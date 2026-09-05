"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, Info, MapPin, Search, Users } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import type { CityOption } from "@/lib/supabase/queries"
import { DatePicker } from "./date-picker"
import { ResponsivePhoto } from "../ui/responsive-photo"

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
      {/* Dusk sky atmospheric anchor. Mobile + desktop crops are the real
          hero photos (phase 4.6). tablet/wide crops below are TEMPORARY —
          they reuse about-page's corridor-dusk images (which happen to be
          the exact same pixel dimensions as what hero needs at those
          tiers, since both were generated from the same v0.dev prompt
          family), until the real hero-specific tablet/wide crops exist.
          [PLACEHOLDER] فاز ۴.۶ (تکمیل ردیف #۱۰): عکس واقعی هیروی
          تبلت/عریض هنوز وجود ندارد — پرامپت اصلی v0.dev این عکس در دسترس
          Zakir نیست. به‌جای حدس‌زدن پرامپت جدید، موقتاً از عکس صفحهٔ
          درباره‌ما (`about-corridor-dusk-tablet.png` / `-wide.png`) که
          دقیقاً هم‌ابعاد نسخهٔ موبایل/دسکتاپ هیرو هستند استفاده شد. باید
          هر وقت عکس واقعی هیرو برای این دو ردهٔ دیگر ساخته شد (تصمیم
          Zakir)، این دو خط جایگزین شوند. */}
      <div className="absolute inset-0 -z-10">
        <ResponsivePhoto
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          mobile="/images/hero-road-dusk-mobile.png"
          tablet="/images/about-corridor-dusk-tablet.png"
          desktop="/images/hero-road-dusk.png"
          wide="/images/about-corridor-dusk-wide.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent rtl:bg-gradient-to-l" />
      </div>

      {/* فاز ۴.۸ (رفع ردیف #۱۸ — بحرانی): فاصله‌گذاری عمودی روی موبایل جمع‌تر
          شد («هیرو = MVP») تا کل ویجت جستجو بدون اسکرول دیده شود؛ خودِ متن
          تیتر/زیرتیتر تغییر نکرده (کوتاه‌کردن محتوا نیاز به هماهنگی با
          Zakir دارد — یادداشت در چک‌لیست پایان فاز). */}
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pb-16 sm:pt-20 md:pb-20 md:pt-24 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="max-w-2xl animate-rise-in">
          <p className="mb-2.5 flex items-center gap-2 text-sm font-medium text-primary sm:mb-4">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.hero.kicker}
          </p>
          <h1 className={`break-words ${displayFont(lang)} text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl`}>
            {t.hero.title}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Search form — the hero's main element */}
        <form
          onSubmit={submit}
          className="mt-5 animate-rise-in rounded-2xl border border-border bg-card/85 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-md sm:mt-12 sm:p-5"
          style={{ animationDelay: "120ms" }}
        >
          <p className="mb-2.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:mb-3.5">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t.hero.helper}
          </p>

          {/* Tablet-portrait and up: origin/destination pair with the date
              picker on its own row, so 768-1023px doesn't stay pinned to a
              single stacked column. Full 5-column inline layout only kicks
              in from 1280px (xl) — 1024px (tablet-landscape) was too tight
              for five inline controls including the date picker. */}
          <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1fr_auto] xl:items-end">
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
              className="flex size-10 shrink-0 items-center justify-center self-center justify-self-center rounded-full border border-border bg-background text-primary transition-transform hover:rotate-180 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:col-span-2 xl:col-span-1 xl:mb-1"
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
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:col-span-2 xl:col-span-1"
            >
              <Search className="size-4" />
              {t.hero.search}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2 text-sm text-muted-foreground sm:mt-3 sm:pt-3">
            <Users className="size-4" />
            <span>1 {t.hero.passenger}</span>
          </div>
        </form>
      </div>
    </section>
  )
}
