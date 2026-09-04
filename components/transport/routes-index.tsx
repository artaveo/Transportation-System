"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { cityLabel } from "@/lib/booking-data"
import type { CityOption, RouteOverview } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { PlaceholderNote } from "./placeholder-badge"

export function RoutesIndex({ routes, cities }: { routes: RouteOverview[]; cities: CityOption[] }) {
  const { lang } = useLang()
  const t = dictionary[lang]
  const [origin, setOrigin] = useState("")

  const filtered = useMemo(
    () => (origin ? routes.filter((r) => r.fromEn === origin || r.toEn === origin) : routes),
    [routes, origin],
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 3xl:max-w-7xl 4xl:max-w-[110rem]">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.routesPage.kicker}
          </p>
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.routesPage.title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {t.routesPage.subtitle}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="mb-5">
          <PlaceholderNote>{t.routesPage.priceNote}</PlaceholderNote>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">{t.routesPage.filterLabel}</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="">{t.routesPage.filterAll}</option>
            {cities.map((c) => (
              <option key={c.nameEn} value={c.nameEn}>
                {lang === "fa" ? c.nameFa : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t.search.noResults}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">
                      {t.routesPage.colFrom}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">
                      {t.routesPage.colTo}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">
                      {t.routesPage.colDuration}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">
                      {t.routesPage.colPrice}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">
                      {t.routesPage.colDaily}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/40 last:border-0 hover:bg-secondary/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                        {cityLabel(r.fromEn, lang)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {cityLabel(r.toEn, lang)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {localizeNumber(Math.round(r.durationMinutes / 60), lang)} {t.routes.hours}
                      </td>
                      <td
                        className={`${displayFont(lang)} whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground`}
                      >
                        <span className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-1.5 py-0.5 text-destructive">
                          {r.startingPrice !== null ? `${localizeNumber(r.startingPrice, lang)} ${t.routes.currency}` : "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        <span className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-1.5 py-0.5 text-destructive">
                          {localizeNumber(r.upcomingTripsCount, lang)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-end">
                        <Link
                          href={`/search?from=${encodeURIComponent(r.fromEn)}&to=${encodeURIComponent(r.toEn)}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t.routesPage.view}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
