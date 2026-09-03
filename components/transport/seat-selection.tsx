"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeftRight, Armchair, BadgeCheck, Check, ChevronLeft, ChevronRight, DoorOpen, ShipWheel, Users } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { buildCoach, cityLabel, formatTime, getTripById } from "@/lib/booking-data"
import { SiteHeader } from "./site-header"

const MAX_SEATS = 6

export function SeatSelection({ tripId }: { tripId: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const { lang } = useLang()
  const t = dictionary[lang]
  const BackIcon = lang === "fa" ? ChevronRight : ChevronLeft

  const trip = getTripById(tripId)
  const date = params.get("date") || ""
  const [selected, setSelected] = useState<string[]>([])
  const [limitNotice, setLimitNotice] = useState(false)

  const coach = useMemo(() => (trip ? buildCoach(tripId, trip.busType) : null), [trip, tripId])

  if (!trip || !coach) {
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

  function toggleSeat(seatId: string, status: "available" | "booked") {
    if (status === "booked") return
    setSelected((prev) => {
      if (prev.includes(seatId)) {
        setLimitNotice(false)
        return prev.filter((s) => s !== seatId)
      }
      if (prev.length >= MAX_SEATS) {
        setLimitNotice(true)
        return prev
      }
      setLimitNotice(false)
      return [...prev, seatId]
    })
  }

  function continueToCheckout() {
    if (selected.length === 0) return
    const q = new URLSearchParams()
    q.set("seats", selected.join(","))
    if (date) q.set("date", date)
    router.push(`/trips/${tripId}/checkout?${q.toString()}`)
  }

  const total = selected.length * trip.price
  const isVip = trip.busType === "vip"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link href="/search" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <BackIcon className="size-4" />
          {t.common.back}
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${displayFont(lang)} text-2xl font-semibold text-foreground`}>{t.seats.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{cityLabel(trip.fromEn, lang)}</span>
              <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{cityLabel(trip.toEn, lang)}</span>
              <span dir="ltr">· {formatTime(trip.departMinutes, lang)}</span>
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: isVip ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "var(--secondary)",
              color: isVip ? "var(--primary)" : "var(--secondary-foreground)",
            }}
          >
            {isVip ? <BadgeCheck className="size-3.5" /> : <Users className="size-3.5" />}
            {t.busTypes[trip.busType]} · {t.seats.layoutNote}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Coach layout */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
            {/*
              dir="ltr" is intentional and fixed here: this diagram represents the
              bus's real physical layout (driver's side, door side, seat columns),
              which does not change when the site language/direction changes. Only
              the diagram's own internal order is pinned — surrounding labels and
              the legend still follow the page's normal text direction.
            */}
            <div dir="ltr" className="mx-auto max-w-sm">
              <div className="mb-6 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShipWheel className="size-4" />
                  {t.seats.driver}
                </span>
                <span className="flex items-center gap-1.5">
                  {t.seats.door}
                  <DoorOpen className="size-4" />
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {coach.rows.map((row) => {
                  const left = row.filter((s) => coach.leftCols.includes(s.col))
                  const right = row.filter((s) => coach.rightCols.includes(s.col))
                  return (
                    <div key={row[0]?.row ?? Math.random()} className="flex items-center justify-center gap-4">
                      <div className="flex gap-2">
                        {left.map((seat) => (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            selected={selected.includes(seat.id)}
                            onToggle={toggleSeat}
                            lang={lang}
                          />
                        ))}
                      </div>
                      <div className="w-6 shrink-0" aria-hidden="true" />
                      <div className="flex gap-2">
                        {right.map((seat) => (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            selected={selected.includes(seat.id)}
                            onToggle={toggleSeat}
                            lang={lang}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 border-t border-border/60 pt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md border border-border bg-card">
                  <Armchair className="size-3.5" />
                </span>
                {t.seats.legendAvailable}
              </span>
              <span className="flex items-center gap-2">
                <span className="relative flex size-6 items-center justify-center rounded-md bg-secondary opacity-60 [background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,var(--border)_3px,var(--border)_4px)]">
                  <Armchair className="size-3.5" />
                </span>
                {t.seats.legendBooked}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
                {t.seats.legendSelected}
              </span>
            </div>
          </div>

          {/* Summary sidebar — sticky so totals stay visible while scrolling the seat map */}
          <aside className="sticky top-24 h-fit rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t.seats.selectedTitle}</h3>
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.seats.none}</p>
            ) : (
              <ul className="mb-4 flex flex-wrap gap-2">
                {selected.map((s) => (
                  <li
                    key={s}
                    className={`${displayFont(lang)} rounded-lg bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary`}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {limitNotice && (
              <p className="mb-4 text-xs text-destructive">{t.seats.max}</p>
            )}

            <div className="flex items-center justify-between border-t border-border/60 pt-4 text-sm">
              <span className="text-muted-foreground">{t.seats.pricePerSeat}</span>
              <span className="font-medium text-foreground">
                {localizeNumber(trip.price, lang)} {t.routes.currency}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base">
              <span className="font-semibold text-foreground">{t.common.total}</span>
              <span className={`${displayFont(lang)} font-semibold text-foreground`}>
                {localizeNumber(total, lang)} {t.routes.currency}
              </span>
            </div>

            <button
              onClick={continueToCheckout}
              disabled={selected.length === 0}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40"
            >
              {t.seats.continueToCheckout}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SeatButton({
  seat,
  selected,
  onToggle,
  lang,
}: {
  seat: { id: string; status: "available" | "booked" }
  selected: boolean
  onToggle: (id: string, status: "available" | "booked") => void
  lang: "fa" | "en"
}) {
  const t = dictionary[lang]
  const statusText = seat.status === "booked" ? t.seats.statusBooked : selected ? t.seats.statusSelected : t.seats.statusAvailable

  return (
    <button
      type="button"
      onClick={() => onToggle(seat.id, seat.status)}
      disabled={seat.status === "booked"}
      aria-label={`${t.seats.seatLabel} ${seat.id} — ${statusText}`}
      aria-pressed={selected}
      className={`relative flex size-10 items-center justify-center rounded-md text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-11 ${
        seat.status === "booked"
          ? "cursor-not-allowed bg-secondary text-muted-foreground/50 opacity-60 [background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,var(--border)_3px,var(--border)_4px)]"
          : selected
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Armchair className="size-4 sm:size-5" strokeWidth={2} />
      <span className="absolute -bottom-4 text-[9px] font-normal text-muted-foreground">{seat.id}</span>
      {selected && (
        <span className="absolute -end-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-background text-primary ring-1 ring-primary">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
