"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, RotateCcw, Search, XCircle } from "lucide-react"
import { dictionary, localizeNumber, type Lang } from "@/lib/i18n"
import { cityLabel } from "@/lib/booking-data"
import { createClient } from "@/lib/supabase/client"
import { createManualPaymentProvider } from "@/lib/payments/provider"
import type { PaymentMethod, PaymentStatus } from "@/lib/payments/types"
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  inputClass,
  labelClass,
  LoadingRows,
  Modal,
  primaryBtnClass,
  ScrollFade,
  secondaryBtnClass,
  iconBtnClass,
} from "./admin-ui"

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "refunded"

type CityRef = { name_en: string; name_fa: string }

type BookingRow = {
  id: string
  booking_reference: string
  contact_name: string
  contact_phone: string
  seats_count: number
  total_amount: number
  currency: string
  payment_method: PaymentMethod
  status: BookingStatus
  created_at: string
  trip: {
    service_date: string
    route: { origin: CityRef | null; destination: CityRef | null } | null
  } | null
  paymentStatus: PaymentStatus | null
  refundedAmount: number | null
  seatNumbers: string[]
}

const ALL_STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled", "refunded"]

function unwrap<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/**
 * جایگزین کامل tab «رزروها»ی فاز ۵ — قبلاً از lib/admin-data.ts (چهل ردیف
 * ساختگی با نام‌های تصادفی) پر می‌شد. حالا مستقیماً روی جدول واقعی
 * `bookings` است (طبق نگرانی صریح Zakir: «صد تا دیتای که معلوم نیست از
 * کجا اومدن»). PaymentConfirmationAction به‌صورت دکمهٔ درون‌ردیفی پیاده
 * شد (نه صفحهٔ جدا) — برای رزروهای آفلاینِ در انتظار.
 *
 * افزودهٔ فاز ۶.۱ (زیرساخت پرداخت): دکمهٔ بازپرداخت برای رزروهای confirmed
 * اضافه شد؛ «لغو رزرو» دیگر روی رزروهای دارای پرداخت confirmed کار نمی‌کند
 * (باید بازپرداخت شود) — هم اینجا در UI هم در admin_cancel_booking در
 * دیتابیس همین قانون اعمال شده. هر دو عملیات از پشت
 * lib/payments/provider.ts رد می‌شوند، نه مستقیم supabase.rpc.
 */
export function BookingsTable({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()
  // فاز ۶.۱: تأیید آفلاین/بازپرداخت دیگر مستقیم supabase.rpc(...) نمی‌زنند —
  // از پشت انتزاع provider رد می‌شوند تا وقتی HesabPay در فاز ۶.۳ وصل شد،
  // فقط همین یک خط عوض شود (createManualPaymentProvider →
  // یک provider واقعی)، بدون دست‌زدن به بقیهٔ این کامپوننت.
  const paymentProvider = createManualPaymentProvider(supabase)

  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all")

  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // فاز ۶.۱: بازپرداخت — قبل از این فاز اصلاً چنین قابلیتی نبود (نه دکمه‌ای،
  // نه تابعی در دیتابیس). فقط برای رزروِ confirmed با پرداخت confirmed فعال
  // می‌شود؛ لغوِ رزروهای پرداخت‌شده دیگر باید از همین مسیر برود (نه دکمهٔ
  // «لغو رزرو» که حالا فقط برای pending کار می‌کند — چون admin_cancel_booking
  // در همین فاز، لغوِ پرداخت‌های confirmed را رد می‌کند).
  // فاز ۶.۲: بازپرداخت جزئی هم مجاز شد (تصمیم صریح Zakir) — پس دیگر یک
  // ConfirmDialog سادهٔ بدون ورودی کافی نیست؛ مبلغ (پیش‌فرض کامل، قابل‌کاهش)
  // و دلیل اختیاری از خودِ ادمین گرفته می‌شود.
  const [refundingBooking, setRefundingBooking] = useState<BookingRow | null>(null)
  const [refundAmountInput, setRefundAmountInput] = useState("")
  const [refundReasonInput, setRefundReasonInput] = useState("")
  const [refundPending, setRefundPending] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id, booking_reference, contact_name, contact_phone, seats_count, total_amount, currency,
         payment_method, status, created_at,
         trip:trips(service_date,
           route:routes(origin:cities!routes_origin_city_id_fkey(name_en, name_fa),
                        destination:cities!routes_destination_city_id_fkey(name_en, name_fa))),
         payments(status, created_at, refunded_amount),
         booking_passengers(trip_seats(seat_number))`,
      )
      .order("created_at", { ascending: false })
      .order("created_at", { foreignTable: "payments", ascending: false })

    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    setBookings(
      (data ?? []).map((row: any) => {
        const trip = unwrap(row.trip)
        const route = trip ? unwrap(trip.route) : null
        const payments = Array.isArray(row.payments) ? row.payments : row.payments ? [row.payments] : []
        const passengers = Array.isArray(row.booking_passengers) ? row.booking_passengers : []
        const seatNumbers = passengers
          .map((p: any) => unwrap(p.trip_seats)?.seat_number)
          .filter((n: unknown): n is string => typeof n === "string")
          .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }))
        return {
          ...row,
          trip: trip ? { service_date: trip.service_date, route: route ? { origin: unwrap(route.origin), destination: unwrap(route.destination) } : null } : null,
          paymentStatus: payments[0]?.status ?? null,
          refundedAmount: payments[0]?.refunded_amount ?? null,
          seatNumbers,
        }
      }),
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false
    const q = query.trim().toLowerCase()
    if (q && !b.contact_name.toLowerCase().includes(q) && !b.contact_phone.includes(q) && !b.booking_reference.toLowerCase().includes(q))
      return false
    return true
  })

  async function handleConfirmPayment() {
    if (!confirmingId) return
    setConfirmPending(true)
    setConfirmError(null)
    const result = await paymentProvider.confirmOfflinePayment(confirmingId)
    setConfirmPending(false)
    if (!result.ok) {
      setConfirmError(t.admin.manage.genericError)
      return
    }
    setConfirmingId(null)
    await load()
  }

  async function handleCancelBooking() {
    if (!cancellingId) return
    setCancelPending(true)
    setCancelError(null)
    const { error } = await supabase.rpc("admin_cancel_booking", { p_booking_id: cancellingId })
    setCancelPending(false)
    if (error) {
      setCancelError(t.admin.manage.genericError)
      return
    }
    setCancellingId(null)
    await load()
  }

  async function handleRefundPayment() {
    if (!refundingBooking) return
    const amount = Number(refundAmountInput)
    if (!Number.isFinite(amount) || amount <= 0 || amount > refundingBooking.total_amount) {
      setRefundError(t.admin.bookingsPanel.refundInvalidAmount)
      return
    }
    setRefundPending(true)
    setRefundError(null)
    const result = await paymentProvider.refund(refundingBooking.id, amount, refundReasonInput.trim() || null)
    setRefundPending(false)
    if (!result.ok) {
      setRefundError(t.admin.manage.genericError)
      return
    }
    setRefundingBooking(null)
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t.admin.bookingsPanel.title}</h2>
        <p className="text-xs text-muted-foreground">{t.admin.bookingsPanel.subtitle}</p>
      </div>

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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">{t.admin.allStatuses}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.admin.status[s]}
            </option>
          ))}
        </select>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingRows />
          ) : filtered.length === 0 ? (
            <EmptyState message={bookings.length === 0 ? t.admin.bookingsPanel.empty : t.search.noResults} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.ref}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.bookingsPanel.contact}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.route}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.date}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.seats}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.seatNumbers}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.amount}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.bookingsPanel.paymentMethod}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.bookingsPanel.paymentStatus}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.status}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.registeredAt}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const route = b.trip?.route
                  const canConfirmPayment = b.payment_method === "offline" && b.status === "pending" && b.paymentStatus === "pending"
                  // فاز ۶.۱: لغوِ رزروِ دارای پرداخت confirmed دیگر از این
                  // دکمه ممکن نیست (admin_cancel_booking در دیتابیس هم همین
                  // را رد می‌کند) — باید بازپرداخت شود، نه لغوِ بی‌اثر روی payments.
                  const canCancel = b.status === "pending"
                  const canRefund = b.status === "confirmed" && b.paymentStatus === "confirmed"
                  return (
                    <tr key={b.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                        {b.booking_reference}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        <div>{b.contact_name}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {b.contact_phone}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {route?.origin && route?.destination ? (
                          <span className="flex items-center gap-1.5">
                            <span>{cityLabel(route.origin.name_en, lang)}</span>
                            <span>←</span>
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
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                        {b.seatNumbers.length > 0 ? b.seatNumbers.join("، ") : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {localizeNumber(b.total_amount, lang)} {t.routes.currency}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                        {b.payment_method === "online" ? t.admin.bookingsPanel.online : t.admin.bookingsPanel.offline}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        {b.paymentStatus ? (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {t.admin.paymentStatus[b.paymentStatus]}
                          </span>
                        ) : (
                          "—"
                        )}
                        {b.paymentStatus === "refunded" && b.refundedAmount != null && b.refundedAmount < b.total_amount && (
                          <div className="mt-1 text-xs text-muted-foreground" dir="ltr">
                            {localizeNumber(b.refundedAmount, lang)} / {localizeNumber(b.total_amount, lang)} {t.routes.currency}
                          </div>
                        )}
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
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground" dir="ltr">
                        {new Date(b.created_at).toLocaleString(lang === "fa" ? "fa-AF" : "en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end">
                        <div className="flex justify-end gap-1">
                          {canConfirmPayment && (
                            <button
                              type="button"
                              className={iconBtnClass}
                              title={t.admin.bookingsPanel.confirmPayment}
                              aria-label={t.admin.bookingsPanel.confirmPayment}
                              onClick={() => {
                                setConfirmingId(b.id)
                                setConfirmError(null)
                              }}
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              className={iconBtnClass}
                              title={t.admin.bookingsPanel.cancelBooking}
                              aria-label={t.admin.bookingsPanel.cancelBooking}
                              onClick={() => {
                                setCancellingId(b.id)
                                setCancelError(null)
                              }}
                            >
                              <XCircle className="size-4" />
                            </button>
                          )}
                          {canRefund && (
                            <button
                              type="button"
                              className={iconBtnClass}
                              title={t.admin.bookingsPanel.refundPayment}
                              aria-label={t.admin.bookingsPanel.refundPayment}
                              onClick={() => {
                                setRefundingBooking(b)
                                setRefundAmountInput(String(b.total_amount))
                                setRefundReasonInput("")
                                setRefundError(null)
                              }}
                            >
                              <RotateCcw className="size-4" />
                            </button>
                          )}
                        </div>
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

      {confirmingId && (
        <ConfirmDialog
          title={t.admin.bookingsPanel.confirmPaymentConfirmTitle}
          body={t.admin.bookingsPanel.confirmPaymentConfirmBody}
          confirmLabel={t.admin.bookingsPanel.confirmPayment}
          cancelLabel={t.admin.manage.cancel}
          pending={confirmPending}
          errorMessage={confirmError}
          onConfirm={handleConfirmPayment}
          onCancel={() => setConfirmingId(null)}
        />
      )}

      {cancellingId && (
        <ConfirmDialog
          title={t.admin.bookingsPanel.cancelBookingConfirmTitle}
          body={t.admin.bookingsPanel.cancelBookingConfirmBody}
          confirmLabel={t.admin.bookingsPanel.cancelBooking}
          cancelLabel={t.admin.manage.cancel}
          pending={cancelPending}
          errorMessage={cancelError}
          onConfirm={handleCancelBooking}
          onCancel={() => setCancellingId(null)}
        />
      )}

      {refundingBooking && (
        <Modal title={t.admin.bookingsPanel.refundPaymentConfirmTitle} onClose={() => setRefundingBooking(null)}>
          <p className="text-sm text-muted-foreground">{t.admin.bookingsPanel.refundPaymentConfirmBody}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className={labelClass}>{t.admin.bookingsPanel.refundAmountLabel}</label>
              <input
                type="number"
                dir="ltr"
                min={0.01}
                max={refundingBooking.total_amount}
                step="0.01"
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                {t.admin.bookingsPanel.refundFullAmountHint}: {localizeNumber(refundingBooking.total_amount, lang)} {t.routes.currency}
              </p>
            </div>
            <div>
              <label className={labelClass}>
                {t.admin.bookingsPanel.refundReasonLabel} <span className="text-muted-foreground">({t.admin.manage.optional})</span>
              </label>
              <textarea
                value={refundReasonInput}
                onChange={(e) => setRefundReasonInput(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
          {refundError && <ErrorBanner message={refundError} className="mt-3" />}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={secondaryBtnClass} onClick={() => setRefundingBooking(null)} disabled={refundPending}>
              {t.admin.manage.cancel}
            </button>
            <button type="button" className={primaryBtnClass} onClick={handleRefundPayment} disabled={refundPending}>
              {refundPending && <Loader2 className="size-3.5 animate-spin" />}
              {t.admin.bookingsPanel.refundPayment}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
