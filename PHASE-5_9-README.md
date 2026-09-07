# فاز ۵.۹ — مدیریت شهرها و ولایت‌ها

**تکمیل:** ۷ سپتامبر ۲۰۲۶

## زمینه

جدول `cities` از فاز ۳.۱ ستون `is_active` داشت، اما فقط ۸ شهر کریدور
فعلی (کابل، غزنی، قلات/زابل، کندهار، هلمند، نیمروز، فراه، هرات) seed
شده بودند؛ ۲۶ ولایت دیگر افغانستان اصلاً رکورد نداشتند (نه این‌که
غیرفعال باشند)، و تنها راه تغییر `is_active` اجرای SQL دستی بود.

## تأیید فهرست canonical (طبق قانون عدم جعل اطلاعات)

قبل از هر migration، فهرست ۲۶ ولایت باقی‌مانده (نام دری+انگلیسی) از
ویکی‌پدیا و منابع دری تقاطعی استخراج و **مستقیماً با Zakir در چت تأیید
شد** — طبق دستور صریح بخش ۵.۹ نسخهٔ قبلی این سند. مرزبندی اداری
افغانستان همچنان ۳۴ ولایت است (بدون تغییر رسمی جدید).

## تغییرات

### ۱. Migration دیتا (بدون تغییر schema)

`phase_5_9_add_remaining_provinces` — insert ۲۶ ردیف به `cities` با
`is_active=false`، `display_order` ۹ تا ۳۴ (الفبایی بر اساس `name_en`،
طبق انتخاب صریح Zakir). ۸ ردیف فعال قبلی دست‌نخورده ماندند. هیچ ستون
جدیدی لازم نبود (`is_active`/`display_order` از فاز ۳.۱ موجود بودند).
`Supabase:get_advisors(security)` بعد از migration هیچ warning جدیدی
نشان نداد (فقط موارد از پیش‌موجود مربوط به functionهای قبلی).
`generate_typescript_types` لازم نبود چون shape جدول تغییر نکرد.

### ۲. دراپ‌داون مبدأ/مقصد در `RouteManager`

این کامپوننت از قبل (بدون فیلتر `is_active`) هر شهر را fetch می‌کرد،
پس بعد از migration خودبه‌خود هر ۳۴ گزینه را نشان می‌دهد. تنها چیزی که
اضافه شد تابع `cityOptionLabel()`: برای شهرهای غیرفعال، برچسب گزینه
با `(غیرفعال)` / `(Inactive)` مشخص می‌شود تا ادمین گمراه نشود.

### ۳. تب تازهٔ «شهرها» (`components/admin/city-manager.tsx`)

- جدول همهٔ ۳۴ شهر (نام دری/انگلیسی) + سوییچ inline فعال/غیرفعال روی
  هر ردیف — بدون مودال، بدون نیاز به SQL دستی.
- فیلد جست‌وجو برای پیداکردن سریع یک ولایت در فهرست ۳۴تایی.
- toggle مستقیماً `cities.is_active` را در Supabase به‌روزرسانی می‌کند؛
  چون هم `RouteManager` هم `getActiveCities()` (صفحهٔ اصلی/سرچ عمومی
  مشتری) از همین ستون می‌خوانند، اثر بلافاصله روی هر دو ظاهر می‌شود —
  نیازی به کش‌زدایی جداگانه نبود چون فاز ۵.۱۰ کش را حل می‌کند، نه این
  فاز (همهٔ صفحات فعلاً Dynamic هستند).
- عمداً CRUD کامل (افزودن/حذف شهر) پیاده نشد — فهرست ۳۴ ولایت رسمی و
  ثابت است؛ فقط toggle طبق درخواست دقیق فاز.
- کنترل toggle تازه (`ToggleSwitch`) به `admin-ui.tsx` اضافه شد تا
  مدیرهای بعدی هم بتوانند از همان الگو (بدون transform، با موقعیت
  منطقی `start-*` برای سازگاری خودکار RTL/LTR) استفاده کنند.
- تب در `admin-panel.tsx` بین «مسیرها» و «گزارش‌ها» اضافه شد (آیکون
  `Map` از lucide-react).

### ۴. i18n

کلیدهای `admin.nav.cities` و `admin.cities.*` به هر دو زبان (`fa`/`en`)
در `lib/i18n.ts` اضافه شد.

## اعتبارسنجی

- `execute_sql` پیش/پس از migration: ۸ فعال قبل، ۳۴ کل / ۸ فعال بعد.
- `tsc --noEmit`: صفر خطای تازه (baseline فعلی این ریپازیتوری ۹ خطای
  از پیش‌موجود در چهار فایل بی‌ربط به این فاز — `app/api/bookings/
  confirm/route.ts`، `account-complete-profile.tsx`،
  `account-login.tsx`، `account-signup.tsx` — همه از نوع
  `string | null` در برابر `string | undefined`؛ عدد کمی با baseline
  ثبت‌شدهٔ فازهای قبل فرق دارد، به‌عنوان baseline به‌روز اینجا ثبت شد).
- `next build`: موفق روی هر ۲۹ روت (فونت‌های Google موقتاً stub و بعد
  از build بازگردانده شدند — طبق روال همیشگی سندباکس).

## Known issue کشف‌شده (خارج از scope این فاز، ثبت شد نه حل شد)

سه کامپوننت صفحهٔ عمومی — `destinations-grid.tsx`، `popular-routes.tsx`،
`contact-page.tsx` — هنوز از فهرست ثابت `cities` در `lib/i18n.ts`
می‌خوانند، نه از `getActiveCities()`. یعنی toggle کردن یک ولایت به فعال
روی این سه بخش (نه روی سرچ اصلی که در Phase 5.9 پوشش داده شد) اثر
نمی‌گذارد. طبق قانون شمارهٔ‌گذاری (بخش ۱۰ / ROAD-MAP §10)، این Debt
تاریخی است و باید در یک فاز بعدی (احتمالاً همراه فاز ۵.۱۳ CMS یا یک
زیرفاز مستقل) به `getActiveCities()` وصل شود.

## فایل‌های تغییریافته

`components/admin/route-manager.tsx`، `components/admin/city-manager.tsx`
(جدید)، `components/admin/admin-ui.tsx`، `components/transport/admin-panel.tsx`،
`lib/i18n.ts`، `phase-5_9-add-provinces.sql` (جدید — همان migration که
مستقیماً روی Supabase اعمال شد، طبق الگوی `phase-5_6-phone-normalization.sql`
برای مستندسازی/audit trail).
