"use client"

import { dictionary } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import type { CityOption } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"
import { HeroSearch } from "./hero-search"
import { PopularRoutes } from "./popular-routes"
import { DestinationsGrid } from "./destinations-grid"
import { WhyUs } from "./why-us"
import { FleetFeatures } from "./fleet-features"
import { TrustStats } from "./trust-stats"
import { SiteFooter } from "./site-footer"

export function TransportHome({ cities }: { cities: CityOption[] }) {
  const { lang } = useLang()

  return (
    <div dir={dictionary[lang].dir} className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main>
        <HeroSearch lang={lang} cities={cities} />
        <PopularRoutes lang={lang} />
        <DestinationsGrid lang={lang} />
        <WhyUs lang={lang} />
        <FleetFeatures lang={lang} />
        <TrustStats lang={lang} />
      </main>
      <SiteFooter />
    </div>
  )
}
