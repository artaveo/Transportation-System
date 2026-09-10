-- =============================================================
-- فاز ۶.۱ — زیرساخت پرداخت (بدون اتصال واقعی HesabPay؛ آن فاز ۶.۳ است)
-- این فایل مستقیماً روی Supabase project ppbdsrcdnmckosqhhamm اعمال شد
-- (دو migration جدا، به ترتیب زیر) و اینجا فقط برای audit trail/تاریخچهٔ
-- ریپو ذخیره شده — دقیقاً الگوی phase-5_12-permission-center.sql.
-- =============================================================

-- -------------------------------------------------------------
-- Migration 1/2: phase_6_1_payment_infrastructure
-- -------------------------------------------------------------

-- هدف: state machine صریح، تاریخچهٔ قابل حسابرسی (audit trail)، ستون‌های
-- آماده برای idempotency/provider که در فاز ۶.۳ استفاده می‌شوند، و رفع یک
-- ناسازگاری واقعی موجود: admin_cancel_booking اجازه می‌داد رزرو confirmed
-- (پول‌گرفته‌شده) بدون هیچ اثری روی payments لغو شود.

-- بخش ۱: ستون‌های جدید روی payments — همه nullable/default-دار، بدون
-- شکستن رفتار فعلی. provider فقط برچسب توصیفی است، نه منطق جدید.
alter table public.payments
  add column provider text not null default 'manual',
  add column idempotency_key text,
  add column refunded_by_admin_id uuid references public.admins(id),
  add column refunded_at timestamptz,
  add column refund_reason text,
  add column failure_reason text,
  add column raw_response jsonb;

alter table public.payments
  add constraint payments_provider_check check (provider = any (array['manual','gateway_pending'])),
  add constraint payments_idempotency_key_key unique (idempotency_key);

comment on column public.payments.provider is
  'کدام مسیر این پرداخت را پردازش می‌کند: manual یعنی تأیید دستی ادمین (رزروهای offline امروز)، gateway_pending یعنی رزرو online ثبت شده ولی هنوز درگاه واقعی وصل نیست (فاز ۶.۳). مقدار hesabpay در فاز ۶.۳ به همین چک‌کانستریت اضافه می‌شود.';
comment on column public.payments.idempotency_key is
  'زیرساخت فاز ۶.۱ برای جلوگیری از تکرار عملیات هنگام فراخوانی provider واقعی (createIntent/refund) در فاز ۶.۳. فعلاً هیچ مسیری این را پر نمی‌کند.';
comment on column public.payments.raw_response is
  'زیرساخت فاز ۶.۱ برای ذخیرهٔ payload خام webhook/پاسخ provider در فاز ۶.۳. فعلاً همیشه null.';
comment on column public.payments.failure_reason is
  'دلیل ناموفق‌شدن پرداخت (status=failed) — هیچ مسیر فعلی این وضعیت را ست نمی‌کند؛ برای فاز ۶.۳ آماده شده.';
comment on column public.payments.refund_reason is
  'یادداشت اختیاری ادمین هنگام بازپرداخت (admin_refund_payment، فاز ۶.۱).';

-- بک‌فیل دادهٔ موجود: offline → manual (درست، چون همین امروز با تأیید
-- دستی ادمین کار می‌کند)، online → gateway_pending (چون امروز هیچ درگاهی
-- وصل نیست — دقیقاً همان محدودیت مستندشده در app/api/bookings/confirm).
update public.payments set provider = 'gateway_pending' where method = 'online';
update public.payments set provider = 'manual' where method = 'offline';

-- بخش ۲: refunded_at روی bookings برای تقارن با confirmed_at/cancelled_at.
alter table public.bookings add column refunded_at timestamptz;

-- بخش ۳: جدول تاریخچهٔ وضعیت پرداخت (audit trail). فقط از طریق توابع
-- SECURITY DEFINER نوشته می‌شود؛ هیچ سیاست insert برای anon/authenticated
-- تعریف نشده (دقیقاً الگوی admin_access_audit در فاز ۵.۱۲).
create table public.payment_status_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  booking_id uuid not null references public.bookings(id),
  from_status payment_status,
  to_status payment_status not null,
  actor_type text not null check (actor_type = any (array['customer','admin','system'])),
  actor_id uuid,
  source text not null,
  note text,
  occurred_at timestamptz not null default now()
);

comment on table public.payment_status_events is
  'تاریخچهٔ قابل حسابرسی هر تغییر وضعیت پرداخت (فاز ۶.۱). تاریخچه از این migration به بعد ثبت می‌شود؛ رویدادهای قبلی بازسازی نشده‌اند (طبق اصل no-fabrication پروژه).';

create index payment_status_events_payment_id_idx on public.payment_status_events(payment_id);
create index payment_status_events_booking_id_idx on public.payment_status_events(booking_id);

alter table public.payment_status_events enable row level security;

create policy payment_status_events_admin_select on public.payment_status_events
  for select using (public.has_admin_section('payments'));

-- بخش ۴: تابع کمکی برای ثبت رویداد — تا سه محل فراخوانی (confirm_booking،
-- admin_confirm_offline_payment، admin_refund_payment) کد تکراری insert
-- نداشته باشند.
create or replace function public.log_payment_status_event(
  p_payment_id uuid,
  p_booking_id uuid,
  p_from_status payment_status,
  p_to_status payment_status,
  p_actor_type text,
  p_actor_id uuid,
  p_source text,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into payment_status_events (payment_id, booking_id, from_status, to_status, actor_type, actor_id, source, note)
  values (p_payment_id, p_booking_id, p_from_status, p_to_status, p_actor_type, p_actor_id, p_source, p_note);
end;
$$;

-- بخش ۵: state machine صریح — گارد سطح دیتابیس، مستقل از این‌که تغییر از
-- کدام مسیر (RPC یا نوشتن مستقیم مجاز از طریق payments_admin_write) بیاید.
create or replace function public.enforce_payment_status_transition()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'failed'))
      or (old.status = 'confirmed' and new.status = 'refunded')
    ) then
      raise exception 'INVALID_PAYMENT_TRANSITION: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger payments_enforce_status_transition
  before update on public.payments
  for each row
  execute function public.enforce_payment_status_transition();

comment on function public.enforce_payment_status_transition() is
  'فاز ۶.۱ — state machine پرداخت: pending→confirmed/failed، confirmed→refunded. هر گذار دیگر رد می‌شود، حتی اگر از طریق UPDATE مستقیم (نه RPC) بیاید.';

-- بخش ۶: بازپرداخت — قابلیتی که امروز اصلاً وجود نداشت (نه تابعی، نه
-- ستونی). فقط برای پرداخت confirmed. صندلی‌ها آزاد می‌شوند (مثل
-- admin_cancel_booking) چون بازپرداخت یعنی سفر دیگر برای این رزرو معتبر
-- نیست.
create or replace function public.admin_refund_payment(p_booking_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid;
  v_booking bookings%rowtype;
  v_payment payments%rowtype;
begin
  if not public.has_admin_section('payments') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select id into v_admin_id from admins where auth_user_id = auth.uid() and is_active;

  select * into v_booking from bookings where id = p_booking_id;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  select * into v_payment from payments where booking_id = p_booking_id;
  if not found or v_payment.status <> 'confirmed' then
    raise exception 'PAYMENT_NOT_REFUNDABLE';
  end if;

  update trip_seats
  set status = 'available', held_until = null
  where status = 'booked'
    and id in (select trip_seat_id from booking_passengers where booking_id = p_booking_id);

  update payments
  set status = 'refunded', refunded_by_admin_id = v_admin_id, refunded_at = now(), refund_reason = p_reason
  where id = v_payment.id;

  update bookings
  set status = 'refunded', refunded_at = now()
  where id = p_booking_id;

  perform public.log_payment_status_event(
    v_payment.id, p_booking_id, 'confirmed', 'refunded', 'admin', v_admin_id, 'admin_refund_payment', p_reason
  );
end;
$$;

comment on function public.admin_refund_payment(uuid, text) is
  'فاز ۶.۱ — بازپرداخت دستی (بدون درگاه واقعی). چوکی‌ها آزاد می‌شوند، booking.status=refunded، و رویداد در payment_status_events ثبت می‌شود. اثر روی wallet_amount_used/coupon usage عمداً دست‌نخورده مانده — تصمیم بعدی Zakir لازم دارد، حدس زده نشده.';

grant execute on function public.admin_refund_payment(uuid, text) to authenticated;

-- بخش ۷: admin_cancel_booking دیگر اجازه نمی‌دهد رزروِ دارای پرداخت
-- confirmed مستقیم لغو شود — باید از مسیر admin_refund_payment (بالا) برود
-- تا payments هم منعکس شود. این رفع یک ناسازگاری واقعی موجود است، نه
-- تغییر رفتار برای رزروهای pending.
create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_booking bookings%rowtype;
  v_payment_status payment_status;
begin
  if not public.has_admin_section('bookings') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_booking from bookings where id = p_booking_id;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
  if v_booking.status in ('cancelled', 'completed', 'refunded') then
    raise exception 'INVALID_BOOKING_STATUS';
  end if;

  select status into v_payment_status from payments where booking_id = p_booking_id;
  if v_payment_status = 'confirmed' then
    raise exception 'PAYMENT_ALREADY_CONFIRMED_USE_REFUND';
  end if;

  update trip_seats
  set status = 'available', held_until = null
  where id in (select trip_seat_id from booking_passengers where booking_id = p_booking_id);

  update bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

-- بخش ۸: ثبت رویداد اولیهٔ 'pending' هنگام ساخت پرداخت در confirm_booking،
-- + ست‌کردن provider درست از همان ابتدا (به‌جای تکیه بر default ستون).
create or replace function public.confirm_booking(p_trip_id uuid, p_seat_ids uuid[], p_contact_name text, p_contact_phone text, p_passengers jsonb, p_payment_method payment_method, p_coupon_code text default null::text, p_customer_id uuid default null::uuid)
 returns table(booking_id uuid, booking_reference text, subtotal_amount numeric, service_fee_amount numeric, coupon_discount_amount numeric, tier_discount_amount numeric, total_amount numeric)
 language plpgsql
 set search_path to 'public'
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
  v_customer_is_registered boolean;
  v_customer_tier_sort int;
  v_required_tier_sort int;
  v_prior_bookings_count int;
  v_customer_redemptions_count int;
  v_payment_id uuid;
  v_provider text;
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

  v_provider := case when p_payment_method = 'offline' then 'manual' else 'gateway_pending' end;

  insert into payments (booking_id, method, amount, status, provider)
  values (v_booking_id, p_payment_method, v_total, 'pending', v_provider)
  returning id into v_payment_id;

  perform public.log_payment_status_event(
    v_payment_id, v_booking_id, null, 'pending', 'customer', p_customer_id, 'confirm_booking', null
  );

  if v_coupon.id is not null then
    update coupons set used_count = used_count + 1 where id = v_coupon.id;
    insert into coupon_redemptions (coupon_id, booking_id, customer_id, amount_saved)
    values (v_coupon.id, v_booking_id, p_customer_id, v_coupon_discount);
  end if;

  return query
    select v_booking_id, v_ref, v_subtotal, v_service_fee, v_coupon_discount, v_tier_discount, v_total;
end;
$function$;

grant execute on function public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text, uuid) to service_role;

-- بخش ۹: ثبت رویداد در admin_confirm_offline_payment (بدون تغییر منطق
-- موجود، فقط افزودن audit).
create or replace function public.admin_confirm_offline_payment(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid;
  v_booking bookings%rowtype;
  v_payment_id uuid;
begin
  if not public.has_admin_section('payments') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select id into v_admin_id from admins where auth_user_id = auth.uid() and is_active;

  select * into v_booking from bookings where id = p_booking_id;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
  if v_booking.payment_method <> 'offline' then
    raise exception 'NOT_OFFLINE_PAYMENT';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'INVALID_BOOKING_STATUS';
  end if;

  update payments
  set status = 'confirmed', confirmed_by_admin_id = v_admin_id, confirmed_at = now()
  where booking_id = p_booking_id and status = 'pending'
  returning id into v_payment_id;

  update bookings
  set status = 'confirmed', confirmed_at = now()
  where id = p_booking_id;

  perform public.log_payment_status_event(
    v_payment_id, p_booking_id, 'pending', 'confirmed', 'admin', v_admin_id, 'admin_confirm_offline_payment', null
  );
end;
$$;

-- -------------------------------------------------------------
-- Migration 2/2: phase_6_1_lock_down_audit_logger
-- -------------------------------------------------------------

-- log_payment_status_event نباید مستقیماً از REST قابل‌فراخوانی باشد
-- (هیچ چک has_admin_section ندارد؛ فقط قرار است از داخل توابع دیگر
-- SECURITY DEFINER صدا زده شود که خودشان چک می‌کنند). advisor امنیتی این
-- را به‌درستی به‌عنوان تابع SECURITY DEFINER در دسترس anon/authenticated
-- پرچم کرد — بدون این revoke، هرکسی می‌توانست رویداد جعلی در
-- payment_status_events بنویسد و کل ارزش audit trail را از بین ببرد.
-- (شامل «from public» هم هست — طبق درس فاز ۵.۱۲.۳: revoke فقط از
-- anon/authenticated کافی نیست چون گرنت پیش‌فرض PostgreSQL به PUBLIC است.)
revoke execute on function public.log_payment_status_event(uuid, uuid, payment_status, payment_status, text, uuid, text, text)
  from public, anon, authenticated;
