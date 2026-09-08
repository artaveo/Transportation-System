"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, MapPin, Search } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import type { CityOption } from "@/lib/supabase/queries"
import { useResponsiveImageSet } from "@/lib/hooks/use-responsive-image-set"
import { DatePicker } from "./date-picker"
import { ResponsivePhoto } from "../ui/responsive-photo"

export function HeroSearch({ lang, cities }: { lang: Lang; cities: CityOption[] }) {
  const t = dictionary[lang]
  const router = useRouter()
  // فاز ۵.۱۴: عکس پس‌زمینه از پنل «عکس‌های چندبرشی» (اگر آپلود شده) وگرنه
  // همان فایل استاتیک فعلی.
  const heroImages = useResponsiveImageSet("hero")
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

  return (
    <section className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 aspect-[1122/1402] md:aspect-[1448/1086] lg:aspect-[1672/941] 3xl:aspect-[1915/821]">
        <ResponsivePhoto
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          priority
          objectPosition="34% 62%"
          mobile={heroImages.mobile}
          tablet={heroImages.tablet}
          desktop={heroImages.desktop}
          wide={heroImages.wide}
        />
        {/* عمودی: تیره‌ترین نقطه دقیقاً لبهٔ بالا (پشت کیکر) و لبهٔ پایین
            (محو به رنگ solid پشت پنل جست‌وجو) است؛ نقطهٔ ۶۲٪ — همان لنگر
            object-position بالا — عمداً کم‌رنگ‌ترین نقطه می‌ماند تا بس زیر
            هیچ breakpoint ای پوشیده نشود. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 from-[0%] via-background/8 via-[62%] to-background/88 to-[100%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/65 to-transparent rtl:bg-gradient-to-l" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 pb-8 pt-8 aspect-[1122/1402] sm:px-8 sm:pb-16 sm:pt-20 sm:gap-10 md:aspect-[1448/1086] md:pb-20 md:pt-24 lg:aspect-[1672/941] 3xl:aspect-[1915/821] 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="max-w-2xl animate-rise-in">
          <p className="mb-2.5 hidden items-center gap-2 text-sm font-medium text-primary sm:mb-4 sm:flex">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.hero.kicker}
          </p>
          <h1 className={`break-words ${displayFont(lang)} text-2xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl sm:leading-[1.1] lg:text-6xl`}>
            {t.hero.title}
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="animate-rise-in overflow-hidden rounded-2xl border border-border bg-card/85 shadow-2xl shadow-black/40 backdrop-blur-md"
          style={{ animationDelay: "120ms" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_auto] lg:items-stretch">
            <div className="relative order-3 border-b border-border/60 px-4 py-2.5 lg:order-none lg:border-b-0 lg:border-e lg:px-5 lg:py-3">
              <label htmlFor="hero-origin" className="block text-[11px] font-medium text-muted-foreground">
                {t.hero.origin}
              </label>
              <div className="mt-0.5 flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" />
                <select
                  id="hero-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full truncate appearance-none bg-transparent py-1.5 text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="">{t.hero.originPlaceholder}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.nameEn}>
                      {lang === "fa" ? c.nameFa : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="order-4 flex items-center justify-center py-1 lg:order-none lg:py-0">
              <button
                type="button"
                onClick={swap}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary transition-transform hover:rotate-180 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label={t.hero.swap}
              >
                <ArrowRightLeft className="size-4" />
              </button>
            </div>

            <div className="relative order-5 px-4 py-2.5 lg:order-none lg:border-e lg:border-border/60 lg:px-5 lg:py-3">
              <label htmlFor="hero-destination" className="block text-[11px] font-medium text-muted-foreground">
                {t.hero.destination}
              </label>
              <div className="mt-0.5 flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-accent" />
                <select
                  id="hero-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full truncate appearance-none bg-transparent py-1.5 text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="">{t.hero.destinationPlaceholder}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.nameEn}>
                      {lang === "fa" ? c.nameFa : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="order-2 border-b border-border/60 px-4 py-2.5 lg:order-none lg:border-b-0 lg:border-e lg:px-5 lg:py-3">
              <DatePicker lang={lang} value={date} onChange={setDate} variant="plain" />
            </div>

            <button
              type="submit"
              className="order-1 flex h-12 items-center justify-center gap-2 border-b border-border/60 bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:order-none lg:h-auto lg:border-b-0 lg:border-e-0"
            >
              <Search className="size-4" />
              {t.hero.search}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
