# ROAD-MAP — پلتفرم حرفه‌ای رزرو، عملیات و مدیریت ترانسپورت بین‌شهری

## وضعیت سند

**آخرین بازنگری:** ۶ سپتامبر ۲۰۲۶  
**وضعیت پروژه:** فازهای ۱ تا ۵.۸ تکمیل شده‌اند؛ **فاز ۵.۹ گام بعدی است.**

این سند نقشه‌راه محصول و مهندسی پروژه است و وضعیت واقعی، جهت معماری، بدهی‌های شناخته‌شده، فازهای آینده و معیارهای تکمیل را ثبت می‌کند.

> **قاعده شماره‌گذاری:** هیچ فاز یا زیر‌فاز جدیدی پیش از ۵.۹ اضافه نمی‌شود. هر قابلیت یا اصلاحی که در auditهای بعدی کشف شود، حتی اگر از نظر معماری بهتر بود در مراحل ابتدایی اجرا می‌شد، بعد از ۵.۸ ثبت می‌شود و در صورت لزوم با برچسب **Debt تاریخی / افزوده‌شده پس از audit** مشخص خواهد شد.

---

# 1. هدف محصول

این پروژه صرفاً وب‌سایت فروش بلیت نیست. هدف، ساخت یک **Transport Commerce & Operations Platform** برای شرکت‌های ترانسپورت مسافربری برون‌شهری است.

### Passenger Commerce

- جستجو و مقایسه سفر
- انتخاب صندلی
- اطلاعات مسافر
- پرداخت و بلیت دیجیتال
- مدیریت رزرو
- تغییر، لغو و بازپرداخت
- اعلان‌ها
- حساب کاربری
- loyalty / referral
- پشتیبانی

### Transport Operations

- شهرها و نقاط سوارشدن
- مسیرها و زمان‌بندی
- سفرها و ظرفیت
- ناوگان و بس‌ها
- راننده‌ها
- dispatch و manifest
- boarding
- tracking و ETA
- maintenance
- disruption management

### Business Control

- payment
- refund
- settlement و reconciliation
- accounting foundation
- cash / expense / commission
- CRM و support
- audit log
- analytics
- access control
- observability
- backup/recovery

---

# 2. اصول محصول و معماری

1. PostgreSQL منبع حقیقت داده‌های تجاری است.
2. Browser منبع حقیقت booking/payment/seat نیست.
3. عملیات حساس باید از server/database boundary عبور کنند.
4. service-role فقط در server و با authorization صریح استفاده شود.
5. business rules مهم نباید فقط در UI پیاده شوند.
6. رزرو و عملیات مالی مهم باید idempotent باشند.
7. وضعیت‌های حساس باید state machine و تاریخچه قابل حسابرسی داشته باشند.
8. داده خراب نباید با fallback به availability جعلی تبدیل شود.
9. cache/fallback برای UX است و جای state authoritative را نمی‌گیرد.
10. هر قابلیت جدید باید edge case، failure mode، access control و observability داشته باشد.
11. رابط کاربری باید ساده، سریع و قابل اعتماد باقی بماند.
12. قابلیت‌های بین‌المللی بعد از تثبیت business core توسعه داده شوند.

---

# 3. استانداردهای هدف

- **Security:** OWASP ASVS و API Security principles
- **Accessibility:** WCAG 2.2 AA
- **Observability:** logs + metrics + traces با correlation بین request، booking و payment
- **Privacy:** حداقل‌سازی PII، retention و محدودسازی دسترسی
- **Localization:** دری/انگلیسی، RTL/LTR، timezone، number/currency abstraction و Jalali/Gregorian adapter

---

# 4. Benchmark محصول

برای benchmark محصول و عملیات از الگوهای عمومی سرویس‌های حرفه‌ای مانند **FlixBus، Busbud، Omio، redBus، National Express، Samsara و Oracle** و برای مهندسی از **OWASP، WCAG و OpenTelemetry** استفاده می‌شود.

نتیجه هر benchmark باید یکی از این تصمیم‌ها باشد:

```text
ADOPT
ADAPT
REJECT WITH REASON
```

Failure modeهای مهم صنعت مانند تأخیر در اطلاع‌رسانی، refund کند، پشتیبانی ضعیف هنگام اختلال، اختلاف وضعیت operator با ticket و ابهام cancellation باید در طراحی سیستم پوشش داده شوند.

---

# 5. تاریخچه تکمیل‌شده

این وضعیت تاریخی باید حفظ شود؛ auditهای بعدی نباید status فازهای تکمیل‌شده را از بین ببرند.

```text
Phase 1       UI/UX foundation                           ✅
Phase 2       Framework + technical architecture         ✅
Phase 3       Supabase schema + RLS + admin auth        ✅
Phase 4       Public booking platform                     ✅
Phase 4.5     Account + loyalty foundation                ✅
Phase 4.6     Professional public responsive              ✅
Phase 4.7     Forgot/reset password flow                  ✅
Phase 5.1     Route / Bus / Driver / Trip CRUD            ✅
Phase 5.2     Booking + offline payment administration    ✅
Phase 5.3     Reporting                                   ✅
Phase 5.4     Loyalty administration                      ✅
Phase 5.5     Professional admin responsive               ✅
Phase 5.6     Phone normalization                         ✅
Phase 5.7     Operational trip lifecycle                  ✅
Phase 5.8     Booking-table operational columns           ✅
```

جزئیات کامل پیاده‌سازی هر یک از فازهای تکمیل‌شده (فایل‌های تغییریافته،
تصمیمات فنی، اعتبارسنجی، بدهی باقی‌مانده) در سند مستقل همان فاز ثبت
شده است: `PHASE-3.3-README.md`، `PHASE-4_1` تا `PHASE-4_5-README.md`،
و `PHASE-5_1` تا `PHASE-5_8-README.md`. این سند (`ROAD-MAP.md`) عمداً
فقط وضعیت را نگه می‌دارد، نه جزئیات را — طبق بخش ۱۳.

---

# 6. Debt تاریخی / افزوده‌شده پس از audit

این موارد کشف‌شده در auditهای بعدی هستند و به معنی برگشت status تاریخی فازهای قبل نیستند:

- production-grade automated tests و release gates
- رسمی‌سازی typecheck/lint/test/build/security pipeline
- atomic trip + seat-inventory creation
- انتقال برخی query/mutationهای client-side به application/domain boundaries
- centralized input validation
- authorization boundaries برای service-role usage
- rate limiting و abuse protection برای public booking lookup
- enforce کردن business invariants در DB + domain + tests
- comprehensive audit trail
- Money / Ledger / Reconciliation domain
- seat-layout versioning برای historical trip consistency
- branch / office / agent / booking-source model
- offline operations architecture
- CMS کامل با version/publish/rollback/localization
- HesabPay و SMS integration
- observability و disaster recovery hardening

---

# 7. فازهای بعدی

## Phase 5.9 — مدیریت شهرها و ولایت‌ها

- ثبت مجموعه رسمی ۳۴ ولایت/شهر مورد نیاز محصول
- active/inactive
- نام canonical و داده‌های قابل مدیریت
- استفاده فقط از مقصدهای فعال در سمت عمومی
- audit و validation

**زمینهٔ آماده:** جدول `cities` از فاز ۳.۱ ستون `is_active` دارد ولی
فقط ۸ شهر کریدور فعلی seed شده‌اند؛ ۲۶ ولایت دیگر اصلاً رکورد ندارند
(نه این‌که غیرفعال باشند).

**کار لازم:**
1. migration برای افزودن ۲۶ ولایت باقی‌ماندهٔ افغانستان به `cities` با
   `is_active=false` (نام دری+انگلیسی رسمی هرکدام را قبل از insert
   تأیید کن، طبق قانون عدم جعل اطلاعات).
2. دراپ‌داون انتخاب شهر در فرم مسیر ادمین (`RouteManager`) باید هر ۳۴
   شهر را نشان دهد (با تگ «غیرفعال» برای inactive)، چون سرچ عمومی
   مشتری از قبل درست فقط شهرهای `is_active` را نشان می‌دهد.
3. یک کنترل ادمین (تیک/سوییچ) برای toggle کردن `is_active` هر شهر —
   بدون نیاز به SQL دستی — که همان لحظه هم روی فرم مسیر ادمین هم روی
   سرچ صفحهٔ اصلی مشتری اثر بگذارد.

**Requires stakeholder confirmation:** فهرست canonical شهرها و نام‌های نمایشی.

## Phase 5.10 — گزارش‌گیری و retention

- بازه‌های گزارش کامل و قابل کنترل
- all-time / historical reporting
- retention policy UX
- export امن
- سازگاری گزارش‌ها با منطق مالی آینده

**زمینهٔ آماده:** دکمه‌های ۷/۳۰/۹۰ روز در `ReportsDashboard` (فاز ۵.۳)
فقط shortcut هستند؛ فیلدهای «از تاریخ»/«تا تاریخ» بدون `min` مستقیم
روی bookings/trips واقعی کوئری می‌زنند و هیچ داده‌ای حذف/آرشیو نمی‌شود.

**کار لازم:**
1. یک دکمهٔ چهارم «همهٔ بازه‌ها» (از قدیمی‌ترین رزرو تا امروز) که این
   قابلیت پنهان را بارزتر کند.
2. یک بند کوتاه دربارهٔ سیاست نگهداری/بکاپ داده برای فاز مربوط به
   Production Deployment (چیزی در کد لازم نیست، فقط تصمیم مکتوب).

## Phase 5.11 — Coupon پیشرفته

- rule composition
- محدودیت بر مسیر/سفر/کاربر
- usage limits
- validity windows
- conflict handling
- auditability

**زمینهٔ آماده:** جدول `coupons` فعلی (فاز ۵.۴) فقط دارد: کد/نوع
تخفیف/مقدار/قابل‌جمع‌شدن با سطح/سقف کلی استفاده/بازهٔ تاریخی/فعال‌بودن.
گپ‌های شناسایی‌شده: بدون محدودیت حداقل سطح عضویت، بدون سقف به‌ازای هر
مشتری (فقط سقف کلی)، بدون محدودیت به مسیر خاص، بدون فلگ «فقط اولین
سفر»، بدون حداقل مبلغ/تعداد صندلی، بدون فلگ «فقط مشتری ثبت‌نامی».

**کار لازم:** افزودن ستون‌های `min_loyalty_tier_id`،
`per_customer_limit`، `applicable_route_ids`، `first_trip_only`،
`min_seats`/`min_amount`، `guest_allowed` به `coupons` + به‌روزرسانی
منطق اعتبارسنجی کوپن در `confirm_booking()` برای چک هرکدام + فرم CRUD
کوپن در `LoyaltyManager` برای این فیلدهای تازه.

## Phase 5.12 — Limited Admin و Permission Center

- section-level permissions
- role-based access
- server enforcement
- UI visibility مطابق permission
- audit تغییرات دسترسی

**زمینهٔ آماده:** پایهٔ کامل از فاز ۳.۱/۳.۲ در دیتابیس هست: جدول
`admins` ستون `role` (`super_admin`/`limited_admin`) و
`allowed_sections text[]` دارد، تابع RLS کمکی `has_admin_section()` از
قبل روی چند جدول (routes/fleet/trips/bookings/payments/loyalty/customers)
فعال است. **چیزی که نیست:** هیچ UI برای ساختن/مدیریت ادمین محدود (فقط
یک super_admin با اسکریپت SQL دستی بوت‌استرپ شده — فاز ۳.۳)، middleware
فقط `is_admin()` عمومی چک می‌کند نه بخش‌های مجاز، sidebar
(`admin-panel.tsx`) همیشه هر ۸ تب را بدون فیلتر نشان می‌دهد.

**کار لازم:** تب «مدیریت ادمین‌ها» (فقط برای super_admin، با
`is_super_admin()` گیت شود) + فیلترکردن `navItems` در `admin-panel.tsx`
بر اساس `allowed_sections` ادمین لاگین‌شده + تصمیم دربارهٔ روش ساخت
حساب Auth برای ادمین جدید (دعوت دستی از Supabase Dashboard مثل
بوت‌استرپ اولیه، یا Admin API).

## Phase 5.13 — Public CMS Lite

- مدیریت متن‌ها
- address/contact content
- تصاویر
- publish/unpublish
- versioning پایه
- fallback content strategy
- جلوگیری از arbitrary HTML به‌عنوان مدل محتوا

**زمینهٔ آماده:** هیچ‌کدام از این‌ها دیتابیسی نیستند؛ متن هیرو/آدرس
تماس/توضیحات درباره‌ما همه هاردکد در `lib/i18n.ts`اند، عکس‌ها فایل
استاتیک در `public/`.

**کار لازم (قبل از شروع کد، با Zakir تأیید شود):** فهرست دقیق کدام
فیلدها واقعاً قابل‌ویرایش باشند (پیشنهاد اولیه: آدرس/تلفن/ساعت‌کاری/
عکس‌های هیرو-ناوگان-درباره‌ما — نه کل ساختار صفحه)؛ سپس یک جدول
key-value تازه (`site_settings`: key, value_fa, value_en) + یک
Supabase Storage bucket برای آپلود عکس + یک تب ادمین ساده برای ویرایش،
و صفحات پابلیک مربوطه باید مقدار دیتابیسی را (اگر موجود بود) به‌جای
مقدار ثابت i18n بخوانند.

---

# 8. Production Product Integrations

## Phase 6 — Payment & Financial Transaction Core

- payment provider abstraction
- HesabPay integration
- payment state machine
- idempotency
- webhook validation
- duplicate/late callback handling
- refund
- reconciliation
- payment audit trail

**Requires stakeholder confirmation:** قراردادهای واقعی payment provider، callback behavior، fee model و refund policy.

## Phase 7 — Notifications

- SMS provider boundary
- booking confirmation
- payment events
- cancellation/refund events
- trip updates
- retry policy
- delivery logging

## Phase 8 — Localization & Time

- دری و انگلیسی
- RTL/LTR verification
- timezone-aware operations
- locale-aware numbers
- currency abstraction
- Jalali/Gregorian separation

---

# 9. Production Assurance

## Phase 9 — QA, Security, Concurrency & Performance

- automated tests
- integration tests
- E2E critical flows
- seat contention tests
- booking/payment race-condition tests
- authorization tests
- dependency/security checks
- performance/load tests
- accessibility verification

## Phase 10 — Observability

- structured logs
- correlation IDs
- metrics
- traces where useful
- error tracking
- booking/payment operational dashboards
- alerts

## Phase 11 — Production Deployment & Recovery

- production deployment standard
- rollback procedure
- backup policy
- restore testing
- RPO/RTO definition
- disaster-recovery runbook
- production E2E
- handover documentation

---

# 10. Debt تاریخی / افزوده‌شده پس از audit — Architecture Hardening

## Phase 12 — Domain & Application Architecture Hardening

- explicit application/domain services for sensitive workflows
- remove business mutations from UI components where appropriate
- consistent repository/service boundaries
- centralized validation
- API versioning strategy where required
- idempotency conventions
- pagination conventions
- correlation IDs
- clearer separation of read models and transactional commands

This phase is intentionally placed after 5.8 because it was identified through a later architecture audit.

## Phase 13 — Audit Trail & Business Invariants

- centralized audit log
- actor/source metadata
- state-transition history
- DB constraints for critical invariants
- domain-level invariant checks
- automated invariant tests

This phase is also historical debt added after audit.

---

# 11. Transport Operations Platform

## Phase 14 — Operations Control Center

- unified operations board
- daily trip board
- dispatch view
- boarding status
- incident/disruption handling
- operational alerts

## Phase 15 — Fleet Management

- vehicle master data
- maintenance schedule
- maintenance history
- inspections
- availability and downtime
- operational cost direction

## Phase 16 — Driver & Workforce

- driver profiles
- contracts/assignments
- duty schedules
- eligibility/licence checks
- attendance/availability
- driver trip history

## Phase 17 — Fare, Inventory & Revenue Management

- fare rules
- seat classes
- route/trip pricing
- demand-aware inventory controls
- promotions
- commission rules
- revenue protection

## Phase 18 — Finance, Accounting & Reconciliation

- ledger foundation
- settlements
- cash management
- expenses
- commissions
- provider reconciliation
- refund reconciliation
- accounting export/interface

## Phase 19 — CRM, Support & Service Recovery

- customer 360
- support tickets
- booking-linked support history
- disruption workflows
- service recovery
- refund/support timeline

## Phase 20 — Booking Change, Cancellation & Rebooking

- deterministic change rules
- cancellation policies
- partial refund logic
- rebooking
- fare difference
- audit trail

## Phase 21 — Baggage & Ancillary Revenue

- baggage rules
- optional services
- ancillary pricing
- revenue attribution

## Phase 22 — Real-time Operations

- GPS integration boundary
- vehicle location
- ETA
- delay propagation
- passenger-facing trip updates

## Phase 23 — Driver / Staff Mobile Workflow

- mobile operational views
- boarding workflow
- manifest access
- incident reporting
- offline-safe operational commands

## Phase 24 — Branches, Offices & Agent Network

- branch model
- office users
- agents
- sales channels
- source attribution
- commission management
- cash/offline sales controls

## Phase 25 — Partner API & Integration Platform

- versioned partner APIs
- scoped access
- idempotency
- webhooks
- partner rate limits
- integration monitoring

## Phase 26 — Multi-Company / Multi-Tenant

- tenant boundaries
- tenant-aware data access
- company-level configuration
- isolated operational data
- platform administration

## Phase 27 — Enterprise Analytics & BI

- operational KPIs
- revenue analytics
- route profitability
- occupancy analysis
- customer analytics
- cohort/retention analysis
- data export / BI integration

## Phase 28 — Offline Operations & Synchronization

- explicit offline command model
- operation queues
- conflict resolution
- retry/idempotency
- sync state
- safe offline UX for critical operations

## Phase 29 — Resilience, DR & Business Continuity

- failover planning
- restore validation
- dependency failure strategy
- business continuity procedures
- tested recovery exercises

## Phase 30 — Enterprise Security & Governance

- least privilege review
- privileged access controls
- security monitoring
- secret rotation
- data governance
- retention and deletion policies
- security incident procedures

## Phase 31 — International Market Readiness

- currencies
- localized payments
- country-specific policy/configuration
- localized tax/financial adapters
- language expansion
- market-specific compliance interfaces

## Phase 32 — Final International-Grade Product Audit

- architecture audit
- security audit
- booking/payment integrity audit
- performance/load audit
- accessibility audit
- observability audit
- DR/BCP audit
- documentation/handover audit
- final product readiness decision

**Manual approval required:** final release decision.

---

# 12. Definition of Done

هیچ فازی صرفاً به دلیل نوشته‌شدن کد «تکمیل‌شده» محسوب نمی‌شود. بسته‌شدن هر فاز باید حداقل این موارد را پوشش دهد:

- implementation کامل
- migration و rollback در صورت نیاز
- typecheck
- lint
- automated tests متناسب با ریسک
- build موفق
- smoke test
- edge cases
- failure paths
- authorization/security review
- performance considerations
- documentation update
- known issues ثبت‌شده
- architecture/tree update در صورت تغییر
- roadmap status update

برای قابلیت‌های حساس، تست concurrency و idempotency نیز الزامی است.

---

# 13. Documentation Architecture

```text
ROAD-MAP.md
  → جهت فعلی پروژه، وضعیت فازها، بدهی‌ها، استانداردها و roadmap

README.md
  → معرفی پروژه، معماری فعلی، setup و وضعیت عملیاتی

PHASE-* documents
  → جزئیات تاریخی implementation و verification

Database migrations / SQL
  → تغییرات اجرایی schema

Runbooks
  → deployment، operations، recovery و maintenance
```

`ROAD-MAP.md` سند مرجع roadmap است. تاریخچه فازهای تکمیل‌شده حفظ می‌شود و یافته‌های جدید پس از audit باید در مراحل بعدی ثبت شوند.

---

# 14. معیار نهایی موفقیت

پروژه زمانی به نقطه نهایی می‌رسد که:

> **مسافر بتواند ایمن و شفاف سفر را از search تا post-trip مدیریت کند؛ اپراتور بتواند عملیات روزانه، ناوگان و مشتریان را کنترل کند؛ وضعیت رزرو و مالی قابل اعتماد و قابل تطبیق باشد؛ تغییرات حساس audit شوند؛ failureها قابل مشاهده و recovery باشند؛ و یک توسعه‌دهنده حرفه‌ای دیگر بتواند بدون reverse-engineering کامل سیستم را نگهداری و توسعه دهد.**
