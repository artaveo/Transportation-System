-- ============================================================================
-- فاز ۳.۲ — Row Level Security و نقش‌های ادمین
-- ============================================================================
-- پیش‌نیاز: فاز ۳.۱ (جداول) باید قبلاً اجرا شده باشد.
--
-- معماری دسترسی:
--  • anon/authenticated (کلید عمومی مرورگر) فقط داده‌های عمومی غیرحساس را
--    مستقیم می‌خوانند (شهرها، مسیرها، سفرها، وضعیت صندلی، سطوح باشگاه).
--  • هرگونه عملیات حساس (ساخت رزرو، قفل صندلی، محاسبهٔ تخفیف، تأیید
--    پرداخت) از طریق Route Handler با service_role انجام می‌شود که
--    RLS را دور می‌زند — این جداول اصلاً policy نوشتنی برای anon ندارند.
--  • رزرو مهمان (بدون حساب) از طریق booking_reference + contact_phone در
--    یک Route Handler با service_role لوکاپ می‌شود، نه از طریق RLS مبتنی
--    بر auth.uid() — چون مهمان اصلاً session ندارد.
--  • مشتری ثبت‌نام‌شده فقط رکوردهای خودش را می‌بیند (از طریق auth.uid()
--    → customers.auth_user_id → customer_id در جداول وابسته).
--  • ادمین کل (super_admin) به همه‌چیز دسترسی دارد. ادمین محدود فقط به
--    بخش‌هایی که در admins.allowed_sections او درج شده.
--
-- نگاشت بخش‌های ادمین (برای allowed_sections) به جداول پنل مدیریت:
--   'routes'    → RouteManager        (cities, routes)
--   'fleet'     → BusManager/DriverManager (buses, drivers)
--   'trips'     → TripScheduler       (trips, trip_seats)
--   'bookings'  → BookingsTable       (bookings, booking_passengers)
--   'payments'  → PaymentConfirmationAction (payments)
--   'customers' → مدیریت حساب مشتریان (customers)
--   'loyalty'   → LoyaltyManager      (loyalty_tiers, wallet_transactions,
--                                       referrals, coupons, coupon_redemptions)
--   مدیریت خود جدول admins (AdminRoleManager) همیشه فقط مخصوص
--   super_admin است و از طریق allowed_sections قابل‌واگذاری نیست.
-- ============================================================================

-- ============================================================================
-- ۱. توابع کمکی (SECURITY DEFINER تا خودشان درگیر RLS جداولی که می‌خوانند نشوند)
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from admins a
    where a.auth_user_id = auth.uid() and a.is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from admins a
    where a.auth_user_id = auth.uid() and a.is_active and a.role = 'super_admin'
  );
$$;

create or replace function public.has_admin_section(section text)
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from admins a
    where a.auth_user_id = auth.uid() and a.is_active
      and (a.role = 'super_admin' or section = any(a.allowed_sections))
  );
$$;

create or replace function public.current_customer_id()
returns uuid
language sql security definer stable
set search_path = public, pg_temp
as $$
  select id from customers where auth_user_id = auth.uid();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.has_admin_section(text) from public;
revoke all on function public.current_customer_id() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.has_admin_section(text) to anon, authenticated;
grant execute on function public.current_customer_id() to anon, authenticated;

-- ============================================================================
-- ۲. فعال‌سازی RLS روی همهٔ جداول
-- ============================================================================

alter table cities enable row level security;
alter table routes enable row level security;
alter table buses enable row level security;
alter table drivers enable row level security;
alter table admins enable row level security;
alter table trips enable row level security;
alter table trip_seats enable row level security;
alter table loyalty_tiers enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table booking_passengers enable row level security;
alter table payments enable row level security;
alter table wallet_transactions enable row level security;
alter table referrals enable row level security;
alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;

-- ============================================================================
-- ۳. مرجع عمومی: cities / routes  → بخش ادمین 'routes'
-- ============================================================================

create policy cities_public_select on cities
  for select using (is_active = true or public.has_admin_section('routes'));

create policy cities_admin_write on cities
  for all using (public.has_admin_section('routes'))
  with check (public.has_admin_section('routes'));

create policy routes_public_select on routes
  for select using (is_active = true or public.has_admin_section('routes'));

create policy routes_admin_write on routes
  for all using (public.has_admin_section('routes'))
  with check (public.has_admin_section('routes'));

-- ============================================================================
-- ۴. ناوگان: buses (عمومی برای نمایش نوع بس در نتایج جستجو) / drivers (کاملاً داخلی)
--    → بخش ادمین 'fleet'
-- ============================================================================

create policy buses_public_select on buses
  for select using (true);

create policy buses_admin_write on buses
  for all using (public.has_admin_section('fleet'))
  with check (public.has_admin_section('fleet'));

create policy drivers_admin_only on drivers
  for all using (public.has_admin_section('fleet'))
  with check (public.has_admin_section('fleet'));

-- ============================================================================
-- ۵. سفر و صندلی → عمومی قابل‌خواندن، نوشتن فقط ادمین بخش 'trips'
--    (رزرو واقعی صندلی از طریق service_role در Route Handler انجام می‌شود)
-- ============================================================================

create policy trips_public_select on trips
  for select using (true);

create policy trips_admin_write on trips
  for all using (public.has_admin_section('trips'))
  with check (public.has_admin_section('trips'));

create policy trip_seats_public_select on trip_seats
  for select using (true);

create policy trip_seats_admin_write on trip_seats
  for all using (public.has_admin_section('trips'))
  with check (public.has_admin_section('trips'));

-- ============================================================================
-- ۶. سطوح باشگاه مشتریان → عمومی قابل‌خواندن (صفحهٔ معرفی باشگاه)،
--    نوشتن فقط ادمین بخش 'loyalty'
-- ============================================================================

create policy loyalty_tiers_public_select on loyalty_tiers
  for select using (true);

create policy loyalty_tiers_admin_write on loyalty_tiers
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

-- ============================================================================
-- ۷. مشتریان → فقط رکورد خودش (فقط خواندن)، ادمین بخش 'customers' کامل
--    توجه: بدون policy برای UPDATE خودِ مشتری — ویرایش نام/ایمیل هم از
--    طریق Route Handler با service_role انجام می‌شود تا ستون‌های حساس
--    (wallet_balance, loyalty_tier_id, lifetime_completed_trips) هرگز
--    مستقیماً توسط خودِ مشتری قابل‌تغییر نباشند.
-- ============================================================================

create policy customers_self_select on customers
  for select using (auth_user_id = auth.uid() or public.has_admin_section('customers'));

create policy customers_admin_write on customers
  for all using (public.has_admin_section('customers'))
  with check (public.has_admin_section('customers'));

-- ============================================================================
-- ۸. رزرو، مسافران، پرداخت → مالکیت از طریق customer_id
--    نوشتن مستقیم توسط anon/authenticated وجود ندارد (فقط service_role
--    در Route Handler رزرو/پرداخت را می‌سازد تا صندلی اتمیک قفل شود)
-- ============================================================================

create policy bookings_owner_select on bookings
  for select using (
    (customer_id is not null and customer_id = public.current_customer_id())
    or public.has_admin_section('bookings')
  );

create policy bookings_admin_write on bookings
  for all using (public.has_admin_section('bookings'))
  with check (public.has_admin_section('bookings'));

create policy booking_passengers_owner_select on booking_passengers
  for select using (
    exists (
      select 1 from bookings b
      where b.id = booking_passengers.booking_id
        and (b.customer_id = public.current_customer_id() or public.has_admin_section('bookings'))
    )
  );

create policy booking_passengers_admin_write on booking_passengers
  for all using (public.has_admin_section('bookings'))
  with check (public.has_admin_section('bookings'));

create policy payments_owner_select on payments
  for select using (
    exists (
      select 1 from bookings b
      where b.id = payments.booking_id
        and (b.customer_id = public.current_customer_id() or public.has_admin_section('payments'))
    )
  );

create policy payments_admin_write on payments
  for all using (public.has_admin_section('payments'))
  with check (public.has_admin_section('payments'));

-- ============================================================================
-- ۹. کیف‌پول، رفرال → فقط صاحبش، ادمین بخش 'loyalty'
--    نوشتن مستقیم وجود ندارد (فقط از طریق منطق سرور در فاز بعد)
-- ============================================================================

create policy wallet_tx_owner_select on wallet_transactions
  for select using (
    customer_id = public.current_customer_id() or public.has_admin_section('loyalty')
  );

create policy wallet_tx_admin_write on wallet_transactions
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

create policy referrals_owner_select on referrals
  for select using (
    referrer_customer_id = public.current_customer_id()
    or referred_customer_id = public.current_customer_id()
    or public.has_admin_section('loyalty')
  );

create policy referrals_admin_write on referrals
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

-- ============================================================================
-- ۱۰. کوپن‌ها → بدون خواندن عمومی (برای جلوگیری از حدس‌زدن/لیست‌کردن کدها)؛
--     اعتبارسنجی یک کد مشخص در فاز ۴.۲ از طریق یک تابع/Route Handن امن
--     انجام می‌شود، نه SELECT مستقیم روی جدول. ادمین بخش 'loyalty' کامل.
-- ============================================================================

create policy coupons_admin_only on coupons
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

create policy coupon_redemptions_owner_select on coupon_redemptions
  for select using (
    customer_id = public.current_customer_id() or public.has_admin_section('loyalty')
  );

create policy coupon_redemptions_admin_write on coupon_redemptions
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

-- ============================================================================
-- ۱۱. خودِ جدول admins → مدیریت نقش‌ها همیشه مخصوص super_admin
--     (نه قابل‌واگذاری از طریق allowed_sections)
-- ============================================================================

create policy admins_self_or_super_select on admins
  for select using (auth_user_id = auth.uid() or public.is_super_admin());

create policy admins_super_write on admins
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================================
-- پایان فاز ۳.۲
-- ادامه در فاز ۳.۳: اتصال واقعی Supabase Auth (ثبت‌نام/ورود ادمین و مشتری)
-- و درج اولین رکورد admins با role = 'super_admin' برای صاحب پروژه.
-- ============================================================================
