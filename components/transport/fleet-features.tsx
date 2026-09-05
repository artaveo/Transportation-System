"use client"

import { Armchair, Clock, Luggage, Snowflake } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import { ResponsivePhoto } from "../ui/responsive-photo"

const icons = [Snowflake, Luggage, Armchair, Clock]

export function FleetFeatures({ lang }: { lang: Lang }) {
  const t = dictionary[lang]

  return (
    <section id="fleet" className="relative isolate scroll-mt-16 overflow-hidden border-y border-border/60 bg-background py-16 sm:py-24">
      {/* Real fleet photo as an atmospheric decorative band. Bounded to a
          fixed height (not the section's full height) because on mobile
          the section is very tall (4 cards stacked in 1 column) — letting
          a 4:5 photo fill that tall/narrow box would crop it down to an
          unrecognizable sliver. At `lg` the grid becomes 1 row of 4 cards
          and the section is short enough for the photo to cover it fully. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden sm:h-[460px] lg:inset-0 lg:h-auto">
        <ResponsivePhoto
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          mobile="/images/fleet-580-dusk-mobile.png"
          tablet="/images/fleet-580-dusk-tablet.png"
          desktop="/images/fleet-580-dusk.png"
          wide="/images/fleet-580-dusk-wide.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/55 to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className={`break-words ${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.fleet.title}
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            {t.fleet.subtitle}
          </p>
        </div>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.fleet.items.map((item, i) => {
            const Icon = icons[i]
            return (
              <div
                key={item.title}
                className="flex flex-col items-start rounded-2xl border border-white/10 bg-card/35 p-5 shadow-lg shadow-black/20 backdrop-blur-md"
              >
                <span className="flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
