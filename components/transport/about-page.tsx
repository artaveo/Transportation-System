"use client"

import Link from "next/link"
import { BadgeCheck, Camera, ShieldCheck, Users } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { FleetFeatures } from "./fleet-features"
import { PlaceholderBadge } from "./placeholder-badge"
import { ResponsivePhoto } from "../ui/responsive-photo"

export function AboutPage() {
  const { lang } = useLang()
  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Intro — real corridor photo (mountain highway at dusk) as the
          background, same family of treatment as the homepage hero and the
          fleet section's photo. Four device-tier crops (phase 4.6). */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ResponsivePhoto
            alt=""
            aria-hidden="true"
            className="size-full object-cover"
            mobile="/images/about-corridor-dusk-mobile.png"
            tablet="/images/about-corridor-dusk-tablet.png"
            desktop="/images/about-corridor-dusk.png"
            wide="/images/about-corridor-dusk-wide.png"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background/95" />
        </div>

        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="mb-4 flex animate-rise-in items-center justify-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.about.kicker}
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
          </p>
          <h1
            className={`text-balance ${displayFont(lang)} animate-rise-in text-4xl font-semibold leading-[1.1] tracking-tight text-foreground drop-shadow-sm sm:text-5xl`}
            style={{ animationDelay: "80ms" }}
          >
            {t.about.title}
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl animate-rise-in text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t.about.intro}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-secondary/40 py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {t.about.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className={`${displayFont(lang)} text-3xl font-semibold text-muted-foreground sm:text-4xl`}>—</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-md">
            <PlaceholderBadge label={t.about.statsPlaceholderNote} />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className={`${displayFont(lang)} text-2xl font-semibold tracking-tight text-foreground sm:text-3xl`}>
            {t.about.storyTitle}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t.about.storyBody}</p>
        </div>
      </section>

      {/* Safety & quality commitment */}
      <section className="border-y border-border/60 bg-secondary/40 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="size-5" strokeWidth={1.8} />
          </span>
          <h2 className={`${displayFont(lang)} text-2xl font-semibold tracking-tight text-foreground sm:text-3xl`}>
            {t.about.safetyTitle}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t.about.safetyBody}</p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <Camera className="size-4 shrink-0 text-muted-foreground" />
            {t.about.fleetPhotoNote}
          </div>
        </div>
      </section>

      {/* Fleet — shared with the homepage section; this is also the header's "fleet" nav target */}
      <FleetFeatures lang={lang} />

      {/* Bus types */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className={`text-balance ${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
              {t.about.busTypesTitle}
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.about.busTypesIntro}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-card p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <BadgeCheck className="size-3.5" />
                {t.busTypes.vip}
              </span>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t.about.vipDesc}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                <Users className="size-3.5" />
                {t.busTypes.standard}
              </span>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t.about.standardDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-secondary/40 py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 text-center sm:px-8">
          <h2 className={`${displayFont(lang)} text-2xl font-semibold text-foreground sm:text-3xl`}>
            {t.about.ctaTitle}
          </h2>
          <Link
            href="/"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t.about.ctaButton}
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
