-- ============================================================================
-- بخش ۱۲.۱۸ پرامپت مادر — رفع باگ «شماره تماس بعد از تغییر دیگر پیدا
-- نمی‌شود» (گزارش Zakir، فاز ۵.۶).
--
-- ریشهٔ باگ: هیچ‌جای مسیر شماره تماس (چک‌اوت، پیگیری بلیت، ویرایش تماس،
-- ثبت‌نام مسافر، راننده‌ها) نرمال‌سازی نمی‌شد — نه ارقام فارسی/عربی به
-- لاتین تبدیل می‌شد، نه کاراکترهای غیرمجاز حذف می‌شد. توابع مقایسهٔ دقیق
-- (`contact_phone = p_phone`) با کوچک‌ترین ناهماهنگی رشته‌ای شکست
-- می‌خورند. این migration یک لایهٔ دفاعی در سطح دیتابیس اضافه می‌کند که
-- مستقل از کلاینت همیشه برقرار می‌ماند.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ۱. normalize_phone(text) — تبدیل ارقام فارسی/عربی به لاتین + حذف هر
--    کاراکتر غیر رقمی (فاصله/خط‌تیره/پرانتز/کاراکترهای جهت‌دهی نامرئی)،
--    با نگه‌داشتن یک + اختیاری در ابتدا. باید دقیقاً معادل
--    lib/phone-utils.ts (سمت TypeScript) بماند.
-- ----------------------------------------------------------------------------
create or replace function public.normalize_phone(p_input text)
returns text
language plpgsql
immutable
as $$
declare
  v_latin text;
  v_has_plus boolean;
  v_digits text;
begin
  if p_input is null then
    return null;
  end if;

  v_latin := translate(
    p_input,
    '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩' || chr(8206) || chr(8207) || chr(1564),
    '01234567890123456789'
  );

  v_has_plus := left(trim(v_latin), 1) = '+';
  v_digits := regexp_replace(v_latin, '[^0-9]', '', 'g');

  if v_digits = '' then
    return '';
  end if;

  return case when v_has_plus then '+' || v_digits else v_digits end;
end;
$$;

comment on function public.normalize_phone(text) is
  'نرمال‌سازی شمارهٔ تماس (بخش ۱۲.۱۸): ارقام فارسی/عربی به لاتین + حذف '
  'جداکننده‌ها، برای جلوگیری از عدم‌تطابق در مقایسهٔ دقیق (=) شمارهٔ تماس. '
  'معادل TypeScript آن lib/phone-utils.ts → normalizePhone() است.';

-- ----------------------------------------------------------------------------
-- ۲. تریگر عمومی: قبل از insert/update، ستون شمارهٔ تماس را نرمال می‌کند —
--    صرف‌نظر از این‌که کدام تابع/مسیر کد آن را نوشته (confirm_booking،
--    signup_customer، درج مستقیم ادمین روی drivers، و...). این یعنی
--    توابع موجود اصلاً نیازی به تغییر ندارند — کاملاً افزایشی است.
-- ----------------------------------------------------------------------------
create or replace function public.normalize_phone_column_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'bookings' then
    new.contact_phone := public.normalize_phone(new.contact_phone);
  elsif tg_table_name = 'booking_passengers' then
    new.passenger_phone := public.normalize_phone(new.passenger_phone);
  elsif tg_table_name = 'customers' then
    new.phone := public.normalize_phone(new.phone);
  elsif tg_table_name = 'drivers' then
    new.phone := public.normalize_phone(new.phone);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalize_phone on bookings;
create trigger trg_normalize_phone
  before insert or update of contact_phone on bookings
  for each row execute function public.normalize_phone_column_trigger();

drop trigger if exists trg_normalize_phone on booking_passengers;
create trigger trg_normalize_phone
  before insert or update of passenger_phone on booking_passengers
  for each row execute function public.normalize_phone_column_trigger();

drop trigger if exists trg_normalize_phone on customers;
create trigger trg_normalize_phone
  before insert or update of phone on customers
  for each row execute function public.normalize_phone_column_trigger();

drop trigger if exists trg_normalize_phone on drivers;
create trigger trg_normalize_phone
  before insert or update of phone on drivers
  for each row execute function public.normalize_phone_column_trigger();

-- ----------------------------------------------------------------------------
-- ۳. به‌روزرسانی توابع مقایسهٔ دقیق موجود — نرمال‌سازی طرف ورودی (پارامتر
--    p_phone) قبل از مقایسه، چون از این پس مقدار ذخیره‌شده همیشه نرمال
--    است اما پارامتر ورودی از کلاینت هنوز ممکن است خام باشد.
-- ----------------------------------------------------------------------------
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
  v_new text;
begin
  v_new := public.normalize_phone(p_new_phone);

  if v_new is null or length(v_new) = 0 then
    raise exception 'INVALID_PHONE';
  end if;

  update bookings
  set contact_phone = v_new
  where booking_reference = upper(trim(p_reference))
    and contact_phone = public.normalize_phone(p_phone);

  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
end;
$$;

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
    and contact_phone = public.normalize_phone(p_phone);

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

-- ----------------------------------------------------------------------------
-- ۴. پاک‌سازی یک‌بارهٔ داده‌های موجود — نرمال‌سازی رکوردهای فعلی.
--    توجه: رکورد SB-998817 مقدار contact_phone بدشکل «03489ق9834ق9834»
--    دارد (احتمالاً تست دستی/کاراکتر ناخواسته، نه صرفاً ارقام فارسی)؛ بعد
--    از این پاک‌سازی فقط کاراکتر غیررقمی حذف می‌شود، شمارهٔ واقعی مشتری
--    قابل حدس‌زدن نیست — نیاز به بررسی دستی دارد.
-- ----------------------------------------------------------------------------
update bookings set contact_phone = public.normalize_phone(contact_phone) where contact_phone is not null;
update booking_passengers set passenger_phone = public.normalize_phone(passenger_phone) where passenger_phone is not null;
update customers set phone = public.normalize_phone(phone) where phone is not null;
update drivers set phone = public.normalize_phone(phone) where phone is not null;
