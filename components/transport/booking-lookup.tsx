"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeftRight, CircleCheck, MapPin, Pencil, Search, XCircle } from "lucide-react"
import { dictionary, displayFont, localizeNumber, type Lang } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { cityLabel, formatTime } from "@/lib/booking-data"
import type { BookingDetail } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

type LookupState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "notFound" }
  | { phase: "error" }
  | { phase: "found"; booking: BookingDetail }

// cancelError می‌تواند از دو فضای نام ترجمهٔ متفاوت بیاید (t.track برای
// وضعیت‌های کنسلی، t.checkout برای خطای عمومی شبکه) — این تابع در لحظهٔ
// رندر (نه لحظهٔ خطا) رشتهٔ درست را طبق زبان فعلی برمی‌گرداند.
function cancelErrorText(
  t: (typeof dictionary)[Lang],
  key: "alreadyCancelled" | "cancelNotAllowed" | "genericError",
): string {
  return key === "genericError" ? t.checkout.genericError : t.track[key]
}

export function BookingLookup() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const [ref, setRef] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<{ ref?: boolean; phone?: boolean }>({})
  const [state, setState] = useState<LookupState>({ phase: "idle" })

  // اقدامات مدیریت رزرو — هر دو حالا واقعاً به Route Handlerهای فاز ۴.۳
  // وصل‌اند (update_booking_contact_phone / request_booking_cancellation
  // سمت service_role)، نه دیگر UI-only مثل نسخهٔ فاز ۱.
  const [editingContact, setEditingContact] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [savingContact, setSavingContact] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)
  const [contactError, setContactError] = useState<"genericError" | null>(null)

  const [cancelling, setCancelling] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelSubmitted, setCancelSubmitted] = useState(false)
  const [cancelError, setCancelError] = useState<"alreadyCancelled" | "cancelNotAllowed" | "genericError" | null>(
    null,
  )

  function resetManageState() {
    setEditingContact(false)
    setNewPhone("")
    setSavingContact(false)
    setContactSaved(false)
    setContactError(null)
    setCancelling(false)
    setCancelSubmitting(false)
    setCancelSubmitted(false)
    setCancelError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: { ref?: boolean; phone?: boolean } = {}
    if (!ref.trim()) nextErrors.ref = true
    if (!phone.trim()) nextErrors.phone = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setState({ phase: "idle" })
      return
    }

    resetManageState()
    setState({ phase: "loading" })

    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref.trim(), phone: phone.trim() }),
      })

      if (res.status === 404) {
        setState({ phase: "notFound" })
        return
      }
      if (!res.ok) {
        setState({ phase: "error" })
        return
      }

      const body = await res.json()
      setState({ phase: "found", booking: body.booking as BookingDetail })
    } catch {
      setState({ phase: "error" })
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!newPhone.trim() || state.phase !== "found") return

    setSavingContact(true)
    setContactError(null)
    try {
      const res = await fetch("/api/bookings/update-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref.trim(), phone: phone.trim(), newPhone: newPhone.trim() }),
      })

      if (!res.ok) {
        setContactError("genericError")
        return
      }

      setContactSaved(true)
      setEditingContact(false)
      // شمارهٔ تماس محلی هم به‌روزرسانی می‌شود تا اگر کاربر دوباره «ویرایش»
      // را بزند، مقدار فعلی درست نمایش داده شود.
      setState({ phase: "found", booking: { ...state.booking, contactPhone: newPhone.trim() } })
    } catch {
      setContactError("genericError")
    } finally {
      setSavingContact(false)
    }
  }

  async function submitCancellation() {
    setCancelSubmitting(true)
    setCancelError(null)
    try {
      const res = await fetch("/api/bookings/request-cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref.trim(), phone: phone.trim() }),
      })

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}))
        setCancelError(body.error === "ALREADY_CANCELLED" ? "alreadyCancelled" : "cancelNotAllowed")
        return
      }
      if (!res.ok) {
        setCancelError("genericError")
        return
      }

      setCancelSubmitted(true)
      setCancelling(false)
      if (state.phase === "found") {
        setState({ phase: "found", booking: { ...state.booking, status: "cancelled" } })
      }
    } catch {
      setCancelError("genericError")
    } finally {
      setCancelSubmitting(false)
    }
  }

  const fieldBase =
    "w-full rounded-xl border bg-background px-3.5 py-2.5 text-start text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  const booking = state.phase === "found" ? state.booking : null
  const seatsLabel = booking?.passengers.map((p) => p.seatNumber).join("، ") ?? ""
  const canManage = booking && (booking.status === "pending" || booking.status === "confirmed")
  const statusLabel = booking
    ? dictionary[lang].admin.status[booking.status as "pending" | "confirmed" | "cancelled" | "completed" | "refunded"]
    : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 text-center animate-rise-in">
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.track.title}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.track.subtitle}</p>
        </div>

        <form
          onSubmit={submit}
          className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-6"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.track.refLabel}</label>
              <input
                dir="ltr"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder={t.track.refPlaceholder}
                className={`${fieldBase} ${errors.ref ? "border-destructive" : "border-border"}`}
              />
              {errors.ref && <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.track.phoneLabel}</label>
              <input
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.track.phonePlaceholder}
                className={`${fieldBase} ${errors.phone ? "border-destructive" : "border-border"}`}
              />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>}
            </div>
            <button
              type="submit"
              disabled={state.phase === "loading"}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
            >
              <Search className="size-4" />
              {state.phase === "loading" ? t.track.searching : t.track.submit}
            </button>
          </div>
        </form>

        {booking && (
          <div className="mt-6 animate-rise-in overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-dashed border-border/60 bg-secondary/40 px-6 py-4">
              <CircleCheck className="size-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">{t.track.resultTitle}</span>
            </div>
            <dl className="flex flex-col gap-3 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.route}</dt>
                <dd className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{cityLabel(booking.trip.fromEn, lang)}</span>
                  <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{cityLabel(booking.trip.toEn, lang)}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.departure}</dt>
                <dd className="font-medium text-foreground" dir="ltr">
                  {booking.trip.departMinutes !== null
                    ? formatTime(booking.trip.departMinutes, lang)
                    : t.search.flexibleDeparture}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.seats}</dt>
                <dd className={`${displayFont(lang)} font-medium text-foreground`}>{seatsLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.track.statusLabel}</dt>
                <dd className="font-medium text-foreground">{statusLabel}</dd>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-3 text-base">
                <dt className="font-semibold text-foreground">{t.confirm.amount}</dt>
                <dd className={`${displayFont(lang)} font-semibold text-foreground`}>
                  {localizeNumber(booking.totalAmount, lang)} {t.routes.currency}
                </dd>
              </div>
            </dl>

            {canManage && (
              <>
                {/* Manage booking actions */}
                <div className="flex flex-col gap-2 border-t border-border/60 px-6 py-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContact((v) => !v)
                      setCancelling(false)
                      setCancelError(null)
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="size-3.5" />
                    {t.track.editContact}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelling((v) => !v)
                      setEditingContact(false)
                      setContactError(null)
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/40 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <XCircle className="size-3.5" />
                    {t.track.requestCancel}
                  </button>
                </div>

                {editingContact && (
                  <form onSubmit={saveContact} className="border-t border-border/60 px-6 py-4">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t.track.newPhoneLabel}
                    </label>
                    <div className="flex gap-2">
                      <input
                        dir="ltr"
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="07xxxxxxxx"
                        className={`${fieldBase} flex-1`}
                      />
                      <button
                        type="submit"
                        disabled={savingContact}
                        className="shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                      >
                        {savingContact ? t.track.saving : t.track.saveChanges}
                      </button>
                    </div>
                    {contactError && <p className="mt-2 text-xs text-destructive">{t.checkout[contactError]}</p>}
                  </form>
                )}
                {contactSaved && (
                  <p className="border-t border-border/60 px-6 py-3 text-xs leading-relaxed text-accent">
                    {t.track.contactUpdated}
                  </p>
                )}

                {cancelling && !cancelSubmitted && (
                  <div className="border-t border-border/60 px-6 py-4">
                    <p className="mb-3 text-sm font-medium text-foreground">{t.track.cancelConfirmTitle}</p>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.track.cancelConfirmBody}</p>
                    <Link
                      href="/faq#cancellation"
                      className="mb-3 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {t.track.viewCancellationPolicy}
                    </Link>
                    {cancelError && <p className="mb-3 text-xs text-destructive">{cancelErrorText(t, cancelError)}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={submitCancellation}
                        disabled={cancelSubmitting}
                        className="flex-1 rounded-xl bg-destructive/10 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-70"
                      >
                        {cancelSubmitting ? t.track.cancelSubmitting : t.track.cancelAction}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelling(false)}
                        className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground"
                      >
                        {t.track.cancelDismiss}
                      </button>
                    </div>
                  </div>
                )}
                {cancelSubmitted && (
                  <p className="border-t border-border/60 px-6 py-3 text-xs leading-relaxed text-accent">
                    {t.track.cancelConfirmBody}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {(state.phase === "notFound" || state.phase === "error") && (
          <div className="mt-6 animate-rise-in rounded-2xl border border-dashed border-border p-6 text-center">
            <AlertCircle className="mx-auto mb-3 size-8 text-destructive" />
            <p className="font-semibold text-foreground">{t.track.notFoundTitle}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.track.notFoundBody}</p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <MapPin className="size-4" />
              {t.track.contactOffices}
            </Link>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
