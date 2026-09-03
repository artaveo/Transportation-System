"use client"

import Link from "next/link"
import { Luggage, PackageCheck, ShieldAlert } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { PlaceholderBadge } from "./placeholder-badge"

export function LuggagePolicyPage() {
  const { lang } = useLang()
  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-10 text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.luggagePage.kicker}
          </p>
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.luggagePage.title}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.luggagePage.subtitle}</p>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Luggage className="size-5 text-primary" />
              {t.luggagePage.allowanceTitle}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{t.luggagePage.allowanceBody}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <PackageCheck className="size-5 text-primary" />
              {t.luggagePage.extraTitle}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{t.luggagePage.extraBody}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <ShieldAlert className="size-5 text-primary" />
              {t.luggagePage.prohibitedTitle}
            </h2>
            <ul className="flex flex-col gap-2">
              {t.luggagePage.prohibitedItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <PlaceholderBadge label={t.luggagePage.note} />

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/faq#luggage" className="font-medium text-primary hover:underline">
              {t.faq.title}
            </Link>
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
