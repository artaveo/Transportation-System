"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { dictionary, localizeNumber, type Lang } from "@/lib/i18n"
import { DEFAULT_BUS_CAPACITY, type BusType } from "@/lib/booking-data"
import { isoToday } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"
import { DatePicker } from "@/components/transport/date-picker"
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingRows,
  Modal,
  ScrollFade,
  iconBtnClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  isForeignKeyViolation,
} from "./admin-ui"

type TripStatus = "scheduled" | "boarding" | "departed" | "completed" | "cancelled"
type ScheduleType = "fixed_time" | "fill_and_go"

type CityRef = { name_en: string; name_fa: string }
type RouteOption = {
  id: string
  is_active: boolean
  origin: CityRef | null
  destination: CityRef | null
}
type BusOption = { id: string; code: string; bus_type: BusType; total_seats: number }
type DriverOption = { id: string; full_name: string }

type TripRow = {
  id: string
  route_id: string
  bus_id: string | null
  driver_id: string | null
  service_date: string
  departure_time: string | null
  schedule_type: ScheduleType
  price_per_seat: number
  total_seats_snapshot: number
  status: TripStatus
  route: RouteOption | null
  bus: BusOption | null
  driver: DriverOption | null
}

type FormState = {
  routeId: string
  busId: string
  driverId: string
  serviceDate: string
  scheduleType: ScheduleType
  departureTime: string
  pricePerSeat: string
  seatLayout: BusType
  totalSeats: string
  status: TripStatus
}

const ALL_STATUSES: TripStatus[] = ["scheduled", "boarding", "departed", "completed", "cancelled"]

function emptyForm(): FormState {
  return {
    routeId: "",
    busId: "",
    driverId: "",
    serviceDate: isoToday(),
    scheduleType: "fixed_time",
    departureTime: "",
    pricePerSeat: "",
    seatLayout: "standard",
    totalSeats: String(DEFAULT_BUS_CAPACITY.standard),
    status: "scheduled",
  }
}

function cityName(c: CityRef | null, lang: Lang): string {
  if (!c) return "—"
  return lang === "fa" ? c.name_fa : c.name_en
}

function routeLabel(route: RouteOption | null, lang: Lang): string {
  if (!route) return "—"
  return `${cityName(route.origin, lang)} ← ${cityName(route.destination, lang)}`
}

/**
 * دقیقاً همان الگوی ستون‌بندی چوکی که در seed دادهٔ فاز ۴.۱ استفاده شده
 * (phase-4_1-demo-seed-data.sql): VIP یک ستون سمت چپ (A) و دو ستون سمت
 * راست (B, C) — سه در هر ردیف؛ استاندارد دو ستون هر سمت (A,B | C,D) —
 * چهار در هر ردیف. تنها نسخهٔ TypeScript این منطق، برای TripScheduler.
 */
function buildSeatRows(totalSeats: number, layout: BusType): { seat_number: string; row_number: number; col_label: string }[] {
  const cols = layout === "vip" ? ["A", "B", "C"] : ["A", "B", "C", "D"]
  const perRow = cols.length
  const rows = Math.ceil(totalSeats / perRow)
  const seats: { seat_number: string; row_number: number; col_label: string }[] = []
  let count = 0
  for (let r = 1; r <= rows; r++) {
    for (const col of cols) {
      if (count >= totalSeats) break
      seats.push({ seat_number: `${r}${col}`, row_number: r, col_label: col })
      count++
    }
  }
  return seats
}

export function TripScheduler({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [trips, setTrips] = useState<TripRow[]>([])
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [buses, setBuses] = useState<BusOption[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deletingTrip, setDeletingTrip] = useState<TripRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)

    const [routesRes, busesRes, driversRes, tripsRes] = await Promise.all([
      supabase
        .from("routes")
        .select(
          `id, is_active,
           origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
           destination:cities!routes_destination_city_id_fkey(name_en, name_fa)`,
        )
        .order("created_at", { ascending: false }),
      supabase.from("buses").select("id, code, bus_type, total_seats").order("code", { ascending: true }),
      supabase.from("drivers").select("id, full_name").eq("status", "active").order("full_name", { ascending: true }),
      supabase
        .from("trips")
        .select(
          `id, route_id, bus_id, driver_id, service_date, departure_time, schedule_type, price_per_seat,
           total_seats_snapshot, status,
           route:routes(id, is_active,
             origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
             destination:cities!routes_destination_city_id_fkey(name_en, name_fa)),
           bus:buses(id, code, bus_type, total_seats),
           driver:drivers(id, full_name)`,
        )
        .order("service_date", { ascending: false })
        .order("departure_time", { ascending: true, nullsFirst: false }),
    ])

    if (routesRes.error || busesRes.error || driversRes.error || tripsRes.error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    const unwrap = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null)

    setRoutes(
      (routesRes.data ?? []).map((r: any) => ({ ...r, origin: unwrap(r.origin), destination: unwrap(r.destination) })),
    )
    setBuses((busesRes.data ?? []) as BusOption[])
    setDrivers((driversRes.data ?? []) as DriverOption[])
    setTrips(
      (tripsRes.data ?? []).map((row: any) => {
        const route = unwrap(row.route)
        return {
          ...row,
          route: route ? { ...route, origin: unwrap(route.origin), destination: unwrap(route.destination) } : null,
          bus: unwrap(row.bus),
          driver: unwrap(row.driver),
        }
      }),
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeRoutes = useMemo(() => routes.filter((r) => r.is_active), [routes])

  function openCreate() {
    setModalMode("create")
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
  }

  function openEdit(trip: TripRow) {
    setModalMode("edit")
    setEditingId(trip.id)
    setForm({
      routeId: trip.route_id,
      busId: trip.bus_id ?? "",
      driverId: trip.driver_id ?? "",
      serviceDate: trip.service_date,
      scheduleType: trip.schedule_type,
      departureTime: trip.departure_time ? trip.departure_time.slice(0, 5) : "",
      pricePerSeat: String(trip.price_per_seat),
      seatLayout: trip.bus?.bus_type ?? "standard",
      totalSeats: String(trip.total_seats_snapshot),
      status: trip.status,
    })
    setFormError(null)
  }

  function closeModal() {
    if (saving) return
    setModalMode(null)
    setEditingId(null)
  }

  function onBusChange(busId: string) {
    const bus = buses.find((b) => b.id === busId)
    setForm((f) => ({
      ...f,
      busId,
      // انتخاب بس، چیدمان و ظرفیت را از خودِ بس می‌گیرد (فقط هنگام ساخت
      // سفر جدید معنا دارد چون بعد از ساخت، نقشهٔ چوکی دیگر تغییر نمی‌کند).
      seatLayout: bus ? bus.bus_type : f.seatLayout,
      totalSeats: bus && modalMode === "create" ? String(bus.total_seats) : f.totalSeats,
    }))
  }

  function onSeatLayoutChange(layout: BusType) {
    setForm((f) => ({ ...f, seatLayout: layout, totalSeats: String(DEFAULT_BUS_CAPACITY[layout]) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.routeId) {
      setFormError(t.admin.scheduler.route)
      return
    }
    const price = Number(form.pricePerSeat)
    if (!form.pricePerSeat || price < 0) {
      setFormError(t.admin.scheduler.pricePerSeat)
      return
    }
    if (form.scheduleType === "fixed_time" && !form.departureTime) {
      setFormError(t.admin.scheduler.departureTime)
      return
    }

    setSaving(true)
    setFormError(null)

    const basePayload = {
      route_id: form.routeId,
      bus_id: form.busId || null,
      driver_id: form.driverId || null,
      service_date: form.serviceDate,
      departure_time: form.scheduleType === "fixed_time" ? form.departureTime : null,
      schedule_type: form.scheduleType,
      price_per_seat: price,
    }

    if (modalMode === "edit" && editingId) {
      const { error } = await supabase
        .from("trips")
        .update({ ...basePayload, status: form.status })
        .eq("id", editingId)
      setSaving(false)
      if (error) {
        setFormError(t.admin.manage.genericError)
        return
      }
      setModalMode(null)
      setEditingId(null)
      await load()
      return
    }

    // ساخت سفر جدید: اول ردیف trips، بعد نقشهٔ چوکی — دقیقاً همان دو مرحله‌ای
    // که در seed دادهٔ فاز ۴.۱ با SQL انجام شده بود، اینجا با دو insert جدا.
    const totalSeats = Number(form.totalSeats)
    if (!totalSeats || totalSeats <= 0) {
      setSaving(false)
      setFormError(t.admin.scheduler.totalSeats)
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from("trips")
      .insert({ ...basePayload, total_seats_snapshot: totalSeats, status: "scheduled" })
      .select("id")
      .single()

    if (insertError || !inserted) {
      setSaving(false)
      setFormError(t.admin.manage.genericError)
      return
    }

    const seatRows = buildSeatRows(totalSeats, form.seatLayout).map((s) => ({ ...s, trip_id: inserted.id }))
    const { error: seatsError } = await supabase.from("trip_seats").insert(seatRows)

    setSaving(false)

    if (seatsError) {
      // trip ساخته شد اما نقشهٔ چوکی شکست خورد — به‌جای رها کردن یک سفر
      // بدون چوکی، خودِ trip را پاک می‌کنیم تا حالت ناقص در دیتابیس نماند.
      await supabase.from("trips").delete().eq("id", inserted.id)
      setFormError(t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingId(null)
    await load()
  }

  async function handleDelete() {
    if (!deletingTrip) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from("trips").delete().eq("id", deletingTrip.id)
    setDeleting(false)

    if (error) {
      setDeleteError(isForeignKeyViolation(error) ? t.admin.scheduler.deleteHasBookingsError : t.admin.manage.genericError)
      return
    }
    setDeletingTrip(null)
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.admin.scheduler.title}</h2>
          <p className="text-xs text-muted-foreground">{t.admin.scheduler.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtnClass} disabled={activeRoutes.length === 0}>
          <Plus className="size-4" />
          {t.admin.scheduler.addTrip}
        </button>
      </div>

      {!loading && activeRoutes.length === 0 && <ErrorBanner message={t.admin.scheduler.noRoutesWarning} />}
      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingRows />
          ) : trips.length === 0 ? (
            <EmptyState message={t.admin.scheduler.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.route}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.date}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.time}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.bus}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.scheduler.driver}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.scheduler.pricePerSeat}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.scheduler.status}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{routeLabel(trip.route, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                      {trip.service_date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                      {trip.departure_time ? trip.departure_time.slice(0, 5) : t.admin.scheduler.fillAndGo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                      {trip.bus?.code ?? t.admin.scheduler.noBusYet}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                      {trip.driver?.full_name ?? t.admin.scheduler.noDriverYet}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                      {localizeNumber(trip.price_per_seat, lang)} {t.routes.currency}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {t.admin.tripStatus[trip.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={iconBtnClass} onClick={() => openEdit(trip)} aria-label={t.admin.manage.edit}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={iconBtnClass}
                          onClick={() => {
                            setDeletingTrip(trip)
                            setDeleteError(null)
                          }}
                          aria-label={t.admin.manage.delete}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </ScrollFade>
      </div>

      {modalMode && (
        <Modal title={modalMode === "edit" ? t.admin.scheduler.editTrip : t.admin.scheduler.addTrip} onClose={closeModal} wide>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{t.admin.scheduler.route}</label>
              <select
                className={inputClass}
                value={form.routeId}
                onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  {t.admin.scheduler.selectRoute}
                </option>
                {(modalMode === "edit" ? routes : activeRoutes).map((r) => (
                  <option key={r.id} value={r.id}>
                    {routeLabel(r, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t.admin.scheduler.bus}</label>
                <select className={inputClass} value={form.busId} onChange={(e) => onBusChange(e.target.value)}>
                  <option value="">{t.admin.scheduler.noBusYet}</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {t.busTypes[b.bus_type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.admin.scheduler.driver}</label>
                <select
                  className={inputClass}
                  value={form.driverId}
                  onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                >
                  <option value="">{t.admin.scheduler.noDriverYet}</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t.admin.scheduler.serviceDate}</label>
              <DatePicker lang={lang} value={form.serviceDate} onChange={(iso) => setForm((f) => ({ ...f, serviceDate: iso }))} />
            </div>

            <div>
              <label className={labelClass}>{t.admin.scheduler.scheduleType}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={form.scheduleType === "fixed_time"}
                    onChange={() => setForm((f) => ({ ...f, scheduleType: "fixed_time" }))}
                  />
                  {t.admin.scheduler.fixedTime}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-foreground">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={form.scheduleType === "fill_and_go"}
                    onChange={() => setForm((f) => ({ ...f, scheduleType: "fill_and_go", departureTime: "" }))}
                  />
                  {t.admin.scheduler.fillAndGo}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {form.scheduleType === "fixed_time" && (
                <div>
                  <label className={labelClass}>{t.admin.scheduler.departureTime}</label>
                  <input
                    type="time"
                    dir="ltr"
                    className={inputClass}
                    value={form.departureTime}
                    onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>{t.admin.scheduler.pricePerSeat}</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.pricePerSeat}
                  onChange={(e) => setForm((f) => ({ ...f, pricePerSeat: e.target.value }))}
                  required
                />
              </div>
            </div>

            {modalMode === "create" ? (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.admin.scheduler.seatLayout}</label>
                  <select
                    className={inputClass}
                    value={form.seatLayout}
                    onChange={(e) => onSeatLayoutChange(e.target.value as BusType)}
                    disabled={!!form.busId}
                  >
                    <option value="standard">{t.busTypes.standard}</option>
                    <option value="vip">{t.busTypes.vip}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.admin.scheduler.totalSeats}</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={form.totalSeats}
                    onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                    disabled={!!form.busId}
                    required
                  />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">{t.admin.scheduler.seatsLockedNote}</p>
              </div>
            ) : (
              <div>
                <label className={labelClass}>{t.admin.scheduler.status}</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TripStatus }))}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t.admin.tripStatus[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formError && <ErrorBanner message={formError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeModal} disabled={saving}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingTrip && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={t.admin.scheduler.deleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={deleting}
          errorMessage={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTrip(null)}
        />
      )}
    </div>
  )
}
