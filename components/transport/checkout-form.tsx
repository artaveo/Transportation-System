"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeftRight, Building, ChevronLeft, ChevronRight, CreditCard, Luggage, Smartphone } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { bookingReference, cityLabel, formatTime, getTripById, pricing } from "@/lib/booking-data"
import { SiteHeader } from "./site-header"

type PassengerForm = {
  fullName: string
  nationalId: string
  gender: "male" | "female"
}

type PayMethod = "card" | "mobile" | "office"

export function CheckoutForm({ tripId }: { tripId: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const { lang } = useLang()
  const t = dictionary[lang]
  const BackIcon = lang === "fa" ? ChevronRight : ChevronLeft

  const trip = getTripById(tripId)
  const date = params.get("date") || ""
  const seats = useMemo(() => {
    const raw = params.get("seats") || ""
    return raw.split(",").filter(Boolean)
  }, [params])

  const [passengers, setPassengers] = useState<PassengerForm[]>(() =>
    seats.map(() => ({ fullName: "", nationalId: "", gender: "male" })),
  )
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [extraLuggage, setExtraLuggage] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>("card")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  if (!trip || seats.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="text-muted-foreground">{t.search.noResults}</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            {t.confirm.home}
          </Link>
        </div>
      </div>
    )
  }

  const { subtotal, serviceFee, grandTotal } = pricing(trip.price, seats.length)

  function updatePassenger(i: number, patch: Partial<PassengerForm>) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: Record<string, boolean> = {}
    passengers.forEach((p, i) => {
      if (!p.fullName.trim()) nextErrors[`name-${i}`] = true
      if (!p.nationalId.trim()) nextErrors[`id-${i}`] = true
    })
    if (!phone.trim()) nextErrors.phone = true
    if (!acceptTerms) nextErrors.terms = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const ref = bookingReference(tripId, seats)
    const q = new URLSearchParams()
    q.set("seats", seats.join(","))
    q.set("ref", ref)
    q.set("name", passengers[0].fullName.trim())
    if (date) q.set("date", date)
    router.push(`/trips/${tripId}/confirmation?${q.toString()}`)
  }

  const fieldBase =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link
          href={`/trips/${tripId}/seats${date ? `?date=${date}` : ""}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <BackIcon className="size-4" />
          {t.common.back}
        </Link>

        <h1 className={`${displayFont(lang)} mb-6 text-2xl font-semibold text-foreground`}>{t.checkout.title}</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            {/* Passenger details */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t.checkout.passengerDetails}</h2>
              <div className="flex flex-col gap-5">
                {passengers.map((p, i) => (
                  <div key={i} className={i > 0 ? "border-t border-border/60 pt-5" : ""}>
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      {t.checkout.passengerNo} {localizeNumber(i + 1, lang)} · {seats[i]}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          {t.checkout.fullName}
                        </label>
                        <input
                          value={p.fullName}
                          onChange={(e) => updatePassenger(i, { fullName: e.target.value })}
                          placeholder={t.checkout.fullNamePh}
                          className={`${fieldBase} ${errors[`name-${i}`] ? "border-destructive" : ""}`}
                        />
                        {errors[`name-${i}`] && (
                          <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          {t.checkout.nationalId}
                        </label>
                        <input
                          value={p.nationalId}
                          onChange={(e) => updatePassenger(i, { nationalId: e.target.value })}
                          placeholder={t.checkout.nationalIdPh}
                          className={`${fieldBase} ${errors[`id-${i}`] ? "border-destructive" : ""}`}
                        />
                        {errors[`id-${i}`] && (
                          <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-5">
                      <span className="text-xs font-medium text-muted-foreground">{t.checkout.gender}</span>
                      {(["male", "female"] as const).map((g) => (
                        <label key={g} className="flex items-center gap-1.5 text-sm text-foreground">
                          <input
                            type="radio"
                            name={`gender-${i}`}
                            checked={p.gender === g}
                            onChange={() => updatePassenger(i, { gender: g })}
                            className="size-3.5 accent-primary"
                          />
                          {t.checkout[g]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t.checkout.contactTitle}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.checkout.phone}</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07xxxxxxxx"
                    className={`${fieldBase} text-start ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.checkout.email}</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${fieldBase} text-start`}
                  />
                </div>
              </div>
            </div>

            {/* Extra luggage (optional) */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Luggage className="size-4 text-primary" />
                {t.checkout.luggageTitle}
              </h2>
              <label className="flex items-start gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={extraLuggage}
                  onChange={(e) => setExtraLuggage(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary"
                />
                {t.checkout.luggageOption}
              </label>
              {extraLuggage && (
                <p className="mt-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {t.checkout.luggageNote}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t.checkout.paymentTitle}</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["card", t.checkout.payCard, t.checkout.payCardDesc, CreditCard],
                    ["mobile", t.checkout.payMobile, t.checkout.payMobileDesc, Smartphone],
                    ["office", t.checkout.payOffice, t.checkout.payOfficeDesc, Building],
                  ] as [PayMethod, string, string, typeof CreditCard][]
                ).map(([key, label, desc, Icon]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setPayMethod(key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      payMethod === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs leading-relaxed opacity-80">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms acceptance */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <label className="flex items-start gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked)
                    if (e.target.checked) setErrors((prev) => ({ ...prev, terms: false }))
                  }}
                  className={`mt-0.5 size-3.5 accent-primary ${errors.terms ? "outline outline-1 outline-destructive" : ""}`}
                />
                <span>
                  {t.checkout.termsLabel}{" "}
                  <Link href="/terms" className="font-medium text-primary hover:underline">
                    {t.checkout.termsLink}
                  </Link>
                  {" · "}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    {t.checkout.privacyLink}
                  </Link>
                </span>
              </label>
              {errors.terms && <p className="mt-2 text-xs text-destructive">{t.checkout.termsRequired}</p>}
            </div>
          </div>

          {/* Summary */}
          <aside className="sticky top-24 h-fit rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t.checkout.summaryTitle}</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.route}</dt>
                <dd className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{cityLabel(trip.fromEn, lang)}</span>
                  <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{cityLabel(trip.toEn, lang)}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.date}</dt>
                <dd className="font-medium text-foreground">
                  {date
                    ? new Date(date + "T00:00:00").toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}{" "}
                  · <span dir="ltr">{formatTime(trip.departMinutes, lang)}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.seatsLabel}</dt>
                <dd className={`${displayFont(lang)} font-medium text-foreground`}>{seats.join("، ")}</dd>
              </div>
              {extraLuggage && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.checkout.luggageTitle}</dt>
                  <dd className="font-medium text-foreground">{t.common.optional}</dd>
                </div>
              )}
            </dl>
            <div className="my-4 border-t border-border/60" />
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.subtotal}</dt>
                <dd className="text-foreground">
                  {localizeNumber(subtotal, lang)} {t.routes.currency}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.serviceFee}</dt>
                <dd className="text-foreground">
                  {localizeNumber(serviceFee, lang)} {t.routes.currency}
                </dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-semibold text-foreground">{t.checkout.grandTotal}</dt>
                <dd className={`${displayFont(lang)} font-semibold text-foreground`}>
                  {localizeNumber(grandTotal, lang)} {t.routes.currency}
                </dd>
              </div>
            </dl>

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t.checkout.pay}
            </button>
          </aside>
        </form>
      </div>
    </div>
  )
}
