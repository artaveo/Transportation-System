"use client"

import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useSiteSettings } from "@/lib/hooks/use-site-content"
import { PlaceholderBadge } from "./placeholder-badge"

/**
 * Homepage trust-building stats strip. Per the no-fabrication rule, every
 * value here stays an explicit placeholder until the company provides real
 * figures — showing "10 years / 60+ coaches" etc. as if confirmed was the
 * exact problem this section replaces.
 *
 * فاز ۵.۱۳: مقادیر حالا از site_settings (پنل «محتوای سایت») می‌آیند؛ هر
 * آیتم مستقل است — هرکدام که Zakir هنوز پر نکرده باشد همچنان «—» و
 * badge نشان می‌دهد، بدون اینکه روی بقیه اثر بگذارد.
 */
export function TrustStats({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const { settings } = useSiteSettings()

  const values = [settings?.about_years_active ?? null, settings?.about_cities_covered ?? null, settings?.about_daily_trips ?? null]

  return (
    <section className="border-y border-border/60 bg-secondary/40 py-12">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 3xl:max-w-6xl 4xl:max-w-7xl">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className={`${displayFont(lang)} text-xl font-semibold text-foreground sm:text-2xl`}>
            {t.trustStats.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.trustStats.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {t.trustStats.items.map((s, i) => {
            const value = values[i]
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center ${
                  value !== null ? "border-border bg-card" : "border-dashed border-destructive/40 bg-destructive/5"
                }`}
              >
                <p className={`${displayFont(lang)} text-3xl font-semibold ${value !== null ? "text-foreground" : "text-muted-foreground"} sm:text-4xl`}>
                  {value !== null ? localizeNumber(value, lang) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                {value === null && <PlaceholderBadge label={t.trustStats.placeholderTag} />}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
