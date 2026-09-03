"use client"

import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import { PlaceholderBadge } from "./placeholder-badge"

/**
 * Homepage trust-building stats strip. Per the no-fabrication rule, every
 * value here is an explicit placeholder until the company provides real
 * figures — showing "10 years / 60+ coaches" etc. as if confirmed was the
 * exact problem this section replaces.
 */
export function TrustStats({ lang }: { lang: Lang }) {
  const t = dictionary[lang]

  return (
    <section className="border-y border-border/60 bg-secondary/40 py-12">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className={`${displayFont(lang)} text-xl font-semibold text-foreground sm:text-2xl`}>
            {t.trustStats.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.trustStats.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {t.trustStats.items.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-5 text-center"
            >
              <p className={`${displayFont(lang)} text-3xl font-semibold text-muted-foreground sm:text-4xl`}>—</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <PlaceholderBadge label={t.trustStats.placeholderTag} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
