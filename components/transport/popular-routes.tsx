"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { cities, dictionary, displayFont, localizeNumber, popularRoutes } from "@/lib/i18n"

export function PopularRoutes({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const Arrow = lang === "fa" ? ArrowLeft : ArrowRight

  return (
    <section id="routes" className="route-lines scroll-mt-16 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
              {t.routes.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{t.routes.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularRoutes.map((r) => (
            <Link
              key={`${r.from.en}-${r.to.en}`}
              href={`/search?from=${encodeURIComponent(r.from.en)}&to=${encodeURIComponent(r.to.en)}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              style={{ borderTopColor: r.accent, borderTopWidth: 3 }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={r.image || "/placeholder.svg"}
                  alt={r.to[lang]}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <span
                  className="absolute end-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-background"
                  style={{ backgroundColor: r.accent }}
                >
                  {localizeNumber(r.trips, lang)} {t.routes.trips} · {t.routes.daily}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span>{r.from[lang]}</span>
                  <Arrow className="size-4 shrink-0" style={{ color: r.accent }} />
                  <span>{r.to[lang]}</span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>
                    {t.routes.duration}: {localizeNumber(r.hours, lang)} {t.routes.hours}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.routes.startingFrom}</p>
                    <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`}>
                      {localizeNumber(r.price, lang)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        {t.routes.currency}
                      </span>
                    </p>
                  </div>
                  <span
                    className="text-sm font-medium transition-colors group-hover:underline"
                    style={{ color: r.accent }}
                  >
                    {t.routes.view}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
