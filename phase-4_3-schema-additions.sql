-- ============================================================================
-- فاز ۴.۳ — توابع سرور برای پیگیری/ویرایش تماس/کنسلی رزرو مهمان
-- این فایل قبلاً از طریق MCP روی پروژهٔ زندهٔ Supabase (Transportation-System)
-- اجرا شده؛ اینجا فقط برای مستندسازی تحویل داده می‌شود. اجرای مجدد امن است
-- (create or replace / revoke+grant idempotent هستند).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ۰. اصلاح امنیتیِ یافته‌شده در همین فاز (نه یک تغییر برنامه‌ریزی‌شده):
--    README فاز ۴.۲ ادعا کرده بود hold_seats/release_seats/confirm_booking
--    «صراحتاً از anon/authenticated گرفته و فقط به service_role داده شدند».
--    بررسی مستقیم pg_proc.proacl روی پروژهٔ زندهٔ Supabase نشان داد این
--    revoke هرگز واقعاً اجرا نشده بود — هر سه تابع همچنان EXECUTE مستقیم
--    برای anon/authenticated داشتند. یعنی هرکسی فقط با همان anon key عمومی
--    (که در کلاینت مرورگر افشا می‌شود) می‌توانست مستقیم از REST API عمومی
--    Supabase این سه تابع حساس را صدا بزند و کل اعتبارسنجی Route Handler
--    (app/api/bookings/confirm) را کاملاً دور بزند — مثلاً صندلی رزروهای
--    دیگران را جعلی hold/confirm کند. این‌جا واقعاً اصلاح شد.
-- ----------------------------------------------------------------------------
revoke execute on function public.hold_seats(uuid, uuid[], integer) from public, anon, authenticated;
revoke execute on function public.release_seats(uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text) from public, anon, authenticated;

grant execute on function public.hold_seats(uuid, uuid[], integer) to service_role;
grant execute on function public.release_seats(uuid, uuid[]) to service_role;
grant execute on function public.confirm_booking(uuid, uuid[], text, text, jsonb, payment_method, text) to service_role;

-- ============================================================================
-- ۱. update_booking_contact_phone — ویرایش شمارهٔ تماس یک رزرو مهمان.
--    اثبات مالکیت = تطابق دقیق booking_reference + contact_phone فعلی،
--    دقیقاً طبق نیازمندی صریح فاز ۳.۲ («مسافر مهمان فقط از طریق کد رهگیری
--    + شمارهٔ تماس به رزرو خودش دسترسی داشته باشد، نه auth.uid()»).
-- ============================================================================
create or replace function public.update_booking_contact_phone(
  p_reference text,
  p_phone text,
  p_new_phone text
)
returns void
language plpgsql
as $$
declare
  v_count int;
begin
  if p_new_phone is null or length(trim(p_new_phone)) = 0 then
    raise exception 'INVALID_PHONE';
  end if;

  update bookings
  set contact_phone = trim(p_new_phone)
  where booking_reference = upper(trim(p_reference))
    and contact_phone = trim(p_phone);

  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
end;
$$;

revoke execute on function public.update_booking_contact_phone(text, text, text) from public, anon, authenticated;
grant execute on function public.update_booking_contact_phone(text, text, text) to service_role;

-- ============================================================================
-- ۲. request_booking_cancellation — کنسلی خودِ مسافر مهمان، فقط وقتی رزرو
--    هنوز 'pending' است (یعنی هیچ اپراتوری در فاز ۵.۲ پرداخت را تأیید
--    نکرده). برای رزروِ از قبل 'confirmed'، کنسلی خودکار عمداً مسدود است —
--    چون احتمال دریافت واقعی پول وجود دارد و باید از مسیر بازپرداخت/بررسی
--    دستی ادمین (فاز ۵.۲ / ۶) عبور کند، نه لغو یک‌طرفهٔ بدون نظارت. صندلی‌های
--    رزروشده بلافاصله به 'available' برمی‌گردند تا مسافر دیگری بتواند
--    همان صندلی را رزرو کند.
-- ============================================================================
create or replace function public.request_booking_cancellation(
  p_reference text,
  p_phone text
)
returns void
language plpgsql
as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings
  where booking_reference = upper(trim(p_reference))
    and contact_phone = trim(p_phone);

  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'ALREADY_CANCELLED';
  end if;

  if v_booking.status <> 'pending' then
    raise exception 'NOT_CANCELLABLE';
  end if;

  update trip_seats
  set status = 'available', held_until = null
  where status = 'booked'
    and id in (select trip_seat_id from booking_passengers where booking_id = v_booking.id);

  update bookings
  set status = 'cancelled', cancelled_at = now()
  where id = v_booking.id;
end;
$$;

revoke execute on function public.request_booking_cancellation(text, text) from public, anon, authenticated;
grant execute on function public.request_booking_cancellation(text, text) to service_role;
