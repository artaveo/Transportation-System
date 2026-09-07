-- Phase 5.9: add the 26 remaining Afghan provinces to `cities`, inactive by default.
-- Applied live to Supabase via MCP (apply_migration, name:
-- phase_5_9_add_remaining_provinces) on 2026-09-07. Saved here for
-- documentation/audit trail per project convention (see phase-5_6-phone-
-- normalization.sql for a prior data-only migration saved the same way).
--
-- The 8 corridor cities already seeded in Phase 4.1 (Kabul, Ghazni,
-- Qalat/Zabul, Kandahar, Helmand, Nimroz, Farah, Herat) are untouched.
-- display_order continues 9-34, alphabetical by name_en (Zakir's choice).
-- Dari+English names for all 26 rows were confirmed with Zakir in chat
-- before this was applied, per the no-fabrication rule.

insert into public.cities (name_en, name_fa, is_active, display_order) values
  ('Badakhshan', 'بدخشان', false, 9),
  ('Badghis',    'بادغیس', false, 10),
  ('Baghlan',    'بغلان', false, 11),
  ('Balkh',      'بلخ', false, 12),
  ('Bamyan',     'بامیان', false, 13),
  ('Daykundi',   'دایکندی', false, 14),
  ('Faryab',     'فاریاب', false, 15),
  ('Ghor',       'غور', false, 16),
  ('Jowzjan',    'جوزجان', false, 17),
  ('Kapisa',     'کاپیسا', false, 18),
  ('Khost',      'خوست', false, 19),
  ('Kunar',      'کنر', false, 20),
  ('Kunduz',     'کندز', false, 21),
  ('Laghman',    'لغمان', false, 22),
  ('Logar',      'لوگر', false, 23),
  ('Nangarhar',  'ننگرهار', false, 24),
  ('Nuristan',   'نورستان', false, 25),
  ('Paktia',     'پکتیا', false, 26),
  ('Paktika',    'پکتیکا', false, 27),
  ('Panjshir',   'پنجشیر', false, 28),
  ('Parwan',     'پروان', false, 29),
  ('Samangan',   'سمنگان', false, 30),
  ('Sar-e Pol',  'سرپل', false, 31),
  ('Takhar',     'تخار', false, 32),
  ('Uruzgan',    'ارزگان', false, 33),
  ('Wardak',     'میدان‌وردک', false, 34);
