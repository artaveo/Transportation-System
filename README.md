# Transportation System

## سامانه رزرو و مدیریت سفرهای بین‌شهری

A production-oriented full-stack booking and transport operations platform for intercity bus companies in Afghanistan.

Transportation System is designed around a real-world bus business workflow: route management, trip scheduling, large-bus seat inventory, passenger booking, payment states, booking tracking, customer accounts, loyalty, reporting, and operational administration.

The system is initially intended for a single transport company, while its domain model and service boundaries are structured so the platform can evolve toward a multi-company transport ecosystem without a foundational rewrite.

> **Current status — September 6, 2026:** Feature development has reached **Phase 5.8**. The system already has live Supabase-backed public booking flows and a real operational admin panel. Production hardening, payment gateway integration, SMS, advanced administrative controls, QA/security, observability, and final deployment remain on the roadmap.

---

## Product Scope

The platform is intentionally more than a marketing website. It combines two connected products:

### Passenger Platform

- Search trips by origin, destination, and date
- Real trip availability from Supabase
- Large-bus seat map and seat selection
- Atomic temporary seat holding to protect against double booking
- Passenger information collection
- Guest checkout without requiring an account
- Registered passenger accounts
- Loyalty tiers and referral architecture
- Booking confirmation and digital booking reference
- Booking lookup and tracking
- Contact information updates where permitted
- Booking cancellation/request-cancellation flows
- Online and offline payment states
- Responsive experience across phones, tablets, laptops, desktops, wide and ultra-wide monitors
- RTL/LTR-ready localization architecture

### Transport Operations Platform

- Operational dashboard
- Route CRUD
- Bus/fleet CRUD
- Driver CRUD
- Trip scheduling and editing
- Trip lifecycle management
- Boarding/departure/completion/cancellation states
- Operational timestamps for departure and arrival
- Booking management
- Offline-payment confirmation
- Booking cancellation actions
- Seat-number visibility inside booking management
- Revenue, passenger, occupancy, and trip reports
- CSV reporting/export
- Loyalty-tier administration
- Referral reward management
- Coupon management
- Responsive mobile admin navigation and wide-table handling

---

## Core Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                     │
│                 App Router + React + TypeScript             │
└──────────────────────────────┬──────────────────────────────┘
                               │
             ┌─────────────────┴─────────────────┐
             │                                   │
             ▼                                   ▼
┌────────────────────────┐          ┌────────────────────────┐
│   Public Experience    │          │    Admin Experience    │
│ Search / Booking /     │          │ Dashboard / Operations │
│ Tracking / Account     │          │ Reports / Loyalty      │
└────────────┬───────────┘          └────────────┬───────────┘
             │                                   │
             └─────────────────┬─────────────────┘
                               ▼
                    ┌────────────────────────┐
                    │ Server / Data Layer    │
                    │ Queries / Route        │
                    │ Handlers / Auth        │
                    └────────────┬───────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
       ┌──────────────────┐              ┌──────────────────┐
       │ Supabase Auth    │              │ PostgreSQL       │
       │ Session / Users  │              │ RLS / Functions  │
       └──────────────────┘              └──────────────────┘
```

### Architectural principles

- **Server-first sensitive operations:** sensitive booking operations are handled through server-side boundaries rather than exposing privileged credentials to the browser.
- **PostgreSQL as the source of truth:** business-critical state lives in the relational database rather than client-only state.
- **RLS-first authorization:** database policies are part of the security boundary, not merely a UI restriction.
- **Atomic booking operations:** seat holding and booking confirmation are protected against concurrent booking attempts using database-side operations.
- **Explicit domain boundaries:** routes, buses, drivers, trips, seats, bookings, passengers, payments, customers, loyalty, referrals, and coupons are modeled as business entities rather than one generic content structure.
- **Guest-first booking:** account creation is optional for passengers; booking remains possible through contact information and booking reference.
- **Progressive extensibility:** payment, SMS, loyalty, monitoring, and future multi-company capabilities are isolated as independent concerns.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Database | PostgreSQL through Supabase |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL RLS + role-aware server checks |
| Server layer | Next.js Route Handlers / Server Components |
| UI system | Tailwind CSS 4 + shadcn/ui |
| Package manager | pnpm |
| Date support | Jalali-aware application utilities |
| Deployment target | Vercel + Supabase |

---

## Data Model

The database is designed around the operational lifecycle of intercity transportation.

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
  │
  ├── bookings
  ├── wallet_transactions
  └── referrals

loyalty_tiers
coupons
coupon_redemptions
admins
```

The current database foundation includes sixteen business tables with Row Level Security enabled, including transportation inventory, customer, booking, payment, wallet/referral, coupon, and administrative concerns.

---

## Booking Integrity

A central engineering requirement is preventing two passengers from successfully purchasing the same seat.

The booking lifecycle is designed around explicit seat states and server/database-side decisions:

```text
AVAILABLE
   │
   ▼
HELD ───────────────► AVAILABLE
   │                  (hold expires / release)
   │
   ▼
BOOKED
```

The public UI may display availability, but the final decision is not trusted to the browser. Seat holding and booking confirmation are executed through server-side/database operations so concurrent requests can be handled safely.

---

## Authentication & Authorization

The platform separates two security domains:

### Passenger Accounts

- Optional registration
- Login/logout
- Profile completion
- Password recovery/reset flow
- Account-protected routes
- Booking history / loyalty direction

### Administrative Accounts

- Dedicated admin login
- Server-side session verification
- Admin membership validation
- Role-aware authorization foundation
- Planned limited-admin section permissions
- Database-level authorization through RLS

Administrative access is never intended to be implemented as a client-side boolean such as `isAdmin = true`. The server and database remain authoritative.

---

## Responsive & Multi-Device Design

Responsive behavior is treated as an architectural concern rather than a final CSS pass.

The current public interface contains explicit support for:

| Tier | Target |
|---|---|
| Mobile | < 768px |
| Tablet portrait | 768px+ |
| Desktop / tablet landscape | 1024px+ |
| Wide monitor | 1600px+ |
| Ultra-wide / very large display | 2560px+ |

The project includes a shared `ResponsivePhoto` primitive for adaptive image sources and an extended breakpoint scale for wide and ultra-wide screens.

Responsive work also covers:

- Mobile-first navigation behavior
- Large touch targets for critical controls
- Responsive booking/checkout actions
- Wide-table horizontal scrolling inside admin views
- Scroll affordances for horizontally constrained tables
- Responsive modal sizing
- RTL-aware spacing and directional behavior
- Device-specific image crops where visual composition benefits from them

The goal is not merely for the page to "fit" on a phone; the interaction model should remain usable at each device tier.

---

## Public Routes

Current public application areas include:

```text
/
/search
/routes
/track
/about
/contact
/faq
/luggage-policy
/terms
/privacy

/trips/[tripId]/seats
/trips/[tripId]/checkout
/trips/[tripId]/confirmation

/account
/account/login
/account/signup
/account/complete-profile
/account/forgot-password
/account/reset-password
```

Administrative areas include:

```text
/admin
/admin/login
```

The application uses thin App Router pages around reusable domain components, keeping server routing separate from the larger transport UI components.

---

## Current Admin Modules

The current admin experience contains real database-backed modules for:

### Dashboard

- Today vs. yesterday booking statistics
- Revenue statistics
- Average occupancy
- Active trips
- Recent bookings
- Upcoming trips

### Routes

- Create
- Edit
- Delete
- Active/inactive state
- Duplicate protection
- Foreign-key-aware deletion handling

### Buses

- Create
- Edit
- Delete
- Fleet code
- Plate number
- Bus type
- Capacity
- Amenities
- Operational status

### Drivers

- Create
- Edit
- Delete
- Phone normalization
- License information
- Active/inactive state

### Trips

- Create and edit scheduled trips
- Route assignment
- Bus assignment
- Driver assignment
- Service date
- Fixed-time or fill-and-go scheduling
- Price per seat
- Seat-layout/capacity generation
- Operational state
- Departure/arrival timestamps
- Quick operational actions
- Cancellation flow
- Delay indicator

### Bookings

- Real booking data
- Search by passenger/contact/reference
- Status filtering
- Seat numbers
- Payment status
- Online/offline payment method
- Offline payment confirmation
- Booking cancellation action
- Registration timestamp

### Reports

- Revenue
- Passenger count
- Occupancy
- Trip count
- Route-level reports
- Date-level reports
- Custom date range
- CSV export

### Loyalty

- Tier thresholds
- Tier discount percentages
- Tier activation
- Referral reward
- Coupon CRUD
- Coupon status/date/usage configuration

---

## Resilience & Failure Philosophy

The public booking platform distinguishes between:

- information that can safely be cached or displayed optimistically;
- data that must come from the current database state;
- operations that must be confirmed atomically by the server/database.

A transport system cannot treat a stale browser value as authoritative for seat availability, payment state, or booking ownership.

The roadmap therefore separates **fast user experience** from **authoritative transaction state**.

---

## Current Roadmap

### Completed

```text
Phase 1  — UI/UX foundation                              ✅
Phase 2  — Framework & technical architecture            ✅
Phase 3  — Supabase schema, RLS & admin auth             ✅
Phase 4  — Public booking platform                       ✅
Phase 4.5 — Passenger account & loyalty foundation       ✅
Phase 4.6 — Professional public responsive system       ✅
Phase 4.7 — Passenger password-recovery flow             ✅
Phase 5.1 — Route / Bus / Driver / Trip CRUD              ✅
Phase 5.2 — Booking & offline payment administration     ✅
Phase 5.3 — Reporting                                   ✅
Phase 5.4 — Loyalty administration                       ✅
Phase 5.5 — Professional admin responsive                ✅
Phase 5.6 — Phone normalization                          ✅
Phase 5.7 — Operational trip lifecycle                   ✅
Phase 5.8 — Booking-table operational columns             ✅
```

### Immediate remaining admin work

```text
Phase 5.9  — 34-province/city management
Phase 5.10 — Complete reporting-range and retention policy UX
Phase 5.11 — Advanced coupon rules
Phase 5.12 — Limited-admin management and section permissions
Phase 5.13 — Editable public-site content, addresses and images
```

### Production product integrations

```text
Phase 6 — HesabPay online payments
Phase 7 — SMS notification infrastructure and event integration
Phase 8 — Full bilingual delivery and RTL/LTR verification
```

### Production assurance

```text
Phase 9  — QA, security hardening, concurrency and performance testing
Phase 10 — Observability, error tracking, metrics, API/database monitoring and alerting
Phase 11 — Production deployment, backup/recovery, final documentation and production E2E
```

> Completing feature phases alone does not automatically make the platform production-ready. Payment, failure recovery, authorization, concurrency, accessibility, performance, monitoring, backup/recovery, and real production validation are explicitly treated as separate responsibilities in the roadmap.

---

## Production-Readiness Priorities

Before taking the platform as a finished enterprise product into live operation, the following areas must be proven rather than assumed:

1. **Payment correctness** — successful, failed, pending, duplicate, delayed, and refund scenarios.
2. **Concurrency correctness** — multiple users competing for the final seats.
3. **Authorization correctness** — customer isolation, limited-admin isolation, and RLS behavior.
4. **Failure recovery** — network loss, API timeout, provider outage, partial booking state, and expired holds.
5. **Security hardening** — rate limits, malicious input handling, XSS/injection review, secret isolation, and final RLS audit.
6. **Accessibility** — keyboard interaction, assistive technology, contrast, touch targets, and RTL/LTR behavior.
7. **Performance** — public search, seat maps, checkout, database query performance, and concurrent load.
8. **Observability** — structured server errors, operational metrics, bottleneck detection, and alerts.
9. **Backup & recovery** — documented data retention, backup strategy, restore procedures, and recovery testing.
10. **Operational handover** — documentation, account ownership, deployment knowledge, and client training.

---

## Engineering Standards

The long-term target is an application that is not only feature-complete but operationally trustworthy.

The engineering direction emphasizes:

- secure server/database boundaries
- least-privilege access
- explicit authorization
- relational integrity
- deterministic business rules
- auditable state transitions
- predictable failure behavior
- responsive interaction design
- accessible controls
- observable production behavior
- testable domain logic
- maintainable code organization
- documented deployment and recovery procedures

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

### Configure environment

Create `.env.local` with the project-specific Supabase and server integration variables required by the current environment.

Never commit service-role credentials, payment secrets, SMS credentials, or other privileged environment variables to source control.

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

The repository follows the Next.js App Router structure with domain-oriented components and Supabase infrastructure:

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
```

The repository also contains phase-specific SQL/README/change-log documentation and the project master prompt used as the engineering source of truth.

---

## Important Business Rules

### Guest checkout

Passengers are not forced to create an account before purchasing a ticket.

### Directional routes

An origin/destination pair is directional. For example, `Kabul → Herat` is a separate route definition from `Herat → Kabul`.

### Optional operational assignments

Bus and driver assignments can remain nullable where real-world operations do not know those details in advance.

### Seat state authority

Client-side seat rendering is informational. Final availability is decided through authoritative server/database operations.

### Loyalty

Passenger loyalty is intended to use configurable tier thresholds and rewards rather than permanently hardcoded business values.

### Third-party services

Payment, SMS, hosting, and other external services remain replaceable integration boundaries. Their availability must not be assumed to be identical to the availability of the core application.

---

## Project Direction

The long-term objective is to evolve this from a local custom booking website into a serious transport-business software platform suitable for professional intercity operators.

That means the finish line is not:

> "All screens are working."

The actual finish line is:

> **Passengers can book safely, operators can run the business from the system, financial and operational state is trustworthy, failures are observable and recoverable, and the platform can be maintained by another professional developer without reverse-engineering the entire project.**

---

## Status

**Active development — Phase 5.8 complete.**

The project is intentionally not labeled "production ready" until the remaining payment, messaging, QA/security, observability, backup/recovery, and final production validation stages have been completed and verified.

---

## License

Proprietary software. All rights reserved unless otherwise agreed in a separate license or software-development agreement with the client.

---

## Project Documentation

- `claudeproject-master-prompt.md` — master engineering roadmap and project decisions
- `CHANGELOG-session-fa.md` — recent implementation and debugging history
- `PHASE-*` documentation — phase-specific implementation notes and verification records
