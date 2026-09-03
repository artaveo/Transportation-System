"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, Info, MapPin, Search, Users } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import type { CityOption } from "@/lib/supabase/queries"
import { DatePicker } from "./date-picker"

export function HeroSearch({ lang, cities }: { lang: Lang; cities: CityOption[] }) {
  const t = dictionary[lang]
  const router = useRouter()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")

  function swap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const from = origin || cities[0]?.nameEn || ""
    const to = destination && destination !== from ? destination : cities[1]?.nameEn || ""
    const params = new URLSearchParams({ from, to })
    if (date) params.set("date", date)
    router.push(`/search?${params.toString()}`)
  }

  const fieldBase =
    "w-full rounded-xl border border-border bg-background/60 py-3 text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <section className="relative isolate">
      {/* Dusk sky atmospheric anchor */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero-road-dusk.png"
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent rtl:bg-gradient-to-l" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="max-w-2xl animate-rise-in">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.hero.kicker}
          </p>
          <h1 className={`text-balance ${displayFont(lang)} text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl`}>
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Search form — the hero's main element */}
        <form
          onSubmit={submit}
          className="mt-9 animate-rise-in rounded-2xl border border-border bg-card/85 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:mt-12 sm:p-5"
          style={{ animationDelay: "120ms" }}
        >
          <p className="mb-3.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t.hero.helper}
          </p>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_1fr_auto] lg:items-end">
            {/* Origin */}
            <div className="relative">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t.hero.origin}
              </label>
              <MapPin className="pointer-events-none absolute bottom-3.5 start-3 size-4 text-primary" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className={`${fieldBase} appearance-none ps-9 pe-3`}
              >
                <option value="">{t.hero.originPlaceholder}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.nameEn}>
                    {lang === "fa" ? c.nameFa : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap */}
            <button
              type="button"
              onClick={swap}
              className="mx-auto flex size-10 shrink-0 items-center justify-center self-center rounded-full border border-border bg-background text-primary transition-transform hover:rotate-180 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:mb-1"
              aria-label={t.hero.swap}
            >
              <ArrowRightLeft className="size-4" />
            </button>

            {/* Destination */}
            <div className="relative">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t.hero.destination}
              </label>
              <MapPin className="pointer-events-none absolute bottom-3.5 start-3 size-4 text-accent" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`${fieldBase} appearance-none ps-9 pe-3`}
              >
                <option value="">{t.hero.destinationPlaceholder}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.nameEn}>
                    {lang === "fa" ? c.nameFa : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <DatePicker lang={lang} value={date} onChange={setDate} />

            {/* Submit */}
            <button
              type="submit"
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Search className="size-4" />
              {t.hero.search}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>1 {t.hero.passenger}</span>
          </div>
        </form>
      </div>
    </section>
  )
}
