# پرامپت مادر پروژه — پلتفرم حرفه‌ای رزرو، عملیات و مدیریت شرکت ترانسپورت برون‌شهری

> **سند مرجع اصلی پروژه (Single Source of Truth)**
>
> این فایل فقط یک پرامپت برای ساخت چند صفحه نیست. این سند، قرارداد مهندسی پروژه است: محصول چیست، معماری چه اصولی دارد، چه چیزهایی ساخته شده، چه چیزهایی باقی مانده، چه استانداردهایی باید رعایت شوند، و معیار پذیرش هر تغییر چیست.
>
> **آخرین بازنگری معماری:** ۶ سپتامبر ۲۰۲۶
>
> **وضعیت فعلی:** فازهای ۱ تا ۵.۸ تکمیل شده‌اند؛ فاز ۵.۹ مرحله بعدی اجرایی است. از ۵.۹ به بعد، roadmap عمداً به سمت یک سیستم حرفه‌ای در سطح بین‌المللی توسعه داده شده است.

---

# ۰. قانون طلایی پروژه

هدف نهایی فقط «یک سایت که بلیت بفروشد» نیست.

هدف، ساخت یک **Transport Commerce & Operations Platform** است که بتواند:

- برای مسافر تجربه ساده، سریع، قابل اعتماد و شفاف ایجاد کند؛
- برای اپراتور تمام عملیات رزرو و سفر را مدیریت کند؛
- برای مدیر مالی ارقام قابل اعتماد و قابل تطبیق فراهم کند؛
- برای مدیر عملیات امکان کنترل ناوگان، سفر، راننده و ظرفیت را بدهد؛
- برای تیم پشتیبانی تاریخچه کامل مشتری و رزرو را قابل پیگیری کند؛
- در برابر خطا، قطعی شبکه، دوباره‌کاری، درخواست‌های همزمان و خطاهای سرویس‌های ثالث مقاوم باشد؛
- و در نهایت بتواند از یک شرکت افغانستانی به یک پلتفرم چندشرکتی/بین‌المللی تکامل پیدا کند، بدون این‌که مجبور شویم هسته اصلی را از صفر بازنویسی کنیم.

**اصل مهم:** هر چیزی که به ظاهر، صفحه یا UI مربوط است مهم است؛ اما برای یک سیستم حمل‌ونقل حرفه‌ای، صحت تراکنش، کنترل عملیات، حسابداری، auditability، failure recovery و data integrity از زیبایی UI مهم‌ترند.

---

# ۱. تعریف محصول

محصول فعلی برای یک شرکت مشخص ترانسپورت مسافربری بین‌شهری در افغانستان ساخته می‌شود و ناوگان اصلی آن **بس‌های بزرگ بین‌شهری با ظرفیت حدود ۴۰ تا ۶۰ مسافر** است.

اما طراحی فنی باید از ابتدا قابلیت رشد به این مدل‌ها را داشته باشد:

1. یک شرکت با چند دفتر و چند مسیر؛
2. یک شرکت با چند ناوگان/دپو؛
3. چند شرکت روی یک پلتفرم مشترک؛
4. فروش مستقیم + فروش از طریق نمایندگان/دفاتر؛
5. در مرحله پیشرفته، API/Marketplace برای شرکای بیرونی.

### ۱.۱ مرز محصول

محصول از سه حوزه تشکیل می‌شود:

**A. Passenger Commerce**
- جستجوی سفر
- انتخاب سفر
- انتخاب صندلی
- اطلاعات مسافر
- پرداخت
- بلیت دیجیتال
- پیگیری و مدیریت رزرو
- کنسلی/تغییر
- اعلان‌ها
- حساب کاربری و loyalty

**B. Transport Operations**
- شهر/ایستگاه/مسیر
- برنامه سفر
- ناوگان
- راننده
- تخصیص منابع
- manifest
- boarding/departure/arrival
- تأخیر و disruption
- مدیریت صندلی و ظرفیت
- کنترل دفاتر/نمایندگان

**C. Business & Enterprise Control**
- مالی
- settlement
- reconciliation
- هزینه‌ها
- درآمد
- CRM
- پشتیبانی
- audit log
- analytics
- access control
- observability
- backup/recovery

---

# ۲. تصمیمات پایه و تغییرناپذیر

| موضوع | تصمیم |
|---|---|
| نوع ناوگان | بس بزرگ بین‌شهری؛ حدود ۴۰–۶۰ صندلی، نه سدان |
| رزرو | Guest Checkout مجاز است |
| حساب کاربری | اختیاری برای خرید؛ برای loyalty لازم است |
| رزرو نهایی | فقط با تأیید server/database معتبر است |
| seat locking | اتمیک و database-backed |
| پرداخت | HesabPay هدف اصلی + پرداخت آفلاین |
| SMS | با abstraction layer قابل تعویض |
| زبان | دری + انگلیسی، RTL/LTR |
| زمان | timezone-aware و قابل توسعه برای بازارهای دیگر |
| داده | PostgreSQL/Supabase source of truth |
| امنیت | RLS + server authorization + least privilege |
| ادمین | super admin + limited admin |
| deployment | Vercel + Supabase در نسخه فعلی؛ قابل انتقال |
| محرمانگی | credentialهای حساس هرگز در client bundle قرار نگیرند |
| معماری آینده | single-company اکنون، multi-company-ready در هسته |

---

# ۳. اصول Benchmark جهانی

این پروژه باید از رفتار حرفه‌ای پلتفرم‌هایی مثل **FlixBus، Busbud، Omio، redBus و National Express** درس بگیرد، نه این‌که صرفاً ظاهر آن‌ها را کپی کند.

### ۳.۱ قابلیت‌هایی که باید از benchmark جهانی یاد بگیریم

پلتفرم‌های جهانی معمولاً روی این موارد سرمایه‌گذاری می‌کنند:

- جستجوی سریع و مقایسه‌پذیر؛
- انتخاب صندلی؛
- مدیریت رزرو بعد از خرید؛
- بلیت دیجیتال؛
- اعلان تغییرات سفر؛
- اطلاعات مسیر و ایستگاه؛
- loyalty / referral / promotions؛
- پشتیبانی مشتری؛
- چندزبانه و چندارزی؛
- mobile-first؛
- کنترل عملیات پشت صحنه.

برای نمونه، FlixBus روی booking، digital tickets، trip updates، station finding، seat reservation و manage-booking تمرکز دارد؛ Busbud علاوه بر جستجو و رزرو، مقایسه قیمت/اپراتور/زمان/امکانات و پشتیبانی ۲۴/۷ را برجسته می‌کند؛ Omio روی مقایسه چند ارائه‌دهنده، بلیت موبایلی، مدیریت رزرو و live updates تأکید دارد؛ National Express امکان amend/cancel/refund و مدیریت بدون حساب با ticket lookup را ارائه می‌کند. citeturn437127search4turn437127search8turn437127search0turn437127search2turn658073search3

### ۳.۲ ضعف‌هایی که نباید تکرار شوند

بررسی بازخوردهای عمومی کاربران در سال ۲۰۲۶ نشان می‌دهد حتی برندهای بزرگ با مشکلات تکرارشونده‌ای مانند این‌ها روبه‌رو می‌شوند:

- اطلاع‌رسانی متناقض درباره تأخیر یا تغییر سفر؛
- تأخیر در refund؛
- سختی دسترسی به پشتیبانی در شرایط اضطراری؛
- اختلاف بین چیزی که هنگام خرید نمایش داده شده و وضعیت واقعی اپراتور؛
- ناهماهنگی بین ticket، operator و seat assignment؛
- cancellation policy که برای کاربر شفاف نیست.

این‌ها **گزارش‌های کاربران هستند، نه اثبات باگ داخلی قطعی**؛ اما برای طراحی محصول باید به‌عنوان failure mode و UX risk جدی گرفته شوند. citeturn455026search6turn455026search0turn455026search4

### ۳.۳ اصل ضدخطای محصول

سیستم ما نباید فقط قابلیت‌های برندهای بزرگ را کپی کند؛ باید برای نقاط شکست آن‌ها راه‌حل مهندسی داشته باشد:

- وضعیت سفر باید source-of-truth واحد داشته باشد؛
- timestamp تغییر وضعیت ثبت شود؛
- notificationها idempotent باشند؛
- refund status قابل رهگیری باشد؛
- customer support بتواند timeline یک رزرو را ببیند؛
- operator change قبل از آن‌که به غافلگیری کاربر تبدیل شود، به سیستم و کاربر propagate شود؛
- هیچ UI نباید state قدیمی را به‌عنوان fact قطعی نمایش دهد.

---

# ۴. استانداردهای حرفه‌ای که از این نسخه به بعد الزام هستند

### ۴.۱ Security

از OWASP ASVS به‌عنوان معیار امنیتی فنی پروژه استفاده شود. نسخه پایدار فعلی ASVS 5.0.0 است. همچنین APIها باید بر مبنای OWASP API Security Top 10 ارزیابی شوند، به‌ویژه BOLA، broken authentication، object/property authorization، unrestricted resource consumption، function-level authorization، sensitive business flows و unsafe third-party API consumption. citeturn755559search3turn755559search1

### ۴.۲ Accessibility

هدف نهایی رابط عمومی و پنل ادمین: **WCAG 2.2 AA** مگر در مواردی که constraint واقعی محصول وجود داشته باشد.

### ۴.۳ Observability

از الگوی logs + metrics + traces استفاده شود. OpenTelemetry این سه signal اصلی را برای instrumentation و troubleshooting توصیه می‌کند. citeturn755559search10

### ۴.۴ Privacy

PII باید حداقلی جمع‌آوری، محدود به افراد مجاز، و تا حد ممکن data-retention-aware باشد. اصول privacy-by-design و privacy-by-default باید در معماری لحاظ شوند. citeturn755559search9

### ۴.۵ Payment

پرداخت باید با state machine روشن، idempotency، reconciliation، refund tracking و audit trail طراحی شود. اطلاعات کارت/credential پرداخت نباید در سیستم ما ذخیره شود مگر ضرورت و مبنای امنیتی کاملاً مشخص و سازگار با provider وجود داشته باشد.

---

# ۵. معماری فعلی و قواعد فنی

## ۵.۱ Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL
- Supabase RLS
- Tailwind CSS 4
- shadcn/ui
- pnpm
- Vercel برای deployment فعلی

## ۵.۲ معماری server/client

- عملیات حساس در server boundary باشند.
- service-role key فقط در server.
- Client Components هرگز نباید به privileged Supabase client دسترسی داشته باشند.
- route handlers باید input validation، authorization و error mapping داشته باشند.
- mutationهای مهم باید transaction/RPC یا service-layer قابل اتکا داشته باشند.
- data fetched برای UI نباید با business authority اشتباه گرفته شود.

## ۵.۳ Database

PostgreSQL source of truth است.

هسته فعلی شامل حوزه‌های زیر است:

- cities
- routes
- buses
- drivers
- admins
- trips
- trip_seats
- loyalty_tiers
- customers
- bookings
- booking_passengers
- payments
- wallet_transactions
- referrals
- coupons
- coupon_redemptions

تمام tableهای فعلی RLS دارند؛ اما RLS باید در طول roadmap دوباره audit و تست شود و صرف داشتن policy به‌عنوان «امنیت کامل» پذیرفته نشود.

## ۵.۴ Booking integrity

چرخه اصلی:

```text
AVAILABLE
   ↓
HELD
   ↓
BOOKED
```

و مسیرهای برگشت:

```text
HELD → AVAILABLE       expired/released
BOOKED → CANCELLED     allowed by policy
BOOKED → REFUNDED      financial completion
```

Seat availability همیشه authoritative server/database state است.

## ۵.۵ Idempotency

این اصل برای همه عملیات critical اجباری است:

- booking confirmation
- payment callbacks/webhooks
- refund
- cancellation
- notification dispatch
- wallet credit/debit
- loyalty reward
- referral reward
- invoice/receipt generation

Double-click، retry شبکه، duplicate webhook یا repeated API call نباید transaction تکراری ایجاد کند.

---

# ۶. تجربه مسافر — استاندارد هدف

مسافر باید بتواند:

1. مسیر و تاریخ را جستجو کند؛
2. سفر مناسب را انتخاب کند؛
3. قیمت و شرایط را پیش از پرداخت کاملاً ببیند؛
4. صندلی را انتخاب کند؛
5. اطلاعات مسافر را وارد کند؛
6. online/offline payment را انتخاب کند؛
7. confirmation واضح بگیرد؛
8. ticket/QR را دریافت کند؛
9. booking را با کد + شماره تماس پیدا کند؛
10. قبل و بعد از سفر تغییرات را دریافت کند؛
11. در صورت مجاز بودن، رزرو را تغییر/لغو کند؛
12. وضعیت refund را مشاهده کند؛
13. با پشتیبانی تماس بگیرد و وضعیت مشکل را پیگیری کند.

### ۶.۱ اعتماد کاربر

هیچ هزینه، fee، restriction، seat rule، cancellation rule یا payment state نباید بعد از تصمیم نهایی کاربر ناگهان ظاهر شود.

### ۶.۲ تغییرات سفر

برای delay، bus change، driver/resource change، stop change، cancellation و schedule change باید event مشخص، audit شده و قابل اطلاع‌رسانی وجود داشته باشد.

### ۶.۳ Ticket

Digital ticket باید حداقل داشته باشد:

- booking reference
- passenger name
- route
- trip date
- departure time
- origin/destination
- seat number
- bus/service information
- payment state
- QR or secure verification token
- issue/update timestamp

---

# ۷. تجربه عملیات — استاندارد هدف

پنل ادمین نباید فقط CRUD باشد.

باید به **Operations Control Center** تبدیل شود.

مدیر باید بتواند در یک نگاه ببیند:

- امروز چند سفر داریم؛
- کدام سفر delayed است؛
- کدام سفر capacity risk دارد؛
- کدام سفر cancellation risk دارد؛
- چند ticket فروخته شده؛
- چه مبلغی collected/pending/refunded است؛
- کدام driver/bus assignment ناقص است؛
- کدام issue نیازمند intervention است.

---

# ۸. ریسپانسیو، UX و UI

Responsive فقط به معنی «در موبایل خراب نباشد» نیست.

هدف:

- mobile-first interaction؛
- tablet usable؛
- desktop optimized؛
- wide/ultra-wide balanced؛
- touch target مناسب؛
- keyboard accessible؛
- RTL/LTR correct؛
- loading/failure/empty states کامل؛
- بدون layout shift غیرضروری؛
- بدون flicker بین fallback و live state.

هیچ redesign غیرضروری برای تغییرات backend یا architecture مجاز نیست مگر UX requirement واقعی وجود داشته باشد.

---

# ۹. وضعیت فعلی پروژه — آنچه تکمیل شده است

```text
Phase 1       UI/UX foundation                                  ✅
Phase 2       Framework + technical architecture                 ✅
Phase 3       Supabase schema + RLS + admin auth                ✅
Phase 4       Public booking platform                            ✅
Phase 4.5     Account + loyalty foundation                       ✅
Phase 4.6     Professional public responsive                     ✅
Phase 4.7     Forgot/reset password flow                         ✅
Phase 5.1     Route/Bus/Driver/Trip CRUD                         ✅
Phase 5.2     Booking + offline payment admin                    ✅
Phase 5.3     Reporting                                           ✅
Phase 5.4     Loyalty administration                              ✅
Phase 5.5     Admin responsive                                    ✅
Phase 5.6     Phone normalization                                 ✅
Phase 5.7     Operational trip lifecycle                          ✅
Phase 5.8     Booking-table operational columns                    ✅
```

### ۹.۱ Technical debt already known

این موارد نباید فراموش شوند فقط چون فاز قبلی «تکمیل» اعلام شده:

- تست خودکار هنوز به بلوغ production-grade نرسیده است.
- package scripts فعلی شامل test/lint/typecheck کامل و رسمی نیستند.
- در سابقه پروژه چند TypeScript error پیش‌موجود گزارش شده و باید در QA نهایی صفر شوند.
- README قبلی stale بود و اکنون با نسخه جدید جایگزین شده است.
- برخی documentation/changelogهای قدیمی ممکن است نسبت به وضعیت ۵.۸ عقب‌تر باشند و باید در documentation phase پاک‌سازی شوند.
- محدودکردن ادمین‌ها در DB پایه دارد اما UX/middleware کامل آن در ۵.۱۲ انجام می‌شود.
- public content هنوز تا قبل از ۵.۱۳ کاملاً CMS-driven نیست.
- HesabPay و SMS هنوز integration نهایی نیستند.
- observability و disaster recovery هنوز production-grade نشده‌اند.
- actual device/load/security testing باید انجام شود، نه فقط static inspection.

**قانون:** هر فاز تکمیل‌شده حق ندارد از auditهای بعدی مصون باشد.

---

# ۱۰. ROADMAP جدید — از اینجا به بعد

> **قاعده مهم کاربر:** هیچ فاز جدیدی قبل از ۵.۹ قرار داده نشود. فازهای ۱ تا ۵.۸ تکمیل‌شده‌اند. کمبودهای آن فازها باید در auditها یا hardening فازهای بعدی اصلاح شوند.

---

## Phase 5.9 — مدیریت کامل شهرها و ولایت‌ها

- seed کامل ۳۴ ولایت/شهر موردنیاز بازار افغانستان؛
- is_active؛
- نمایش inactive در پنل؛
- فعال/غیرفعال‌سازی بدون SQL؛
- سرچ عمومی فقط active؛
- جلوگیری از ایجاد route به city نامعتبر؛
- audit تغییرات فعال/غیرفعال؛
- حفظ نام دری و انگلیسی به‌صورت canonical.

---

## Phase 5.10 — Reporting & Data Retention Hardening

- All-time reporting shortcut؛
- consistency بین dashboard و reports؛
- timezone-correct date boundaries؛
- export امن؛
- گزارش payment/refund/cancellation؛
- retention policy مستند؛
- backup policy؛
- data deletion/archive فقط بر اساس policy؛
- جلوگیری از حذف داده financial/booking موردنیاز audit.

---

## Phase 5.11 — Advanced Coupon & Promotion Engine

- min_loyalty_tier_id؛
- per_customer_limit؛
- route scoping؛
- first_trip_only؛
- min_seats؛
- min_amount؛
- guest_allowed؛
- usage audit؛
- stacking rules؛
- precedence؛
- expiration؛
- clear explanation در checkout؛
- جلوگیری از race-condition در redemption.

---

## Phase 5.12 — Limited Admin & Permission Center

- super_admin management؛
- limited_admin creation/disable؛
- section-level permissions؛
- sidebar filtering؛
- route-level enforcement؛
- DB/RLS enforcement؛
- auth-account lifecycle؛
- permission audit log؛
- جلوگیری از privilege escalation؛
- deny-by-default.

---

## Phase 5.13 — Public Content CMS Lite

- editable address/phone/hours؛
- hero content؛
- fleet/about images؛
- bilingual values؛
- Supabase Storage؛
- fallback value؛
- validation؛
- cache invalidation؛
- preview/publish semantics؛
- no arbitrary HTML injection؛
- alt text و image metadata.

---

# ۱۱. Phase 6 — Online Payments & Financial Transaction Core

## 6.1 Payment abstraction

Payment provider باید interface مستقل داشته باشد:

```text
createPayment
verifyPayment
getPaymentStatus
handleWebhook
requestRefund
getRefundStatus
```

Provider-specific code نباید در UI پخش شود.

## 6.2 HesabPay integration

- API credentials server-only؛
- environment separation؛
- sandbox/production separation؛
- request signing/verification طبق provider؛
- callback/webhook؛
- idempotency؛
- pending state؛
- timeout؛
- retry policy؛
- failure mapping.

## 6.3 Financial state machine

حداقل:

```text
INITIATED
PENDING
AUTHORIZED / SUCCESS
FAILED
EXPIRED
CANCELLED
REFUND_PENDING
REFUNDED
REFUND_FAILED
```

## 6.4 Reconciliation

سیستم باید بتواند transaction داخلی را با provider reference تطبیق دهد.

هیچ payment موفقی نباید فقط با redirect مرورگر معتبر تلقی شود.

## 6.5 Refund

- partial/full refund؛
- reason؛
- actor؛
- timestamp؛
- provider reference؛
- settlement status؛
- customer-visible status.

---

# ۱۲. Phase 7 — Notification Platform

SMS، Email و در آینده push باید روی abstraction layer باشند.

### Eventهای پایه

- booking created
- payment pending
- payment confirmed
- booking confirmed
- booking changed
- booking cancelled
- refund initiated
- refund completed
- trip reminder
- delay
- departure stop change
- trip cancelled
- driver/vehicle change در صورت لازم

### الزامات

- idempotency key؛
- delivery status؛
- retry؛
- dead-letter/error state؛
- template versioning؛
- bilingual templates؛
- per-event preferences؛
- audit log.

---

# ۱۳. Phase 8 — Internationalization, Currency & Time

این فاز فقط ترجمه متن نیست.

- دری/انگلیسی؛
- RTL/LTR؛
- locale-aware number formatting؛
- currency abstraction؛
- timezone-aware timestamps؛
- date display vs storage separation؛
- Jalali/Gregorian adapter؛
- future multi-currency readiness؛
- locale-specific address/phone formatting؛
- no hardcoded locale assumptions در business logic.

---

# ۱۴. Phase 9 — Enterprise QA, Security & Reliability

این فاز feature development نیست؛ validation است.

## 9.1 Unit tests

برای:

- fare calculation
- discounts
- coupons
- loyalty
- phone normalization
- date/time conversion
- seat state transitions
- payment mapping
- refund calculation
- permission helpers

## 9.2 Integration tests

روی Supabase واقعی/test project:

- RLS
- RPC
- booking flow
- payment state
- refund
- admin authorization

## 9.3 E2E tests

حداقل:

- guest booking
- registered booking
- multi-seat booking
- unavailable seat
- hold expiry
- payment success/failure/pending
- cancellation
- refund
- account flow
- admin operations
- limited admin
- bilingual

## 9.4 Concurrency tests

سناریوهای همزمان:

- دو کاربر برای آخرین صندلی؛
- چند درخواست confirm؛
- duplicate payment webhook؛
- retry بعد از timeout؛
- simultaneous coupon redemption.

## 9.5 Security

بر مبنای OWASP ASVS + API Top 10:

- BOLA
- broken auth
- broken function authorization
- mass assignment/property authorization
- rate limits
- resource exhaustion
- SSRF surface
- unsafe third-party API consumption
- secret leakage
- SQL/XSS injection
- CSRF/session issues where applicable
- security headers
- CORS review
- dependency review
- exposed debug endpoints

## 9.6 Accessibility

هدف WCAG 2.2 AA:

- keyboard
- focus states
- semantic labels
- contrast
- screen reader semantics
- touch targets
- motion sensitivity
- error announcements
- RTL navigation.

## 9.7 Performance

- Core Web Vitals
- search latency
- seat map render time
- admin table scale
- server response time
- DB query plans
- index review
- cache strategy
- image optimization
- bundle size.

## 9.8 Failure recovery

- DB unavailable
- payment provider unavailable
- SMS provider unavailable
- network interruption
- duplicate submission
- expired hold
- stale browser
- partial mutation
- webhook delay
- provider timeout

## 9.9 Data integrity audit

- FK
- uniqueness
- nullable semantics
- cascade rules
- orphan cleanup
- financial immutability
- auditability.

## 9.10 Release gate

هیچ buildی production-ready اعلام نشود تا:

- test suite green باشد؛
- typecheck green باشد؛
- lint green باشد؛
- security gate green باشد؛
- critical accessibility issues صفر باشد؛
- critical performance regressions صفر باشد؛
- smoke E2E green باشد.

---

# ۱۵. Phase 10 — Observability & Operations Intelligence

طبق رویکرد modern observability، logs + metrics + traces باید قابل اتصال به request/booking/payment correlation باشند. citeturn755559search10

### 10.1 Structured logging

هر خطای حساس باید حداقل correlation_id/request_id داشته باشد.

### 10.2 Business metrics

- booking attempts
- booking success rate
- seat-hold expiry rate
- payment success/failure/pending
- refund time
- cancellation rate
- occupancy
- on-time departure rate
- route profitability
- notification delivery
- support response time

### 10.3 Technical metrics

- API latency
- DB latency
- error rate
- cache hit/miss
- webhook delay
- queue backlog
- CPU/memory where available.

### 10.4 Alerts

critical alerts برای:

- payment failures spike
- booking failure spike
- database failure
- notification failure
- abnormal refund backlog
- repeated auth failures
- high latency
- abnormal seat inventory mismatch.

---

# ۱۶. Phase 11 — Production Deployment, Backup & Handover

- custom domain؛
- production env separation؛
- secret management؛
- Supabase production plan review؛
- database backups؛
- restore test؛
- disaster recovery document؛
- DNS/domain ownership؛
- account ownership transfer؛
- production monitoring؛
- final E2E؛
- incident runbook؛
- handover documentation.

Recovery فقط «backup داریم» نیست؛ باید **restore واقعی آزمایش شده باشد**.

---

# ۱۷. Phase 12 — Transport Operations Control Center

این فاز نقطه عبور از «booking website» به «transport company software» است.

## 12.1 Stations & Stops

- terminal
- office
- boarding point
- intermediate stop
- arrival point
- address
- contact
- geolocation
- active/inactive

## 12.2 Trip Templates & Schedules

- recurring schedules
- weekday rules
- blackout dates
- seasonal schedule
- holiday exceptions
- manual overrides

## 12.3 Operational Dispatch

- assign bus
- assign driver
- reassign
- conflict detection
- schedule conflict
- driver availability
- bus availability
- dispatcher notes

## 12.4 Passenger Manifest

برای هر سفر:

- passenger list
- seat numbers
- contact
- booking status
- payment status
- boarding status
- special notes

## 12.5 Boarding workflow

- board/not-boarded
- QR scan architecture
- manual override
- boarding timestamp
- staff identity
- late passenger handling

## 12.6 Trip status machine

```text
SCHEDULED
↓
BOARDING
↓
DEPARTED
↓
IN_TRANSIT
↓
ARRIVED
```

Alternative terminal states:

- CANCELLED
- ABORTED
- NO_SERVICE

هر state transition باید actor + timestamp + optional reason داشته باشد.

---

# ۱۸. Phase 13 — Fleet Management

هدف: bus CRUD کافی نیست؛ lifecycle کامل vehicle لازم است.

## 13.1 Vehicle master

- plate
- VIN/chassis where applicable
- model
- make
- year
- capacity
- seat layout
- amenities
- ownership/lease state
- active state

## 13.2 Maintenance

- preventive maintenance
- mileage/time intervals
- maintenance work order
- cost
- vendor
- parts
- service date
- next due date
- downtime

## 13.3 Inspection

- daily pre-trip checklist
- safety checklist
- defects
- inspection result
- sign-off

## 13.4 Fuel & operating resources

- fuel entry
- liters
- price
- total
- station/vendor
- mileage/odometer
- anomaly detection

## 13.5 Fleet KPIs

- utilization
- downtime
- maintenance cost
- fuel cost
- trips per vehicle
- cancellation due to vehicle issues.

Oracle-style fleet systems explicitly combine asset lifecycle, dispatch, real-time monitoring, maintenance, driver management and financial settlement; this is the direction for the mature internal operations layer. citeturn658073search1turn658073search6

---

# ۱۹. Phase 14 — Driver & Workforce Management

- driver profile
- license information
- license expiry
- availability
- assignment history
- shift/work schedule
- trip hours
- leave/unavailability
- performance metrics
- incident records
- document expiry alerts
- compensation/pay model foundation

**Important:** driver HR data is sensitive and باید با access-control جداگانه مدیریت شود.

---

# ۲۰. Phase 15 — Fare, Inventory & Revenue Management

این فاز سیستم قیمت را از یک `price` ساده به pricing engine تبدیل می‌کند.

## 15.1 Fare rules

- route base fare
- seat class
- time/date rule
- peak/off-peak
- season
- holiday
- advance purchase
- inventory level
- channel
- customer segment

## 15.2 Dynamic pricing readiness

قیمت می‌تواند بر اساس demand و inventory تغییر کند، اما هر price change باید:

- rule-based باشد؛
- قابل توضیح باشد؛
- audit شود؛
- قابل rollback باشد؛
- ceiling/floor داشته باشد.

redBus نمونه‌ای از ابزارهای dynamic pricing برای تنظیم fare بر اساس demand و market trends ارائه می‌کند؛ در پروژه ما این منطق باید بعد از ساخته‌شدن pricing rules و audit کامل اضافه شود، نه به‌صورت black-box. citeturn658073search8

## 15.3 Yield analytics

- load factor
- revenue per seat
- average fare
- route/day performance
- abandoned booking
- cancellation impact

---

# ۲۱. Phase 16 — Finance, Accounting & Reconciliation

این یکی از مهم‌ترین تفاوت‌های «وبسایت» و «نرم‌افزار شرکت» است.

## 16.1 Chart of accounts foundation

- revenue
- payment clearing
- refund liability
- discounts
- wallet liability
- commissions
- operating expenses
- cash
- receivables

## 16.2 Ledger principles

تراکنش‌های مالی حساس باید append-only یا دارای immutable audit trail باشند.

## 16.3 Daily settlement

- online payments
- offline cash
- office sales
- partner/agent sales
- refunds
- fees
- net settlement

## 16.4 Cash management

- branch cash
- cashier
- opening balance
- closing balance
- cash variance
- cash transfer

## 16.5 Expense management

- fuel
- maintenance
- salaries/driver payments where in scope
- office expense
- vendor payments
- miscellaneous

## 16.6 Reconciliation

- payment provider vs database
- booking revenue vs paid amount
- cash vs booking
- refunds vs provider
- wallet balances vs transactions.

اصل Oracle-style: financial performance باید در کنار operating events قابل مشاهده و قابل تطبیق باشد. citeturn658073search10turn658073search14

---

# ۲۲. Phase 17 — CRM, Customer Support & Service Recovery

چون حتی پلتفرم‌های بزرگ در support/refund/communication failure آسیب‌پذیرند، سیستم ما باید support را feature جانبی حساب نکند. citeturn455026search6turn455026search0

## 17.1 Customer profile

- contact
- booking history
- cancellation history
- loyalty
- preferences
- support cases
- communication preference.

## 17.2 Support cases

- issue category
- ticket number
- booking reference
- assigned agent
- priority
- status
- notes
- customer-visible resolution
- SLA timers.

## 17.3 Refund/support timeline

مسافر باید بتواند ببیند:

```text
Request submitted
→ reviewed
→ approved/rejected
→ payment provider processing
→ completed
```

## 17.4 Service recovery

- voucher/credit
- partial compensation
- rebooking
- escalation
- manager approval threshold.

---

# ۲۳. Phase 18 — Booking Change, Cancellation, Refund & Rebooking Engine

Booking فقط create/cancel نباشد.

- date change
- seat change
- passenger detail correction
- trip change
- partial cancellation
- full cancellation
- no-show
- rebooking
- voucher
- credit note
- refund
- policy engine.

تمام policyهای مالی باید versioned و قابل audit باشند.

---

# ۲۴. Phase 19 — Baggage, Extras & Ancillary Revenue

برای رشد حرفه‌ای:

- extra luggage
- oversized luggage
- bicycle where applicable
- priority seat
- premium seat
- insurance-like optional add-ons فقط در صورت مجاز بودن
- ancillary pricing
- extra purchase after booking

FlixBus نمونه‌ای از seat reservation و extras مانند luggage/bike را در lifecycle رزرو خود ارائه می‌کند. citeturn437127search13turn437127search9

---

# ۲۵. Phase 20 — Real-Time Operations, GPS & ETA

این فاز وقتی device/provider واقعی در دسترس باشد اجرا می‌شود.

- bus location ingestion
- trip location
- current stop
- estimated arrival
- delay calculation
- route deviation alert
- customer-facing tracking
- operations map
- privacy-aware location retention.

**نکته:** GPS نباید شرط کارکرد اصلی booking باشد؛ اگر telemetry قطع شد، booking و operational core باید همچنان کار کنند.

FlixBus در تجربه مسافر خود trip tracking و real-time travel updates را ارائه می‌کند؛ این قابلیت باید در پروژه ما با معماری event-based و graceful degradation پیاده شود. citeturn437127search11

---

# ۲۶. Phase 21 — Driver / Staff Mobile Workflow

به‌جای این‌که driver فقط user پنل admin باشد، workflow مخصوص field ساخته شود:

- امروز کدام سفرها را دارم؛
- route/stops؛
- passenger manifest؛
- boarding؛
- incident report؛
- departure/arrival؛
- vehicle checklist؛
- offline-first minimum workflow در صورت قطع اینترنت.

Offline mode فقط برای dataهای قابل cache مجاز است؛ booking/payment authority نباید با داده stale جعل شود.

---

# ۲۷. Phase 22 — Branches, Offices & Agent Network

برای شرکت واقعی:

- branches
- offices
- sales counters
- agents
- staff roles
- commission rules
- cash settlement
- branch performance
- ticket issuance source.

منبع هر booking باید قابل تشخیص باشد:

```text
WEB
ADMIN
OFFICE
AGENT
API
```

---

# ۲۸. Phase 23 — Partner API & Integration Platform

APIها باید versioned باشند:

```text
/api/v1/...
```

قابلیت‌ها:

- trip search
- availability
- seat map
- booking
- payment status
- cancellation
- webhook events.

### الزامات

- auth
- scopes
- rate limit
- idempotency
- API inventory
- versioning
- deprecation policy
- audit
- request correlation.

OWASP API Security Top 10 باید در API review checklist وارد شود. citeturn755559search1

---

# ۲۹. Phase 24 — Multi-Company / Multi-Tenant Foundation

این فاز باید فقط وقتی operational core تثبیت شد انجام شود.

جهت معماری:

```text
platform
 ├── company
 │    ├── branches
 │    ├── staff
 │    ├── fleet
 │    ├── routes
 │    └── bookings
```

### الزامات

- tenant/company_id boundary؛
- strict tenant isolation؛
- company-scoped RLS؛
- branding/settings per company؛
- per-company currencies/settings؛
- super-platform vs company-admin;
- partner onboarding.

هیچ داده یک شرکت نباید در query یا cache به شرکت دیگر leak شود.

---

# ۳۰. Phase 25 — Enterprise Analytics & BI

Dashboard فقط کارت‌های آماری نباشد.

## KPIهای اصلی

### Commercial
- gross booking value
- net revenue
- average ticket value
- conversion rate
- abandonment

### Operations
- load factor
- on-time departure
- cancellation rate
- vehicle utilization
- driver utilization

### Financial
- collected
- pending
- refunded
- cash variance
- route profitability

### Customer
- repeat rate
- loyalty distribution
- support volume
- refund turnaround.

### Analytics architecture

تا حد نیاز future-proof باشد برای:

- event tracking
- reporting warehouse/export
- materialized aggregates
- BI integration.

---

# ۳۱. Phase 26 — Resilience, Disaster Recovery & Business Continuity

این فاز تضمین می‌کند سیستم فقط وقتی همه‌چیز عالی است کار نکند.

- RPO definition
- RTO definition
- backup frequency
- restore procedure
- restore testing
- incident runbook
- provider outage plan
- payment outage plan
- communication fallback
- emergency operational procedures.

---

# ۳۲. Phase 27 — Enterprise Security & Governance Hardening

- privileged access review
- secret rotation
- access recertification
- audit log retention
- security incident process
- dependency SBOM where practical
- vulnerability scanning
- environment separation
- database function privilege review
- storage bucket review
- RLS regression tests
- admin action traceability.

Privacy باید بر مبنای data minimization و least-privilege باشد. citeturn755559search9

---

# ۳۳. Phase 28 — International Market Readiness

این فاز پس از تثبیت business core انجام شود.

- multiple currencies
- multiple tax models
- multiple timezone
- country-specific phone/address
- regional payment providers
- translation expansion
- country-level legal terms
- localized cancellation rules
- market-specific customer support.

---

# ۳۴. Phase 29 — Final International-Grade Product Audit

یک audit مستقل از roadmap:

### Product
آیا passenger بدون کمک انسان می‌تواند سفر را از search تا post-trip مدیریت کند؟

### Operations
آیا operator می‌تواند شرکت را از صبح تا شب با سیستم اداره کند؟

### Finance
آیا هر مبلغ از booking تا settlement قابل ردگیری است؟

### Security
آیا API، RLS، auth، admin و privileged actions تست شده‌اند؟

### Reliability
اگر provider یا network قطع شود، سیستم چه می‌کند؟

### Observability
آیا تیم می‌فهمد چه چیزی خراب شده و چرا؟

### Recovery
آیا واقعاً restore را آزمایش کرده‌ایم؟

### Maintainability
آیا developer جدید می‌تواند بدون reverse-engineering سیستم را ادامه دهد؟

### Scalability
آیا رشد شرکت نیازمند rewrite بنیادین است؟

---

# ۳۵. Definition of Done — قانون اجباری همه فازها

هیچ فازی فقط با «کد نوشته شد» تمام نشده است.

برای هر phase باید:

1. repository audit قبل از تغییر؛
2. data model impact review؛
3. security impact review؛
4. UX impact review؛
5. implementation؛
6. migration با rollback strategy در صورت نیاز؛
7. tests؛
8. typecheck/lint/build؛
9. manual smoke test؛
10. edge-case review؛
11. documentation update؛
12. دقیقاً مشخص شود چه فایل‌هایی تغییر/ایجاد/حذف شدند؛
13. وضعیت actual در master prompt به‌روز شود.

---

# ۳۶. قوانین جلوگیری از خراب‌کاری پروژه

- هیچ API موجود بدون بررسی dependencyها حذف نشود.
- هیچ table مهم بدون migration امن تغییر نکند.
- service-role key هرگز client-side نشود.
- business rule مهم فقط در UI پیاده نشود.
- duplication در pricing/payment/booking logic ایجاد نشود.
- error را فقط با `catch {}` پنهان نکن.
- loading/error/empty/success states همگی طراحی شوند.
- تغییر UI فقط برای رفع نیاز واقعی باشد.
- هیچ feature جدیدی بدون تعریف edge cases وارد production نشود.
- هیچ فاز جدیدی نباید فرض کند «RLS داریم، پس امن است».
- هیچ payment موفقی بر اساس redirect browser alone ثبت نشود.
- هیچ notification بدون idempotency retry نشود.
- هیچ مالیاتی/fee/commission در چند نقطه hardcode نشود.
- هیچ data حساس غیرضروری جمع‌آوری نشود.
- هیچ cached state به‌جای source of truth استفاده نشود.

---

# ۳۷. قانون معماری برای آینده

هر feature جدید باید ابتدا در یکی از این لایه‌ها جای بگیرد:

```text
UI
 ↓
Application / Domain Service
 ↓
Authorization
 ↓
Database / Transaction
 ↓
External Provider
```

Cross-cutting concerns:

```text
Auth
Validation
Observability
Audit
Idempotency
Error handling
Caching
Localization
```

منطق حیاتی نباید بین چند component UI پراکنده باشد.

---

# ۳۸. وضعیت نهایی مورد انتظار

در پایان roadmap، سیستم باید بتواند به‌عنوان یک محصول حرفه‌ای حمل‌ونقل معرفی شود، نه صرفاً «سایت فروش بلیت».

### مسافر

- search
- compare
- seat
- pay
- ticket
- manage
- change
- cancel
- refund
- notification
- tracking
- support
- loyalty

### عملیات

- route
- station
- schedule
- dispatch
- bus
- driver
- maintenance
- inspection
- manifest
- boarding
- tracking

### مالی

- payment
- refund
- settlement
- reconciliation
- cash
- expenses
- ledger foundation
- reporting

### مدیریت

- role/permission
- audit
- CMS
- CRM
- support
- analytics
- observability

### Platform

- API
- integrations
- multi-company readiness
- localization
- resilience
- backup/recovery
- security governance.

---

# ۳۹. Benchmark reference set

برای benchmark و بازبینی دوره‌ای، این دسته‌ها باید بررسی شوند:

### Passenger booking benchmarks

- FlixBus
- Busbud
- Omio
- redBus
- National Express

### Fleet / operations benchmarks

- Samsara
- Oracle Fleet Management / Transportation Management

### Engineering/security benchmarks

- OWASP ASVS
- OWASP API Security Top 10
- WCAG
- OpenTelemetry

### اصل استفاده از benchmark

Benchmark فقط برای الهام است.

کد، UX یا business rule رقیب نباید بدون تحلیل context کپی شود. هر قابلیت benchmark شده باید یکی از این سه نتیجه را داشته باشد:

```text
ADOPT
ADAPT
REJECT WITH REASON
```

---

# ۴۰. دستور به AI/Developer در هر چت آینده

هر AI یا developer که روی این repository کار می‌کند باید:

1. ابتدا وضعیت واقعی repository را بررسی کند؛
2. به master prompt فعلی اعتماد کند، اما آن را حقیقت مطلق و مصون از audit نداند؛
3. code را قبل از پیشنهاد معماری بررسی کند؛
4. وابستگی‌های تغییر را پیدا کند؛
5. برای migrationها impact analysis بدهد؛
6. business ruleها را قبل از UI بررسی کند؛
7. بعد از اتمام phase، فایل‌های تغییرکرده و وضعیت verification را گزارش کند؛
8. هر deficiency کشف‌شده را در phase مناسب آینده ثبت کند، نه این‌که فقط آن را نادیده بگیرد چون phase قبلی done شده است.

### خروجی اجباری هر Phase

```text
PHASE STATUS
1. Goal
2. Current repository state
3. Problems found
4. Architecture decision
5. Files to create
6. Files to modify
7. Files to delete (only when justified)
8. Database migrations
9. Security impact
10. Tests
11. Verification results
12. Remaining known issues
13. Updated project tree
14. Master prompt status update
```

---

# ۴۱. یک اصل نهایی

این پروژه نباید از «کامل‌شدن featureها» احساس امنیت کاذب بگیرد.

یک نرم‌افزار ترانسپورتی حرفه‌ای زمانی قابل اعتماد است که:

> **در حالت عادی کار کند، در حالت خطا قابل فهم باشد، در حالت فشار قابل کنترل باشد، در حالت اختلاف مالی قابل حسابرسی باشد، در حالت حمله قابل دفاع باشد، و در زمان تحویل به تیم دیگر قابل نگهداری باشد.**

مسیر پروژه از اینجا به بعد بر همین معیار سنجیده می‌شود.
