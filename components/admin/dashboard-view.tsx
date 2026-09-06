"use client"

import { useEffect, useState } from "react"
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react"
import { dictionary, displayFont, localizeNumber, localizePercent, type Lang } from "@/lib/i18n"
import { cityLabel, formatTime } from "@/lib/booking-data"
import { addDaysIso, isoToday } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"
import { EmptyState, ErrorBanner, LoadingRows, ScrollFade } from "./admin-ui"

type CityRef = { name_en: string; name_fa: string }
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "refunded"

type RecentBooking = {
  id: string
  booking_reference: string
  contact_name: string
  seats_count: number
  total_amount: number
  status: BookingStatus
  trip: { service_date: string; route: { origin: CityRef | null; destination: CityRef | null } | null } | null
}

type UpcomingTrip = {
  id: string
  service_date: string
  departure_time: string | null
  route: { origin: CityRef | null; destination: CityRef | null } | null
  bus: { code: string } | null
  totalSeats: number
  bookedSeats: number
}

type DayStats = { bookings: number; revenue: number; avgOccupancy: number | null; activeTrips: number }
type Delta = { percent: number; isNew: boolean } | null

function unwrap<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function timeToMinutes(time: string | null): number | null {
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** رشد نسبی امروز در برابر دیروز. اگر دیروز صفر بود، درصد نسبی بی‌معنی
 * است (تقسیم بر صفر) — به‌جایش «جدید» نشان داده می‌شود (isNew). */
function relativeDelta(today: number, yesterday: number): Delta {
  if (yesterday === 0) {
    if (today === 0) return { percent: 0, isNew: false }
    return { percent: 100, isNew: true }
  }
  return { percent: Math.round(((today - yesterday) / yesterday) * 100), isNew: false }
}

/** برای اشغال ظرفیت، اختلاف نقطه‌ای درصد معنادارتر از رشد نسبی است
 * (مثلاً ۴۰٪ در برابر ۳۰٪ یعنی «۱۰ واحد بیشتر»، نه «۳۳٪ رشد»). */
function pointDelta(today: number | null, yesterday: number | null): Delta {
  if (today === null || yesterday === null) return null
  return { percent: Math.round(today - yesterday), isNew: false }
}

async function fetchDayStats(supabase: ReturnType<typeof createClient>, date: string): Promise<DayStats> {
  const [bookingsRes, tripsRes] = await Promise.all([
    supabase.from("bookings").select("total_amount").gte("created_at", `${date}T00:00:00`).lt("created_at", `${addDaysIso(date, 1)}T00:00:00`).neq("status", "cancelled"),
    supabase.from("trips").select("id, total_seats_snapshot, trip_seats(status)").eq("service_date", date).in("status", ["scheduled", "boarding"]),
  ])

  const bookings = bookingsRes.data ?? []
  const trips = (tripsRes.data ?? []) as any[]
  const occupancies = trips.map((tr) => {
    const seats = (tr.trip_seats ?? []) as { status: string }[]
    const booked = seats.filter((s) => s.status === "booked").length
    return tr.total_seats_snapshot > 0 ? (booked / tr.total_seats_snapshot) * 100 : 0
  })

  return {
    bookings: bookings.length,
    revenue: bookings.reduce((sum, b) => sum + Number(b.total_amount), 0),
    avgOccupancy: occupancies.length > 0 ? occupancies.reduce((a, b) => a + b, 0) / occupancies.length : null,
    activeTrips: trips.length,
  }
}

/**
 * جایگزین داشبورد ساختگی فاز ۵ — چهار کارت آمار حالا از bookings/trips
 * واقعی محاسبه می‌شوند، شامل درصد واقعیِ «نسبت به دیروز» (امروز در برابر
 * دیروز، هر دو از دیتابیس زنده — نه عدد ساختگی مثل قبل از فاز ۵). با حجم
 * دادهٔ فعلاً محدود، این درصد گاهی «جدید» یا ۰٪ نشان می‌دهد که طبیعی و
 * صحیح است، نه باگ. لیست‌های «رزروهای اخیر» و «سرویس‌های پیشِ‌رو» هم
 * مستقیماً از همان دو جدول واقعی می‌آیند.
 */
export function DashboardView({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [today, setToday] = useState<DayStats | null>(null)
  const [yesterday, setYesterday] = useState<DayStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)
      const todayIso = isoToday()
      const yesterdayIso = addDaysIso(todayIso, -1)

      try {
        const [todayStats, yesterdayStats, recentRes, upcomingRes] = await Promise.all([
          fetchDayStats(supabase, todayIso),
          fetchDayStats(supabase, yesterdayIso),
          supabase
            .from("bookings")
            .select(
              `id, booking_reference, contact_name, seats_count, total_amount, status,
               trip:trips(service_date,
                 route:routes(origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
                              destination:cities!routes_destination_city_id_fkey(name_en, name_fa)))`,
            )
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("trips")
            .select(
              `id, service_date, departure_time, total_seats_snapshot,
               route:routes(origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
                            destination:cities!routes_destination_city_id_fkey(name_en, name_fa)),
               bus:buses(code),
               trip_seats(status)`,
            )
            .gte("service_date", todayIso)
            .in("status", ["scheduled", "boarding"])
            .order("service_date", { ascending: true })
            .order("departure_time", { ascending: true, nullsFirst: false })
            .limit(6),
        ])

        if (recentRes.error || upcomingRes.error) {
          setLoadError(t.admin.manage.genericError)
          setLoading(false)
          return
        }

        setToday(todayStats)
        setYesterday(yesterdayStats)

        setRecentBookings(
          (recentRes.data ?? []).map((row: any) => {
            const trip = unwrap(row.trip)
            const route = trip ? unwrap(trip.route) : null
            return {
              ...row,
              trip: trip ? { service_date: trip.service_date, route: route ? { origin: unwrap(route.origin), destination: unwrap(route.destination) } : null } : null,
            }
          }),
        )

        setUpcomingTrips(
          (upcomingRes.data ?? []).map((row: any) => {
            const route = unwrap(row.route)
            const bus = unwrap(row.bus)
            const seats = (row.trip_seats ?? []) as { status: string }[]
            const bookedSeats = seats.filter((s) => s.status === "booked").length
            return {
              id: row.id,
              service_date: row.service_date,
              departure_time: row.departure_time,
              route: route ? { origin: unwrap(route.origin), destination: unwrap(route.destination) } : null,
              bus,
              totalSeats: row.total_seats_snapshot,
              bookedSeats,
            }
          }),
        )
      } catch {
        setLoadError(t.admin.manage.genericError)
      }

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <LoadingRows />
  if (loadError) return <ErrorBanner message={loadError} />

  const cards: { label: string; value: string; delta: Delta }[] = [
    {
      label: t.admin.stats.bookings,
      value: localizeNumber(today?.bookings ?? 0, lang),
      delta: relativeDelta(today?.bookings ?? 0, yesterday?.bookings ?? 0),
    },
    {
      label: t.admin.stats.revenue,
      value: `${localizeNumber(today?.revenue ?? 0, lang)} ${t.routes.currency}`,
      delta: relativeDelta(today?.revenue ?? 0, yesterday?.revenue ?? 0),
    },
    {
      label: t.admin.stats.occupancy,
      value: today?.avgOccupancy !== null && today?.avgOccupancy !== undefined ? localizePercent(Math.round(today.avgOccupancy), lang) : "—",
      delta: pointDelta(today?.avgOccupancy ?? null, yesterday?.avgOccupancy ?? null),
    },
    {
      label: t.admin.stats.trips,
      value: localizeNumber(today?.activeTrips ?? 0, lang),
      delta: relativeDelta(today?.activeTrips ?? 0, yesterday?.activeTrips ?? 0),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const positive = c.delta === null || c.delta.percent >= 0
          const TrendIcon = positive ? ArrowUpRight : ArrowDownRight
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`${displayFont(lang)} mt-2 text-2xl font-semibold text-foreground`}>{c.value}</p>
              {c.delta !== null && (
                <p className={`mt-1 flex items-center gap-1 text-xs ${positive ? "text-accent" : "text-destructive"}`}>
                  <TrendIcon className="size-3.5" />
                  {c.delta.isNew ? (lang === "fa" ? "جدید" : "New") : `${localizePercent(Math.abs(c.delta.percent), lang)} ${t.admin.vsYesterday}`}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t.admin.recentTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.admin.recentSub}</p>
        </div>
        <ScrollFade>
        <div className="overflow-x-auto">
          {recentBookings.length === 0 ? (
            <EmptyState message={t.admin.bookingsPanel.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.ref}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.passenger}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.route}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.date}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.seats}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.amount}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const route = b.trip?.route
                  return (
                    <tr key={b.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className={`${displayFont(lang)} whitespace-nowrap px-3 py-2.5 text-sm text-primary`} dir="ltr">
                        {b.booking_reference}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{b.contact_name}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {route?.origin && route?.destination ? (
                          <span className="flex items-center gap-1.5">
                            <span>{cityLabel(route.origin.name_en, lang)}</span>
                            <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                            <span>{cityLabel(route.destination.name_en, lang)}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                        {b.trip?.service_date ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{localizeNumber(b.seats_count, lang)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {localizeNumber(b.total_amount, lang)} {t.routes.currency}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === "confirmed" || b.status === "completed"
                              ? "bg-accent/15 text-accent"
                              : b.status === "pending"
                                ? "bg-primary/15 text-primary"
                                : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {t.admin.status[b.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        </ScrollFade>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t.admin.upcomingTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          {upcomingTrips.length === 0 ? (
            <EmptyState message={t.admin.scheduler.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.route}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.time}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.bus}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.occupancy}
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingTrips.map((trip) => {
                  const occupancy = trip.totalSeats > 0 ? Math.round((trip.bookedSeats / trip.totalSeats) * 100) : 0
                  const minutes = timeToMinutes(trip.departure_time)
                  return (
                    <tr key={trip.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {trip.route?.origin && trip.route?.destination ? (
                          <span className="flex items-center gap-1.5">
                            <span>{cityLabel(trip.route.origin.name_en, lang)}</span>
                            <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                            <span>{cityLabel(trip.route.destination.name_en, lang)}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                        {minutes !== null ? formatTime(minutes, lang) : t.admin.scheduler.fillAndGo}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                        {trip.bus?.code ?? t.admin.scheduler.noBusYet}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${occupancy}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{localizePercent(occupancy, lang)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
