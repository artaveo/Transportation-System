# فاز ۵.۱۱ — Coupon پیشرفته

**تکمیل:** ۷ سپتامبر ۲۰۲۶

## زمینه

جدول `coupons` (فاز ۵.۴) فقط داشت: کد/نوع تخفیف/مقدار/قابل‌جمع‌شدن با
تخفیف سطح/سقف کلی استفاده/بازهٔ تاریخی/فعال‌بودن. گپ‌های شناسایی‌شده:
بدون محدودیت حداقل سطح عضویت، بدون سقف به‌ازای هر مشتری (فقط سقف کلی
سراسری)، بدون محدودیت به مسیر خاص، بدون فلگ «فقط اولین سفر»، بدون
حداقل مبلغ/تعداد صندلی، بدون فلگ «فقط مشتری ثبت‌نامی».

## بررسی دیتابیس قبل از کد نوشتن

قبل از نوشتن migration، شمای واقعی `coupons`، `loyalty_tiers`، `bookings`،
`customers`، `trips`، `coupon_redemptions`، و تعریف کامل تابع
`confirm_booking()` + `signup_customer()` از دیتابیس زندهٔ Supabase خوانده
شد تا قوانین جدید دقیقاً روی دادهٔ واقعی سوار شوند، نه فرضیات. یافته‌های
کلیدی که تصمیمات زیر را شکل دادند:

- `loyalty_tiers.sort_order` صعودی = سطح بالاتر (برنز=۱، نقره=۲، طلا=۳).
- `customers.is_registered` امروز همیشه `true` است — تنها مسیر ساخت
  رکورد `customers`، تابع `signup_customer()` است که آن را ثابت `true`
  می‌گذارد؛ یعنی «مشتری ثبت‌نامی» = داشتن `customer_id` معتبر با
  `is_registered=true` (نه صرفاً غیر-null بودن `customer_id`، برای
  سازگاری با هر مسیر آیندهٔ دیگر ساخت `customers`).
- لغو رزرو (`admin_cancel_booking`) هرگز `coupons.used_count` را کم
  نمی‌کند — یعنی سیاست فعلی پروژه «مصرف‌شده یعنی مصرف‌شده، حتی بعد از
  لغو» است؛ قانون تازهٔ `per_customer_limit` هم دقیقاً همین سیاست را
  دنبال می‌کند (شمارش از `coupon_redemptions`، بدون فیلتر وضعیت رزرو)
  تا دو مکانیزم شمارش متفاوت در یک سیستم نداشته باشیم.
- جدول `coupon_redemptions` (coupon_id, booking_id, customer_id,
  amount_saved) از قبل موجود بود — پایهٔ auditability و
  `per_customer_limit` را بدون جدول جدید فراهم کرد.

## تغییرات دیتابیس

### Migration ۱ — ستون‌های تازه روی `coupons`

`min_loyalty_tier_id` (uuid → `loyalty_tiers.id`)، `per_customer_limit`
(int)، `applicable_route_ids` (uuid[])، `first_trip_only` (boolean,
default false)، `min_seats` (int)، `min_amount` (numeric)،
`guest_allowed` (boolean, default true). همه nullable/false-پیش‌فرض تا
هیچ کوپن قدیمی رفتارش تغییر نکند مگر ادمین صریحاً یکی را تنظیم کند.
Check constraintها برای مقادیر مثبت/غیرمنفی هم اضافه شد. `get_advisors`
بعد از migration هیچ warning امنیتی تازه‌ای نشان نداد.

### Migration ۲ — بازنویسی `confirm_booking()`

بعد از پیداشدن کوپن (منطق قبلی دست‌نخورده)، هفت بلوک اعتبارسنجی تازه
اضافه شد — همه AND می‌شوند (رعایت هر ۷ قانونی که روی آن کوپن تنظیم شده
لازم است):

1. `min_seats` — تعداد چوکی رزرو باید ≥ این مقدار باشد.
2. `min_amount` — روی `subtotal` (پیش از هر تخفیف) چک می‌شود.
3. `applicable_route_ids` — اگر پر باشد، `trip.route_id` باید عضو آن باشد.
4. `guest_allowed=false` — نیاز به `customer_id` معتبر با
   `customers.is_registered=true`.
5. `min_loyalty_tier_id` — مقایسهٔ `sort_order` سطح مشتری در برابر سطح حداقلی.
6. `first_trip_only` — نیاز به `customer_id` + هیچ رزرو غیرلغوشدهٔ قبلی نداشتن.
7. `per_customer_limit` — شمارش `coupon_redemptions` همان مشتری برای همان کوپن.

هر شکست، `COUPON_INVALID: <REASON>` را raise می‌کند — پیشوند
`COUPON_INVALID` عمداً حفظ شد چون منطق نگاشت خطای `app/api/bookings/
confirm/route.ts` با `.includes("COUPON_INVALID")` کار می‌کند؛ یعنی این
فاز نیازی به تغییر آن route نداشت. تصمیم آگاهانه: پیام دقیق‌تر
(`<REASON>`) فعلاً به کاربر checkout نمایش داده نمی‌شود (هنوز فقط یک
پیام عمومی «کد تخفیف نامعتبر است» — همان رفتار قبلی)؛ اگر بعداً بازخورد
دقیق‌تر برای مسافر خواسته شد، افزودن نگاشت reason→پیام در همان route یک
فاز کوچک جدا است، نه بخشی از این فاز.

### TypeScript types

چون این‌بار schema واقعاً عوض شد (نه فقط insert داده مثل فاز ۵.۹)،
`generate_typescript_types` اجرا و خروجی کامل در
`lib/supabase/database.types.ts` نوشته شد.

## تغییرات UI (`LoyaltyManager`)

- بخش «۳. کدهای تخفیف»: فرم افزودن/ویرایش کوپن یک بخش تازهٔ «قوانین
  پیشرفته» گرفت — دراپ‌داون حداقل سطح (از همان state سطوح عضویت که
  قبلاً لود می‌شد)، سقف به‌ازای هر مشتری، حداقل صندلی/مبلغ، چک‌باکس‌لیست
  مسیرها (الگوی یکسان با `toggleAmenity` در `BusManager`)، «فقط اولین
  سفر»، «فقط مشتری ثبت‌نامی».
- مسیرها با کوئری تازهٔ `loadRouteOptions()` لود می‌شوند (همان الگوی
  join در `ReportsDashboard`/`RouteManager`)؛ قبلاً `LoyaltyManager`
  هیچ نیازی به دادهٔ routes نداشت.
- فیلد `guest_allowed` در فرم به‌صورت مثبت («فقط مشتری ثبت‌نامی»، نه
  «مهمان مجاز است؟») نمایش داده می‌شود تا از دوگانه‌منفی گیج‌کننده
  پرهیز شود؛ در ذخیره‌سازی معکوس می‌شود (`guest_allowed = !registeredOnly`).
- جدول اصلی لیست کوپن‌ها عمداً دست‌نخورده ماند (بدون ستون تازه) — درخواست
  دقیق فاز فقط «فرم CRUD» بود، نه ستون‌های تازه در جدول؛ جزئیات قوانین
  فقط در مودال ویرایش دیده می‌شود.
- اعتبارسنجی سمت فرم برای مقادیر تازه اضافه شد (فقط بازخورد سریع؛
  اعتبارسنجی لازم‌الاجرا همیشه در `confirm_booking()` سمت دیتابیس است).

## ریزفاز ۵.۱۱.۱ — پیام دقیق رد کوپن (همان روز، بدون فاز جدا)

بلافاصله بعد از تحویل فاز ۵.۱۱ یک Known issue ثبت شده بود: وقتی کوپنی
به‌خاطر یکی از ۷ قانون تازه رد می‌شد، مسافر توی چک‌اوت فقط پیام عمومی
«کد تخفیف معتبر نیست یا منقضی شده» می‌دید، نه دلیل دقیق. طبق دستور
Zakir همان لحظه (بدون شمارهٔ فاز جدا) رفع شد:

- **Migration سوم روی `confirm_booking()`:** پیام دو قانون عددی
  (`MIN_SEATS`/`MIN_AMOUNT`) حالا مقدار واقعی را هم ضمیمه می‌کند —
  مثلاً `COUPON_INVALID: MIN_SEATS:3` — تا پیام نهایی بتواند دقیق بگوید
  «حداقل ۳ چوکی». بقیهٔ ۵ قانون (route/tier/first-trip/per-customer/
  registered-only) از قبل هم نام دقیق قانون را در پیام داشتند، فقط
  سمت API/UI آن را دور می‌ریختند.
- **`app/api/bookings/confirm/route.ts`:** به‌جای فقط تشخیص رشتهٔ
  `"COUPON_INVALID"`، حالا با regex
  `/COUPON_INVALID:\s*([A-Z_]+)(?::([\d.]+))?/` نام قانون (`reason`) و
  مقدار عددی همراهش (`reasonValue`, در صورت وجود) را استخراج و در
  پاسخ JSON برمی‌گرداند. این تغییر backward-compatible است — پاسخ خطا
  هنوز `error: "COUPON_INVALID"` دارد، فقط دو فیلد تازه اضافه شده.
- **`checkout-form.tsx`:** تابع تازهٔ `couponReasonMessage()` هفت
  `reason` را به پیام Dari/English مشخص نگاشت می‌کند (با درج مقدار عددی
  برای MIN_SEATS/MIN_AMOUNT از طریق جای‌گذاری `{n}`)؛ `reason`های
  ناشناخته (مثل `NOT_FOUND` — یعنی کد اصلاً پیدا نشد/غیرفعال/منقضی) همان
  پیام عمومی قبلی را می‌گیرند. `serverError` state از یک «کلید ترجمه»
  به مستقیماً «متن نهایی ترجمه‌شده» تغییر کرد تا نیازی به یک union-type
  رشد‌یابنده از کلیدها نباشد.
- **i18n:** هفت کلید تازه زیر `checkout.*` در فارسی و انگلیسی
  (`couponMinSeats`, `couponMinAmount`, `couponRouteNotEligible`,
  `couponRegisteredOnly`, `couponTierTooLow`, `couponFirstTripOnly`,
  `couponPerCustomerLimit`).

نتیجه: مثال دقیقاً همانی که در گزارش Known issue آمده بود — الان مسافری
که کد «فقط اولین سفر» را روی رزرو دوم امتحان کند، پیام «این کد تخفیف
فقط برای اولین سفر مشتریان تازه‌وارد است.» می‌بیند، نه پیام عمومی.

## اعتبارسنجی

`tsc --noEmit`: صفر خطای تازه (همان baseline ۹ خطای از پیش‌موجود، بدون
ارتباط با این فاز — بعد از ریزفاز ۵.۱۱.۱ هم دوباره چک شد و همان ۹ خطا
با همان محتوا، فقط جابه‌جا با شماره خط). `next build`: موفق روی هر ۲۹
روت (هم بعد از migration دوم، هم بعد از migration سوم). `Supabase:
get_advisors(security)`: بدون warning تازه بعد از هر سه migration.

## فایل‌های تغییریافته

`components/admin/loyalty-manager.tsx`، `components/transport/checkout-form.tsx`،
`app/api/bookings/confirm/route.ts`، `lib/i18n.ts`،
`lib/supabase/database.types.ts` (regenerate کامل)، `ROAD-MAP.md`،
`phase-5_11-advanced-coupons.sql` (سه migration — دو تای اول برای
قوانین پیشرفته، سومی برای ریزفاز ۵.۱۱.۱ — همه مستقیماً روی Supabase
اعمال شدند، ذخیره‌شده برای audit trail طبق الگوی
`phase-5_6-phone-normalization.sql`).
