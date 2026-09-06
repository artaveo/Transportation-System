-- ============================================================================
-- فاز ۵.۲ — مدیریت رزرو و تأیید پرداخت آفلاین (سمت دیتابیس)
-- این فایل قبلاً از طریق MCP روی پروژهٔ زندهٔ Supabase (Transportation-System)
-- اجرا شده؛ اینجا فقط برای مستندسازی و انطباق با ریپو تحویل داده می‌شود.
-- ============================================================================

-- ============================================================================
-- ۱. admin_confirm_offline_payment / admin_cancel_booking — چرا SECURITY DEFINER:
--    آزادسازی صندلی (trip_seats) با بخش ادمین 'trips' گیت شده، نه 'bookings'
--    (نگاشت بخش‌ها در بالای phase-3.2-rls-policies.sql). یک ادمین محدود که
--    فقط دسترسی 'bookings' دارد نباید برای لغو یک رزرو مجبور باشد دسترسی
--    جداگانهٔ 'trips' هم داشته باشد. این دو تابع خودشان مجوز را با
--    has_admin_section() داخلی چک می‌کنند و کل به‌روزرسانی (bookings +
--    trip_seats یا bookings + payments) را در یک تراکنش اتمیک انجام می‌دهند
--    — دقیقاً همان اصل hold_seats/confirm_booking در فاز ۴.۲.
-- ============================================================================

create or replace function public.admin_confirm_offline_payment(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_booking bookings%rowtype;
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
  where booking_id = p_booking_id and status = 'pending';

  update bookings
  set status = 'confirmed', confirmed_at = now()
  where id = p_booking_id;
end;
$$;

revoke all on function public.admin_confirm_offline_payment(uuid) from public;
grant execute on function public.admin_confirm_offline_payment(uuid) to authenticated;

create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
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

  update trip_seats
  set status = 'available', held_until = null
  where id in (select trip_seat_id from booking_passengers where booking_id = p_booking_id);

  update bookings
  set status = 'cancelled', cancelled_at = now()
  where id = p_booking_id;
end;
$$;

revoke all on function public.admin_cancel_booking(uuid) from public;
grant execute on function public.admin_cancel_booking(uuid) to authenticated;
