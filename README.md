# Transportation System

Online bus ticket booking platform for intercity travel in Afghanistan, built for a real transport company client (a market with players like Ahmad Shah Baba, Abdali, and Mirwais Nika).

The fleet consists of large intercity buses (40–60 seats), operating at the same scale as platforms like FlixBus — not the small sedans typical of local ride services. This shapes the seat-map, capacity, and database design throughout the project.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router) + TypeScript
- **Backend / Database:** [Supabase](https://supabase.com) — Postgres, Row Level Security, Auth
- **Styling:** Tailwind CSS + shadcn/ui
- **Package Manager:** pnpm

## Key Features

- 🌐 **Fully bilingual** — Dari (دری) and English, with complete RTL/LTR support built into the base architecture (not bolted on later)
- 🎫 **Guest checkout** — book with just a phone number and booking reference, no account required, matching global standards (FlixBus, Busbud, Omio)
- 🪑 **Real seat-map booking** — large-bus seat selection with atomic seat locking to prevent double-booking
- 💳 **Dual payment methods** — online payment (HesabPay) and offline/cash payment with manual admin confirmation
- 🏆 **Customer loyalty program** — tiered membership (Bronze/Silver/Gold) with lifetime trip tracking, wallet/cashback, and referral rewards
- 🔐 **Two-tier admin roles** — full admin vs. department-scoped limited admin, enforced at the database level via Postgres RLS policies
- 🔒 **Row Level Security everywhere** — every table has RLS policies; sensitive operations (booking, payment) run server-side through Route Handlers with the service role, never exposed to the browser

## Project Status

🚧 **Actively in development.** Currently in the database/backend foundation phase (Supabase schema, RLS policies, authentication) before public site and admin panel features are wired to live data.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

Built for a real client as part of ongoing freelance/contract work.
