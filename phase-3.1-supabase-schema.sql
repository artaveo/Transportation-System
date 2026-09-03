-- ============================================================================
-- فاز ۳.۱ — طراحی جداول Supabase (Postgres)
-- سیستم رزرو آنلاین ترانسپورت برون‌شهری
-- ============================================================================
-- این فایل را می‌توان مستقیماً در Supabase SQL Editor یا به‌عنوان یک
-- migration اجرا کرد. ترتیب اجرا از بالا به پایین به‌دلیل وابستگی FK مهم است.
--
-- نکات کلیدی هماهنگ‌شده با پرامپت مادر پروژه:
--  • bus_id و driver_id در trips به‌صورت NULLABLE هستند (سفرهایی که هنوز
--    پلاک/راننده مشخص ندارند هم باید قابل ثبت باشند).
--  • ظرفیت بس یک مقدار واحد و قابل‌تغییر روی خود بس است (total_seats)،
--    نه عدد جادویی پخش‌شده در کد — دقیقاً مطابق DEFAULT_BUS_CAPACITY فعلی
--    در lib/booking-data.ts (vip: 33, standard: 48) که این‌جا فقط مقدار
--    پیش‌فرض اولیه seed می‌شود، نه هاردکد شده در منطق.
--  • schedule_type از هر دو مدل «ساعت ثابت» و «حرکت بر اساس پرشدن ظرفیت»
--    پشتیبانی می‌کند، بدون اجبار برای هر مسیر.
--  • رزرو مهمان (Guest Checkout) کاملاً پشتیبانی می‌شود: customer_id در
--    bookings نال‌پذیر است و contact_phone/contact_name جایگزین آن است.
--  • RLS و نقش‌های ادمین موضوع فاز ۳.۲ است؛ این فایل فقط ساختار جداول،
--    enum ها، محدودیت‌ها و ایندکس‌هاست. جدول admins این‌جا ساخته می‌شود چون
--    چند جدول دیگر (payments, coupons) به آن FK دارند، اما فعال‌سازی
--    Supabase Auth برای آن در فاز ۳.۳ انجام خواهد شد.
-- ============================================================================

-- pgcrypto برای gen_random_uuid() — در Supabase معمولاً از قبل فعال است.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- تابع کمکی مشترک: به‌روزرسانی خودکار updated_at
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- ۱. ENUM ها
-- ============================================================================

create type bus_type as enum ('vip', 'standard');
create type bus_status as enum ('active', 'maintenance', 'retired');
create type driver_status as enum ('active', 'inactive');

create type trip_schedule_type as enum ('fixed_time', 'fill_and_go');
create type trip_status as enum ('scheduled', 'boarding', 'departed', 'completed', 'cancelled');

create type seat_status as enum ('available', 'held', 'booked');

-- توجه: مقادیر 'pending' | 'confirmed' | 'cancelled' عیناً با
-- BookingStatus موجود در admin-data.ts هم‌نام هستند تا پنل ادمین فعلی
-- بدون remapping به این enum وصل شود. 'completed' برای شمارش سفرهای
-- تکمیل‌شده در باشگاه مشتریان اضافه شده (بخش ۵ پرامپت مادر) و
-- 'refunded' برای لغو با بازپرداخت آنلاین.
create type booking_status as enum
  ('pending', 'confirmed', 'completed', 'cancelled', 'refunded');

create type payment_method as enum ('online', 'offline');
create type payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');

create type wallet_tx_type as enum
  ('cashback', 'referral_bonus', 'redeemed', 'manual_adjustment');

create type referral_status as enum ('pending', 'completed');
create type coupon_discount_type as enum ('percent', 'fixed');
create type admin_role as enum ('super_admin', 'limited_admin');

-- ============================================================================
-- ۲. شهرها (مرجع مسیرها — استخراج از cities در lib/i18n.ts)
-- ============================================================================

create table cities (
  id uuid primary key default gen_random_uuid(),
  name_en text not null unique,
  name_fa text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table cities is
  'مرجع شهرهای فعال روی کریدور واقعی (کابل..هرات و توقف‌های میانی).';

-- ============================================================================
-- ۳. مسیر، بس، راننده
-- ============================================================================

create table routes (
  id uuid primary key default gen_random_uuid(),
  origin_city_id uuid not null references cities(id) on delete restrict,
  destination_city_id uuid not null references cities(id) on delete restrict,
  distance_km numeric(6,1),
  typical_duration_minutes int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routes_origin_destination_diff check (origin_city_id <> destination_city_id),
  constraint routes_unique_pair unique (origin_city_id, destination_city_id)
);

create trigger trg_routes_updated_at
  before update on routes
  for each row execute function set_updated_at();

create index idx_routes_origin on routes(origin_city_id);
create index idx_routes_destination on routes(destination_city_id);

comment on column routes.typical_duration_minutes is
  'مدت‌زمان معمول سفر؛ فقط برای نمایش تخمینی در سایت عمومی استفاده می‌شود.';

create table buses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- مثال: VIP-133 / STD-107
  plate_number text,
  bus_type bus_type not null,
  total_seats int not null check (total_seats > 0),
  status bus_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_buses_updated_at
  before update on buses
  for each row execute function set_updated_at();

comment on column buses.total_seats is
  'ظرفیت واقعی همین بس مشخص. مقدار پیش‌فرض پیشنهادی هنگام افزودن بس جدید '
  'در پنل ادمین از DEFAULT_BUS_CAPACITY (vip:33 / standard:48) خوانده '
  'می‌شود، اما هر بس می‌تواند مقدار متفاوت داشته باشد.';

create table drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  license_number text,
  status driver_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_drivers_updated_at
  before update on drivers
  for each row execute function set_updated_at();

-- ============================================================================
-- ۴. ادمین‌ها (ساختار جدول اینجا، فعال‌سازی Auth واقعی در فاز ۳.۳)
-- ============================================================================

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  role admin_role not null default 'limited_admin',
  allowed_sections text[], -- برای ادمین محدود دپارتمانی؛ نال یعنی بدون محدودیت خاص
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table admins is
  'نقش‌بندی دوسطحی ادمین (کل / محدود دپارتمانی) طبق بخش ۳.۳ پرامپت مادر. '
  'اتصال auth_user_id و سیاست‌های RLS مبتنی بر آن در فاز ۳.۲/۳.۳ تکمیل می‌شود.';

-- ============================================================================
-- ۵. سفرها و نقشهٔ صندلی
-- ============================================================================

create table trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete restrict,
  bus_id uuid references buses(id) on delete set null,       -- نال‌پذیر
  driver_id uuid references drivers(id) on delete set null,  -- نال‌پذیر
  service_date date not null,
  departure_time time,                 -- برای schedule_type = fixed_time
  schedule_type trip_schedule_type not null default 'fixed_time',
  price_per_seat numeric(10,2) not null check (price_per_seat >= 0),
  -- کپی ظرفیت در لحظهٔ ساخت سفر، تا اگر بعداً بس عوض/حذف شود گزارش‌های
  -- قبلی و نقشهٔ صندلیِ سفرهای گذشته دست‌نخورده بماند.
  total_seats_snapshot int not null check (total_seats_snapshot > 0),
  status trip_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_fixed_time_requires_departure
    check (schedule_type <> 'fixed_time' or departure_time is not null)
);

create trigger trg_trips_updated_at
  before update on trips
  for each row execute function set_updated_at();

create index idx_trips_route_date on trips(route_id, service_date);
create index idx_trips_bus on trips(bus_id);
create index idx_trips_driver on trips(driver_id);
create index idx_trips_status on trips(status);

create table trip_seats (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  seat_number text not null,   -- مثال: "12A"
  row_number int not null,
  col_label text not null,     -- "A".."D" برای استاندارد، "A".."C" برای VIP
  status seat_status not null default 'available',
  -- قفل موقت هنگام تکمیل فرم رزرو، برای جلوگیری از رزرو هم‌زمان همان صندلی
  held_until timestamptz,
  created_at timestamptz not null default now(),
  constraint trip_seats_unique_per_trip unique (trip_id, seat_number)
);

create index idx_trip_seats_trip_status on trip_seats(trip_id, status);

comment on column trip_seats.held_until is
  'در حین ثبت فرم مسافر/پرداخت، صندلی موقتاً held می‌شود (چند دقیقه)؛ '
  'اگر held_until بگذرد و رزرو تکمیل نشود، صندلی به available برمی‌گردد.';

-- ============================================================================
-- ۶. باشگاه مشتریان — سطوح، مشتریان
-- ============================================================================

create table loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  tier_key text not null unique,  -- 'bronze' | 'silver' | 'gold'
  name_fa text not null,
  name_en text not null,
  min_completed_trips int not null default 0,
  discount_percent numeric(4,1) not null default 0 check (discount_percent >= 0),
  sort_order int not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger trg_loyalty_tiers_updated_at
  before update on loyalty_tiers
  for each row execute function set_updated_at();

comment on table loyalty_tiers is
  'آستانه‌ها و درصدها از پنل ادمین (LoyaltyManager) در فاز ۵.۴ قابل‌تغییرند؛ '
  'در کد هاردکد نمی‌شوند. مقادیر پیش‌فرض اولیه در seed پایین درج شده‌اند.';

-- seed سه‌سطحی طبق بخش ۵ پرامپت مادر
insert into loyalty_tiers (tier_key, name_fa, name_en, min_completed_trips, discount_percent, sort_order) values
  ('bronze', 'برنز', 'Bronze', 0, 5, 1),
  ('silver', 'نقره', 'Silver', 5, 10, 2),
  ('gold',   'طلا',  'Gold',  15, 17.5, 3);

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  phone text not null unique,
  full_name text,
  email text,
  -- مشتریانی که فقط با شماره تماس رزرو مهمان انجام داده‌اند هم این‌جا
  -- می‌توانند یک رکورد "ثبت‌نام‌نشده" داشته باشند تا سابقهٔ سفرشان حفظ
  -- شود و اگر بعداً ثبت‌نام کردند، سابقه بر اساس شماره تماس منتقل شود.
  is_registered boolean not null default false,
  loyalty_tier_id uuid not null references loyalty_tiers(id),
  lifetime_completed_trips int not null default 0,
  wallet_balance numeric(10,2) not null default 0,
  referral_code text unique,
  referred_by_customer_id uuid references customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_not_self_referred check (referred_by_customer_id <> id)
);

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create index idx_customers_phone on customers(phone);
create index idx_customers_referral_code on customers(referral_code);

comment on column customers.lifetime_completed_trips is
  'شمارش تجمعی مادام‌العمر (نه سالانه/چرخشی) طبق تصمیم بخش ۵ پرامپت مادر؛ '
  'با تکمیل هر بوکینگ به وضعیت completed یک واحد افزایش می‌یابد (تریگر فاز بعد).';

-- ============================================================================
-- ۷. رزرو، مسافران هر رزرو، پرداخت
-- ============================================================================

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique, -- مثال: SB-XXXXXX
  trip_id uuid not null references trips(id) on delete restrict,
  customer_id uuid references customers(id) on delete set null, -- نال = مهمان
  contact_name text not null,
  contact_phone text not null,
  seats_count int not null check (seats_count > 0),
  subtotal_amount numeric(10,2) not null,
  service_fee_amount numeric(10,2) not null default 0,
  coupon_id uuid, -- FK به coupons پایین‌تر تعریف می‌شود (وابستگی حلقوی با redemptions)
  coupon_discount_amount numeric(10,2) not null default 0,
  tier_discount_amount numeric(10,2) not null default 0,
  wallet_amount_used numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  currency text not null default 'AFN',
  payment_method payment_method not null,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index idx_bookings_trip on bookings(trip_id);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_reference on bookings(booking_reference);
create index idx_bookings_contact_phone on bookings(contact_phone);
create index idx_bookings_status on bookings(status);

comment on column bookings.tier_discount_amount is
  'قابلیت جمع‌شدن یا نشدن تخفیف سطح با کوپن دقیقاً در فاز ۴.۲ (فرم رزرو) '
  'مشخص می‌شود؛ فعلاً هر دو مبلغ جدا ذخیره می‌شوند تا منطق بعداً روی داده '
  'موجود قابل‌اعمال باشد، نه نیازمند migration مجدد.';

create table booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  trip_seat_id uuid not null references trip_seats(id) on delete restrict,
  passenger_full_name text not null,
  passenger_phone text,
  created_at timestamptz not null default now(),
  constraint booking_passengers_unique_seat unique (trip_seat_id)
);

create index idx_booking_passengers_booking on booking_passengers(booking_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  method payment_method not null,
  provider_reference text, -- شناسهٔ تراکنش HesabPay در پرداخت آنلاین
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  confirmed_by_admin_id uuid references admins(id) on delete set null, -- تأیید دستی پرداخت آفلاین
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payments_booking on payments(booking_id);
create index idx_payments_status on payments(status);

comment on column payments.confirmed_by_admin_id is
  'برای پرداخت آفلاین: کدام اپراتور پنل ادمین دریافت نقدی را تأیید کرده '
  '(PaymentConfirmationAction در فاز ۵.۲).';

-- ============================================================================
-- ۸. کیف‌پول و رفرال
-- ============================================================================

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type wallet_tx_type not null,
  amount numeric(10,2) not null, -- مثبت = واریز، منفی = برداشت/استفاده
  related_booking_id uuid references bookings(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_wallet_tx_customer on wallet_transactions(customer_id);

comment on table wallet_transactions is
  'دفتر تراکنش‌های کیف‌پول (کش‌بک، پاداش رفرال، استفاده در رزرو، اصلاح دستی '
  'ادمین). wallet_balance روی customers از جمع همین جدول به‌روزرسانی می‌شود '
  '(تریگر یا محاسبه در Route Handler فاز ۴).';

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_customer_id uuid not null references customers(id) on delete cascade,
  referred_customer_id uuid not null unique references customers(id) on delete cascade,
  reward_amount numeric(10,2) not null default 0,
  status referral_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referrals_not_self check (referrer_customer_id <> referred_customer_id)
);

create index idx_referrals_referrer on referrals(referrer_customer_id);

comment on table referrals is
  'هر مشتری فقط یک‌بار به‌عنوان "دعوت‌شونده" ثبت می‌شود (unique روی '
  'referred_customer_id)؛ پاداش برای هر دو طرف در wallet_transactions ثبت '
  'می‌شود، نه این‌جا.';

-- ============================================================================
-- ۹. کوپن‌های ادمین
-- ============================================================================

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type coupon_discount_type not null,
  discount_value numeric(10,2) not null check (discount_value > 0),
  is_stackable_with_tier boolean not null default false,
  usage_limit int,           -- نال = بدون محدودیت تعداد کل استفاده
  used_count int not null default 0,
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  created_by_admin_id uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint coupons_valid_range check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index idx_coupons_code on coupons(code);

comment on table coupons is
  'سیستم مستقل کمپین‌های فصلی (بخش ۵ پرامپت مادر)، جدا از تخفیف سطح '
  'عضویت. is_stackable_with_tier فعلاً فقط پرچم آماده است؛ منطق نهایی '
  'جمع‌شدن/نشدن در فاز ۴.۲ اعمال می‌شود.';

alter table bookings
  add constraint fk_bookings_coupon foreign key (coupon_id) references coupons(id) on delete set null;

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  booking_id uuid not null unique references bookings(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  amount_saved numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index idx_coupon_redemptions_coupon on coupon_redemptions(coupon_id);

-- ============================================================================
-- پایان فاز ۳.۱
-- ادامه در فاز ۳.۲: فعال‌سازی Row Level Security و نوشتن policyها
-- (مسافر عادی فقط رزرو خودش را ببیند، ادمین محدود فقط دادهٔ دپارتمان خودش،
-- ادمین کل همه‌چیز) و فاز ۳.۳: اتصال admins.auth_user_id به Supabase Auth.
-- ============================================================================
