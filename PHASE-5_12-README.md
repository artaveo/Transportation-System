# فاز ۵.۱۲ — Limited Admin و Permission Center

**تکمیل:** ۸ سپتامبر ۲۰۲۶

## زمینه

طبق ROAD-MAP.md: پایهٔ کامل از فاز ۳.۱/۳.۲ در دیتابیس بود — جدول `admins`
ستون `role` (`super_admin`/`limited_admin`) و `allowed_sections text[]`
داشت، تابع RLS کمکی `has_admin_section()` از قبل روی ۷ بخش
(routes/fleet/trips/bookings/payments/loyalty/customers) فعال بود. چیزی
که نبود: هیچ UI برای ساختن/مدیریت ادمین محدود (فقط یک super_admin با
اسکریپت SQL دستی بوت‌استرپ شده — فاز ۳.۳)، middleware فقط `is_admin()`
عمومی چک می‌کرد نه بخش‌های مجاز، و `admin-panel.tsx` همیشه هر ۹ تب را
بدون فیلتر نشان می‌داد.

## بررسی دیتابیس قبل از کد نوشتن

قبل از هر migration، شمای `admins`، enum `admin_role`، تعریف کامل سه
تابع `is_admin()`/`is_super_admin()`/`has_admin_section()`، و کل
`phase-3.2-rls-policies.sql` از دیتابیس زندهٔ Supabase خوانده شد. یافتهٔ
کلیدی: RLS policy `admins_super_write` («for all using
(is_super_admin())») از قبل روی خودِ جدول `admins` وجود داشت — یعنی
نوشتن روی این جدول برای super_admin از طریق کلاینت anon+نشست معمولی
(بدون service_role) از قبل مجاز بود؛ فقط UI برایش وجود نداشت.

## نگاشت تب‌ها به بخش‌های RLS

sidebar فعلی ۹ تب دارد ولی RLS فقط ۷ بخش می‌شناسد؛ نگاشت زیر (در
`admin-panel.tsx`، ثابت `REQUIRED_SECTION`) تصمیمی است که این فاز گرفت:

| تب (UI)           | بخش لازم (RLS)  | یادداشت |
|--------------------|-----------------|---------|
| داشبورد            | (همیشه آزاد)    | صفحهٔ ورود پیش‌فرض هر ادمینی |
| سرویس‌ها (trips)   | `trips`         | — |
| رزروها             | `bookings`      | — |
| ناوگان (buses)     | `fleet`         | با رانندگان مشترک (طبق `buses_admin_write`/`drivers_admin_only` در فاز ۳.۲) |
| رانندگان           | `fleet`         | — |
| مسیرها             | `routes`        | — |
| شهرها              | `routes`        | چون `cities_admin_write` هم دقیقاً همین بخش را چک می‌کند |
| گزارش‌ها           | `bookings`      | چون از جدول `bookings` می‌خواند؛ `trips`/`routes` که در گزارش استفاده می‌شوند public-select هستند |
| باشگاه مشتریان     | `loyalty`       | — |
| **مدیریت ادمین‌ها** | — (فقط role)   | هیچ‌وقت با allowed_sections قابل‌واگذاری نیست |

دو بخش `payments` و `customers` در دیتابیس فعالند ولی هنوز هیچ تب
اختصاصی UI ندارند (پرداخت داخل تب رزروها دیده می‌شود، مدیریت مشتری هنوز
وجود ندارد — بدهی فاز ۱۹ آینده). با این‌حال در Permission Center قابل
انتخاب‌اند تا وقتی آن تب‌ها بعداً اضافه شدند، دسترسی از پیش قابل‌تنظیم
باشد.

## تغییرات دیتابیس (`phase-5_12-permission-center.sql`، دو migration)

1. **CHECK constraint** روی `admins.allowed_sections` — فقط اجازهٔ همان
   ۷ مقدار شناخته‌شدهٔ بالا (یا `null` برای super_admin).
2. **جدول `admin_access_audit`** (نسخهٔ محدود؛ audit log عمومی هنوز
   بدهی فاز ۱۳ است) — با RLS: فقط super_admin می‌تواند SELECT کند،
   هیچ INSERT/UPDATE/DELETE policy‌ای برای هیچ نقشی نیست (تنها راه
   نوشتن، تریگر پایین است).
3. **تریگر `log_admin_access_change()`** (AFTER INSERT/UPDATE روی
   `admins`) — خودکار هر تغییر (ایجاد/نقش/دسترسی‌ها/فعال‌سازی/
   غیرفعال‌سازی/تغییر نام) را با actor (`auth.uid()` وقت وقوع) ثبت
   می‌کند. چون این تریگر بی‌قید و شرط روی هر UPDATE اجرا می‌شود
   (نه فقط تغییرات از طریق UI)، حتی یک تغییر دستی SQL هم audit می‌شود.
4. **تریگر `prevent_self_admin_lockout()`** (BEFORE UPDATE) — یک
   edge case که این فاز اضافه کرد نه بخشی از درخواست اصلی: جلوگیری از
   این‌که یک super_admin نقش خودش را عوض کند یا حساب خودش را غیرفعال
   کند (باید توسط یک super_admin *دیگر* انجام شود). بدون این، تنها
   super_admin موجود می‌توانست به‌اشتباه خودش را قفل کند بدون راه
   بازگشتی جز SQL دستی.
5. **`list_admins_with_email()`** و **`list_admin_audit_log()`** —
   دو تابع `SECURITY DEFINER` که فقط برای `is_super_admin()` ردیف
   برمی‌گردانند (صفر ردیف، نه خطا — دقیقاً الگوی `has_admin_section`).
   اولی با `auth.users` جوین می‌شود تا UI بتواند ایمیل/آخرین‌ورود را
   نشان دهد، بدون این‌که `auth.users` مستقیماً exposed شود.

**نکتهٔ مهم دربارهٔ grantها:** بعد از migration اول، `Supabase:
get_advisors(security)` نشان داد `list_admins_with_email`/
`list_admin_audit_log` هنوز برای نقش `anon` هم قابل‌اجرا هستند —
`revoke ... from public` کافی نبود چون Supabase به‌صورت پیش‌فرض روی
schema `public` یک `ALTER DEFAULT PRIVILEGES` دارد که مستقیماً (نه فقط
از طریق `PUBLIC`) به `anon`/`authenticated` اجازهٔ EXECUTE می‌دهد.
Migration دوم صریحاً `revoke ... from anon` (و برای دو تابع تریگر،
از `anon, authenticated` هر دو) اجرا کرد. بعد از آن `get_advisors`
هیچ warning تازه‌ای نشان نداد.

## تصمیم دربارهٔ ساخت حساب Auth ادمین جدید

ROAD-MAP دو گزینه مطرح کرده بود: «دعوت دستی از Supabase Dashboard» یا
«Admin API». این فاز گزینهٔ دوم را انتخاب کرد (تجربهٔ کاربری واقعی برای
super_admin، نه رفتن به Dashboard هر بار):

- `app/api/admin/admins/route.ts` (Route Handler تازه) — تنها بخشی از
  کل این فاز که واقعاً به `service_role` نیاز دارد، چون
  `auth.admin.inviteUserByEmail()` یک عملیات مدیریتی GoTrue است که با
  anon key ممکن نیست.
- درج ردیف جدول `admins` عمداً با کلاینت anon+نشستِ خودِ super_admin
  درخواست‌دهنده انجام می‌شود (نه `service_role`) — چون RLS policy
  `admins_super_write` از قبل این را مجاز کرده، و این‌طور تریگر audit
  `auth.uid()` درست (خودِ super_admin دعوت‌کننده) را می‌بیند؛ با
  `service_role` هیچ `auth.uid()`ای در دسترس تریگر نیست.
- اگر درج ردیف `admins` بعد از دعوت موفق شکست بخورد (مثلاً race
  condition یا نقض constraint)، حساب Auth یتیم به‌صورت best-effort با
  `serviceClient.auth.admin.deleteUser()` پاک می‌شود تا حساب بی‌صاحب
  در سیستم نماند.
- `app/admin/accept-invite/page.tsx` (صفحهٔ تازه) — قدم دوم: دقیقاً
  همان الگوی implicit-flow دومرحله‌ای `account-reset-password.tsx`
  (فاز ۴.۷)، چون فعلاً SMTP اختصاصی وصل نیست و دعوت هم از قالب
  پیش‌فرض ایمیل Supabase استفاده می‌کند. تفاوت مهم: رکورد `admins`
  از همان لحظهٔ دعوت در دیتابیس وجود دارد (نه بعد از تعیین رمز)، پس
  `is_admin()` از همان اول true است — این صفحه فقط رمز عبور می‌سازد.
- `middleware.ts`: یک استثنای تازه (`ADMIN_ACCEPT_INVITE_PATH`) دقیقاً
  مثل الگوی `ACCOUNT_SESSION_OPTIONAL_PATH` موجود — این یک مسیر کاملاً
  دست‌نخورده رد می‌شود، خودِ کامپوننت نشست را چک می‌کند.

## تغییرات UI

- **`app/admin/page.tsx`:** `role`/`allowed_sections` خودِ ادمین
  لاگین‌شده یک‌بار سمت سرور خوانده و به `AdminPanel` پاس داده می‌شود
  (نه یک fetch اضافه سمت کلاینت).
- **`components/transport/admin-panel.tsx`:** `navItems` حالا بر
  اساس جدول نگاشت بالا فیلتر می‌شود؛ تب تازهٔ «مدیریت ادمین‌ها»
  (آیکون `ShieldCheck`) فقط برای `role === 'super_admin'` اضافه
  می‌شود.
- **`components/admin/admin-manager.tsx`** (کامپوننت تازه): جدول
  همهٔ ادمین‌ها (نام/ایمیل/نقش/بخش‌های مجاز/وضعیت/آخرین ورود)، دکمهٔ
  «دعوت ادمین جدید» (مودال → `POST /api/admin/admins`)، ویرایش هر
  ادمین (نام/نقش/بخش‌ها → مستقیم `supabase.from("admins").update()`),
  سوییچ فعال/غیرفعال inline (الگوی یکسان با `CityManager`)، و یک پنل
  جمع‌شونده «تاریخچهٔ تغییرات دسترسی» که از `list_admin_audit_log`
  می‌خواند. سطرِ خودِ super_admین لاگین‌شده با برچسب «(خودتان)» مشخص
  می‌شود و سوییچ غیرفعال‌سازی‌اش از قبل در UI هم غیرفعال است (علاوه بر
  محافظت تریگر دیتابیس) تا حتی خطای Postgres هم دیده نشود.
- **`lib/i18n.ts`:** کلید `nav.admins` + یک بلوک کامل `admin.admins.*`
  (فارسی/انگلیسی) شامل برچسب هر ۷ بخش، پیام‌های خطای مخصوص (ایمیل
  تکراری، قفل‌شدن خود و ...)، و برچسب هر نوع رویداد audit.

## اعتبارسنجی

`pnpm install` → `npx tsc --noEmit`: همان baseline ۹ خطای از
پیش‌موجود (در `app/api/bookings/confirm/route.ts` و سه فایل
`account-*.tsx`) — صفر خطای تازه از تغییرات این فاز. `pnpm build`
(بعد از stub موقت فونت‌های Google طبق محدودیت شبکهٔ sandbox، و بازگردانی
فوری بعد از build): موفق روی هر ۳۱ روت، شامل دو روت تازه
(`/admin/accept-invite` و `/api/admin/admins`). `Supabase:
get_advisors(security)`: بدون warning تازه بعد از هر دو migration
(بعد از تنگ‌کردن grantها در migration دوم).

## بدهی/نکات باز برای Zakir

- تب‌های «پرداخت‌ها» و «مشتریان» هنوز در UI وجود ندارند؛ بخش‌های
  `payments`/`customers` در Permission Center از قبل قابل‌انتخاب‌اند
  تا آمادهٔ آن تب‌های آینده باشند.
- هیچ حذف سخت (hard delete) ادمین وجود ندارد — فقط غیرفعال‌سازی، مثل
  الگوی `CityManager`؛ اگر حذف کامل واقعاً لازم شد، باید جدا با Zakir
  تأیید شود (چون `admin_access_audit`/`coupons.created_by_admin_id`/
  `payments.confirmed_by_admin_id` به `admins.id` رفرنس دارند).
- دعوت ایمیلی فعلاً از قالب پیش‌فرض Supabase استفاده می‌کند — همان
  بدهی مستندشدهٔ SMTP که برای فراموشی رمز مسافر (فاز ۴.۷) هم صادق است؛
  وقتی SMTP اختصاصی وصل شد، قالب دعوت هم باید مرور شود.

## فایل‌های تغییریافته/تازه

`app/admin/page.tsx`، `components/transport/admin-panel.tsx`،
`middleware.ts`، `lib/i18n.ts`، `lib/supabase/database.types.ts`
(regenerate کامل)، `ROAD-MAP.md` — **تازه:**
`components/admin/admin-manager.tsx`،
`app/api/admin/admins/route.ts`،
`app/admin/accept-invite/page.tsx`،
`phase-5_12-permission-center.sql` (دو migration، مستقیماً روی
Supabase اعمال شدند، ذخیره‌شده برای audit trail).
