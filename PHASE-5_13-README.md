# فاز ۵.۱۳ — Public CMS Lite

**تکمیل:** ۸ سپتامبر ۲۰۲۶

## زمینه

طبق ROAD-MAP.md (بخش ۷، پیش‌نویس ثبت‌شده قبل از این فاز)، هیچ‌کدام از این‌ها
دیتابیسی نبودند: تماس شرکت (تلفن/ایمیل فوتر)، آمار «درباره ما» (سال
فعالیت/شهر/بس/سرویس روزانه)، عکس واقعی ناوگان، و آدرس/تلفن/ساعت کاری هر یک
از ۱۱ دفتر — همه‌شان یا هاردکد در `lib/i18n.ts` بودند یا صریحاً به‌صورت
متن `[PLACEHOLDER — ...]` نمایش داده می‌شدند.

طبق قاعدهٔ صریح ROAD-MAP («کار لازم قبل از شروع کد، با Zakir تأیید شود»)،
پیش از نوشتن هر خط کد یک تأیید صریح گرفته شد:

1. کدام بخش‌ها قابل‌ویرایش شوند؟ → **همهٔ چهار پیشنهاد اولیه + «هرچی دگر که
   باید طبق استندرد جهانی قابل‌ویرایش باشه»**.
2. دفاتر چطور مدیریت شوند؟ → **هرکدام جداگانه** (آدرس/تلفن/ساعت مستقل هر
   دفتر)، نه یک بلاک تماس واحد.

## تصمیم دربارهٔ محدودهٔ «هرچی دگر»

بخش دوم تأیید («طبق استندرد جهانی») باز بود، پس این تصمیم گرفته شد: عکس
پس‌زمینهٔ هیرو/ناوگان/درباره‌ما (سیستم چهار-برشی `ResponsivePhoto` فاز ۴.۶
— موبایل/تبلت/دسکتاپ/وایدِ جداگانه) **عمداً از این فاز خارج ماند**. این
عکس‌ها از قبل واقعی‌اند (نه placeholder)؛ ادمین‌کردنشان نیاز به یک pipeline
تولید ۴ برش مجزا دارد، نه یک آپلود ساده — طبق اصل صریح ROAD-MAP («نه کل
ساختار صفحه»)، این یک بدهی جداگانه ثبت شد (بخش «بدهی‌های مستند» پایین)، نه
چیزی که در همین فاز حل شود.

در عوض، یک اسلات عکس *جدید* که تا این فاز اصلاً وجود نداشت شناسایی شد:
بخش «تعهد به ایمنی و کیفیت» صفحهٔ درباره ما فقط یک یادداشت متنی
`fleetPhotoNote` («نیاز به تصویر واقعی») داشت، هیچ `<img>` ای نبود — این
دقیقاً همان چیزی است که یک آپلود ساده (بدون نیاز به چند برش) حلش می‌کند.

## بررسی دیتابیس قبل از کد نوشتن

قبل از migration: `Supabase:list_tables` تأیید کرد هیچ `site_settings` یا
`offices` ای وجود ندارد؛ `pg_get_functiondef` تعریف کامل `has_admin_section`/
`is_admin`/`is_super_admin` را نشان داد؛ `admins_allowed_sections_valid`
(فاز ۵.۱۲) و ساختار دقیق `loyalty_settings` (الگوی singleton، فاز ۵.۴)
به‌عنوان الگوی مستقیم برای `site_settings` خوانده شدند؛ فهرست کامل ۱۱ دفتر
هاردکد در `lib/i18n.ts` و ۸ شهر فعال کریدور (با UUID واقعی) استخراج شد تا
seed دقیقاً منطبق با داده‌ی زندهٔ فعلی باشد. هیچ storage bucket ای از قبل
وجود نداشت.

## تغییرات دیتابیس (`phase-5_13-public-cms-lite.sql`، یک migration)

۱. **بخش هشتم Permission Center:** `admins_allowed_sections_valid` بازنویسی
   شد تا `'content'` را هم بپذیرد (در کنار ۷ بخش فاز ۵.۱۲: routes/fleet/
   trips/bookings/payments/loyalty/customers).

۲. **`site_settings`** — جدول singleton (`id boolean primary key default
   true`, `constraint ..._singleton check (id)` — دقیقاً همان الگوی
   `loyalty_settings`): `company_phone`, `company_email`,
   `about_years_active`, `about_cities_covered`, `about_buses_in_fleet`,
   `about_daily_trips`, `fleet_photo_url`. همه nullable — مقدار `NULL`
   یعنی «هنوز از شرکت تأیید نشده» (طبق اصل no-fabrication که در
   `trust-stats.tsx` از قبل مستند بود). trigger `set_updated_at` مشترک با
   بقیهٔ پروژه استفاده شد. RLS: `select` برای همه (public/anon هم — چون
   فوتر/درباره‌ما/صفحهٔ اصلی کامپوننت کلاینت‌اند و مستقیم با کلید anon
   می‌خوانند، دقیقاً برخلاف `loyalty_settings` که فقط ادمین می‌خواند)، `update`
   فقط `has_admin_section('content')` (بدون insert/delete — تک‌ردیفی قفل است).

۳. **`offices`** — جایگزین آرایهٔ هاردکد در `lib/i18n.ts`: `city_id`
   (references `cities`), `name_fa`/`name_en`, `address_fa`/`address_en`,
   `phone`, `hours_fa`/`hours_en` (هرکدام مستقل و nullable — طبق تصمیم
   Zakir)، `display_order`, `is_active`. RLS دقیقاً مثل الگوی `cities`
   فاز ۳.۲: `select` عمومی فقط برای `is_active = true` **یا**
   `has_admin_section('content')` (تا ادمین دفاتر غیرفعال را هم برای
   ویرایش ببیند)، `all` (insert/update/delete) فقط `has_admin_section
   ('content')`. Seed: همان ۱۱ دفتر فعلی (کابل×۳، غزنی، قلات، کندهار×۲،
   هلمند، نیمروز، فراه، هرات) با `city_id` واقعی — آدرس/تلفن/ساعت `NULL`
   تا Zakir از پنل تکمیل کند.

۴. **Storage bucket `site-content`** — پابلیک (`public = true`)، محدود به
   ۵ مگابایت و `image/png`/`image/jpeg`/`image/webp`. سیاست‌های
   `storage.objects`: `select` عمومی (بارگذاری مستقیم از URL پابلیک)،
   `insert`/`update`/`delete` فقط `authenticated` + `has_admin_section
   ('content')`.

`Supabase:get_advisors(security)` بعد از migration اجرا شد — هیچ finding
جدیدی مرتبط با `site_settings`/`offices`/`site-content` گزارش نشد (فقط
هشدارهای از‌پیش‌موجود روی توابع دیگر که بدهی مستند فازهای قبل‌اند).
`Supabase:generate_typescript_types` اجرا و در `lib/supabase/database.types.ts`
ذخیره شد.

## تغییرات UI

### پنل ادمین

- **تب جدید «محتوای سایت»** در `admin-panel.tsx` (آیکون `FileText`)، پشت
  `REQUIRED_SECTION.content = 'content'` — دقیقاً همان الگوی فیلتر sidebar
  فاز ۵.۱۲.
- **`components/admin/site-content-manager.tsx`** (تازه): دو بخش مستقل.
  - فرم تنظیمات سراسری: تلفن/ایمیل شرکت + ۴ فیلد آمار «درباره ما» (هرکدام
    اختیاری — خالی‌گذاشتن یعنی همان placeholder فعلی روی سایت می‌ماند) +
    آپلود/تعویض/حذف عکس واقعی ناوگان (نام فایل نسخه‌بندی‌شده
    `fleet/fleet-{timestamp}.ext` — طبق درسِ کش تصویر تلگرام/واتساپ که در
    حافظهٔ پروژه ثبت است: آپلود دوباره با همان نام هیچ‌وقت رفرش نمی‌شود).
  - CRUD کامل دفاتر (الگوی `RouteManager` فاز ۵.۱): دراپ‌داون شهر (همهٔ
    ۳۴ ولایت، غیرفعال‌ها با برچسب — مثل `RouteManager`)، نام/آدرس/ساعت
    دوزبانه، تلفن، سوییچ فعال/غیرفعال، حذف با تأیید.
- **`admin-manager.tsx`**: `SECTION_KEYS` هشت‌تایی شد (`content` اضافه
  شد) تا سوپرادمین بتواند این بخش را به یک ادمین محدود واگذار کند؛ کامنت
  بالای فایل به‌روزرسانی شد.
- **`lib/i18n.ts`**: برچسب بخش `content` (Permission Center)، `nav.content`،
  و کل بلوک `admin.siteContent` (فرم + جدول دفاتر) — دو زبان کامل.

### صفحات پابلیک

چهار کامپوننت پابلیک به `lib/hooks/use-site-content.ts` (تازه — دو هوک
`useSiteSettings`/`useActiveOffices` مشترک، تا منطق fetch/fallback یک‌بار
نوشته شود نه چهار بار) وصل شدند. **قاعدهٔ مشترک همه‌جا: هر فیلد مستقل** —
اگر Zakir فقط بخشی از داده را پر کند، همان بخش عدد/متن واقعی نشان می‌دهد و
بقیه دقیقاً همان placeholder قبلی می‌ماند؛ هیچ مقدار پیش‌فرض ساختگی جای
`NULL` نمی‌نشیند (طبق همان اصل no-fabrication). اگر خودِ fetch شکست بخورد
(خطای شبکه/RLS)، به آرایهٔ ثابت `t.offices` در `lib/i18n.ts` برمی‌گردیم تا
صفحه هیچ‌وقت خالی نماند.

- **`site-footer.tsx`**: دفاتر گروه‌بندی‌شده حالا از `offices` می‌آید نه
  `t.offices`؛ badge «نیاز به آدرس/تلفن دفتر» فقط وقتی نشان داده می‌شود که
  حداقل یک دفتر فعال هنوز آدرس/تلفن ندارد. تلفن/ایمیل شرکت از
  `site_settings` — در غیر این صورت همان UI placeholder قبلی.
- **`contact-page.tsx`**: کارت هر دفتر حالا آدرس/تلفن/ساعت واقعی (اگر
  موجود) نشان می‌دهد؛ فیلد تلفن per-office که قبلاً اصلاً نمایش داده
  نمی‌شد اضافه شد. badge سطح-بخش «ساعت کاری هر دفتر» فقط اگر حداقل یک دفتر
  هنوز ساعت ندارد. بلوک تماس پایین فرم پیام هم به `site_settings` وصل شد.
- **`about-page.tsx`**: هرکدام از ۴ آمار مستقل (نه یک placeholder مشترک
  برای هر چهار) — badge پایین فقط اگر حداقل یکی هنوز خالی است. بخش «تعهد
  به ایمنی» حالا اگر `fleet_photo_url` ست شده یک `<img>` واقعی نشان
  می‌دهد، وگرنه دقیقاً همان یادداشت placeholder قبلی.
- **`trust-stats.tsx`** (صفحهٔ اصلی): همان الگوی مستقل‌بودن هر آیتم؛ ۳ آیتم
  (سال/شهر/سرویس روزانه) از همان `site_settings` می‌آیند.

## اعتبارسنجی

- `Supabase:get_advisors(security)`: بدون finding جدید.
- `pnpm tsc --noEmit`: دقیقاً همان ۱۸ خط خطای از‌پیش‌موجود (`app/api/
  bookings/confirm/route.ts` + سه فایل `account-*.tsx`، بدهی مستند از
  فازهای قبل) — **صفر خطای جدید**.
- `pnpm run build` (Turbopack): موفق، هر ۲۵ روت (از جمله `/`, `/about`,
  `/contact`, `/admin`) تولید شدند.
- استاب موقت فونت گوگل (طبق محدودیت شبکهٔ sandbox — `fonts.googleapis.com`
  مسدود است) قبل از build اعمال و بلافاصله بعد از build به حالت واقعی
  (`next/font/google`) برگردانده شد؛ نسخهٔ تحویلی هیچ استابی ندارد.
- بررسی دستی دیتابیس: `select count(*) from offices` → ۱۱ (منطبق با seed)؛
  `select * from site_settings` → یک ردیف، همهٔ فیلدهای قابل‌ویرایش `NULL`.

## بدهی/نکات باز برای Zakir

- **دادهٔ واقعی هنوز خالی است** — این فاز فقط زیرساخت (دیتابیس + UI) را
  ساخت؛ تلفن/ایمیل شرکت، آمار «درباره ما»، عکس ناوگان، و آدرس/تلفن/ساعت هر
  ۱۱ دفتر باید از تب «محتوای سایت» پر شوند تا placeholder ها از سایت پابلیک
  محو شوند.
- **عکس‌های پس‌زمینهٔ هیرو/ناوگان/درباره‌ما** (سیستم ۴-برشی `ResponsivePhoto`)
  عمداً خارج از این فاز ماند (نگاه کنید به «تصمیم دربارهٔ محدودهٔ هرچی دگر»
  بالا). اگر در آینده لازم شد این‌ها هم از پنل قابل‌تعویض باشند، نیاز به
  یک migration جدید + یا آپلود ۴ فایل جداگانه توسط ادمین، یا یک pipeline
  خودکار crop سمت سرور (`sharp` از قبل در پروژه هست) — این یک فاز/زیرفاز
  مستقل است، نه کار کوچک.
- فایل قدیمی که حذف عکس در Storage را هنگام «تعویض عکس ناوگان» انجام دهد
  نوشته نشد — آپلود جدید فایل قدیمی را در bucket باقی می‌گذارد (orphan).
  حجم/تعداد فایل کم است (یک عکس ناوگان)، پس فعلاً بی‌خطر است؛ اگر در آینده
  فیلدهای عکس بیشتری اضافه شد، یک پاک‌سازی دوره‌ای یا حذف صریح موقع تعویض
  ارزش اضافه‌کردن دارد.
- `lib/i18n.ts` هنوز آرایهٔ `offices` را به‌عنوان fallback نگه می‌دارد (برای
  حالت شکست fetch) — این عمداً حذف نشد.

## فایل‌های تغییریافته/تازه

```text
تازه:
  components/admin/site-content-manager.tsx
  lib/hooks/use-site-content.ts
  phase-5_13-public-cms-lite.sql
  PHASE-5_13-README.md

تغییریافته:
  components/admin/admin-manager.tsx        (SECTION_KEYS + کامنت)
  components/transport/admin-panel.tsx      (تب «محتوای سایت»)
  components/transport/site-footer.tsx      (دفاتر/تماس از DB)
  components/transport/contact-page.tsx     (دفاتر/تماس از DB)
  components/transport/about-page.tsx       (آمار/عکس ناوگان از DB)
  components/transport/trust-stats.tsx      (آمار از DB)
  lib/i18n.ts                               (sections.content, nav.content, admin.siteContent)
  lib/supabase/database.types.ts            (بازتولید — site_settings, offices)
  ROAD-MAP.md                               (وضعیت فاز ۵.۱۳ → تکمیل)
```
