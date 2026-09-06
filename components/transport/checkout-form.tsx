"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, Building, ChevronLeft, ChevronRight, CreditCard, Luggage, Smartphone } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { normalizePhone, toLatinDigits } from "@/lib/phone-utils"
import { useLang } from "@/lib/lang-context"
import { cityLabel, formatTime, pricing } from "@/lib/booking-data"
import type { TripDetail } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"

type PassengerForm = {
  fullName: string
  nationalId: string
  gender: "male" | "female"
}

type PayMethod = "card" | "mobile" | "office"

// دکمه‌های UI سه‌گانه (کارت/موبایلی/دفتر) روی enum دوتاییِ واقعی دیتابیس
// (`online`/`offline`) نگاشت می‌شوند — کارت و موبایلی هر دو زیرمجموعهٔ
// درگاه HesabPay‌اند (بخش ۲ سند مادر: «کارت بانکی یا پول موبایلی»).
function toDbPaymentMethod(m: PayMethod): "online" | "offline" {
  return m === "office" ? "offline" : "online"
}

export function CheckoutForm({ trip, seatIds }: { trip: TripDetail; seatIds: string[] }) {
  const router = useRouter()
  const { lang } = useLang()
  const t = dictionary[lang]
  const BackIcon = lang === "fa" ? ChevronRight : ChevronLeft

  const seatLabels = useMemo(
    () => seatIds.map((id) => trip.seats.find((s) => s.id === id)?.seatNumber ?? "?"),
    [seatIds, trip.seats],
  )

  const [passengers, setPassengers] = useState<PassengerForm[]>(() =>
    seatIds.map(() => ({ fullName: "", nationalId: "", gender: "male" })),
  )
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [extraLuggage, setExtraLuggage] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>("card")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<"couponInvalid" | "holdExpired" | "genericError" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (seatIds.length === 0) {
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

  const { subtotal, serviceFee, grandTotal } = pricing(trip.price, seatIds.length)

  function updatePassenger(i: number, patch: Partial<PassengerForm>) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const nextErrors: Record<string, boolean> = {}
    passengers.forEach((p, i) => {
      if (!p.fullName.trim()) nextErrors[`name-${i}`] = true
    })
    if (!phone.trim()) nextErrors.phone = true
    if (!acceptTerms) nextErrors.terms = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          seatIds,
          // نام تماس رزرو = نام مسافر اول (همان قراردادی که قبلاً هم برای
          // نمایش در صفحهٔ تأییدیه استفاده می‌شد)؛ فیلد جدا برای «نام
          // تماس» در فرم فعلی UI وجود ندارد.
          contactName: passengers[0].fullName.trim(),
          contactPhone: normalizePhone(phone),
          passengers: passengers.map((p, i) => ({
            seatId: seatIds[i],
            fullName: p.fullName.trim(),
            nationalId: p.nationalId.trim() || undefined,
            gender: p.gender,
          })),
          paymentMethod: toDbPaymentMethod(payMethod),
          couponCode: couponCode.trim() || undefined,
        }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (body.error === "COUPON_INVALID") {
          setErrors((prev) => ({ ...prev, coupon: true }))
          setServerError("couponInvalid")
        } else if (body.error === "SEATS_NOT_HELD") {
          setServerError("holdExpired")
        } else {
          setServerError("genericError")
        }
        return
      }

      router.push(`/trips/${trip.id}/confirmation?ref=${encodeURIComponent(body.booking.booking_reference)}`)
    } catch {
      setServerError("genericError")
    } finally {
      setSubmitting(false)
    }
  }

  const fieldBase =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 pb-28 sm:px-8 lg:pb-8 3xl:max-w-6xl 4xl:max-w-7xl">
        <Link
          href={`/trips/${trip.id}/seats`}
          onClick={() => {
            // آزادسازی best-effort صندلی‌های held شده در صورت انصراف —
            // ناوبری را بلاک نمی‌کند (fire-and-forget).
            fetch("/api/bookings/release", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tripId: trip.id, seatIds }),
              keepalive: true,
            }).catch(() => {})
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <BackIcon className="size-4" />
          {t.common.back}
        </Link>

        <h1 className={`${displayFont(lang)} mb-6 text-2xl font-semibold text-foreground`}>{t.checkout.title}</h1>

        <form id="checkout-form" onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            {/* Passenger details */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t.checkout.passengerDetails}</h2>
              <div className="flex flex-col gap-5">
                {passengers.map((p, i) => (
                  <div key={i} className={i > 0 ? "border-t border-border/60 pt-5" : ""}>
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      {t.checkout.passengerNo} {localizeNumber(i + 1, lang)} · {seatLabels[i]}
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
                        {errors[`name-${i}`] && <p className="mt-1 text-xs text-destructive">{t.checkout.required}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          {t.checkout.nationalId}
                        </label>
                        <input
                          value={p.nationalId}
                          onChange={(e) => updatePassenger(i, { nationalId: e.target.value })}
                          placeholder={t.checkout.nationalIdPh}
                          className={fieldBase}
                        />
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
                    onChange={(e) => setPhone(toLatinDigits(e.target.value))}
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

            {/* Coupon code */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">{t.checkout.couponTitle}</h2>
              <input
                dir="ltr"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  setErrors((prev) => ({ ...prev, coupon: false }))
                }}
                placeholder={t.checkout.couponPh}
                className={`${fieldBase} text-start uppercase ${errors.coupon ? "border-destructive" : ""}`}
              />
              {errors.coupon && <p className="mt-1 text-xs text-destructive">{t.checkout.couponInvalid}</p>}
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
              {(payMethod === "card" || payMethod === "mobile") && (
                <p className="mt-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {t.checkout.onlinePendingNote}
                </p>
              )}
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

          {/* Summary — sticky only from lg up (row #13/#14: below lg the
              fixed CTA bar rendered after the form carries the submit
              action, since the two-column grid stacks vertically here). */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
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
                  {new Date(trip.serviceDate + "T00:00:00").toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  ·{" "}
                  <span dir="ltr">
                    {trip.departMinutes !== null ? formatTime(trip.departMinutes, lang) : t.search.flexibleDeparture}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.checkout.seatsLabel}</dt>
                <dd className={`${displayFont(lang)} font-medium text-foreground`}>{seatLabels.join("، ")}</dd>
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
              <p className="text-xs text-muted-foreground">{t.checkout.couponAppliedAtConfirm}</p>
              <div className="flex justify-between text-base">
                <dt className="font-semibold text-foreground">{t.checkout.grandTotal}</dt>
                <dd className={`${displayFont(lang)} font-semibold text-foreground`}>
                  {localizeNumber(grandTotal, lang)} {t.routes.currency}
                </dd>
              </div>
            </dl>

            {serverError && <p className="mt-3 text-xs text-destructive">{t.checkout[serverError]}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 hidden w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 lg:block"
            >
              {submitting ? t.checkout.submitting : t.checkout.pay}
            </button>
          </aside>
        </form>
      </div>

      {/* فاز ۴.۸ (رفع ردیف #۱۳/#۱۴ — بحرانی): نوار CTA ثابت زیر lg. دکمه با
          form="checkout-form" همچنان همان فرم بالا را سابمیت می‌کند، با
          اینکه بیرون از تگ <form> رندر شده (رفتار استاندارد HTML5). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.15)] lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t.checkout.grandTotal}</p>
            <p className={`${displayFont(lang)} text-base font-semibold text-foreground`}>
              {localizeNumber(grandTotal, lang)} {t.routes.currency}
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40"
          >
            {submitting ? t.checkout.submitting : t.checkout.pay}
          </button>
        </div>
        {serverError && <p className="mt-1.5 text-center text-xs text-destructive">{t.checkout[serverError]}</p>}
      </div>
    </div>
  )
}
