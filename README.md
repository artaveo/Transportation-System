# Transportation System

## سامانه رزرو و مدیریت سفرهای بین‌شهری

A production-oriented full-stack transport platform for intercity bus companies in Afghanistan.

The project is no longer treated as a simple ticket-booking website. Its target architecture combines passenger commerce, transport operations, and business control in one system that can evolve toward a larger transport software platform.

> **Current status — September 6, 2026:** Phase **5.8** is complete and Phase **5.9** is the next planned implementation step. The public booking platform and database-backed operational admin are functional. Payment integration, messaging, stronger authorization, automated quality gates, observability, recovery, and broader transport-operations capabilities remain on the roadmap.

---

## Product Scope

### Passenger Platform

- Search intercity trips by origin, destination, and date
- Live trip and seat availability from Supabase
- Large-bus seat map and seat selection
- Server/database-controlled seat holding and booking confirmation
- Guest checkout
- Passenger accounts and profile management
- Booking confirmation and booking reference
- Booking lookup and tracking
- Cancellation/request-cancellation flows
- Loyalty and referral foundation
- Coupon support
- Online/offline payment states
- Responsive mobile, tablet, desktop, wide-screen, and ultra-wide experience
- RTL/LTR-ready localization foundation

### Transport Operations Platform

- Operational dashboard
- Route, bus, driver, and trip management
- Trip lifecycle management
- Seat inventory generation
- Booking administration
- Offline-payment confirmation
- Cancellation operations
- Passenger, revenue, occupancy, and trip reports
- CSV exports
- Loyalty and coupon administration
- Responsive administrative navigation and wide-table handling

### Long-term business platform

The roadmap extends the system toward:

- payments and financial reconciliation
- notifications and messaging
- branches, offices, and booking channels
- fleet management
- driver/workforce operations
- revenue and fare management
- customer support and service recovery
- real-time operations and GPS/ETA
- partner integrations
- multi-company/multi-tenant operation
- enterprise analytics
- offline operations
- disaster recovery and business continuity

---

## Core Architecture

```text
Passenger Web App ───────┐
                         │
Admin / Operations ──────┼──► Next.js Application
                         │        │
                         │        ├── Server / API boundaries
                         │        ├── Domain/Application logic
                         │        └── UI components
                         │
                         ▼
                 Supabase / PostgreSQL
                         │
              ┌──────────┴──────────┐
              │                     │
          Supabase Auth          RLS / DB
              │                     │
              └──────────┬──────────┘
                         ▼
                Business source of truth
```

### Architectural direction

- PostgreSQL is the authoritative source for business-critical state.
- The browser is never authoritative for seat ownership, payment status, or booking validity.
- Sensitive operations must cross explicit server-side authorization boundaries.
- Database constraints, transactions, and domain rules must protect business invariants rather than relying only on UI validation.
- Booking and inventory operations must be safe under concurrent requests.
- External providers such as payment and SMS remain replaceable integration boundaries.
- Cached or fallback content may improve perceived performance, but it must never masquerade as authoritative transaction state.
- Operational state changes should be explicit, auditable, and recoverable.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Database | PostgreSQL through Supabase |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL RLS + server-side checks |
| Server layer | Next.js Route Handlers / Server Components |
| UI system | Tailwind CSS 4 + shadcn/ui |
| Package manager | pnpm |
| Deployment target | Vercel + Supabase |

---

## Business Data Model

The current database foundation is centered on the transport lifecycle:

```text
cities
  │
  └── routes
        │
        └── trips
              │
              ├── trip_seats
              └── bookings
                    │
                    ├── booking_passengers
                    └── payments

buses ───────────────┘
drivers ──────────────┘

customers
  ├── bookings
  ├── wallet_transactions
  └── referrals

loyalty_tiers
coupons
coupon_redemptions
admins
```

The schema currently contains the core transportation, booking, customer, payment, loyalty, coupon, and administrative entities with Row Level Security enabled.

The long-term data model is expected to add stronger financial, operational, audit, branch, fleet, workforce, and integration domains rather than continuously extending a single generic model.

---

## Booking Integrity

Seat availability and booking ownership are transaction-sensitive business state.

```text
AVAILABLE
   │
   ▼
HELD ───────────────► AVAILABLE
   │                  (expired/released)
   ▼
BOOKED
```

The UI can display availability, but the authoritative decision is made by server/database operations. Future hardening must also ensure that missing or corrupted inventory is treated as an integrity problem rather than being converted into artificial "all seats available" behavior.

Trip creation and seat-inventory creation must ultimately be atomic so a trip cannot be left in a partially initialized state.

---

## Authentication & Authorization

### Passenger accounts

- Optional registration
- Login/logout
- Profile completion
- Password recovery/reset
- Account-protected areas
- Booking history and loyalty direction

### Administrative accounts

- Dedicated admin authentication
- Server-side session verification
- Admin membership checks
- RLS-backed protection
- Planned section-level permissions for limited administrators

Service-role access is restricted to server-only code. Each privileged operation still requires an explicit authorization boundary; possession of a service-role client is not itself an authorization decision.

---

## Responsive Design

Responsive behavior is treated as part of the product architecture.

| Tier | Target |
|---|---|
| Mobile | < 768px |
| Tablet | 768px+ |
| Desktop | 1024px+ |
| Wide | 1600px+ |
| Ultra-wide | 2560px+ |

The system includes shared responsive primitives, adaptive imagery, mobile navigation behavior, responsive booking flows, wide-table handling, RTL-aware layout behavior, and device-specific image composition where needed.

---

## Current Admin Capabilities

### Dashboard

- Booking statistics
- Revenue statistics
- Average occupancy
- Active/upcoming trips
- Recent bookings

### Routes

- CRUD
- Active/inactive state
- Duplicate protection
- Foreign-key-aware deletion handling

### Buses

- CRUD
- Fleet and plate information
- Capacity and bus type
- Amenities
- Operational status

### Drivers

- CRUD
- Phone normalization
- License information
- Active/inactive state

### Trips

- Create/edit scheduled trips
- Route, bus, and driver assignment
- Fixed-time or fill-and-go scheduling
- Price per seat
- Seat-layout/capacity generation
- Operational status
- Departure/arrival timestamps
- Delay/cancellation actions

### Bookings

- Real booking data
- Passenger/contact/reference search
- Status filtering
- Seat numbers
- Payment status and payment method
- Offline-payment confirmation
- Cancellation action

### Reports

- Revenue
- Passenger count
- Occupancy
- Trip count
- Route-level/date-level reports
- Custom date range
- CSV export

### Loyalty & Coupons

- Loyalty tier configuration
- Referral rewards
- Coupon CRUD
- Coupon status, date, and usage configuration

---

## Current Development Status

### Completed

```text
Phase 1   — UI/UX foundation                              ✅
Phase 2   — Framework & technical architecture            ✅
Phase 3   — Supabase schema, RLS & admin auth             ✅
Phase 4   — Public booking platform                       ✅
Phase 4.5 — Passenger account & loyalty foundation        ✅
Phase 4.6 — Professional public responsive system        ✅
Phase 4.7 — Passenger password recovery                   ✅
Phase 5.1 — Route / Bus / Driver / Trip CRUD              ✅
Phase 5.2 — Booking & offline payment administration      ✅
Phase 5.3 — Reporting                                     ✅
Phase 5.4 — Loyalty administration                        ✅
Phase 5.5 — Professional admin responsive                 ✅
Phase 5.6 — Phone normalization                           ✅
Phase 5.7 — Operational trip lifecycle                    ✅
Phase 5.8 — Booking-table operational columns             ✅
```

### Next implementation steps

```text
Phase 5.9  — Province/city management
Phase 5.10 — Reporting range and retention UX
Phase 5.11 — Advanced coupon rules
Phase 5.12 — Limited-admin management and permissions
Phase 5.13 — Public-site CMS lite
```

### Production product work

```text
Phase 6  — HesabPay and payment transaction core
Phase 7  — SMS notification infrastructure
Phase 8  — Full bilingual / RTL-LTR delivery
Phase 9  — QA, security, concurrency and performance
Phase 10 — Observability and operational monitoring
Phase 11 — Production deployment, recovery and handover
```

The roadmap then continues into the larger transport-operations platform, including application architecture hardening, audit/business invariants, control center, fleet, workforce, revenue management, finance, CRM/support, booking changes, baggage, real-time operations, partner APIs, multi-company operation, analytics, offline architecture, resilience, security governance, international readiness, and final product audit.

---

## Architecture Audit Summary

A September 2026 architecture audit confirmed that the project has a strong product and database foundation but is not yet a fully hardened enterprise transport platform.

### Strong areas

- booking and seat-state foundation
- Supabase/PostgreSQL model
- RLS foundation
- operational admin functionality
- responsive public/admin UI
- real trip lifecycle handling
- loyalty/coupon foundation

### Historical architectural debt

The audit also identified issues that must not be mistaken for missing features. These are tracked in `ROAD-MAP.md` as historical debt added after the current phase history, including:

- insufficiently explicit domain/application boundaries in some admin flows
- client-side data mutations that should move behind application/domain services
- manual validation that should be centralized
- missing rate limiting/abuse protection for public booking lookup
- separate trip and seat inserts without one atomic transaction
- unsafe fallback behavior when expected seat inventory is missing
- incomplete service-role authorization boundaries
- lack of comprehensive audit trail
- business invariants not yet formalized across database/domain/tests
- missing Money/Ledger/Reconciliation domain
- lack of seat-layout versioning for historical consistency
- missing branch/office/agent and booking-channel model
- insufficient offline-operations architecture
- incomplete CI/typecheck/lint/test/security release gates
- incomplete production observability and disaster-recovery discipline

These debts are intentionally tracked after Phase 5.8 so the completed phase history is preserved.

---

## Standards & Quality Bar

The long-term engineering target includes:

- least-privilege authorization
- centralized input validation
- database-enforced invariants
- atomic transactional business operations
- explicit state machines for critical workflows
- auditability of operational changes
- idempotent external operations
- rate limiting and abuse protection
- accessible and responsive interfaces
- automated typecheck/lint/test/build gates
- structured logging and monitoring
- documented backup and restore procedures
- deterministic deployment and rollback procedures
- privacy and security controls appropriate for a real transport business

Feature completion alone does not define production readiness.

---

## Development

### Requirements

- Node.js LTS
- pnpm
- Supabase project

### Install

```bash
pnpm install
```

### Environment

Create `.env.local` with the variables required by the current Supabase and server integrations.

Never commit service-role keys, payment secrets, SMS credentials, or other privileged credentials.

### Run locally

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Start production build

```bash
pnpm start
```

---

## Repository Structure

```text
app/
  api/
  account/
  admin/
  routes/
  search/
  track/
  trips/
  ...

components/
  admin/
  transport/
  ui/

lib/
  supabase/
  booking-data.ts
  date-utils.ts
  i18n.ts
  lang-context.tsx
  phone-utils.ts
  ...

public/
  images/

middleware.ts
next.config.mjs
package.json

ROAD-MAP.md
README.md
phase-* documentation
```

---

## Documentation Architecture

The repository separates current direction from historical implementation detail:

| Document | Purpose |
|---|---|
| `ROAD-MAP.md` | Canonical roadmap, architecture direction, phase status, debts, standards and long-term product plan |
| `README.md` | Current project overview, architecture summary, setup and operational scope |
| `PHASE-*` documents | Historical implementation notes and verification records |
| Database migrations / SQL | Executable schema changes |
| Runbooks | Deployment, operations, recovery and maintenance procedures |

`ROAD-MAP.md` is the canonical project roadmap. The completed phase history must remain intact. New findings discovered after the historical phase sequence are recorded as historical debt rather than inserted into an already-completed phase.

---

## Important Business Rules

### Guest checkout

Passengers are not required to create an account before purchasing a ticket.

### Directional routes

An origin/destination pair is directional. `Kabul → Herat` is a different route from `Herat → Kabul`.

### Optional operational assignments

Bus and driver assignment may remain nullable where operations do not know those details in advance.

### Seat authority

Client rendering is informational. Final availability and ownership are decided by authoritative server/database operations.

### Loyalty

Tier thresholds and rewards should remain configurable rather than being permanently hardcoded into the UI.

### Third-party services

Payment, SMS, hosting, and future external integrations must remain replaceable boundaries. External outages must not corrupt core booking state.

---

## Project Direction

The product target is not simply to finish all screens.

The intended finish line is:

> **Passengers can book safely, transport operators can run day-to-day operations from the system, financial and operational state is trustworthy, failures are observable and recoverable, and another professional developer can maintain the platform without reverse-engineering the entire project.**

---

## Status

**Active development — Phase 5.8 complete. Phase 5.9 next.**

The project should not be labeled fully production-ready until the remaining transaction, security, QA, observability, recovery, and production-validation requirements have been implemented and verified.

---

## License

Proprietary software. All rights reserved unless otherwise agreed in a separate license or software-development agreement with the client.
