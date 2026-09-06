"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BusFront, LayoutDashboard, ListFilter, LogOut, Menu, Route as RouteIcon, Ticket, Users, X } from "lucide-react"
import { dictionary } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { DashboardView } from "@/components/admin/dashboard-view"
import { BookingsTable } from "@/components/admin/bookings-table"
import { RouteManager } from "@/components/admin/route-manager"
import { BusManager } from "@/components/admin/bus-manager"
import { DriverManager } from "@/components/admin/driver-manager"
import { TripScheduler } from "@/components/admin/trip-scheduler"

// فاز ۵.۲: آخرین بازماندهٔ دادهٔ ساختگی (lib/admin-data.ts) هم حذف شد —
// dashboard و tab «رزروها» حالا هر دو مستقیماً از bookings/trips/payments
// واقعی Supabase می‌آیند (طبق درخواست صریح Zakir). گزارش‌گیری آماری
// عمیق‌تر (روند/مقایسهٔ دوره‌ای) هنوز فاز ۵.۳ است.
type Tab = "dashboard" | "trips" | "bookings" | "buses" | "routes" | "drivers"

export function AdminPanel() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const [tab, setTab] = useState<Tab>("dashboard")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

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
          {tab === "bookings" && <BookingsTable lang={lang} />}
          {tab === "buses" && <BusManager lang={lang} />}
          {tab === "drivers" && <DriverManager lang={lang} />}
          {tab === "routes" && <RouteManager lang={lang} />}
        </main>
      </div>
    </div>
  )
}
