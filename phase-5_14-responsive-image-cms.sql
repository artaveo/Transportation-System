-- فاز ۵.۱۴ — Responsive Image CMS (کراپ درون‌سایتی)
-- زمینه: فاز ۵.۱۳ عمداً عکس‌های پس‌زمینهٔ هیرو/ناوگان/درباره‌ما (سیستم ۴-برشی
-- ResponsivePhoto فاز ۴.۶) را کنار گذاشت چون نیاز به یک ابزار crop واقعی
-- داشت. تصمیم Zakir: (۱) کراپ باید داخل خودِ سایت با پیش‌نمایش زنده باشد،
-- نه دستی بیرون از سایت. (۲) این سیستم باید عمومی/قابل‌توسعه باشد — «برای
-- هر بخشی که عکس لازم داشته باشه» — نه فقط سه بخش شناخته‌شدهٔ فعلی.
--
-- طراحی: section_key/breakpoint متن آزادند (بدون enum روی section_key)؛
-- فهرست بخش‌های شناخته‌شده و نسبت ابعاد هرکدام در کد (lib/responsive-image-
-- sections.ts) نگه‌داری می‌شود، نه دیتابیس — چون نسبت ابعاد به کلاس CSS
-- aspect-[...] هر کامپوننت گره خورده و تصمیم سطح کد است، نه محتوای قابل-
-- ویرایش. یک ردیف NULL/غایب یعنی «هنوز آپلود نشده» → کامپوننت پابلیک باید
-- به فایل استاتیک فعلی در public/images برگردد (دقیقاً همان اصل no-
-- fabrication که در بقیهٔ فاز ۵.۱۳ رعایت شد).

create table responsive_site_images (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  breakpoint text not null,
  image_url text not null,
  updated_at timestamptz not null default now(),
  constraint responsive_site_images_breakpoint_check
    check (breakpoint in ('mobile', 'tablet', 'desktop', 'wide')),
  constraint responsive_site_images_unique unique (section_key, breakpoint)
);

comment on table responsive_site_images is
  'بازنویسی عکس‌های چندبرشی (mobile/tablet/desktop/wide) بخش‌های پس‌زمینهٔ اتمسفریک سایت (فاز ۵.۱۴) — هر ردیف یک (section_key, breakpoint). فهرست section_key های شناخته‌شده و نسبت ابعاد هرکدام در lib/responsive-image-sections.ts است، نه اینجا. نبودِ ردیف یعنی هنوز آپلود نشده؛ کامپوننت پابلیک باید به فایل استاتیک fallback برگردد.';

create trigger trg_responsive_site_images_updated_at
  before update on responsive_site_images
  for each row execute function set_updated_at();

alter table responsive_site_images enable row level security;

create policy responsive_site_images_public_select
  on responsive_site_images for select
  using (true);

create policy responsive_site_images_admin_write
  on responsive_site_images for all
  using (has_admin_section('content'))
  with check (has_admin_section('content'));
