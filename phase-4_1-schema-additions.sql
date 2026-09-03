-- ============================================================================
-- فاز ۴.۱ — تغییرات افزایشی اسکیمای Supabase
-- این فایل قبلاً روی پروژهٔ زندهٔ Supabase (Transportation-System) از طریق
-- MCP اجرا شده؛ اینجا فقط برای مستندسازی و انطباق با phase-3.1-supabase-schema.sql
-- تحویل داده می‌شود. دوباره اجرا کردنش امن است (idempotent).
-- ============================================================================

-- ۱. buses.amenities — در فاز ۳.۱ اصلاً طراحی نشده بود (فیلتر امکانات فقط در
--    UI ساختهٔ v0.dev بود، بدون پشتوانهٔ دیتابیس). آرایه‌ای از کلیدهای
--    شناخته‌شده در lib/booking-data.ts: ac, wifi, charging, refreshment, reclining.
alter table buses
  add column if not exists amenities text[] not null default '{}';

comment on column buses.amenities is
  'آرایه‌ای از کلیدهای امکانات همین بس مشخص (ac/wifi/charging/refreshment/reclining) '
  'مطابق AmenityKey در lib/booking-data.ts. ستون افزایشی فاز ۴.۱.';

-- ۲. cities.display_order — ترتیب جغرافیایی واقعی کریدور کابل..هرات، که در
--    طراحی فاز ۳.۱ ستونی برایش وجود نداشت (ترتیب نمایش وابسته به created_at/uuid
--    می‌شد که غیرقابل‌اتکاست).
alter table cities
  add column if not exists display_order int not null default 0;

comment on column cities.display_order is
  'ترتیب جغرافیایی روی کریدور کابل..هرات (۱..۸). ستون افزایشی فاز ۴.۱.';

create index if not exists idx_cities_display_order on cities(display_order);

-- ============================================================================
-- ۳. Seed دادهٔ واقعی (نه نمایشی): همان ۸ شهر تأییدشدهٔ کریدور که در
--    lib/i18n.ts (ثابت `cities`، با کامنت صریح «بدون تأیید اضافه نشود») از قبل
--    موجود بود. هیچ نام/عدد جدیدی اینجا اختراع نشده.
-- ============================================================================

insert into cities (name_en, name_fa, is_active, display_order) values
  ('Kabul',    'کابل',    true, 1),
  ('Ghazni',   'غزنی',    true, 2),
  ('Qalat',    'قلات',    true, 3),
  ('Kandahar', 'کندهار',  true, 4),
  ('Helmand',  'هلمند',   true, 5),
  ('Nimroz',   'نیمروز',  true, 6),
  ('Farah',    'فراه',    true, 7),
  ('Herat',    'هرات',    true, 8)
on conflict (name_en) do update set
  name_fa = excluded.name_fa,
  display_order = excluded.display_order;
