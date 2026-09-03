"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftRight,
  BatteryCharging,
  Coffee,
  Filter,
  Snowflake,
  Sofa,
  Wifi,
} from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { formatTime, type AmenityKey, type BusType } from "@/lib/booking-data"
import type { CityOption, SearchTrip } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

const amenityIcons: Record<AmenityKey, typeof Snowflake> = {
  ac: Snowflake,
  wifi: Wifi,
  charging: BatteryCharging,
  refreshment: Coffee,
  reclining: Sofa,
}

type SortKey = "earliest" | "cheapest" | "fastest"

// null یعنی سفر fill_and_go بدون ساعت حرکت ثابت — در فیلتر «زمان حرکت»
// جزو هیچ‌کدام از سه بازه حساب نمی‌شود (چون واقعاً نامشخص است، نه این‌که
// حدس زده شود).
function timeBand(depart: number | null): "morning" | "afternoon" | "evening" | null {
  if (depart === null) return null
  const h = Math.floor(depart / 60)
  if (h >= 5 && h < 12) return "morning"
  if (h >= 12 && h < 17) return "afternoon"
  return "evening"
}

export function SearchResults({
  cities,
  fromEn,
  toEn,
  date,
  trips: allTrips,
}: {
  cities: CityOption[]
  fromEn: string
  toEn: string
  date: string
  trips: SearchTrip[]
}) {
  const { lang } = useLang()
  const t = dictionary[lang]

  function cityLabel(nameEn: string): string {
    const c = cities.find((x) => x.nameEn === nameEn)
    return c ? (lang === "fa" ? c.nameFa : c.nameEn) : nameEn
  }

  // چند تاریخ متفاوت در نتیجه هست یا نه — وقتی کاربر تاریخ انتخاب نکرده،
  // /app/search/page.tsx همهٔ سفرهای از امروز به بعد را برمی‌گرداند، پس
  // هر کارت باید تاریخ خودش را جداگانه نشان دهد.
  const showsMultipleDates = !date

  const [sort, setSort] = useState<SortKey>("earliest")
  const [busTypes, setBusTypes] = useState<Set<BusType>>(new Set())
  const [amenities, setAmenities] = useState<Set<AmenityKey>>(new Set())
  const [bands, setBands] = useState<Set<"morning" | "afternoon" | "evening">>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)

  const priceBounds = useMemo(() => {
    if (allTrips.length === 0) return { min: 0, max: 0 }
    const prices = allTrips.map((tr) => tr.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [allTrips])
  const [maxPrice, setMaxPrice] = useState(priceBounds.max)

  // Reset the price cap whenever the route (and therefore its price range)
  // changes, so a leftover value from a previous search can't hide trips.
  useEffect(() => {
    setMaxPrice(priceBounds.max)
  }, [priceBounds.max])

  const trips = useMemo(() => {
    let list = allTrips.filter((trip) => {
      if (busTypes.size && !busTypes.has(trip.busType)) return false
      if (bands.size) {
        const band = timeBand(trip.departMinutes)
        if (!band || !bands.has(band)) return false
      }
      if (amenities.size && ![...amenities].every((a) => trip.amenities.includes(a))) return false
      if (trip.price > maxPrice) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === "cheapest") return a.price - b.price
      if (sort === "fastest") return a.durationMinutes - b.durationMinutes
      // سفرهای fill_and_go (بدون ساعت مشخص) در مرتب‌سازیِ «زودترین حرکت»
      // بعد از همهٔ سفرهای دارای ساعت ثابت قرار می‌گیرند.
      const aDepart = a.departMinutes ?? Number.POSITIVE_INFINITY
      const bDepart = b.departMinutes ?? Number.POSITIVE_INFINITY
      return aDepart - bDepart
    })
    return list
  }, [allTrips, busTypes, bands, amenities, sort, maxPrice])

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Route summary bar */}
      <div className="border-b border-border/60 bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className={`${displayFont(lang)} text-lg font-semibold text-foreground sm:text-xl`}>
              {cityLabel(fromEn)}
            </span>
            <ArrowLeftRight className="size-4 text-primary" aria-hidden="true" />
            <span className={`${displayFont(lang)} text-lg font-semibold text-foreground sm:text-xl`}>
              {cityLabel(toEn)}
            </span>
            {dateLabel && <span className="text-sm text-muted-foreground">· {dateLabel}</span>}
          </div>
          <Link
            href="/"
            className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t.search.editSearch}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className={`${displayFont(lang)} text-2xl font-semibold text-foreground`}>
              {t.search.resultsTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {localizeNumber(trips.length, lang)} {t.search.resultsSub}
            </p>
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-foreground lg:hidden"
            aria-expanded={filtersOpen}
          >
            <Filter className="size-4" />
            {t.search.filtersTitle}
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <div className="sticky top-24 flex flex-col gap-6 rounded-2xl border border-border bg-card p-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.search.sortTitle}</h3>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ["earliest", t.search.sortEarliest],
                      ["cheapest", t.search.sortCheapest],
                      ["fastest", t.search.sortFastest],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="sort"
                        checked={sort === key}
                        onChange={() => setSort(key)}
                        className="size-3.5 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>{t.search.priceRange}</span>
                  <span className={`${displayFont(lang)} font-normal text-muted-foreground`}>
                    {t.search.upTo} {localizeNumber(maxPrice, lang)} {t.routes.currency}
                  </span>
                </h3>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label={t.search.priceRange}
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{localizeNumber(priceBounds.min, lang)}</span>
                  <span>{localizeNumber(priceBounds.max, lang)}</span>
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.search.timeOfDay}</h3>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ["morning", t.search.morning],
                      ["afternoon", t.search.afternoon],
                      ["evening", t.search.evening],
                    ] as ["morning" | "afternoon" | "evening", string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={bands.has(key)}
                        onChange={() => toggle(bands, key, setBands)}
                        className="size-3.5 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.search.busType}</h3>
                <div className="flex flex-col gap-2">
                  {(["vip", "standard"] as BusType[]).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={busTypes.has(key)}
                        onChange={() => toggle(busTypes, key, setBusTypes)}
                        className="size-3.5 accent-primary"
                      />
                      {t.busTypes[key]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.search.amenities}</h3>
                <div className="flex flex-col gap-2">
                  {(Object.keys(amenityIcons) as AmenityKey[]).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={amenities.has(key)}
                        onChange={() => toggle(amenities, key, setAmenities)}
                        className="size-3.5 accent-primary"
                      />
                      {t.amenities[key]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Trip list */}
          <div className="flex flex-col gap-4">
            {trips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                {t.search.noResults}
              </div>
            ) : (
              trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} lang={lang} showDate={showsMultipleDates} />
              ))
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

function TripCard({
  trip,
  lang,
  showDate,
}: {
  trip: SearchTrip
  lang: "fa" | "en"
  showDate: boolean
}) {
  const t = dictionary[lang]
  const hasFixedTime = trip.departMinutes !== null
  const arrive = hasFixedTime ? trip.departMinutes! + trip.durationMinutes : null
  const hours = Math.floor(trip.durationMinutes / 60)
  const mins = trip.durationMinutes % 60
  const isFull = trip.seatsLeft === 0
  const seatsParams = new URLSearchParams({ date: trip.serviceDate })
  const tripDateLabel = showDate
    ? new Date(trip.serviceDate + "T00:00:00").toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="text-center">
            {hasFixedTime ? (
              <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`} dir="ltr">
                {formatTime(trip.departMinutes!, lang)}
              </p>
            ) : (
              <p className={`${displayFont(lang)} text-sm font-semibold text-primary`}>
                {t.search.flexibleDeparture}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {tripDateLabel ? `${tripDateLabel} · ` : ""}
              {t.search.departure}
            </p>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="text-xs text-muted-foreground">
              {localizeNumber(hours, lang)}{t.search.hours} {mins ? localizeNumber(mins, lang) : ""}
            </span>
            <span className="my-1 h-px w-10 bg-border" />
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: trip.busType === "vip" ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "var(--secondary)",
                color: trip.busType === "vip" ? "var(--primary)" : "var(--secondary-foreground)",
              }}
            >
              {t.busTypes[trip.busType]}
            </span>
          </div>
          <div className="text-center">
            {hasFixedTime ? (
              <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`} dir="ltr">
                {formatTime(arrive!, lang)}
              </p>
            ) : (
              <p className={`${displayFont(lang)} text-xl font-semibold text-muted-foreground`}>—</p>
            )}
            <p className="text-xs text-muted-foreground">{t.search.arrival}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:border-s sm:border-border/60 sm:ps-6">
          {trip.amenities.map((a) => {
            const Icon = amenityIcons[a]
            return (
              <span
                key={a}
                title={t.amenities[a]}
                className="flex size-8 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground"
              >
                <Icon className="size-4" />
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:text-end">
        <div>
          <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`}>
            {localizeNumber(trip.price, lang)} <span className="text-sm font-normal text-muted-foreground">{t.routes.currency}</span>
          </p>
          <p className={`text-xs ${isFull ? "text-destructive" : "text-accent"}`}>
            {isFull ? t.search.full : `${localizeNumber(trip.seatsLeft, lang)} ${t.search.seatsLeft}`}
          </p>
        </div>
        {isFull ? (
          <span className="cursor-not-allowed rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-muted-foreground">
            {t.search.selectSeats}
          </span>
        ) : (
          <Link
            href={`/trips/${trip.id}/seats?${seatsParams.toString()}`}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t.search.selectSeats}
          </Link>
        )}
      </div>
    </div>
  )
}
