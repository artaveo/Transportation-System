"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, Download } from "lucide-react"
import { dictionary, displayFont, localizeNumber, localizePercent, type Lang } from "@/lib/i18n"
import { cityLabel } from "@/lib/booking-data"
import { addDaysIso, isoToday } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"
import { EmptyState, ErrorBanner, LoadingRows, ScrollFade, inputClass, labelClass, secondaryBtnClass } from "./admin-ui"

type CityRef = { name_en: string; name_fa: string }
type RouteOption = { id: string; origin: CityRef | null; destination: CityRef | null }
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "refunded"

type TripRow = {
  id: string
  service_date: string
  total_seats_snapshot: number
  route_id: string
  route: RouteOption | null
  trip_seats: { status: string }[]
  bookings: { seats_count: number; total_amount: number; status: BookingStatus }[]
}

type Bucket = {
  key: string
  revenue: number
  passengers: number
  bookedSeats: number
  totalSeats: number
  tripsCount: number
}

type Preset = "7d" | "30d" | "90d" | "custom"

function unwrap<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function occupancyOf(bucket: { bookedSeats: number; totalSeats: number }): number | null {
  return bucket.totalSeats > 0 ? (bucket.bookedSeats / bucket.totalSeats) * 100 : null
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")
  // BOM تا اکسل متن دری/یونیکد را درست (نه به‌صورت رمزینه) نمایش بدهد.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * فاز ۵.۳ — گزارش‌گیری آماری. طبق بخش ۳.۳ پرامپت مادر: گزارش درآمد، تعداد
 * مسافر، و نرخ اشغال صندلی به تفکیک مسیر/تاریخ. محور اصلی «تاریخ سفر»
 * (trips.service_date) است، نه تاریخ ثبت رزرو — چون گزارش عملکرد واقعی
 * شبکه (کدام مسیر/کدام روز چقدر درآمد داشته)، نه فعالیت لحظه‌ای رزرو
 * (که همان چیزی است که DashboardView از قبل با created_at پوشش می‌دهد).
 *
 * تعریف «درآمد قابل‌محاسبه»: هر رزروِ غیرلغوشده (pending/confirmed/
 * completed/refunded) — دقیقاً همان قاعدهٔ DashboardView.fetchDayStats
 * (فاز ۵.۲)، تا دو گزارش مختلف پنل عدد متفاوتی برای «امروز» ندهند.
 * اشغال صندلی از خودِ trip_seats.status='booked' خوانده می‌شود (وضعیت
 * واقعی صندلی، مستقل از وضعیت پرداخت) — همان منطق DashboardView.
 *
 * محدودیت شناخته‌شده (مستند، نه باگ): اگر یک ادمین محدود دسترسی بخش
 * 'bookings' یا 'routes' نداشته باشد، RLS ردیف‌های مرتبط را بی‌صدا فیلتر
 * می‌کند — عدد درآمد صفر یا نام مسیر «—» دیده می‌شود. این دقیقاً همان
 * رفتاری است که BookingsTable/DashboardView هم دارند؛ رفع آن (در صورت نیاز)
 * باید صریح در بخش ۵.۴ یا یک فاز RLS مجزا درخواست شود.
 */
export function ReportsDashboard({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const tr = t.admin.reportsPanel
  const supabase = createClient()

  const today = useMemo(() => isoToday(), [])
  const [preset, setPreset] = useState<Preset>("30d")
  const [from, setFrom] = useState(() => addDaysIso(today, -29))
  const [to, setTo] = useState(today)
  const [routeFilter, setRouteFilter] = useState<string>("all")

  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([])
  const [trips, setTrips] = useState<TripRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  function applyPreset(p: Exclude<Preset, "custom">) {
    const days = p === "7d" ? 6 : p === "30d" ? 29 : 89
    setFrom(addDaysIso(today, -days))
    setTo(today)
    setPreset(p)
  }

  const rangeValid = from <= to

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      if (!rangeValid) {
        setLoading(false)
        return
      }

      try {
        const [routesRes, tripsRes] = await Promise.all([
          routeOptions.length > 0
            ? Promise.resolve({ data: routeOptions, error: null } as const)
            : supabase
                .from("routes")
                .select(
                  `id,
                   origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
                   destination:cities!routes_destination_city_id_fkey(name_en, name_fa)`,
                )
                .order("created_at", { ascending: false }),
          (() => {
            let q = supabase
              .from("trips")
              .select(
                `id, service_date, total_seats_snapshot, route_id,
                 route:routes(id,
                   origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
                   destination:cities!routes_destination_city_id_fkey(name_en, name_fa)),
                 trip_seats(status),
                 bookings(seats_count, total_amount, status)`,
              )
              .gte("service_date", from)
              .lte("service_date", to)
              .neq("status", "cancelled")
              .order("service_date", { ascending: true })
            if (routeFilter !== "all") q = q.eq("route_id", routeFilter)
            return q
          })(),
        ])

        if (cancelled) return

        if (routesRes.error || tripsRes.error) {
          setLoadError(t.admin.manage.genericError)
          setLoading(false)
          return
        }

        if (routeOptions.length === 0) {
          setRouteOptions(
            ((routesRes.data ?? []) as any[]).map((r) => ({
              id: r.id,
              origin: unwrap(r.origin),
              destination: unwrap(r.destination),
            })),
          )
        }

        setTrips(
          ((tripsRes.data ?? []) as any[]).map((row) => {
            const routeObj = unwrap(row.route)
            return {
              id: row.id,
              service_date: row.service_date,
              total_seats_snapshot: row.total_seats_snapshot,
              route_id: row.route_id,
              route: routeObj
                ? { id: routeObj.id ?? row.route_id, origin: unwrap(routeObj.origin), destination: unwrap(routeObj.destination) }
                : null,
              trip_seats: (row.trip_seats ?? []) as { status: string }[],
              bookings: (row.bookings ?? []) as { seats_count: number; total_amount: number; status: BookingStatus }[],
            }
          }),
        )
      } catch {
        if (!cancelled) setLoadError(t.admin.manage.genericError)
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, routeFilter])

  const { totals, byRoute, byDate } = useMemo(() => {
    const routeMap = new Map<string, Bucket & { route: RouteOption | null }>()
    const dateMap = new Map<string, Bucket>()
    let totalRevenue = 0
    let totalPassengers = 0
    let totalBooked = 0
    let totalSeats = 0

    for (const trip of trips) {
      const bookedSeats = trip.trip_seats.filter((s) => s.status === "booked").length
      const activeBookings = trip.bookings.filter((b) => b.status !== "cancelled")
      const revenue = activeBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
      const passengers = activeBookings.reduce((sum, b) => sum + Number(b.seats_count), 0)

      totalRevenue += revenue
      totalPassengers += passengers
      totalBooked += bookedSeats
      totalSeats += trip.total_seats_snapshot

      const rKey = trip.route_id
      const rEntry =
        routeMap.get(rKey) ??
        ({ key: rKey, route: trip.route, revenue: 0, passengers: 0, bookedSeats: 0, totalSeats: 0, tripsCount: 0 } as Bucket & {
          route: RouteOption | null
        })
      rEntry.revenue += revenue
      rEntry.passengers += passengers
      rEntry.bookedSeats += bookedSeats
      rEntry.totalSeats += trip.total_seats_snapshot
      rEntry.tripsCount += 1
      routeMap.set(rKey, rEntry)

      const dKey = trip.service_date
      const dEntry =
        dateMap.get(dKey) ?? { key: dKey, revenue: 0, passengers: 0, bookedSeats: 0, totalSeats: 0, tripsCount: 0 }
      dEntry.revenue += revenue
      dEntry.passengers += passengers
      dEntry.bookedSeats += bookedSeats
      dEntry.totalSeats += trip.total_seats_snapshot
      dEntry.tripsCount += 1
      dateMap.set(dKey, dEntry)
    }

    return {
      totals: { revenue: totalRevenue, passengers: totalPassengers, bookedSeats: totalBooked, totalSeats, tripsCount: trips.length },
      byRoute: Array.from(routeMap.values()).sort((a, b) => b.revenue - a.revenue),
      byDate: Array.from(dateMap.values()).sort((a, b) => (a.key < b.key ? -1 : 1)),
    }
  }, [trips])

  function routeLabel(route: RouteOption | null): string {
    if (!route?.origin || !route?.destination) return "—"
    return `${cityLabel(route.origin.name_en, lang)} ↔ ${cityLabel(route.destination.name_en, lang)}`
  }

  function exportByRoute() {
    const header = [tr.colRoute, tr.colTrips, tr.colPassengers, tr.colRevenue, tr.colOccupancy]
    const rows = byRoute.map((b) => {
      const occ = occupancyOf(b)
      return [
        routeLabel(b.route),
        b.tripsCount,
        b.passengers,
        b.revenue,
        occ !== null ? `${Math.round(occ)}%` : "—",
      ]
    })
    downloadCsv(`shabraw-report-by-route_${from}_${to}.csv`, [header, ...rows])
  }

  function exportByDate() {
    const header = [tr.colDate, tr.colTrips, tr.colPassengers, tr.colRevenue, tr.colOccupancy]
    const rows = byDate.map((b) => {
      const occ = occupancyOf(b)
      return [b.key, b.tripsCount, b.passengers, b.revenue, occ !== null ? `${Math.round(occ)}%` : "—"]
    })
    downloadCsv(`shabraw-report-by-date_${from}_${to}.csv`, [header, ...rows])
  }

  const summaryCards = [
    { label: tr.totalRevenue, value: `${localizeNumber(totals.revenue, lang)} ${t.routes.currency}` },
    { label: tr.totalPassengers, value: localizeNumber(totals.passengers, lang) },
    {
      label: tr.avgOccupancy,
      value: totals.totalSeats > 0 ? localizePercent(Math.round((totals.bookedSeats / totals.totalSeats) * 100), lang) : "—",
    },
    { label: tr.totalTrips, value: localizeNumber(totals.tripsCount, lang) },
  ]

  const presetBtnClass = (p: Preset) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
      preset === p
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
    }`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">{tr.title}</h2>
        <p className="text-xs text-muted-foreground">{tr.subtitle}</p>
      </div>

      {/* فیلترها */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={presetBtnClass("7d")} onClick={() => applyPreset("7d")}>
            {tr.last7}
          </button>
          <button type="button" className={presetBtnClass("30d")} onClick={() => applyPreset("30d")}>
            {tr.last30}
          </button>
          <button type="button" className={presetBtnClass("90d")} onClick={() => applyPreset("90d")}>
            {tr.last90}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>{tr.from}</label>
            <input
              type="date"
              dir="ltr"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value)
                setPreset("custom")
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{tr.to}</label>
            <input
              type="date"
              dir="ltr"
              value={to}
              min={from}
              max={today}
              onChange={(e) => {
                setTo(e.target.value)
                setPreset("custom")
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{tr.routeFilter}</label>
            <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className={inputClass}>
              <option value="all">{tr.allRoutes}</option>
              {routeOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {routeLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!rangeValid && <ErrorBanner message={tr.invalidRange} />}
      </div>

      {loading ? (
        <LoadingRows />
      ) : loadError ? (
        <ErrorBanner message={loadError} />
      ) : (
        <>
          {/* کارت‌های خلاصه */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`${displayFont(lang)} mt-2 text-2xl font-semibold text-foreground`}>{c.value}</p>
              </div>
            ))}
          </div>

          {trips.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState message={tr.empty} />
            </div>
          ) : (
            <>
              {/* تفکیک بر اساس مسیر */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{tr.byRouteTitle}</h3>
                  <button type="button" onClick={exportByRoute} className={secondaryBtnClass}>
                    <Download className="size-3.5" />
                    {tr.exportCsv}
                  </button>
                </div>
                <ScrollFade>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tr.colRoute}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tr.colTrips}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colPassengers}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colRevenue}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colOccupancy}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byRoute.map((b) => {
                        const occ = occupancyOf(b)
                        return (
                          <tr key={b.key} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                              <span className="flex items-center gap-1.5">
                                {b.route?.origin && b.route?.destination ? (
                                  <>
                                    <span>{cityLabel(b.route.origin.name_en, lang)}</span>
                                    <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span>{cityLabel(b.route.destination.name_en, lang)}</span>
                                  </>
                                ) : (
                                  "—"
                                )}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{localizeNumber(b.tripsCount, lang)}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{localizeNumber(b.passengers, lang)}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                              {localizeNumber(b.revenue, lang)} {t.routes.currency}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${occ ?? 0}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {occ !== null ? localizePercent(Math.round(occ), lang) : "—"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                </ScrollFade>
              </div>

              {/* تفکیک بر اساس تاریخ */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{tr.byDateTitle}</h3>
                  <button type="button" onClick={exportByDate} className={secondaryBtnClass}>
                    <Download className="size-3.5" />
                    {tr.exportCsv}
                  </button>
                </div>
                <ScrollFade>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tr.colDate}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tr.colTrips}</th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colPassengers}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colRevenue}
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                          {tr.colOccupancy}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDate.map((b) => {
                        const occ = occupancyOf(b)
                        return (
                          <tr key={b.key} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                              {b.key}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{localizeNumber(b.tripsCount, lang)}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{localizeNumber(b.passengers, lang)}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                              {localizeNumber(b.revenue, lang)} {t.routes.currency}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${occ ?? 0}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {occ !== null ? localizePercent(Math.round(occ), lang) : "—"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                </ScrollFade>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
