"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeftRight, CircleCheck, MapPin, Pencil, Search, XCircle } from "lucide-react"
import { cities, dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { formatTime, hash, pricing } from "@/lib/booking-data"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

type LookupResult = {
  found: boolean
  fromEn?: string
  toEn?: string
  departMinutes?: number
  seats?: string[]
  amount?: number
}

export function BookingLookup() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const [ref, setRef] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<{ ref?: boolean; phone?: boolean }>({})
  const [result, setResult] = useState<LookupResult | null>(null)

  // UI-only affordances for the two management actions the enrichment brief
  // calls for. There is no backend yet (Phase 1 is UI/UX only, per the
  // master prompt) — these show the intended flow and end state; wiring
  // them to a real update/cancellation happens once Supabase is in place.
  const [editingContact, setEditingContact] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [contactSaved, setContactSaved] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelSubmitted, setCancelSubmitted] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: { ref?: boolean; phone?: boolean } = {}
    if (!ref.trim()) nextErrors.ref = true
    if (!phone.trim()) nextErrors.phone = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setResult(null)
      return
    }

    setEditingContact(false)
    setContactSaved(false)
    setCancelling(false)
    setCancelSubmitted(false)

    // No backend yet (Phase 1 is UI/UX only) — deterministically derive a
    // plausible booking from the entered values, the same way the rest of
    // this prototype fabricates trips/seats from a hash of stable inputs.
    const seed = hash(`${ref.trim().toUpperCase()}|${phone.trim()}`)

    // Roughly one lookup in six shows the "not found" state, so both
    // outcomes of this page are visible without needing a real backend.
    if (seed % 6 === 0) {
      setResult({ found: false })
      return
    }

    const fromIdx = seed % cities.length
    let toIdx = Math.floor(seed / 7) % cities.length
    if (toIdx === fromIdx) toIdx = (toIdx + 1) % cities.length
    const seatCount = 1 + (seed % 3)
    const seats = Array.from(
      { length: seatCount },
      (_, i) => `${2 + ((seed + i * 5) % 12)}${["A", "B", "C", "D"][(seed + i) % 4]}`,
    )
    const pricePerSeat = 700 + (seed % 12) * 100
    const { grandTotal } = pricing(pricePerSeat, seatCount)

    setResult({
      found: true,
      fromEn: cities[fromIdx].en,
      toEn: cities[toIdx].en,
      departMinutes: 360 + (seed % 12) * 60,
      seats,
      amount: grandTotal,
    })
  }

  function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!newPhone.trim()) return
    setContactSaved(true)
    setEditingContact(false)
  }

  const fieldBase =
    "w-full rounded-xl border bg-background px-3.5 py-2.5 text-start text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

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
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Search className="size-4" />
              {t.track.submit}
            </button>
          </div>
        </form>

        {result?.found && (
          <div className="mt-6 animate-rise-in overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-dashed border-border/60 bg-secondary/40 px-6 py-4">
              <CircleCheck className="size-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">{t.track.resultTitle}</span>
            </div>
            <dl className="flex flex-col gap-3 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.route}</dt>
                <dd className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{cities.find((c) => c.en === result.fromEn)?.[lang]}</span>
                  <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{cities.find((c) => c.en === result.toEn)?.[lang]}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.departure}</dt>
                <dd className="font-medium text-foreground" dir="ltr">{formatTime(result.departMinutes!, lang)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.seats}</dt>
                <dd className={`${displayFont(lang)} font-medium text-foreground`}>{result.seats?.join("، ")}</dd>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-3 text-base">
                <dt className="font-semibold text-foreground">{t.confirm.amount}</dt>
                <dd className={`${displayFont(lang)} font-semibold text-foreground`}>
                  {localizeNumber(result.amount!, lang)} {t.routes.currency}
                </dd>
              </div>
            </dl>

            {/* Manage booking actions */}
            <div className="flex flex-col gap-2 border-t border-border/60 px-6 py-4 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setEditingContact((v) => !v)
                  setCancelling(false)
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
                    className="shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    {t.track.saveChanges}
                  </button>
                </div>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelSubmitted(true)}
                    className="flex-1 rounded-xl bg-destructive/10 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20"
                  >
                    {t.track.cancelAction}
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
          </div>
        )}

        {result && !result.found && (
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
