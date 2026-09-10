-- =============================================================
-- فاز ۶.۲ — بازپرداخت جزئی + آزادسازی کوپن + تب «پرداخت‌ها»
-- این فایل مستقیماً روی Supabase project ppbdsrcdnmckosqhhamm اعمال شد
-- و اینجا فقط برای audit trail/تاریخچهٔ ریپو ذخیره شده — دقیقاً الگوی
-- phase-6_1-payment-infrastructure.sql.
-- =============================================================

-- ستون تازه: چقدر واقعاً بازگردانده شد (ممکن است کمتر از payments.amount
-- باشد — جریمهٔ لغو دستی ادمین).
alter table public.payments add column refunded_amount numeric;

comment on column public.payments.refunded_amount is
  'فاز ۶.۲ — مبلغ واقعی بازپرداخت‌شده؛ می‌تواند کمتر از amount باشد (بازپرداخت جزئی، مثلاً کسر جریمهٔ لغو). NULL یعنی هنوز بازپرداخت نشده.';

-- امضای admin_refund_payment عوض شد (p_amount اضافه شد) — چون نوع
-- پارامترها فرق کرده، CREATE OR REPLACE کافی نیست (overload جدا می‌سازد،
-- نسخهٔ قدیمی را حذف نمی‌کند)؛ صریحاً DROP می‌شود.
drop function if exists public.admin_refund_payment(uuid, text);

create or replace function public.admin_refund_payment(p_booking_id uuid, p_amount numeric default null, p_reason text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid;
  v_booking bookings%rowtype;
  v_payment payments%rowtype;
  v_refund_amount numeric;
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

  v_refund_amount := coalesce(p_amount, v_payment.amount);
  if v_refund_amount <= 0 or v_refund_amount > v_payment.amount then
    raise exception 'INVALID_REFUND_AMOUNT';
  end if;

  update trip_seats
  set status = 'available', held_until = null
  where status = 'booked'
    and id in (select trip_seat_id from booking_passengers where booking_id = p_booking_id);

  update payments
  set status = 'refunded', refunded_amount = v_refund_amount, refunded_by_admin_id = v_admin_id, refunded_at = now(), refund_reason = p_reason
  where id = v_payment.id;

  update bookings
  set status = 'refunded', refunded_at = now()
  where id = p_booking_id;

  -- تصمیم Zakir: بازپرداخت یعنی کوپن هم آزاد شود (قابل‌استفادهٔ دوباره)،
  -- نه این‌که «مصرف‌شده» بماند. per_customer_limit در confirm_booking از
  -- روی وجودِ ردیف در coupon_redemptions می‌شمارد، پس حذف همین ردیف کافی
  -- است تا سهمیهٔ مشتری آزاد شود.
  if v_booking.coupon_id is not null then
    update coupons set used_count = greatest(used_count - 1, 0) where id = v_booking.coupon_id;
    delete from coupon_redemptions where booking_id = p_booking_id;
  end if;

  perform public.log_payment_status_event(
    v_payment.id, p_booking_id, 'confirmed', 'refunded', 'admin', v_admin_id, 'admin_refund_payment',
    case when p_reason is not null then p_reason else null end
  );
end;
$$;

comment on function public.admin_refund_payment(uuid, numeric, text) is
  'فاز ۶.۲ — بازپرداخت جزئی یا کامل (p_amount=null یعنی کامل). کوپنِ رزرو (اگر بود) آزاد می‌شود. اثر روی wallet عمداً دست‌نخورده ماند چون خودِ کسر از wallet هنوز wire نشده (wallet_amount_used همیشه ۰ است).';

grant execute on function public.admin_refund_payment(uuid, numeric, text) to authenticated;

-- تب «پرداخت‌ها». payment_status_events_admin_select خودِ جدول را برای
-- has_admin_section('payments') باز می‌کند، ولی جوین به bookings برای
-- نمایش booking_reference/contact_name را RLS جدول bookings
-- (has_admin_section('bookings')) مسدود می‌کند — یک ادمین محدود که فقط
-- بخش payments دارد (نه bookings) نباید کور بماند. دقیقاً الگوی
-- list_admin_audit_log فاز ۵.۱۲: یک تابع SECURITY DEFINER که فقط با
-- has_admin_section('payments') گیت شده.
create or replace function public.list_payment_audit_log(p_limit int default 200)
returns table (
  id uuid,
  occurred_at timestamptz,
  from_status payment_status,
  to_status payment_status,
  actor_type text,
  actor_name text,
  source text,
  note text,
  booking_id uuid,
  booking_reference text,
  contact_name text,
  contact_phone text,
  payment_amount numeric,
  refunded_amount numeric
)
language sql
security definer
set search_path to 'public'
as $$
  select
    e.id, e.occurred_at, e.from_status, e.to_status, e.actor_type,
    a.full_name as actor_name,
    e.source, e.note,
    b.id as booking_id, b.booking_reference, b.contact_name, b.contact_phone,
    p.amount as payment_amount, p.refunded_amount
  from payment_status_events e
  join bookings b on b.id = e.booking_id
  join payments p on p.id = e.payment_id
  left join admins a on a.id = e.actor_id and e.actor_type = 'admin'
  where public.has_admin_section('payments')
  order by e.occurred_at desc
  limit p_limit;
$$;

comment on function public.list_payment_audit_log(int) is
  'فاز ۶.۲ — تاریخچهٔ کامل پرداخت برای تب «پرداخت‌ها»، با جوین به bookings/admins که SECURITY DEFINER دور RLS جدول bookings می‌زند (دقیقاً الگوی list_admin_audit_log فاز ۵.۱۲) تا ادمین محدودِ فقط-payments هم booking_reference را ببیند.';

revoke execute on function public.list_payment_audit_log(int) from public, anon;
grant execute on function public.list_payment_audit_log(int) to authenticated;
