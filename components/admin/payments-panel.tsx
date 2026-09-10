"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { dictionary, localizeNumber, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import type { PaymentStatus } from "@/lib/payments/types"
import { EmptyState, ErrorBanner, LoadingRows, ScrollFade } from "./admin-ui"

type ActorType = "customer" | "admin" | "system"

type AuditRow = {
  id: string
  occurred_at: string
  from_status: PaymentStatus | null
  to_status: PaymentStatus
  actor_type: ActorType
  actor_name: string | null
  source: string
  note: string | null
  booking_id: string
  booking_reference: string
  contact_name: string
  contact_phone: string
  payment_amount: number
  refunded_amount: number | null
}

const ALL_TO_STATUSES: PaymentStatus[] = ["pending", "confirmed", "failed", "refunded"]

/**
 * فاز ۶.۲ — اولین تب اختصاصی «پرداخت‌ها»؛ قبلاً (طبق یادداشت بدهی فاز
 * ۵.۱۲) این بخش هیچ UI مستقلی نداشت و پرداخت فقط داخل تب رزروها دیده
 * می‌شد. این تب تاریخچهٔ کامل payment_status_events (فاز ۶.۱) را نشان
 * می‌دهد — از طریق list_payment_audit_log (تابع SECURITY DEFINER، دقیقاً
 * الگوی list_admin_audit_log فاز ۵.۱۲) تا ادمین محدودِ فقط-payments هم
 * بدون دسترسی به بخش bookings بتواند booking_reference را ببیند.
 */
export function PaymentsPanel({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")

  async function load() {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase.rpc("list_payment_audit_log", { p_limit: 300 })
    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }
    setRows((data ?? []) as AuditRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.to_status !== statusFilter) return false
    const q = query.trim().toLowerCase()
    if (q && !r.contact_name.toLowerCase().includes(q) && !r.contact_phone.includes(q) && !r.booking_reference.toLowerCase().includes(q))
      return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t.admin.paymentsPanel.title}</h2>
        <p className="text-xs text-muted-foreground">{t.admin.paymentsPanel.subtitle}</p>
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
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">{t.admin.allStatuses}</option>
          {ALL_TO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.admin.paymentStatus[s]}
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
              <EmptyState message={rows.length === 0 ? t.admin.paymentsPanel.empty : t.search.noResults} />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{t.admin.cols.ref}</th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.bookingsPanel.contact}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.paymentsPanel.colTransition}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.paymentsPanel.colAmount}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.paymentsPanel.colActor}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.paymentsPanel.colNote}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.cols.registeredAt}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                        {r.booking_reference}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        <div>{r.contact_name}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {r.contact_phone}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">
                          {r.from_status ? t.admin.paymentStatus[r.from_status] : t.admin.paymentsPanel.newPayment}
                        </span>
                        <span className="mx-1.5 text-muted-foreground">←</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {t.admin.paymentStatus[r.to_status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                        {r.to_status === "refunded" && r.refunded_amount != null && r.refunded_amount < r.payment_amount
                          ? `${localizeNumber(r.refunded_amount, lang)} / ${localizeNumber(r.payment_amount, lang)}`
                          : localizeNumber(r.payment_amount, lang)}{" "}
                        {t.routes.currency}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                        {r.actor_type === "admin"
                          ? (r.actor_name ?? t.admin.paymentsPanel.actorAdmin)
                          : r.actor_type === "customer"
                            ? t.admin.paymentsPanel.actorCustomer
                            : t.admin.paymentsPanel.actorSystem}
                      </td>
                      <td className="max-w-[16rem] truncate px-3 py-2.5 text-sm text-muted-foreground" title={r.note ?? undefined}>
                        {r.note ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground" dir="ltr">
                        {new Date(r.occurred_at).toLocaleString(lang === "fa" ? "fa-AF" : "en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ScrollFade>
      </div>
    </div>
  )
}
