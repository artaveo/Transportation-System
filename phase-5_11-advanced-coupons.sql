-- Phase 5.11: advanced coupon rules.
-- Applied live to Supabase via MCP in two migrations:
--   1) phase_5_11_advanced_coupon_rules
--   2) phase_5_11_confirm_booking_coupon_rules
-- Saved here for documentation/audit trail per project convention
-- (see phase-5_6-phone-normalization.sql for a prior example).

-- =====================================================================
-- 1) New columns on `coupons`. All nullable/false-default so every
--    existing coupon keeps behaving exactly as before (no restriction)
--    until an admin opts in.
-- =====================================================================
alter table public.coupons
  add column if not exists min_loyalty_tier_id uuid references public.loyalty_tiers(id) on delete set null,
  add column if not exists per_customer_limit integer,
  add column if not exists applicable_route_ids uuid[],
  add column if not exists first_trip_only boolean not null default false,
  add column if not exists min_seats integer,
  add column if not exists min_amount numeric,
  add column if not exists guest_allowed boolean not null default true;

alter table public.coupons
  add constraint coupons_per_customer_limit_positive check (per_customer_limit is null or per_customer_limit > 0),
  add constraint coupons_min_seats_positive check (min_seats is null or min_seats > 0),
  add constraint coupons_min_amount_nonnegative check (min_amount is null or min_amount >= 0);

comment on column public.coupons.min_loyalty_tier_id is 'حداقل سطح باشگاه مشتریان لازم (null = بدون محدودیت سطح).';
comment on column public.coupons.per_customer_limit is 'سقف استفاده به‌ازای هر مشتری، جدا از سقف کلی usage_limit (null = بدون سقف شخصی).';
comment on column public.coupons.applicable_route_ids is 'اگر پر باشد، کوپن فقط روی این مسیرها معتبر است؛ null/خالی یعنی همهٔ مسیرها.';
comment on column public.coupons.first_trip_only is 'اگر true، فقط برای مشتری‌ای که هیچ رزرو غیرلغوشدهٔ قبلی ندارد (اولین سفر).';
comment on column public.coupons.min_seats is 'حداقل تعداد چوکی رزرو برای اعتبار کوپن (null = بدون حداقل).';
comment on column public.coupons.min_amount is 'حداقل مبلغ subtotal (پیش از تخفیف) برای اعتبار کوپن (null = بدون حداقل).';
comment on column public.coupons.guest_allowed is 'اگر false، فقط مشتری ثبت‌نامی (customers.is_registered) می‌تواند استفاده کند، نه مهمان.';

-- =====================================================================
-- 2) confirm_booking(): validate the 7 new rules before computing the
--    coupon discount. Existing logic (trip/seat checks, tier discount,
--    booking/payment/redemption inserts) is unchanged.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.confirm_booking(p_trip_id uuid, p_seat_ids uuid[], p_contact_name text, p_contact_phone text, p_passengers jsonb, p_payment_method payment_method, p_coupon_code text DEFAULT NULL::text, p_customer_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(booking_id uuid, booking_reference text, subtotal_amount numeric, service_fee_amount numeric, coupon_discount_amount numeric, tier_discount_amount numeric, total_amount numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_trip trips%rowtype;
  v_seats_count int;
  v_subtotal numeric;
  v_service_fee numeric;
  v_coupon coupons%rowtype;
  v_coupon_discount numeric := 0;
  v_tier_discount numeric := 0;
  v_tier_percent numeric := 0;
  v_total numeric;
  v_booking_id uuid;
  v_ref text;
  v_passenger jsonb;
  v_seat_id uuid;
  v_held_count int;
  -- فاز ۵.۱۱: متغیرهای کمکی برای اعتبارسنجی قوانین پیشرفتهٔ کوپن
  v_customer_is_registered boolean;
  v_customer_tier_sort int;
  v_required_tier_sort int;
  v_prior_bookings_count int;
  v_customer_redemptions_count int;
begin
  select * into v_trip from trips where id = p_trip_id;
  if not found then
    raise exception 'TRIP_NOT_FOUND';
  end if;

  v_seats_count := coalesce(array_length(p_seat_ids, 1), 0);
  if v_seats_count = 0 then
    raise exception 'NO_SEATS_SELECTED';
  end if;

  if jsonb_array_length(p_passengers) <> v_seats_count then
    raise exception 'PASSENGER_COUNT_MISMATCH';
  end if;

  select count(*) into v_held_count
  from trip_seats
  where id = any(p_seat_ids) and trip_id = p_trip_id and status = 'held' and held_until > now();

  if v_held_count <> v_seats_count then
    raise exception 'SEATS_NOT_HELD';
  end if;

  v_subtotal := v_trip.price_per_seat * v_seats_count;
  v_service_fee := v_seats_count * 30;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon from coupons
    where code = upper(trim(p_coupon_code))
      and is_active = true
      and (valid_from is null or valid_from <= current_date)
      and (valid_to is null or valid_to >= current_date)
      and (usage_limit is null or used_count < usage_limit);

    if not found then
      raise exception 'COUPON_INVALID: NOT_FOUND';
    end if;

    -- فاز ۵.۱۱: قوانین پیشرفتهٔ کوپن — همه AND می‌شوند (رعایت همهٔ
    -- قوانین تنظیم‌شده لازم است). مقدار null در هر ستون یعنی آن قانون
    -- برای این کوپن غیرفعال است (رفتار قبل از این فاز، بدون تغییر).

    if v_coupon.min_seats is not null and v_seats_count < v_coupon.min_seats then
      raise exception 'COUPON_INVALID: MIN_SEATS';
    end if;

    if v_coupon.min_amount is not null and v_subtotal < v_coupon.min_amount then
      raise exception 'COUPON_INVALID: MIN_AMOUNT';
    end if;

    if v_coupon.applicable_route_ids is not null
       and array_length(v_coupon.applicable_route_ids, 1) > 0
       and not (v_trip.route_id = any(v_coupon.applicable_route_ids)) then
      raise exception 'COUPON_INVALID: ROUTE_NOT_ELIGIBLE';
    end if;

    -- guest_allowed=false یعنی فقط مشتری با حساب ثبت‌نامی (نه رزرو مهمان،
    -- و نه فقط داشتن customer_id — باید customers.is_registered=true باشد).
    if v_coupon.guest_allowed = false then
      v_customer_is_registered := false;
      if p_customer_id is not null then
        select coalesce(is_registered, false) into v_customer_is_registered
        from customers where id = p_customer_id;
      end if;
      if not coalesce(v_customer_is_registered, false) then
        raise exception 'COUPON_INVALID: REGISTERED_ONLY';
      end if;
    end if;

    if v_coupon.min_loyalty_tier_id is not null then
      v_customer_tier_sort := null;
      if p_customer_id is not null then
        select lt.sort_order into v_customer_tier_sort
        from customers c join loyalty_tiers lt on lt.id = c.loyalty_tier_id
        where c.id = p_customer_id;
      end if;
      select sort_order into v_required_tier_sort from loyalty_tiers where id = v_coupon.min_loyalty_tier_id;
      if v_customer_tier_sort is null or v_required_tier_sort is null or v_customer_tier_sort < v_required_tier_sort then
        raise exception 'COUPON_INVALID: TIER_TOO_LOW';
      end if;
    end if;

    if v_coupon.first_trip_only then
      if p_customer_id is null then
        raise exception 'COUPON_INVALID: FIRST_TRIP_ONLY';
      end if;
      select count(*) into v_prior_bookings_count
      from bookings where customer_id = p_customer_id and status <> 'cancelled';
      if v_prior_bookings_count > 0 then
        raise exception 'COUPON_INVALID: FIRST_TRIP_ONLY';
      end if;
    end if;

    if v_coupon.per_customer_limit is not null then
      if p_customer_id is null then
        raise exception 'COUPON_INVALID: PER_CUSTOMER_LIMIT';
      end if;
      select count(*) into v_customer_redemptions_count
      from coupon_redemptions where coupon_id = v_coupon.id and customer_id = p_customer_id;
      if v_customer_redemptions_count >= v_coupon.per_customer_limit then
        raise exception 'COUPON_INVALID: PER_CUSTOMER_LIMIT';
      end if;
    end if;

-- =====================================================================
-- 3) ریزفاز ۵.۱۱.۱ (همان روز، بدون شمارهٔ فاز جدا): پیام دو قانون عددی
--    (MIN_SEATS/MIN_AMOUNT) حالا مقدار واقعی را هم ضمیمه می‌کند
--    ('COUPON_INVALID: MIN_SEATS:3') تا API/UI بتواند دلیل دقیق رد کوپن
--    را به مسافر نشان دهد، نه فقط پیام عمومی «کد تخفیف نامعتبر است».
--    بقیهٔ تابع نسبت به migration شمارهٔ ۲ همین فایل بدون تغییر است.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.confirm_booking(p_trip_id uuid, p_seat_ids uuid[], p_contact_name text, p_contact_phone text, p_passengers jsonb, p_payment_method payment_method, p_coupon_code text DEFAULT NULL::text, p_customer_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(booking_id uuid, booking_reference text, subtotal_amount numeric, service_fee_amount numeric, coupon_discount_amount numeric, tier_discount_amount numeric, total_amount numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_trip trips%rowtype;
  v_seats_count int;
  v_subtotal numeric;
  v_service_fee numeric;
  v_coupon coupons%rowtype;
  v_coupon_discount numeric := 0;
  v_tier_discount numeric := 0;
  v_tier_percent numeric := 0;
  v_total numeric;
  v_booking_id uuid;
  v_ref text;
  v_passenger jsonb;
  v_seat_id uuid;
  v_held_count int;
  -- فاز ۵.۱۱: متغیرهای کمکی برای اعتبارسنجی قوانین پیشرفتهٔ کوپن
  v_customer_is_registered boolean;
  v_customer_tier_sort int;
  v_required_tier_sort int;
  v_prior_bookings_count int;
  v_customer_redemptions_count int;
begin
  select * into v_trip from trips where id = p_trip_id;
  if not found then
    raise exception 'TRIP_NOT_FOUND';
  end if;

  v_seats_count := coalesce(array_length(p_seat_ids, 1), 0);
  if v_seats_count = 0 then
    raise exception 'NO_SEATS_SELECTED';
  end if;

  if jsonb_array_length(p_passengers) <> v_seats_count then
    raise exception 'PASSENGER_COUNT_MISMATCH';
  end if;

  select count(*) into v_held_count
  from trip_seats
  where id = any(p_seat_ids) and trip_id = p_trip_id and status = 'held' and held_until > now();

  if v_held_count <> v_seats_count then
    raise exception 'SEATS_NOT_HELD';
  end if;

  v_subtotal := v_trip.price_per_seat * v_seats_count;
  v_service_fee := v_seats_count * 30;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon from coupons
    where code = upper(trim(p_coupon_code))
      and is_active = true
      and (valid_from is null or valid_from <= current_date)
      and (valid_to is null or valid_to >= current_date)
      and (usage_limit is null or used_count < usage_limit);

    if not found then
      raise exception 'COUPON_INVALID: NOT_FOUND';
    end if;

    -- فاز ۵.۱۱: قوانین پیشرفتهٔ کوپن — همه AND می‌شوند (رعایت همهٔ
    -- قوانین تنظیم‌شده لازم است). مقدار null در هر ستون یعنی آن قانون
    -- برای این کوپن غیرفعال است (رفتار قبل از این فاز، بدون تغییر).
    --
    -- ریزفاز ۵.۱۱.۱: پیام دو قانون عددی (MIN_SEATS/MIN_AMOUNT) حالا
    -- مقدار واقعی را هم با «:%» ضمیمه می‌کند تا API/UI بتواند پیام دقیق
    -- («حداقل ۳ چوکی») به مسافر نشان دهد، نه فقط نام قانون.

    if v_coupon.min_seats is not null and v_seats_count < v_coupon.min_seats then
      raise exception 'COUPON_INVALID: MIN_SEATS:%', v_coupon.min_seats;
    end if;

    if v_coupon.min_amount is not null and v_subtotal < v_coupon.min_amount then
      raise exception 'COUPON_INVALID: MIN_AMOUNT:%', v_coupon.min_amount;
    end if;

    if v_coupon.applicable_route_ids is not null
       and array_length(v_coupon.applicable_route_ids, 1) > 0
       and not (v_trip.route_id = any(v_coupon.applicable_route_ids)) then
      raise exception 'COUPON_INVALID: ROUTE_NOT_ELIGIBLE';
    end if;

    -- guest_allowed=false یعنی فقط مشتری با حساب ثبت‌نامی (نه رزرو مهمان،
    -- و نه فقط داشتن customer_id — باید customers.is_registered=true باشد).
    if v_coupon.guest_allowed = false then
      v_customer_is_registered := false;
      if p_customer_id is not null then
        select coalesce(is_registered, false) into v_customer_is_registered
        from customers where id = p_customer_id;
      end if;
      if not coalesce(v_customer_is_registered, false) then
        raise exception 'COUPON_INVALID: REGISTERED_ONLY';
      end if;
    end if;

    if v_coupon.min_loyalty_tier_id is not null then
      v_customer_tier_sort := null;
      if p_customer_id is not null then
        select lt.sort_order into v_customer_tier_sort
        from customers c join loyalty_tiers lt on lt.id = c.loyalty_tier_id
        where c.id = p_customer_id;
      end if;
      select sort_order into v_required_tier_sort from loyalty_tiers where id = v_coupon.min_loyalty_tier_id;
      if v_customer_tier_sort is null or v_required_tier_sort is null or v_customer_tier_sort < v_required_tier_sort then
        raise exception 'COUPON_INVALID: TIER_TOO_LOW';
      end if;
    end if;

    if v_coupon.first_trip_only then
      if p_customer_id is null then
        raise exception 'COUPON_INVALID: FIRST_TRIP_ONLY';
      end if;
      select count(*) into v_prior_bookings_count
      from bookings where customer_id = p_customer_id and status <> 'cancelled';
      if v_prior_bookings_count > 0 then
        raise exception 'COUPON_INVALID: FIRST_TRIP_ONLY';
      end if;
    end if;

    if v_coupon.per_customer_limit is not null then
      if p_customer_id is null then
        raise exception 'COUPON_INVALID: PER_CUSTOMER_LIMIT';
      end if;
      select count(*) into v_customer_redemptions_count
      from coupon_redemptions where coupon_id = v_coupon.id and customer_id = p_customer_id;
      if v_customer_redemptions_count >= v_coupon.per_customer_limit then
        raise exception 'COUPON_INVALID: PER_CUSTOMER_LIMIT';
      end if;
    end if;

    v_coupon_discount := case
      when v_coupon.discount_type = 'percent' then round(v_subtotal * v_coupon.discount_value / 100, 2)
      else least(v_coupon.discount_value, v_subtotal)
    end;
  end if;

  if p_customer_id is not null then
    select coalesce(lt.discount_percent, 0) into v_tier_percent
    from customers c join loyalty_tiers lt on lt.id = c.loyalty_tier_id
    where c.id = p_customer_id;

    if v_coupon.id is not null and v_coupon.is_stackable_with_tier = false then
      v_tier_percent := 0;
    end if;

    v_tier_discount := round(v_subtotal * coalesce(v_tier_percent, 0) / 100, 2);
  end if;

  v_total := v_subtotal + v_service_fee - v_coupon_discount - v_tier_discount;

  for i in 1..5 loop
    v_ref := 'SB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from bookings b where b.booking_reference = v_ref);
  end loop;

  insert into bookings (
    booking_reference, trip_id, customer_id, contact_name, contact_phone,
    seats_count, subtotal_amount, service_fee_amount, coupon_id,
    coupon_discount_amount, tier_discount_amount, wallet_amount_used,
    total_amount, currency, payment_method, status
  ) values (
    v_ref, p_trip_id, p_customer_id, p_contact_name, p_contact_phone,
    v_seats_count, v_subtotal, v_service_fee, v_coupon.id,
    v_coupon_discount, v_tier_discount, 0,
    v_total, 'AFN', p_payment_method, 'pending'
  ) returning id into v_booking_id;

  for v_passenger in select * from jsonb_array_elements(p_passengers)
  loop
    v_seat_id := (v_passenger->>'seat_id')::uuid;

    insert into booking_passengers (
      booking_id, trip_seat_id, passenger_full_name, passenger_phone, national_id, gender
    ) values (
      v_booking_id,
      v_seat_id,
      v_passenger->>'full_name',
      nullif(v_passenger->>'phone', ''),
      nullif(v_passenger->>'national_id', ''),
      (v_passenger->>'gender')::passenger_gender
    );

    update trip_seats set status = 'booked', held_until = null
    where id = v_seat_id and trip_id = p_trip_id;
  end loop;

  insert into payments (booking_id, method, amount, status)
  values (v_booking_id, p_payment_method, v_total, 'pending');

  if v_coupon.id is not null then
    update coupons set used_count = used_count + 1 where id = v_coupon.id;
    insert into coupon_redemptions (coupon_id, booking_id, customer_id, amount_saved)
    values (v_coupon.id, v_booking_id, p_customer_id, v_coupon_discount);
  end if;

  return query
    select v_booking_id, v_ref, v_subtotal, v_service_fee, v_coupon_discount, v_tier_discount, v_total;
end;
$function$;
