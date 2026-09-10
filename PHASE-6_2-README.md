# فاز ۶.۲ — بازپرداخت جزئی + تب اختصاصی «پرداخت‌ها»

**تکمیل:** ۱۰ سپتامبر ۲۰۲۶

## زمینه

فاز ۶.۲ توی ROAD-MAP تعریف‌نشده بود (نه اسم، نه scope — واقعاً یک خانهٔ
خالی بین ۶.۱ و ۶.۳). طی گفتگو با Zakir دو کاندید مطرح شد و هر دو با هم
انتخاب شدند:
1. سیاست بازپرداخت جزئی + اثرش روی کوپن (از بدهی‌های صریح فاز ۶.۱)
2. تب اختصاصی «پرداخت‌ها» در پنل ادمین (از بدهی مستندشدهٔ فاز ۵.۱۲: «تب‌های
   پرداخت‌ها و مشتریان هنوز در UI وجود ندارند»)

## تصمیم‌های کسب‌وکاری (از خودِ Zakir، قبل از کد)

- **بازپرداخت جزئی مجاز است** — ادمین می‌تواند مبلغ کمتر از کل پرداخت وارد
  کند (مثلاً ۹۰٪ برگرداند، ۱۰٪ جریمهٔ لغو نگه دارد).
- **کوپن رزروِ بازپرداخت‌شده آزاد می‌شود** — مشتری دوباره می‌تواند همان کد
  را استفاده کند، نه این‌که «مصرف‌شده» حساب شود.
- **اثر روی wallet عمداً بررسی نشد** — چک دیتابیس قبل از کد نشان داد
  `wallet_amount_used` روی هر ۱۲ رزروِ موجود صفر است (چون خودِ کسر از
  wallet هنوز در `confirm_booking` wire نشده)؛ ساختن منطق بازگرداندنِ
  چیزی که هیچ‌وقت کسر نشده، یک فیچر یتیم می‌ساخت. این هنوز بدهی باز است،
  برای وقتی کسر از wallet واقعاً ساخته شود.

## تغییرات دیتابیس (`phase-6_2-partial-refund-and-payments-panel.sql`، یک migration)

1. **`payments.refunded_amount numeric`** — مبلغ واقعی بازگردانده‌شده؛
   می‌تواند کمتر از `amount` باشد.
2. **`admin_refund_payment` بازنویسی شد** — امضای تازه
   `(p_booking_id, p_amount default null, p_reason default null)`.
   چون نوع پارامترها فرق کرد (نه فقط مقدار پیش‌فرض)، `CREATE OR REPLACE`
   کافی نبود — یک overload جدا می‌ساخت و نسخهٔ دوپارامتری فاز ۶.۱ را
   دست‌نخورده رها می‌کرد؛ صریحاً `DROP FUNCTION` شد اول. اعتبارسنجی:
   `0 < p_amount <= payments.amount` (وگرنه `INVALID_REFUND_AMOUNT`).
   اگر رزرو کوپن داشت: `coupons.used_count` یک واحد کم می‌شود (floor صفر)
   و ردیف `coupon_redemptions` حذف می‌شود — دقیقاً همان چیزی که
   `per_customer_limit` در `confirm_booking` می‌شمارد، پس حذفش یعنی سهمیه
   واقعاً آزاد شده.
3. **`list_payment_audit_log(p_limit)`** (تابع تازه) — تاریخچهٔ کامل
   `payment_status_events` با جوین به `bookings`/`admins`. چرا SECURITY
   DEFINER لازم بود، نه یک SELECT مستقیم از کلاینت با RLS معمولی: سیاست
   `payment_status_events_admin_select` (فاز ۶.۱) خودِ جدول رویداد را برای
   `has_admin_section('payments')` باز می‌کند، ولی RLS جدول `bookings`
   (`bookings_owner_select`، فاز ۳.۲) فقط `has_admin_section('bookings')`
   را برای ادمین می‌پذیرد — یک ادمین محدودِ *فقط* بخش payments (نه
   bookings) می‌توانست ردیف رویداد را ببیند ولی `booking_reference` جوین‌شده
   همیشه خالی می‌ماند. دقیقاً همان مشکلی که `list_admin_audit_log` در
   فاز ۵.۱۲ حل کرده بود، اینجا هم با همان الگو حل شد.

**بررسی امنیتی:** `get_advisors(security)` بعد از migration فقط همان
warningهای شناخته‌شده/عمدی (توابع self-checked مثل `admin_cancel_booking`)
را نشان داد. `has_function_privilege()` مستقیم تأیید کرد
`list_payment_audit_log` برای `anon` اجرا نمی‌شود و فقط یک overload از
`admin_refund_payment` باقی مانده (نسخهٔ قدیمی واقعاً حذف شد، نه فقط
سایه‌زده).

## اعتبارسنجی منطق (روی داده واقعی، تراکنش ROLLBACK‌شده)

- مبلغ بیشتر از کل پرداخت → `INVALID_REFUND_AMOUNT` رد شد.
- بازپرداخت ۹۰٪ روی یک پرداخت واقعی ۷۳۰ افغانی: `refunded_amount=657`
  دقیقاً محاسبه و ثبت شد؛ `payments.status`/`bookings.status` هر دو
  `refunded` شدند. (تست مسیر آزادسازی کوپن روی داده واقعی ممکن نبود چون
  فعلاً هیچ رزرویی در پایگاه‌داده کوپن ندارد — منطقش با همان الگوی
  ساده‌ی update+delete که در فاز ۵.۱۱/۵.۱۲ هم استفاده شده، پیاده شد.)

## تغییرات کد (TypeScript)

- **`lib/payments/provider.ts`:** امضای `refund()` عوض شد —
  `refund(bookingId, amount, reason?)`؛ `amount=null` یعنی کامل.
- **`components/admin/bookings-table.tsx`:**
  - دیالوگ بازپرداخت از `ConfirmDialog` ساده به یک `Modal` با فیلد مبلغ
    (پیش‌فرض = مبلغ کامل، قابل‌کاهش) و یادداشت اختیاری تغییر کرد.
  - اعتبارسنجی سمت کلاینت هم اضافه شد (۰ < مبلغ ≤ کل) — لایهٔ دوم، نه
    جایگزین چک دیتابیس.
  - اگر بازپرداخت جزئی بود، زیر برچسب وضعیت پرداخت `مبلغ‌بازپرداختی / کل`
    نشان داده می‌شود.
- **`components/admin/payments-panel.tsx`** (تازه) — تب «پرداخت‌ها»:
  جست‌وجو (نام/تلفن/کد رزرو)، فیلتر وضعیت، جدول تاریخچه (گذار وضعیت،
  مبلغ/مبلغ‌بازپرداختی، انجام‌دهنده، یادداشت، زمان) از
  `list_payment_audit_log`.
- **`components/transport/admin-panel.tsx`:** تب تازهٔ «پرداخت‌ها»
  (آیکون `CreditCard`) اضافه شد، `REQUIRED_SECTION` بخش `payments` (که
  از فاز ۳.۲/۵.۱۲ در Permission Center از قبل قابل‌انتخاب بود ولی هیچ تبی
  نداشت) را نگاشت می‌کند.
- **`lib/i18n.ts`:** کلیدهای تازه در `admin.nav.payments`،
  `admin.bookingsPanel.refund*` (مبلغ/دلیل/خطای مبلغ نامعتبر)، و بلوک
  کامل تازهٔ `admin.paymentsPanel.*` — هر دو زبان.
- **`lib/supabase/database.types.ts`** — regenerate (ستون تازه
  `refunded_amount`، امضای تازهٔ `admin_refund_payment`، تابع تازهٔ
  `list_payment_audit_log`).

## اعتبارسنجی build

`npx tsc --noEmit`: همان baseline ۹ خطا (۱۸ خط) — صفر خطای تازه.
`next build` (با همان stub موقت فونت‌های Google + بازگردانی فوری): موفق
روی هر ۳۱ روت.

## بدهی/نکات باز برای Zakir

- **اثر بازپرداخت روی wallet** — همان‌طور که بالا گفته شد، عمداً کنار
  گذاشته شد چون خودِ کسر از wallet هنوز وجود ندارد؛ وقتی آن فیچر ساخته
  شد، باید همین‌جا هم برگرداندنِ wallet اضافه شود.
- **تب «مشتریان»** هنوز وجود ندارد — بدهی جدای فاز ۵.۱۲، این فاز فقط
  «پرداخت‌ها» را ساخت.
- **فاز ۶.۳** (اتصال واقعی HesabPay) هنوز بلاک است — نیازمند ثبت‌نام
  دولوپر/sandbox key از حساب‌پی که Zakir هنوز ندارد.

## فایل‌های تغییریافته/تازه

`lib/payments/provider.ts`، `components/admin/bookings-table.tsx`،
`components/transport/admin-panel.tsx`، `lib/i18n.ts`،
`lib/supabase/database.types.ts` (regenerate) — **تازه:**
`components/admin/payments-panel.tsx`،
`phase-6_2-partial-refund-and-payments-panel.sql` (یک migration،
مستقیماً روی Supabase اعمال شد، ذخیره‌شده برای audit trail)، همین فایل.
