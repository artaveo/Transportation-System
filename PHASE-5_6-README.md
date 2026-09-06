# فاز ۵.۶ — رفع باگ نرمال‌سازی شمارهٔ تماس

> این سند از بخش ۱۲.۱۸ نسخهٔ قدیمی پرامپت مادر بازسازی شده تا جزئیات
> پیاده‌سازی این فاز از حافظهٔ پروژه گم نشود.

**تکمیل:** ۶ سپتامبر ۲۰۲۶

## گزارش Zakir

بعد از تغییر شمارهٔ تماس در صفحهٔ «پیگیری رزرو»، هم شمارهٔ جدید هم
شمارهٔ قدیمی دیگر برای پیگیری بلیت جواب نمی‌دادند («سفری یافت نشد»)،
هرچند پنل ادمین شمارهٔ جدید را درست نشان می‌داد.

## ریشهٔ باگ (پیدا شده با خواندن کد واقعی، نه حدس)

هیچ‌جای مسیر شمارهٔ تماس (چک‌اوت، پیگیری بلیت، ویرایش تماس، ثبت‌نام
مسافر، راننده‌ها) نرمال‌سازی نمی‌شد. `update_booking_contact_phone`/
`request_booking_cancellation` (فاز ۴.۳) و
`getBookingByReferenceAndPhone` (فاز ۴.۳) مقایسهٔ **دقیق رشته‌ای** انجام
می‌دهند؛ کیبورد فارسی سیستم‌عامل حین تایپ (حتی در فیلد `dir="ltr"`)
ارقام فارسی/عربی (۰۱۲۳...) تولید می‌کند — `dir` فقط جهت نمایش را تعیین
می‌کند، نه کاراکتر واقعی کیبورد. پروژه دقیقاً همین کلاس مشکل را قبلاً
برای تقویم حل کرده بود (`lib/date-utils.ts`)، اما هرگز برای شمارهٔ تماس
تعمیم نیافته بود. بررسی داده‌های زندهٔ Supabase یک رکورد واقعی بدشکل
هم تأیید کرد (`SB-998817`، `contact_phone` قبلاً `"03489ق9834ق9834"`).

## راه‌حل (لایهٔ دفاعی چندگانه، کاملاً افزایشی)

1. **دیتابیس (لایهٔ اصلی):** تابع تازهٔ `public.normalize_phone(text)`
   (ارقام فارسی/عربی→لاتین + حذف فاصله/خط‌تیره/کاراکترهای جهت‌دهی
   نامرئی RTL/LTR، با نگه‌داشتن یک `+` اختیاری) + تریگر عمومی
   `normalize_phone_column_trigger` روی `bookings.contact_phone`،
   `booking_passengers.passenger_phone`، `customers.phone`،
   `drivers.phone` (`BEFORE INSERT OR UPDATE`). یک `update` یک‌بارهٔ
   پاک‌سازی روی هر چهار جدول اجرا شد (migration کامل در
   `phase-5_6-phone-normalization.sql`). **توجه:** `SB-998817` بعد از
   پاک‌سازی به `0348998349834` تبدیل شد (فقط حذف کاراکتر غیرمجاز «ق»)
   — شمارهٔ واقعی مشتری از این داده‌ی خراب قابل بازسازی نیست؛ نیاز به
   بررسی دستی با مشتری دارد.
2. **کلاینت:** `lib/phone-utils.ts` تازه (`toLatinDigits` برای تبدیل
   زندهٔ ارقام حین تایپ در هر ۶ فیلد شمارهٔ تماس سایت؛ `normalizePhone`
   کامل قبل از هر ارسال به سرور).
3. **سرور (دفاع در عمق):** نرمال‌سازی مجدد در هر ۴ Route Handler
   (`lookup`, `update-contact`, `request-cancellation`, `confirm`) و
   داخل `getBookingByReferenceAndPhone`.

## یافتهٔ جانبی مهم برای فازهای بعد

ستون `trips.status` از قبل یک enum کامل دارد: `scheduled | boarding |
departed | completed | cancelled` — دقیقاً مرتبط با درخواست بعدی Zakir
(معماری وضعیت سفرها)؛ این یعنی آن فاز به تغییر schema نیاز ندارد، فقط
به UI/منطق تعیین وضعیت. **(همین یافته مستقیماً فاز ۵.۷ را ساده کرد.)**

## تأیید

تست end-to-end واقعی روی Supabase زنده (رزرو تست، تغییر شماره با ارقام
فارسی، پیگیری با نتیجهٔ نرمال‌شده) موفق. `get_advisors` (security) صفر
هشدار جدید (۳ تابع تازه/بازنویسی‌شده `search_path` گرفتند، برخلاف
پیش‌فرض قبلی مشابه در `hold_seats`/`release_seats`). `tsc --noEmit`
صفر خطای تازه. `next build` روی هر ۲۹ مسیر موفق.

## فایل‌های تغییریافته

`lib/phone-utils.ts` (جدید)، `phase-5_6-phone-normalization.sql`
(جدید)، `lib/supabase/database.types.ts` (regenerate)،
`lib/supabase/queries.ts`،
`app/api/bookings/{lookup,update-contact,request-cancellation,confirm}/route.ts`،
`components/transport/{booking-lookup,checkout-form,account-signup,
account-complete-profile,contact-page}.tsx`،
`components/admin/driver-manager.tsx`.
