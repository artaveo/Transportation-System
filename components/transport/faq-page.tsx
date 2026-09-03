"use client"

import { ChevronDown } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

// Anchor ids for the groups other pages deep-link to. Group order is:
// 0 Booking, 1 Payment, 2 Cancellation & refund, 3 Luggage, 4 During travel.
const ANCHOR_BY_INDEX: Record<number, string> = {
  2: "cancellation",
  3: "luggage",
}

export function FaqPage() {
  const { lang } = useLang()
  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-10 animate-rise-in text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.faq.kicker}
          </p>
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.faq.title}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.faq.subtitle}</p>
        </div>

        <div className="flex flex-col gap-10">
          {t.faq.groups.map((group, gi) => (
            <section key={group.title} id={ANCHOR_BY_INDEX[gi]} className="scroll-mt-20">
              <h2 className={`${displayFont(lang)} mb-4 text-xl font-semibold text-foreground`}>{group.title}</h2>
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl border border-border bg-card px-5 py-4 open:border-primary/40"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground marker:content-none">
                      {item.q}
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
