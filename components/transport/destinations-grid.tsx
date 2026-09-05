"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { cities, dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { getAllRoutes } from "@/lib/booking-data"

/**
 * Full destination list along the confirmed corridor (Kabul -> Herat),
 * rendered as a connected timeline rather than a flat card grid — this is
 * one physical route, and the layout should read that way. Replaces the
 * old "4 sample cards" teaser per the enrichment brief.
 */
export function DestinationsGrid({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const allRoutes = getAllRoutes()

  // Hours from Kabul, reusing the same seeded duration used by search
  // results/routes-index so the number is consistent everywhere on the site.
  function hoursFromKabul(cityEn: string): number | null {
    if (cityEn === cities[0].en) return 0
    const route = allRoutes.find(
      (r) => (r.fromEn === cities[0].en && r.toEn === cityEn) || (r.toEn === cities[0].en && r.fromEn === cityEn),
    )
    return route ? route.hours : null
  }

  return (
    <section className="border-y border-border/60 bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.destinationsSection.kicker}
          </p>
          <h2 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.destinationsSection.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{t.destinationsSection.subtitle}</p>
        </div>

        <div className="relative -mx-5 sm:mx-0">
          {/*
            dir="ltr" pins the corridor's visual order left-to-right (Kabul
            first) regardless of page language, since it mirrors real
            geography; each stop's own text still follows the page's direction.
          */}
          <div dir="ltr" className="overflow-x-auto px-5 pb-3 sm:overflow-visible sm:px-0">
            <div className="relative flex min-w-[860px] items-start justify-between sm:min-w-0">
              <div
                className="absolute inset-x-0 top-6 h-0.5 bg-gradient-to-r from-primary/15 via-primary to-primary/15"
                aria-hidden="true"
              />
              {cities.map((c, i) => {
                const hrs = hoursFromKabul(c.en)
                return (
                  <Link
                    key={c.en}
                    href={`/search?from=${encodeURIComponent(cities[0].en)}&to=${encodeURIComponent(c.en)}`}
                    dir={lang === "fa" ? "rtl" : "ltr"}
                    className="group relative z-10 flex w-24 shrink-0 flex-col items-center text-center focus-visible:outline-none"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-[0_0_0_4px_var(--secondary)] transition-transform group-hover:-translate-y-1 group-hover:scale-105">
                      <MapPin className="size-5" strokeWidth={2} />
                    </span>
                    <span className={`${displayFont(lang)} mt-3 text-sm font-semibold text-foreground`}>{c[lang]}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {i === 0 ? t.hero.origin : hrs !== null ? `${localizeNumber(hrs, lang)} ${t.routes.hours}` : ""}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Scroll affordance — fades the edges on mobile so the row reads
              as "scroll for more" instead of an abrupt, unfinished-looking
              cut-off icon at the viewport edge. Not needed once sm:
              switches to overflow-visible (everything fits, no scrolling).
              فاز ۴.۸ (رفع ردیف #۳ — متوسط): این دو المان همیشه left-0/right-0
              فیزیکی هستند (نه start-0/end-0 منطقی)، چون محتوای داخل همیشه
              dir="ltr" اجباری دارد (ترتیب جغرافیایی کابل→هرات) صرف‌نظر از
              جهت خودِ صفحه؛ استفاده از start/end منطقی روی نسخهٔ دری سمت
              گرادیان را برعکس می‌کرد. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-secondary/40 to-transparent sm:hidden"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-secondary/40 to-transparent sm:hidden"
            aria-hidden="true"
          />
        </div>

        <p className="mt-8 text-sm text-muted-foreground">{t.destinationsSection.corridorNote}</p>
      </div>
    </section>
  )
}
