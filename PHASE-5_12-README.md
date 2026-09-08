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

## فایل‌های تغییریافته/تازه (تحویل اصلی فاز ۵.۱۲)

`app/admin/page.tsx`، `components/transport/admin-panel.tsx`،
`middleware.ts`، `lib/i18n.ts`، `lib/supabase/database.types.ts`
(regenerate کامل)، `ROAD-MAP.md` — **تازه:**
`components/admin/admin-manager.tsx`،
`app/api/admin/admins/route.ts`،
`app/admin/accept-invite/page.tsx`،
`phase-5_12-permission-center.sql` (دو migration، مستقیماً روی
Supabase اعمال شدند، ذخیره‌شده برای audit trail).

---

# ریزفاز ۵.۱۲.۱ — جدا نگه‌داشتن هویت ادمین از هویت مسافر

**زمینه:** Zakir پرسید آیا ایمیل یک ادمین می‌تواند هم‌زمان حساب مسافر
هم داشته باشد. جواب: در schema قبلی هیچ قیدی این را نمی‌بست. تصمیم
گرفته شد که یک حساب Auth (بر اساس `auth_user_id`، نه فقط رشتهٔ ایمیل)
نباید هم‌زمان هم ردیف `admins` داشته باشد هم ردیف `customers`.

**پیاده‌سازی:**
- تریگر `prevent_admin_customer_overlap()` (BEFORE INSERT OR UPDATE OF
  auth_user_id روی `admins`) — اگر `auth_user_id` تازه از قبل در جدول
  `customers` هم باشد، با خطای `AUTH_USER_ALREADY_CUSTOMER` رد می‌کند.
  این لایهٔ واقعی enforcement است (کار می‌کند حتی اگر یک روز کد دیگری
  مستقیم روی `admins` بنویسد).
- در `app/api/admin/admins/route.ts` یک چک سریع قبل از فراخوانی
  `inviteUserByEmail` اضافه شد: اگر ایمیل از قبل در جدول `customers`
  باشد، بدون حتی فرستادن دعوت، خطای `EMAIL_IS_CUSTOMER` برمی‌گردد
  (تجربهٔ بهتر از این‌که اول دعوت بفرستد بعد شکست بخورد).
- خطای تریگر هم در همان route گرفته می‌شود (اگر race condition باعث شود
  چک اولیه رد شود ولی درج نهایی به تریگر بخورد) — با همان کد
  `EMAIL_IS_CUSTOMER` به کاربر.

**تصمیم عمداً محدود:** فقط جهت «مسافر نمی‌تواند ادمین شود» بسته شد.
جهت برعکس (یک ادمین برود در `/account/signup` پروفایل مسافر هم برای
خودش بسازد) دست‌نخورده ماند — چون Zakir فقط همین یک جهت را خواسته بود؛
اگر لازم شد، یک تریگر آینه‌ای کوچک روی جدول `customers` کافی است.

---

# ریزفاز ۵.۱۲.۲ — لایهٔ سوم: «مدیر کل» (can_manage_admins)

**زمینه:** بحث با Zakir دربارهٔ این‌که «مدیریت ادمین‌ها» باید از `role`
جدا باشد — یک `limited_admin` باید بتواند دسترسی کامل به همهٔ بخش‌های
عملیاتی داشته باشد (با تیک‌زدن هر ۷ بخش) بدون این‌که خودکار به تب
«مدیریت ادمین‌ها» دسترسی پیدا کند. تصمیم نهایی (بین دو گزینهٔ مطرح‌شده):
مدل «Owner vs Admin/Manager» — یک لایهٔ سوم (`can_manage_admins`) که
می‌تواند ادمین‌های محدود دیگر را مدیریت کند، ولی **هرگز** نمی‌تواند به
حساب‌های سوپرادمین دست بزند یا کسی (حتی خودش) را سوپرادمین/مدیر کل کند
— فقط یک سوپرادمین واقعی این دو کار حیاتی را می‌تواند.

**تغییرات دیتابیس:**
- ستون تازه `admins.can_manage_admins boolean not null default false`.
- تابع کمکی `can_manage_admins()` — دقیقاً همان الگوی `is_super_admin`/
  `has_admin_section`: `role = 'super_admin' OR can_manage_admins = true`
  (و `is_active`).
- RLS بازنویسی شد: SELECT حالا `can_manage_admins()` را هم می‌پذیرد؛
  دو policy تازهٔ INSERT/UPDATE برای مدیر کل اضافه شد (دروازهٔ گسترده —
  محدودیت دقیق در تریگر پایین، نه در RLS، چون RLS به‌تنهایی نمی‌تواند
  مقدار OLD و NEW را با هم مقایسه کند).
- **تریگر `enforce_admin_management_boundaries()`** (BEFORE INSERT OR
  UPDATE) — قلب این ریزفاز: اگر عامل سوپرادمین واقعی باشد بدون محدودیت
  رد می‌شود؛ اگر مدیر کل باشد، رد می‌شود *مگر این‌که*: ردیف هدف از قبل
  `super_admin` باشد (رد با خطای `MANAGER_CANNOT_TOUCH_SUPER_ADMIN`)،
  یا `role` تازه چیزی جز `limited_admin` باشد (`MANAGER_CANNOT_GRANT_SUPER_ADMIN`)،
  یا مقدار `can_manage_admins` تغییر کند (`MANAGER_CANNOT_GRANT_MANAGE_FLAG`).
  اگر عامل نه سوپرادمین است نه مدیر کل (حالتی که نباید اصلاً به این‌جا
  برسد چون RLS قبلش رد کرده)، با `NOT_AUTHORIZED` رد می‌شود.
  **نکتهٔ مهم:** اگر `auth.uid()` خالی باشد (یعنی عملیات از طریق SQL
  مستقیم/migration انجام می‌شود، نه یک نشست Supabase Auth واقعی)، تریگر
  دست‌نخورده رد می‌شود — وگرنه حتی بوت‌استرپ اولین super_admin (فاز ۳.۳)
  و migrationهای بعدی من هم قفل می‌شدند.
- `admin_access_audit.change_type` یک مقدار تازه گرفت:
  `manage_flag_changed`؛ `log_admin_access_change()` برای این ستون هم
  audit می‌نویسد.
- `list_admins_with_email()`/`list_admin_audit_log()` گیت‌شان گسترده‌تر
  شد (`is_super_admin() OR can_manage_admins()`) و ستون `can_manage_admins`
  به خروجی اولی اضافه شد.

**تغییرات API/UI:**
- `app/api/admin/admins/route.ts`: گیت اصلی از `is_super_admin` به
  `can_manage_admins` عوض شد؛ دو چک تازه اضافه شد که فقط سوپرادمین
  واقعی می‌تواند `role=super_admin` بدهد یا `canManageAdmins=true`
  بفرستد (همان قانون تریگر، زودتر و با پیام روشن‌تر تکرار شده).
- `app/admin/page.tsx`/`admin-panel.tsx`: ستون `can_manage_admins` هم
  خوانده و به `AdminPanel` پاس داده می‌شود؛ تب «مدیریت ادمین‌ها» حالا
  برای `isSuperAdmin || canManageAdmins` باز می‌شود؛ `AdminManager` یک
  پراپ تازه `viewerIsSuperAdmin` می‌گیرد.
- `components/admin/admin-manager.tsx`: برای یک بازدیدکنندهٔ مدیر کل
  (نه سوپرادمین واقعی) — دکمهٔ ویرایش و سوییچ فعال/غیرفعال روی ردیف‌های
  سوپرادمین اصلاً رندر نمی‌شود (`canManageRow()`)، دراپ‌داون نقش با یک
  متن ثابت «ادمین محدود» جایگزین می‌شود (اصلاً گزینهٔ سوپرادمین دیده
  نمی‌شود)، و چک‌باکس «می‌تواند ادمین‌ها را مدیریت کند» فقط وقتی
  `viewerIsSuperAdmin` باشد رندر می‌شود. یک برچسب «مدیر کل» کنار نقش هر
  ادمینی که این پرچم را دارد نشان داده می‌شود. زیرعنوان بالای صفحه هم
  برای یک مدیر کل عوض می‌شود (`managerScopeNotice`) تا محدودهٔ دقیق
  دسترسی‌اش را توضیح دهد.

---

# ریزفاز ۵.۱۲.۳ — رفع یک نشتی امنیتی واقعی در grantها

موقع بررسی migration ریزفاز ۵.۱۲.۲، متوجه شدم روش `revoke execute ...
from anon, authenticated` که در فاز اصلی ۵.۱۲ برای قفل‌کردن توابع
تریگر (`log_admin_access_change`, `prevent_self_admin_lockout`) استفاده
شده بود، **کامل نبود**: PostgreSQL هنگام ساخت هر تابع، خودکار EXECUTE
را به نقش `PUBLIC` می‌دهد؛ چون نقش‌های `anon`/`authenticated` عضو ضمنی
`PUBLIC` هستند، `revoke ... from anon, authenticated` فقط گرنت مستقیم
آن دو نقش را پاک می‌کند، نه گرنت جداگانهٔ `PUBLIC` را. با یک کوئری
مستقیم روی `pg_proc.proacl` (نه فقط `get_advisors`، که گاهی نتیجهٔ
قدیمی نشان می‌دهد) این نشتی روی ۴ تابع تأیید شد:
`log_admin_access_change`، `prevent_self_admin_lockout`،
`prevent_admin_customer_overlap`، `enforce_admin_management_boundaries`
— هر ۴ تا برای `anon` هم قابل‌اجرا بودند (فقط به این معنی که کسی
می‌توانست آن‌ها را مستقیم به‌عنوان RPC صدا بزند، نه این‌که RLS دور زده
شود — چون این توابع فقط منطق تریگر دارند و به‌صورت مستقل معنی ندارند،
ولی اصل «کمترین دسترسی ممکن» رعایت نشده بود).

**رفع:** یک migration تصحیحی (`revoke all ... from public`) روی هر ۴
تابع + یک `revoke execute ... from anon` تازه روی `list_admins_with_email`
(که در ریزفاز ۵.۱۲.۲ با DROP+CREATE از نو ساخته شده بود و گرنت پیش‌فرض
`anon` را دوباره گرفته بود). بعد از این migration، با کوئری مستقیم روی
`has_function_privilege()` برای هر ۴ تابع + `list_admins_with_email`
تأیید شد که نه `anon` نه `authenticated` دیگر دسترسی مستقیم ندارند.
`get_advisors(security)` نهایی هم تمیز است (فقط همان چند warning
پیش‌موجود/عمدی که در فاز اصلی هم بود: `is_admin`/`is_super_admin`/
`has_admin_section`/`can_manage_admins` که *عمداً* برای `anon` باز
هستند، چون خودشان `auth.uid()` را چک می‌کنند).

**درس گرفته‌شده (برای فازهای بعدی):** برای هر تابع داخلی/تریگر که نباید
مستقیم RPC-پذیر باشد، از این پس هم `revoke all ... from public` هم
`revoke execute ... from anon, authenticated` هر دو لازم است — نه فقط
دومی. برای توابعی که یک بار DROP+CREATE می‌شوند (نه فقط CREATE OR
REPLACE)، گرنت پیش‌فرض هم دوباره برمی‌گردد و باید دوباره revoke شود.

## فایل‌های تغییریافته در این سه ریزفاز

همان فایل‌های بالا دوباره تغییر کردند: `app/api/admin/admins/route.ts`،
`app/admin/page.tsx`، `components/transport/admin-panel.tsx`،
`components/admin/admin-manager.tsx`، `lib/i18n.ts`،
`lib/supabase/database.types.ts` (regenerate دوباره)،
`phase-5_12-permission-center.sql` (پنج migration اضافه شد).

