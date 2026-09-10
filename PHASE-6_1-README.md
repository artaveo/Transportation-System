# فاز ۶.۱ — زیرساخت پرداخت (بدون اتصال واقعی HesabPay)

**تکمیل:** ۹ سپتامبر ۲۰۲۶

## زمینه

طبق ROAD-MAP.md، فاز ۶ («Payment & Financial Transaction Core») نیازمند
تأیید کارفرما برای قرارداد واقعی HesabPay، fee model و refund policy است.
Zakir صریحاً درخواست کرد فقط **زیرساخت** فاز ۶ ساخته شود — «فعلاً با
حساب پی هیچ ارتباط مستقیمی نداریم». فاز ۵.۱۵ (که در ROAD-MAP گام بعدی
بود) عمداً کنار گذاشته شد تا بعداً با scope مشخص انجام شود.

## بررسی وضعیت موجود قبل از کد نوشتن

قبل از هر migration، schema کامل (`payments`, `bookings`, و بقیهٔ جدول‌ها)
و تعریف کامل `confirm_booking()`, `admin_confirm_offline_payment()`,
`admin_cancel_booking()`, `request_booking_cancellation()` از دیتابیس
زندهٔ Supabase خوانده شد. یافته‌های کلیدی:

- `confirm_booking()` همیشه یک ردیف `payments` با `status='pending'`
  می‌سازد — چه online چه offline. تنها مسیر به `confirmed` رفتن،
  `admin_confirm_offline_payment()` است که فقط برای `payment_method='offline'`
  کار می‌کند (مستندشده در کامنت خودِ `app/api/bookings/confirm/route.ts`:
  «رزرو آنلاین هم فعلاً با payments.status='pending' ثبت می‌شود — بدون
  درگاه واقعی HesabPay — آن اتصال فاز ۶.۳ است»). یعنی رزروهای online امروز
  تا ابد در `pending` می‌مانند؛ این محدودیت شناخته‌شده است، نه باگ این فاز.
- **باگ واقعی موجود:** `admin_cancel_booking()` روی هر رزروِ `pending` یا
  `confirmed` کار می‌کرد و هیچ اثری روی `payments` نمی‌گذاشت — یعنی یک
  رزروِ آفلاینِ **پول‌گرفته‌شده** (payment.status='confirmed') می‌توانست
  «لغو» شود در حالی که در `payments` هنوز `confirmed` باقی می‌ماند. هیچ
  تابع بازپرداخت هم اصلاً وجود نداشت.
- هیچ تاریخچه/audit trail‌ای برای تغییرات وضعیت پرداخت وجود نداشت (بر خلاف
  `admin_access_audit` که برای تغییرات ادمین در فاز ۵.۱۲ ساخته شده بود).

## تغییرات دیتابیس (`phase-6_1-payment-infrastructure.sql`، دو migration)

1. **ستون‌های تازه روی `payments`:** `provider` (`manual`/`gateway_pending`،
   بک‌فیل‌شده از `method` موجود)، `idempotency_key` (unique، فعلاً خالی —
   فقط برای فاز ۶.۳)، `refunded_by_admin_id`/`refunded_at`/`refund_reason`،
   `failure_reason`، `raw_response jsonb`. همه nullable/default-دار — هیچ
   رفتار موجودی نشکست.
2. **`bookings.refunded_at`** — برای تقارن با `confirmed_at`/`cancelled_at`.
3. **جدول `payment_status_events`** (audit trail) — دقیقاً الگوی
   `admin_access_audit` فاز ۵.۱۲: RLS فقط SELECT برای `has_admin_section('payments')`،
   هیچ INSERT policy برای هیچ نقشی (تنها راه نوشتن، تابع پایین).
4. **تابع کمکی `log_payment_status_event()`** — تا سه محل فراخوانی کد
   تکراری insert نداشته باشند.
5. **تریگر `enforce_payment_status_transition()`** (BEFORE UPDATE روی
   `payments`) — state machine واقعی سطح دیتابیس: فقط
   `pending→confirmed`, `pending→failed`, `confirmed→refunded` مجازند؛ هر
   گذار دیگر رد می‌شود، حتی از طریق UPDATE مستقیم (نه فقط RPC) — چون
   `payments_admin_write` (فاز ۳.۲) از قبل به ادمین‌ها نوشتن مستقیم روی
   این جدول را می‌داد.
6. **تابع تازه `admin_refund_payment(p_booking_id, p_reason)`** — قابلیتی
   که امروز اصلاً وجود نداشت: فقط برای پرداخت `confirmed`، چوکی‌ها را آزاد
   می‌کند، `payments.status='refunded'` + `bookings.status='refunded'`
   می‌کند، و رویداد را در `payment_status_events` ثبت می‌کند.
7. **`admin_cancel_booking()` بازنویسی شد** — رفع باگ بخش قبل: اگر
   پرداخت رزرو از قبل `confirmed` باشد، با خطای
   `PAYMENT_ALREADY_CONFIRMED_USE_REFUND` رد می‌شود؛ باید از مسیر
   `admin_refund_payment` برود.
8. **`confirm_booking()` و `admin_confirm_offline_payment()`** — بدون
   تغییر منطق موجود، فقط افزودن `log_payment_status_event(...)` بعد از هر
   تغییر وضعیت + ست‌کردن `provider` درست هنگام ساخت پرداخت.

**نکتهٔ امنیتی (پیدا شده با `get_advisors(security)`، طبق درسِ ۵.۱۲.۳):**
migration اول باعث شد `log_payment_status_event` برای `anon`/`authenticated`
هم به‌صورت RPC مستقیم قابل‌فراخوانی باشد — این تابع هیچ چک
`has_admin_section` ندارد (فقط قرار است از داخل توابع دیگر صدا زده شود)،
پس هرکسی می‌توانست رویداد جعلی در جدول تاریخچه بنویسد و کل ارزش audit
trail را از بین ببرد. Migration دوم صریحاً `revoke execute ... from
public, anon, authenticated` زد (با `from public` هم — نه فقط دو نقش،
دقیقاً همان درسِ ریزفاز ۵.۱۲.۳). با `has_function_privilege()` مستقیم
(نه فقط `get_advisors`) تأیید شد که دیگر هیچ نقشی جز مالک تابع دسترسی
ندارد.

## اعتبارسنجی منطق (روی داده واقعی، همه در تراکنش ROLLBACK‌شده)

- گذار غیرمجاز (`pending→refunded` مستقیم روی یک ردیف واقعی) با خطای
  `INVALID_PAYMENT_TRANSITION` رد شد.
- `admin_refund_payment` روی یک بوکینگ واقعی `confirmed` اجرا شد (با
  `set local role authenticated` + `request.jwt.claims` برای شبیه‌سازی
  نشست همان super_admin واقعی پروژه): چوکی به `available` برگشت، پرداخت
  و رزرو هر دو `refunded` شدند، رویداد در `payment_status_events` ثبت شد
  — سپس `ROLLBACK` شد تا داده واقعی دست‌نخورده بماند.

## تغییرات کد (TypeScript)

- **`lib/payments/types.ts`** (تازه) — `PaymentStatus`/`PaymentMethod`/
  `PaymentProviderName`/`PaymentActionResult`، جایگزین union typeهای
  پراکندهٔ تکراری که قبلاً مستقیم داخل `bookings-table.tsx` تعریف شده
  بودند.
- **`lib/payments/provider.ts`** (تازه) — interface صریح `PaymentProvider`
  با فقط دو متدی که همین امروز واقعاً وجود دارند
  (`confirmOfflinePayment`, `refund`). عمداً `createIntent`/`verify`/
  `parseWebhook` اینجا نیست — نوشتنشان الان یعنی قرارداد فرضی برای درگاهی
  که هنوز طراحی نشده؛ در فاز ۶.۳ که HesabPay وصل شود، همین interface
  گسترش پیدا می‌کند و یک `HesabPayProvider` جدید پیاده‌سازیش می‌کند.
  `createManualPaymentProvider()` پیاده‌سازی امروز است — فقط دور همان دو
  RPC که از قبل وجود داشتند (`admin_confirm_offline_payment`,
  `admin_refund_payment`).
- **`components/admin/bookings-table.tsx`:**
  - دیگر مستقیم `supabase.rpc(...)` برای تأیید/بازپرداخت نمی‌زند — از پشت
    `paymentProvider` (بالا) رد می‌شود.
  - دکمهٔ بازپرداخت تازه (آیکون `RotateCcw`) — فقط برای
    `status==='confirmed' && paymentStatus==='confirmed'`.
  - `canCancel` دیگر رزروهای `confirmed` را شامل نمی‌شود (باید بازپرداخت
    شوند) — منعکس‌کنندهٔ همان قانون DB بالا، به‌عنوان لایهٔ دوم (UX)، نه
    جایگزین آن.
- **`lib/i18n.ts`:** سه کلید تازه در `admin.bookingsPanel.*`
  (`refundPayment`, `refundPaymentConfirmTitle`, `refundPaymentConfirmBody`)
  در هر دو زبان.
- **`lib/supabase/database.types.ts`** — regenerate کامل (جدول تازه
  `payment_status_events`، ستون‌های تازهٔ `payments`/`bookings`، تابع تازهٔ
  `admin_refund_payment`).

## اعتبارسنجی build

`npm install` → `npx tsc --noEmit`: همان baseline ۹ خطای از پیش‌موجود
(۱۸ خط چاپی — `app/api/bookings/confirm/route.ts` و سه فایل
`account-*.tsx`) — صفر خطای تازه. `next build` (بعد از stub موقت فونت‌های
Google طبق محدودیت شبکهٔ sandbox، و بازگردانی فوری بعد از build): موفق
روی هر ۳۱ روت، بدون روت تازه (این فاز فقط دیتابیس + کامپوننت ادمین موجود
را تغییر داد).

## بدهی/نکات باز برای Zakir

- **بازپرداخت جزئی و اثر روی wallet/coupon تصمیم‌گیری نشده.**
  `admin_refund_payment` فقط بازپرداخت کامل انجام می‌دهد؛ اگر مشتری از
  `wallet_amount_used` یا کوپن استفاده کرده بود، آن‌ها هنگام بازپرداخت
  برنگردانده می‌شوند (نه چون فراموش شد — چون سیاست دقیقش («کوپن هم به
  مشتری برگردد یا نه؟») تصمیم کسب‌وکاری است که حدس زده نشد).
- **رزروهای online همچنان تا ابد `pending` می‌مانند** — این محدودیت از
  قبل مستند بود و همین فاز آن را حل نمی‌کند؛ حل واقعی‌اش دقیقاً فاز ۶.۳
  (اتصال HesabPay) است.
- **فاز ۶.۲ هنوز تعریف نشده** — طبق قاعدهٔ بخش ۷ ROAD-MAP، scope آن باید
  قبل از کد با Zakir مشخص شود.
- **فاز ۵.۱۵** کماکان معلق است (تصمیم Zakir: فعلاً بی‌خیالش).

## فایل‌های تغییریافته/تازه

`lib/supabase/database.types.ts` (regenerate کامل)، `components/admin/bookings-table.tsx`،
`lib/i18n.ts`، `ROAD-MAP.md` — **تازه:** `lib/payments/types.ts`،
`lib/payments/provider.ts`، `phase-6_1-payment-infrastructure.sql` (دو
migration، مستقیماً روی Supabase اعمال شدند، ذخیره‌شده برای audit trail)،
همین فایل.
