-- ============================================================================
-- فاز ۵.۴ — مدیریت باشگاه مشتریان (سمت دیتابیس)
-- این فایل قبلاً از طریق MCP روی پروژهٔ زندهٔ Supabase (Transportation-System)
-- اجرا شده؛ اینجا فقط برای مستندسازی و انطباق با ریپو تحویل داده می‌شود.
-- ============================================================================

-- ============================================================================
-- ۱. loyalty_settings — تنظیمات سراسری باشگاه مشتریان
-- هدف: پاداش رفرال (که در فاز ۴.۵ عمداً به‌عنوان یک مقدار ثابت ۱۰۰ داخل
-- handle_booking_completed() نگه داشته شده بود، طبق کامنت صریح همان فاز:
-- "تا وقتی LoyaltyManager (فاز ۵.۴) این عدد را قابل‌تغییر نکند") را از
-- پنل ادمین قابل‌تغییر می‌کند. یک جدول singleton (همیشه دقیقاً یک ردیف)
-- برای این تنظیم و هر تنظیم مشابه آیندهٔ باشگاه مشتریان.
-- ============================================================================

create table loyalty_settings (
  id boolean primary key default true,
  referral_reward_amount numeric(10,2) not null default 100 check (referral_reward_amount >= 0),
  updated_at timestamptz not null default now(),
  constraint loyalty_settings_singleton check (id)
);

comment on table loyalty_settings is
  'تنظیمات سراسری باشگاه مشتریان که در کد هاردکد نمی‌شوند. همیشه دقیقاً '
  'یک ردیف (id=true) — الگوی جدول singleton برای جلوگیری از چند مقدار '
  'متناقض. مقدار seed پایین دقیقاً برابر مقدار ثابت قبلی v_referral_reward '
  'در handle_booking_completed() (فاز ۴.۵) است تا رفتار سیستم بی‌صدا عوض نشود.';

insert into loyalty_settings (id, referral_reward_amount) values (true, 100);

create trigger trg_loyalty_settings_updated_at
  before update on loyalty_settings
  for each row execute function set_updated_at();

alter table loyalty_settings enable row level security;

-- فقط ادمین بخش 'loyalty' — همان نگاشت بخش‌های فاز ۳.۲؛ بدون نیاز به
-- خواندن عمومی چون این عدد فقط داخل تابع SECURITY DEFINER زیر مصرف می‌شود.
create policy loyalty_settings_admin_only on loyalty_settings
  for all using (public.has_admin_section('loyalty'))
  with check (public.has_admin_section('loyalty'));

-- ============================================================================
-- ۲. بازتعریف handle_booking_completed() — فقط جایگزینی مقدار ثابت ۱۰۰ با
-- خواندن از loyalty_settings؛ هیچ منطق دیگری (ارتقای سطح، شرط "فقط سفر
-- اول") تغییر نکرده. coalesce برای ایمنی در صورت خالی‌بودن غیرمنتظرهٔ
-- جدول (نباید هرگز اتفاق بیفتد چون singleton با seed بالا تضمین شده).
-- ============================================================================

create or replace function public.handle_booking_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer customers%rowtype;
  v_new_tier_id uuid;
  v_referral referrals%rowtype;
  v_referral_reward numeric;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.customer_id is null then
    return new;
  end if;

  select coalesce(referral_reward_amount, 100) into v_referral_reward
  from loyalty_settings where id = true;

  update customers
  set lifetime_completed_trips = lifetime_completed_trips + 1
  where id = new.customer_id
  returning * into v_customer;

  if not found then
    return new;
  end if;

  select id into v_new_tier_id
  from loyalty_tiers
  where is_active = true and min_completed_trips <= v_customer.lifetime_completed_trips
  order by min_completed_trips desc
  limit 1;

  if v_new_tier_id is not null and v_new_tier_id <> v_customer.loyalty_tier_id then
    update customers set loyalty_tier_id = v_new_tier_id where id = v_customer.id;
  end if;

  if v_customer.lifetime_completed_trips = 1 then
    select * into v_referral from referrals
    where referred_customer_id = v_customer.id and status = 'pending';

    if found then
      update referrals
      set status = 'completed', completed_at = now(), reward_amount = v_referral_reward
      where id = v_referral.id;

      insert into wallet_transactions (customer_id, type, amount, related_booking_id, note)
      values
        (v_referral.referrer_customer_id, 'referral_bonus', v_referral_reward, new.id, 'پاداش معرفی دوست'),
        (v_referral.referred_customer_id, 'referral_bonus', v_referral_reward, new.id, 'پاداش اولین سفر با کد معرفی');

      update customers set wallet_balance = wallet_balance + v_referral_reward
      where id in (v_referral.referrer_customer_id, v_referral.referred_customer_id);
    end if;
  end if;

  return new;
end;
$$;
-- trg_booking_completed از قبل به همین تابع اشاره دارد؛ چون امضا/نام تابع
-- عوض نشده، نیازی به drop/recreate تریگر نیست.
