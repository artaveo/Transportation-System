# فاز ۵.۱۴ — Responsive Image CMS (کراپ درون‌سایتی)

**تکمیل:** ۸ سپتامبر ۲۰۲۶

## زمینه

فاز ۵.۱۳ عمداً عکس‌های پس‌زمینهٔ هیرو صفحهٔ اصلی، بخش ناوگان، و صفحهٔ درباره
ما را کنار گذاشت: این‌ها سیستم ۴-برشی `ResponsivePhoto` (فاز ۴.۶ —
mobile/tablet/desktop/wide، هرکدام با `aspect-[...]` جداگانه در CSS) دارند
و ادمین‌کردنشان به یک ابزار crop واقعی نیاز دارد، نه یک آپلود ساده.

بعد از سوال مستقیم Zakir دربارهٔ همین موضوع، دو تصمیم صریح گرفته شد:

1. **کراپ باید داخل خودِ سایت باشد**، با پیش‌نمایش واقعی زنده — نه crop
   دستی بیرون از سایت توسط Zakir.
2. **سیستم باید عمومی/توسعه‌پذیر باشد** — «برای هر بخشی که عکس لازم داشته
   باشه» — نه فقط سه بخش شناخته‌شدهٔ فعلی.

## طراحی

**فهرست بخش‌ها در کد، نه دیتابیس.** `lib/responsive-image-sections.ts` سه
بخش فعلی (`hero`, `fleet`, `about`) را با نسبت ابعاد دقیق هر برش و مسیر
فایل fallback تعریف می‌کند. این عمداً در کد است، نه یک جدول ادمین‌قابل‌ویرایش:
نسبت ابعاد هر برش مستقیماً به کلاس CSS `aspect-[...]` همان کامپوننت گره
خورده — تصمیم layout است، نه محتوا. برای اضافه‌کردن بخش جدید در آینده،
فقط یک آیتم به این فایل اضافه می‌شود؛ جدول دیتابیس و پنل ادمین هر دو
خودکار slot های جدید را می‌سازند — بدون migration جدید، بدون تغییر UI.

**جدول عمومی `responsive_site_images`** (`section_key, breakpoint,
image_url`) — یک ردیف در دیتابیس معنی «ادمین این برش را عوض کرده» می‌دهد؛
نبودِ ردیف یعنی فایل استاتیک فعلی در `public/images` استفاده می‌شود
(همان اصل no-fabrication که در فاز ۵.۱۳ رعایت شد، اینجا هم عیناً).

**ابزار crop واقعی داخل مرورگر** — کتابخانهٔ `react-easy-crop` (سبک،
سازگار با React 19، بدون تداخل peer-dependency) اضافه شد. ادمین یک عکس
منبع انتخاب می‌کند، در یک مودال با قاب crop **قفل‌شده دقیقاً روی همان
نسبت ابعادی که سایت واقعی نمایش می‌دهد** (نه یک تخمین)، می‌تواند drag/zoom
کند؛ روی تأیید، یک تابع canvas (`lib/crop-image.ts`) دقیقاً همان ناحیه را
با کیفیت کامل به یک Blob تبدیل می‌کند — بدون resize اضافه (پایپ‌لاین
بهینه‌سازی نهایی همان `next/image`/`ResponsivePhoto` فاز ۴.۶ است که از
قبل روی هر عکسی، از جمله عکس‌های آپلودی آینده، پیکربندی شده بود).

## تغییرات دیتابیس (`phase_5_14_responsive_image_cms`، یک migration)

جدول `responsive_site_images`: `section_key` و `breakpoint` متن آزادند
(بدون enum روی `section_key` — چون فهرست بخش‌ها در کد است)؛ `breakpoint`
فقط با یک CHECK به چهار مقدار مجاز محدود شده. `unique (section_key,
breakpoint)` برای upsert تمیز. RLS دقیقاً همان الگوی `site_settings`/
`offices` فاز ۵.۱۳: `select` عمومی (`true` — چون هیرو/ناوگان/درباره‌ما
کامپوننت کلاینت‌اند و مستقیم با anon می‌خوانند)، `all` (insert/update/
delete) فقط `has_admin_section('content')` — همان بخش Permission Center
فاز ۵.۱۳، migration جدیدی برای بخش‌های مجاز لازم نبود.

`Supabase:get_advisors(security)` بعد از migration: بدون finding جدید.
`Supabase:generate_typescript_types` اجرا و در `database.types.ts` merge شد.

`next.config.mjs` نیازی به تغییر نداشت — `images.remotePatterns` برای
دامنهٔ Supabase Storage از فاز ۴.۶ از قبل آماده بود (کامنت همان‌جا صراحتاً
همین سناریوی آیندهٔ «آپلود از پنل ادمین» را پیش‌بینی کرده بود).

## تغییرات UI

- **`lib/hooks/use-responsive-image-set.ts`** (تازه): برای یک section_key،
  ۴ مقدار برش را برمی‌گرداند — override دیتابیس اگر موجود بود، وگرنه فایل
  استاتیک `defaultSrc` همان بخش.
- **`components/admin/image-crop-modal.tsx`** (تازه): مودال crop عمومی
  (قابل استفادهٔ مجدد برای هر section/breakpoint) — قاب با `aspect` قفل،
  اسلایدر zoom، روی تأیید Blob کراپ‌شده را به caller برمی‌گرداند.
- **`components/admin/responsive-image-manager.tsx`** (تازه): برای هر
  بخش در `RESPONSIVE_IMAGE_SECTIONS`، یک کارت با ۴ اسلات (mobile/tablet/
  desktop/wide) — هرکدام پیش‌نمایش با نسبت ابعاد واقعی (`style={{
  aspectRatio }}`)، برچسب «پیش‌فرض سایت» یا «آپلودشدهٔ ادمین»، دکمهٔ آپلود/
  تعویض (باز کردن مودال crop)، و دکمهٔ «بازگشت به پیش‌فرض» (حذف ردیف
  دیتابیس، با تأیید). آپلود در bucket `site-content` با نام
  نسخه‌بندی‌شده (`responsive/{section}/{breakpoint}-{timestamp}.jpg`).
- تب «محتوای سایت» در `admin-panel.tsx` حالا `SiteContentManager` (فاز
  ۵.۱۳) و `ResponsiveImageManager` را زیر هم نشان می‌دهد — هر دو پشت همان
  بخش دسترسی `content`، تب جدیدی لازم نبود.
- **صفحات پابلیک:** `hero-search.tsx`، `fleet-features.tsx`، و بخش
  intro در `about-page.tsx` سه‌تایشان به‌جای مسیر ثابت فایل، از
  `useResponsiveImageSet(sectionKey)` می‌خوانند.
- **`lib/i18n.ts`**: بلوک `admin.responsiveImages` (فرم/برچسب‌های این
  بخش) — دو زبان کامل.

## اعتبارسنجی

- `Supabase:get_advisors(security)`: بدون finding جدید.
- `pnpm tsc --noEmit`: دقیقاً همان ۱۸ خط خطای از‌پیش‌موجود فاز ۵.۱۳ —
  **صفر خطای جدید**.
- `pnpm run build` (Turbopack): موفق، هر ۲۵ روت تولید شدند.
- استاب موقت فونت گوگل (طبق همان محدودیت شبکهٔ sandbox) اعمال و بعد از
  build به حالت واقعی برگردانده شد.
- بررسی دستی: `select count(*) from responsive_site_images` → ۰ (درست —
  هنوز هیچ عکسی آپلود نشده، همه‌چیز روی fallback استاتیک است)؛
  `storage.buckets` → `site-content` با `public=true`، `file_size_limit=
  5242880` دست‌نخورده مانده (فاز ۵.۱۳).

## بدهی/نکات باز برای Zakir

- **هیچ عکسی هنوز آپلود نشده** — این فاز فقط ابزار را ساخت؛ عکس‌های واقعی
  هیرو/ناوگان/درباره‌ما (هرکدام ۴ برش) باید از تب «محتوای سایت» → «عکس‌های
  چندبرشی» آپلود/کراپ شوند.
- «بازگشت به پیش‌فرض» فقط ردیف دیتابیس را حذف می‌کند، فایل را از Storage
  پاک نمی‌کند (orphan می‌ماند) — همان تصمیم بدهی مستند فاز ۵.۱۳ برای
  `fleet_photo_url`؛ اگر حجم آپلودها زیاد شد، یک پاک‌سازی دوره‌ای Storage
  ارزش اضافه‌کردن دارد.
- محدودیت حجم فایل منبع (پیش از crop) در فرانت‌اند ۱۵ مگابایت است؛ محدودیت
  واقعی bucket (۵ مگابایت) روی فایل *بعد از crop* اعمال می‌شود — اگر خروجی
  crop به‌ندرت از ۵ مگابایت بیشتر شود، خطای آپلود همان پیام عمومی
  `genericError` را نشان می‌دهد (پیام اختصاصی‌تر برایش نوشته نشده).
- کیفیت خروجی JPEG کراپ ثابت روی ۰.۹۲ است (بدون کنترل UI) — کافی برای این
  مقیاس؛ اگر در آینده لازم شد قابل‌تنظیم شود.

## فایل‌های تغییریافته/تازه

```text
تازه:
  lib/responsive-image-sections.ts
  lib/hooks/use-responsive-image-set.ts
  lib/crop-image.ts
  components/admin/image-crop-modal.tsx
  components/admin/responsive-image-manager.tsx
  phase-5_14-responsive-image-cms.sql
  PHASE-5_14-README.md

تغییریافته:
  components/transport/admin-panel.tsx      (رندر ResponsiveImageManager در تب «محتوای سایت»)
  components/transport/hero-search.tsx      (عکس هیرو از useResponsiveImageSet)
  components/transport/fleet-features.tsx   (عکس ناوگان از useResponsiveImageSet)
  components/transport/about-page.tsx       (عکس intro از useResponsiveImageSet)
  lib/i18n.ts                               (admin.responsiveImages)
  lib/supabase/database.types.ts            (بازتولید — responsive_site_images)
  package.json / pnpm-lock.yaml             (وابستگی جدید react-easy-crop)
  ROAD-MAP.md                               (وضعیت فاز ۵.۱۴ → تکمیل)
```
