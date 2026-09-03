"use client"

import { FileWarning } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

type LegalContent = {
  kicker: string
  title: string
  updatedLabel: string
  updatedValue: string
  notice: string
  sections: { heading: string; body: string }[]
}

/**
 * Shared shell for Terms & Conditions / Privacy Policy. Both are legal
 * documents this project cannot originate on the client's behalf — the
 * notice banner makes clear this is a structural draft, not final legal
 * copy, until the company's own team reviews it (see i18n.ts terms/privacy).
 */
function LegalPage({ content }: { content: LegalContent }) {
  const { lang } = useLang()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {content.kicker}
          </p>
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {content.updatedLabel}: {content.updatedValue}
          </p>
        </div>

        <div className="mb-8 flex items-start gap-2.5 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          {content.notice}
        </div>

        <div className="flex flex-col gap-6">
          {content.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="mb-2 text-lg font-semibold text-foreground">{s.heading}</h2>
              <p className="leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

export function TermsPage() {
  const { lang } = useLang()
  return <LegalPage content={dictionary[lang].terms} />
}

export function PrivacyPage() {
  const { lang } = useLang()
  return <LegalPage content={dictionary[lang].privacy} />
}
