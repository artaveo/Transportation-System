"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  BusFront,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  Route as RouteIcon,
  Search,
  Ticket,
  Users,
  X,
} from "lucide-react"
import { dictionary, displayFont, localizeNumber, localizePercent } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { cityLabel, formatTime } from "@/lib/booking-data"
import { getAdminBookings, getAdminStats, getAdminTrips, type AdminBooking, type BookingStatus } from "@/lib/admin-data"
import { createClient } from "@/lib/supabase/client"
import { RouteManager } from "@/components/admin/route-manager"
import { BusManager } from "@/components/admin/bus-manager"
import { DriverManager } from "@/components/admin/driver-manager"
import { TripScheduler } from "@/components/admin/trip-scheduler"

// فاز ۵.۱: تب‌های routes/buses/drivers/trips حالا مدیرهای CRUD واقعی‌اند
// (components/admin/*)، نه جدول‌های خواندنیِ دادهٔ ساختگی. dashboard/bookings
// عمداً هنوز روی lib/admin-data.ts (ساختگی) مانده‌اند — به ترتیب فاز ۵.۲
// (رزروها) و ۵.۳ (گزارش‌گیری) به دادهٔ واقعی وصل می‌شوند.
type Tab = "dashboard" | "trips" | "bookings" | "buses" | "routes" | "drivers"

export function AdminPanel() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const [tab, setTab] = useState<Tab>("dashboard")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

  // فاز ۳.۳ — خروج واقعی از Supabase Auth (قبلاً فقط لینک تزئینی به "/" بود).
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", label: t.admin.nav.dashboard, icon: LayoutDashboard },
    { key: "trips", label: t.admin.nav.trips, icon: Ticket },
    { key: "bookings", label: t.admin.nav.bookings, icon: ListFilter },
    { key: "buses", label: t.admin.nav.buses, icon: BusFront },
    { key: "drivers", label: t.admin.nav.drivers, icon: Users },
    { key: "routes", label: t.admin.nav.routes, icon: RouteIcon },
  ]

  const NavList = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = tab === item.key
        return (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key)
              setMobileNavOpen(false)
            }}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-e border-sidebar-border bg-sidebar py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BusFront className="size-4" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">{t.brand}</p>
            <p className="text-xs text-sidebar-foreground/60">{t.admin.title}</p>
          </div>
        </div>
        {NavList}
        <div className="mt-auto px-3 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
            {t.admin.exit}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative flex w-64 flex-col border-e border-sidebar-border bg-sidebar py-5">
            <div className="mb-6 flex items-center justify-between px-4">
              <span className="text-sm font-semibold text-sidebar-foreground">{t.admin.title}</span>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close" className="text-sidebar-foreground/70">
                <X className="size-5" />
              </button>
            </div>
            {NavList}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-card px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="text-foreground lg:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">{t.admin.title}</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">{t.admin.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:flex"
          >
            <LogOut className="size-3.5" />
            {t.admin.exit}
          </button>
        </header>

        <main className="flex-1 overflow-x-auto p-4 sm:p-6">
          {tab === "dashboard" && <DashboardView lang={lang} />}
          {tab === "trips" && <TripScheduler lang={lang} />}
          {tab === "bookings" && <BookingsView lang={lang} />}
          {tab === "buses" && <BusManager lang={lang} />}
          {tab === "drivers" && <DriverManager lang={lang} />}
          {tab === "routes" && <RouteManager lang={lang} />}
        </main>
      </div>
    </div>
  )
}

// ---------- Shared bits ----------

function StatusBadge({ status, lang }: { status: BookingStatus; lang: "fa" | "en" }) {
  const t = dictionary[lang]
  const styles: Record<BookingStatus, string> = {
    confirmed: "bg-accent/15 text-accent",
    pending: "bg-primary/15 text-primary",
    cancelled: "bg-destructive/15 text-destructive",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{t.admin.status[status]}</span>
  )
}

function relativeDay(offset: number, lang: "fa" | "en"): string {
  if (offset === 0) return lang === "fa" ? "امروز" : "Today"
  if (offset === 1) return lang === "fa" ? "دیروز" : "Yesterday"
  return lang === "fa" ? `${localizeNumber(offset, lang)} روز پیش` : `${offset} days ago`
}

function Th({
  children,
  className = "",
  dir,
}: {
  children: React.ReactNode
  className?: string
  dir?: "ltr" | "rtl"
}) {
  return (
    <th dir={dir} className={`whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground ${className}`}>
      {children}
    </th>
  )
}

function Td({
  children,
  className = "",
  dir,
}: {
  children: React.ReactNode
  className?: string
  dir?: "ltr" | "rtl"
}) {
  return (
    <td dir={dir} className={`whitespace-nowrap px-3 py-2.5 text-sm text-foreground ${className}`}>
      {children}
    </td>
  )
}

// ---------- Dashboard ----------

function DashboardView({ lang }: { lang: "fa" | "en" }) {
  const t = dictionary[lang]
  const stats = useMemo(() => getAdminStats(), [])
  const bookings = useMemo(() => getAdminBookings(8), [])
  const trips = useMemo(() => getAdminTrips(6), [])

  const cards: { label: string; value: string; delta: number }[] = [
    { label: t.admin.stats.bookings, value: localizeNumber(stats.bookingsToday, lang), delta: stats.bookingsDelta },
    {
      label: t.admin.stats.revenue,
      value: `${localizeNumber(stats.revenueToday, lang)} ${t.routes.currency}`,
      delta: stats.revenueDelta,
    },
    { label: t.admin.stats.occupancy, value: localizePercent(stats.avgOccupancy, lang), delta: stats.occupancyDelta },
    { label: t.admin.stats.trips, value: localizeNumber(stats.activeTrips, lang), delta: stats.tripsDelta },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const positive = c.delta >= 0
          const TrendIcon = positive ? ArrowUpRight : ArrowDownRight
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`${displayFont(lang)} mt-2 text-2xl font-semibold text-foreground`}>{c.value}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs ${positive ? "text-accent" : "text-destructive"}`}>
                <TrendIcon className="size-3.5" />
                {localizePercent(Math.abs(c.delta), lang)} {t.admin.vsYesterday}
              </p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t.admin.recentTitle}</h2>
            <p className="text-xs text-muted-foreground">{t.admin.recentSub}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                <Th>{t.admin.cols.ref}</Th>
                <Th>{t.admin.cols.passenger}</Th>
                <Th>{t.admin.cols.route}</Th>
                <Th>{t.admin.cols.date}</Th>
                <Th>{t.admin.cols.seats}</Th>
                <Th>{t.admin.cols.amount}</Th>
                <Th>{t.admin.cols.status}</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <BookingRow key={b.ref} b={b} lang={lang} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t.admin.upcomingTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                <Th>{t.admin.cols.route}</Th>
                <Th>{t.admin.cols.time}</Th>
                <Th>{t.admin.cols.bus}</Th>
                <Th>{t.admin.cols.occupancy}</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <span>{cityLabel(trip.fromEn, lang)}</span>
                      <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{cityLabel(trip.toEn, lang)}</span>
                    </span>
                  </Td>
                  <Td dir="ltr">{formatTime(trip.departMinutes, lang)}</Td>
                  <Td dir="ltr">{trip.bus}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${trip.occupancy}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{localizePercent(trip.occupancy, lang)}</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BookingRow({ b, lang }: { b: AdminBooking; lang: "fa" | "en" }) {
  const t = dictionary[lang]
  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
      <Td className={`${displayFont(lang)} text-primary`} dir="ltr">
        {b.ref}
      </Td>
      <Td>{b.passenger}</Td>
      <Td>
        <span className="flex items-center gap-1.5">
          <span>{cityLabel(b.fromEn, lang)}</span>
          <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{cityLabel(b.toEn, lang)}</span>
        </span>
      </Td>
      <Td className="text-muted-foreground">{relativeDay(b.dayOffset, lang)}</Td>
      <Td>{localizeNumber(b.seats, lang)}</Td>
      <Td>
        {localizeNumber(b.amount, lang)} {t.routes.currency}
      </Td>
      <Td>
        <StatusBadge status={b.status} lang={lang} />
      </Td>
    </tr>
  )
}

// ---------- Bookings ----------

function BookingsView({ lang }: { lang: "fa" | "en" }) {
  const t = dictionary[lang]
  const all = useMemo(() => getAdminBookings(40), [])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<BookingStatus | "all">("all")

  const filtered = all.filter((b) => {
    if (status !== "all" && b.status !== status) return false
    if (query.trim() && !b.passenger.includes(query.trim()) && !b.ref.toLowerCase().includes(query.trim().toLowerCase()))
      return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin.searchPh}
            className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">{t.admin.allStatuses}</option>
          <option value="confirmed">{t.admin.status.confirmed}</option>
          <option value="pending">{t.admin.status.pending}</option>
          <option value="cancelled">{t.admin.status.cancelled}</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                <Th>{t.admin.cols.ref}</Th>
                <Th>{t.admin.cols.passenger}</Th>
                <Th>{t.admin.cols.route}</Th>
                <Th>{t.admin.cols.date}</Th>
                <Th>{t.admin.cols.seats}</Th>
                <Th>{t.admin.cols.amount}</Th>
                <Th>{t.admin.cols.status}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <BookingRow key={b.ref} b={b} lang={lang} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t.search.noResults}</p>
          )}
        </div>
      </div>
    </div>
  )
}

