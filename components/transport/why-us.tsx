"use client"

import { Ban, BusFront, CreditCard, MapPinned, QrCode, Users } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary, displayFont } from "@/lib/i18n"
import { PlaceholderBadge } from "./placeholder-badge"

const icons = [Ban, QrCode, Users, CreditCard, MapPinned, BusFront]

// Cycles through the site's existing chart palette so the six benefit cards
// don't all read as one flat, identical block — each gets its own icon tint
// and top-border accent, the same visual language already used for the
// popular-routes cards on the homepage.
const ACCENTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--primary)", "var(--accent)"]

export function WhyUs({ lang }: { lang: Lang }) {
  const t = dictionary[lang]

  return (
    <section className="route-lines py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.whyUs.kicker}
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
          </p>
          <h2 className={`break-words ${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.whyUs.title}
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.whyUs.subtitle}</p>
        </div>

        {/* فاز ۴.۸ (رفع ردیف #۲۵ — جزئی): رده‌های میانی xl/2xl اضافه شد تا
            گرید مستقیم از lg (۳ ستون) به 3xl (۶ ستون) نپرد. */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {t.whyUs.items.map((item, i) => {
            const Icon = icons[i] ?? BusFront
            const accent = ACCENTS[i % ACCENTS.length]

            if (item.placeholder) {
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-start rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-5"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </span>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <PlaceholderBadge label={t.whyUs.placeholderTag} />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              )
            }

            return (
              <div
                key={item.title}
                className="flex flex-col items-start rounded-2xl border border-border bg-card p-5"
                style={{ borderTopColor: accent, borderTopWidth: 3 }}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
                    color: accent,
                  }}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
