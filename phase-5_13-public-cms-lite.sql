-- فاز ۵.۱۳ — Public CMS Lite
-- زمینه: تصمیم با Zakir قبل از کد (طبق ROAD-MAP بخش ۷): آدرس/تلفن/ساعت هر دفتر
-- جداگانه، + تماس شرکت (فوتر) + آمار «درباره ما» + عکس واقعی ناوگان همه از
-- پنل ادمین قابل‌ویرایش شوند. بخش هیرو/ناوگان/درباره‌ما (پس‌زمینهٔ چندبرش‌ی
-- ResponsivePhoto موبایل/تبلت/دسکتاپ/وایدِ فاز ۴.۶) عمداً از این فاز خارج
-- ماند چون از قبل عکس واقعی دارد و ادمین‌کردنش نیاز به pipeline تولید چند
-- برش (نه فقط یک آپلود ساده) دارد — طبق اصل ROAD-MAP «نه کل ساختار صفحه»،
-- این به‌عنوان بدهی جدا ثبت می‌شود نه اینجا حل می‌شود.

-- ۱. افزودن بخش جدید 'content' به فهرست بخش‌های مجاز Permission Center (فاز ۵.۱۲)
alter table admins drop constraint admins_allowed_sections_valid;
alter table admins add constraint admins_allowed_sections_valid
  check (
    allowed_sections is null
    or allowed_sections <@ array['routes','fleet','trips','bookings','payments','loyalty','customers','content']::text[]
  );

-- ۲. site_settings — تنظیمات سراسری محتوای پابلیک (الگوی singleton مطابق loyalty_settings فاز ۵.۴)
create table site_settings (
  id boolean primary key default true,
  company_phone text,
  company_email text,
  about_years_active smallint,
  about_cities_covered smallint,
  about_buses_in_fleet smallint,
  about_daily_trips smallint,
  fleet_photo_url text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id),
  constraint site_settings_years_active_check check (about_years_active is null or about_years_active >= 0),
  constraint site_settings_cities_covered_check check (about_cities_covered is null or about_cities_covered >= 0),
  constraint site_settings_buses_in_fleet_check check (about_buses_in_fleet is null or about_buses_in_fleet >= 0),
  constraint site_settings_daily_trips_check check (about_daily_trips is null or about_daily_trips >= 0)
);

comment on table site_settings is
  'تنظیمات سراسری محتوای پابلیک سایت (فاز ۵.۱۳ Public CMS Lite) — دقیقاً یک ردیف (id=true). مقدار NULL یعنی هنوز عدد/متن واقعی از شرکت دریافت نشده؛ طبق اصل no-fabrication پروژه (نگاه کنید به trust-stats.tsx)، صفحات پابلیک در این حالت باید placeholder موجود را نگه‌دارند، نه عدد ساختگی نمایش دهند.';

insert into site_settings (id) values (true);

create trigger trg_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

alter table site_settings enable row level security;

create policy site_settings_public_select
  on site_settings for select
  using (true);

create policy site_settings_admin_write
  on site_settings for update
  using (has_admin_section('content'))
  with check (has_admin_section('content'));

-- ۳. offices — دفاتر واقعی (قبلاً هاردکد در lib/i18n.ts بدون آدرس/تلفن/ساعت واقعی)
create table offices (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete restrict,
  name_fa text not null,
  name_en text not null,
  address_fa text,
  address_en text,
  phone text,
  hours_fa text,
  hours_en text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table offices is
  'دفاتر فروش/پشتیبانی شرکت (فاز ۵.۱۳). آدرس/تلفن/ساعت کاری هرکدام مستقل و NULL-پذیرند (تصمیم Zakir: مدیریت هرکدام جداگانه، نه یک بلاک تماس واحد). NULL یعنی هنوز تأیید نشده — صفحات پابلیک باید placeholder را حفظ کنند.';

create trigger trg_offices_updated_at
  before update on offices
  for each row execute function set_updated_at();

alter table offices enable row level security;

create policy offices_public_select
  on offices for select
  using (is_active = true or has_admin_section('content'));

create policy offices_admin_write
  on offices for all
  using (has_admin_section('content'))
  with check (has_admin_section('content'));

-- seed: کوچ ۱۱ دفتر فعلی هاردکد (آدرس/تلفن/ساعت NULL تا Zakir تکمیل کند)
insert into offices (city_id, name_fa, name_en, display_order) values
  ('243a179b-c60f-41cd-bdf5-3e68811443a6', 'دفتر مرکزی', 'Central office', 1),
  ('243a179b-c60f-41cd-bdf5-3e68811443a6', 'دفتر کوته‌سنگی', 'Kote Sangi office', 2),
  ('243a179b-c60f-41cd-bdf5-3e68811443a6', 'دفتر کمپنی', 'Kampani office', 3),
  ('9fb2373d-ab6d-4f72-9c46-73f0280ddb35', 'دفتر غزنی', 'Ghazni office', 4),
  ('a5cf59fc-f4db-402c-837b-a43f9725dfb7', 'دفتر قلات', 'Qalat office', 5),
  ('a10d7030-d780-4924-9bbe-41f99dce7d41', 'دفتر اصلی', 'Main office', 6),
  ('a10d7030-d780-4924-9bbe-41f99dce7d41', 'دفتر باغ پل', 'Bagh-e Pol office', 7),
  ('110db6b7-fa81-4c10-923c-5732b904a7d9', 'دفتر هلمند', 'Helmand office', 8),
  ('a002c677-5194-4975-9fba-162d480d74fb', 'دفتر نیمروز', 'Nimroz office', 9),
  ('2e79fbbe-887e-4d6a-95e9-be2533c01c39', 'دفتر فراه', 'Farah office', 10),
  ('07031948-dc61-4b12-a882-fbd8656de18b', 'دفتر هرات', 'Herat office', 11);

-- ۴. Storage bucket برای عکس واقعی ناوگان (نسخه‌بندی نام فایل سمت کلاینت الزامی است —
-- طبق تجربهٔ کش تصویر تلگرام/واتساپ که با تغییر محتوا بدون تغییر نام هیچ‌وقت رفرش نمی‌شود)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-content', 'site-content', true, 5242880, array['image/png','image/jpeg','image/webp']);

create policy site_content_public_read
  on storage.objects for select
  using (bucket_id = 'site-content');

create policy site_content_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-content' and has_admin_section('content'));

create policy site_content_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-content' and has_admin_section('content'))
  with check (bucket_id = 'site-content' and has_admin_section('content'));

create policy site_content_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-content' and has_admin_section('content'));
