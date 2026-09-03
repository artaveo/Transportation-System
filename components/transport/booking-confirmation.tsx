"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeftRight, CalendarPlus, CircleCheck, Download, LifeBuoy } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { cityLabel, formatTime, getTripById, hash, pricing } from "@/lib/booking-data"
import { SiteHeader } from "./site-header"

/**
 * Deterministic decorative QR-style grid derived from the booking reference.
 * This is a visual placeholder for the digital ticket, not a scannable code —
 * wiring an actual QR encoder (or the payment gateway's own QR) is a later,
 * backend-connected step (see master prompt phase 6).
 */
function QrPlaceholder({ seedValue }: { seedValue: string }) {
  const size = 9
  const cells = useMemo(() => {
    const out: boolean[] = []
    let seed = hash(seedValue)
    for (let i = 0; i < size * size; i++) {
      seed = hash(`${seed}-${i}`)
      out.push(seed % 5 < 2)
    }
    return out
  }, [seedValue])

  return (
    <div
      className="grid aspect-square w-28 shrink-0 gap-[3px] rounded-lg bg-primary-foreground p-2.5 sm:w-32"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="img"
      aria-label="QR"
    >
      {cells.map((on, i) => (
        <span key={i} className={`rounded-[1px] ${on ? "bg-background" : "bg-transparent"}`} />
      ))}
    </div>
  )
}

export function BookingConfirmation({ tripId }: { tripId: string }) {
  const params = useSearchParams()
  const { lang } = useLang()
  const t = dictionary[lang]

  const trip = getTripById(tripId)
  const seats = useMemo(() => (params.get("seats") || "").split(",").filter(Boolean), [params])
  const ref = params.get("ref") || ""
  const name = params.get("name") || ""
  const date = params.get("date") || ""

  if (!trip || seats.length === 0 || !ref) {
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

  const { grandTotal } = pricing(trip.price, seats.length)
  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "—"

  function addToCalendar() {
    const day = date || new Date().toISOString().slice(0, 10)
    const h = Math.floor(trip!.departMinutes / 60)
    const m = trip!.departMinutes % 60
    const startsAt = `${day.replace(/-/g, "")}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${dictionary[lang].brand} — ${cityLabel(trip!.fromEn, lang)} \u2192 ${cityLabel(trip!.toEn, lang)}`,
      `DTSTART:${startsAt}`,
      `DESCRIPTION:${t.confirm.ref}: ${ref}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${ref}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <CircleCheck className="size-8" strokeWidth={1.8} />
          </span>
          <h1 className={`${displayFont(lang)} text-2xl font-semibold text-foreground`}>{t.confirm.title}</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.confirm.subtitle}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-border/60 bg-secondary/40 px-6 py-4">
            <div>
              <span className="block text-xs text-muted-foreground">{t.confirm.ref}</span>
              <span className={`${displayFont(lang)} text-lg font-semibold tracking-wide text-primary`} dir="ltr">
                {ref}
              </span>
            </div>
            <QrPlaceholder seedValue={ref} />
          </div>

          <dl className="flex flex-col gap-3 px-6 py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.confirm.route}</dt>
              <dd className="flex items-center gap-1.5 font-medium text-foreground">
                <span>{cityLabel(trip.fromEn, lang)}</span>
                <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{cityLabel(trip.toEn, lang)}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.confirm.date}</dt>
              <dd className="font-medium text-foreground">{dateLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.confirm.departure}</dt>
              <dd className="font-medium text-foreground" dir="ltr">{formatTime(trip.departMinutes, lang)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.confirm.seats}</dt>
              <dd className={`${displayFont(lang)} font-medium text-foreground`}>{seats.join("، ")}</dd>
            </div>
            {name && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.confirm.passenger}</dt>
                <dd className="font-medium text-foreground">{name}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border/60 pt-3 text-base">
              <dt className="font-semibold text-foreground">{t.confirm.amount}</dt>
              <dd className={`${displayFont(lang)} font-semibold text-foreground`}>
                {localizeNumber(grandTotal, lang)} {t.routes.currency}
              </dd>
            </div>
          </dl>
          <p className="border-t border-border/60 px-6 py-3 text-center text-xs text-muted-foreground">{t.confirm.qrHint}</p>
        </div>

        <p className="mt-6 rounded-xl bg-secondary/40 px-4 py-3 text-center text-sm leading-relaxed text-muted-foreground">
          {t.confirm.boarding}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Download className="size-4" />
            {t.confirm.download}
          </button>
          <button
            onClick={addToCalendar}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <CalendarPlus className="size-4" />
            {t.confirm.addToCalendar}
          </button>
        </div>
        <Link
          href="/"
          className="mt-3 flex items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.confirm.home}
        </Link>

        <div className="mt-8 rounded-2xl border border-dashed border-border p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LifeBuoy className="size-4 text-primary" />
            {t.confirm.supportTitle}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.confirm.supportNote}</p>
          <Link href="/contact" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            {t.confirm.contactOffices}
          </Link>
        </div>
      </div>
    </div>
  )
}
