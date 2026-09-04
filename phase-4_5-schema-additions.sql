-- ============================================================================
-- فاز ۴.۵ — حساب کاربری مسافر و باشگاه مشتریان (سمت دیتابیس)
-- این فایل قبلاً از طریق MCP روی پروژهٔ زندهٔ Supabase (Transportation-System)
-- اجرا شده؛ اینجا فقط برای مستندسازی تحویل داده می‌شود.
-- ============================================================================

-- ============================================================================
-- ۱. signup_customer — ساخت رکورد customers بلافاصله بعد از ثبت‌نام واقعی
--    Supabase Auth. چون هیچ policy INSERT روی customers برای authenticated
--    وجود ندارد (طبق تصمیم صریح فاز ۳.۲: «ویرایش حساس فقط از طریق
--    service_role/تابع، نه مستقیم»)، این کار از طریق یک تابع SECURITY DEFINER
--    انجام می‌شود که همیشه از auth.uid() خودِ کاربر واردشده استفاده می‌کند —
--    نه یک uid دلخواه که از کلاینت پاس داده شود — تا کسی نتواند برای شخص
--    دیگری حساب بسازد.
-- ============================================================================
create or replace function public.signup_customer(
  p_phone text,
  p_full_name text default null,
  p_email text default null,
  p_referral_code text default null
)
returns customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_bronze_id uuid;
  v_referrer_id uuid;
  v_new_code text;
  v_row customers;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if exists (select 1 from customers where auth_user_id = v_uid) then
    raise exception 'CUSTOMER_ALREADY_EXISTS';
  end if;

  if p_phone is null or length(trim(p_phone)) = 0 then
    raise exception 'INVALID_PHONE';
  end if;

  select id into v_bronze_id from loyalty_tiers where tier_key = 'bronze' limit 1;
  if v_bronze_id is null then
    raise exception 'BRONZE_TIER_NOT_FOUND';
  end if;

  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select id into v_referrer_id from customers where referral_code = upper(trim(p_referral_code));
    if v_referrer_id is null then
      raise exception 'INVALID_REFERRAL_CODE';
    end if;
  end if;

  for i in 1..5 loop
    v_new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from customers where referral_code = v_new_code);
  end loop;

  begin
    insert into customers (
      auth_user_id, phone, full_name, email, is_registered,
      loyalty_tier_id, referral_code, referred_by_customer_id
    ) values (
      v_uid, trim(p_phone), nullif(trim(coalesce(p_full_name, '')), ''),
      nullif(trim(coalesce(p_email, '')), ''), true,
      v_bronze_id, v_new_code, v_referrer_id
    )
    returning * into v_row;
  exception when unique_violation then
    raise exception 'PHONE_ALREADY_REGISTERED';
  end;

  if v_referrer_id is not null then
    insert into referrals (referrer_customer_id, referred_customer_id, status)
    values (v_referrer_id, v_row.id, 'pending');
  end if;

  return v_row;
end;
$$;

revoke execute on function public.signup_customer(text, text, text, text) from public, anon, authenticated;
grant execute on function public.signup_customer(text, text, text, text) to authenticated;

-- ============================================================================
-- ۲. تریگر تکمیل سفر — ارتقای سطح باشگاه مشتریان + واریز پاداش رفرال.
--    طبق فاز ۳.۱ («این‌ها منطق لایهٔ سرور هستند و در فاز ۴ ... پیاده‌سازی
--    می‌شوند») و بخش ۵ سند مادر. تا پنل ادمین (فاز ۵.۲) رزرو را واقعاً
--    completed نکند این تریگر بی‌اثر می‌ماند — اما از همین حالا آماده و
--    صحیح است.
-- ============================================================================
create or replace function public.handle_booking_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers%rowtype;
  v_new_tier_id uuid;
  v_referral referrals%rowtype;
  -- پاداش ثابت رفرال — هیچ ستون/جدول تنظیماتی برای این عدد در فاز ۳.۱
  -- طراحی نشده بود (برخلاف درصد سطوح که در loyalty_tiers قابل‌تغییر است).
  -- تا وقتی LoyaltyManager (فاز ۵.۴) این عدد را قابل‌تغییر نکند، همین‌جا
  -- به‌عنوان یک مقدار پیش‌فرض مستند نگه داشته می‌شود.
  v_referral_reward numeric := 100;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.customer_id is null then
    return new;
  end if;

  update customers
  set lifetime_completed_trips = lifetime_completed_trips + 1
  where id = new.customer_id
  returning * into v_customer;

  if not found then
    return new;
  end if;

  select id into v_new_tier_id
  from loyalty_tiers
  where is_active = true and min_completed_trips <= v_customer.lifetime_completed_trips
  order by min_completed_trips desc
  limit 1;

  if v_new_tier_id is not null and v_new_tier_id <> v_customer.loyalty_tier_id then
    update customers set loyalty_tier_id = v_new_tier_id where id = v_customer.id;
  end if;

  -- پاداش رفرال فقط برای اولین سفر تکمیل‌شدهٔ مشتریِ دعوت‌شده، و فقط یک‌بار
  -- (referrals.referred_customer_id در فاز ۳.۱ یکتاست).
  if v_customer.lifetime_completed_trips = 1 then
    select * into v_referral from referrals
    where referred_customer_id = v_customer.id and status = 'pending';

    if found then
      update referrals
      set status = 'completed', completed_at = now(), reward_amount = v_referral_reward
      where id = v_referral.id;

      insert into wallet_transactions (customer_id, type, amount, related_booking_id, note)
      values
        (v_referral.referrer_customer_id, 'referral_bonus', v_referral_reward, new.id, 'پاداش معرفی دوست'),
        (v_referral.referred_customer_id, 'referral_bonus', v_referral_reward, new.id, 'پاداش اولین سفر با کد معرفی');

      update customers set wallet_balance = wallet_balance + v_referral_reward
      where id in (v_referral.referrer_customer_id, v_referral.referred_customer_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_booking_completed on bookings;
create trigger trg_booking_completed
  after update on bookings
  for each row execute function public.handle_booking_completed();

-- ============================================================================
-- ۳. confirm_booking — بازتعریف کامل با پشتیبانی از customer_id واقعی و
--    اعمال خودکار تخفیف سطح باشگاه مشتریان. امضای تابع عوض شده (دو پارامتر
--    جدید در انتها)، پس نسخهٔ قبلی صراحتاً drop می‌شود تا دو overload
--    هم‌زمان روی PostgREST باعث خطای «ambiguous function» نشود.
-- ============================================================================
drop function if exists public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text);

create or replace function public.confirm_booking(
  p_trip_id uuid,
  p_seat_ids uuid[],
  p_contact_name text,
  p_contact_phone text,
  p_passengers jsonb,
  p_payment_method payment_method,
  p_coupon_code text default null,
  p_customer_id uuid default null
)
returns table(booking_id uuid, booking_reference text, subtotal_amount numeric, service_fee_amount numeric, coupon_discount_amount numeric, tier_discount_amount numeric, total_amount numeric)
language plpgsql
set search_path = public
as $function$
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
      raise exception 'COUPON_INVALID';
    end if;

    v_coupon_discount := case
      when v_coupon.discount_type = 'percent' then round(v_subtotal * v_coupon.discount_value / 100, 2)
      else least(v_coupon.discount_value, v_subtotal)
    end;
  end if;

  -- تخفیف سطح باشگاه مشتریان — فقط اگر رزرو واقعاً به یک مشتری ثبت‌نام‌شده
  -- وصل باشد (نه رزرو مهمان). طبق تصمیم فاز ۴.۲، جمع‌شدن با کوپن غیرمشروط
  -- است مگر کوپن صراحتاً is_stackable_with_tier = false باشد.
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

revoke execute on function public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text, uuid) from public, anon, authenticated;
grant execute on function public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text, uuid) to service_role;
