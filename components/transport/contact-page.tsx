"use client"

import { useState } from "react"
import { Building2, Clock, Mail, MapPin, Phone, Send } from "lucide-react"
import { cities, dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { toLatinDigits } from "@/lib/phone-utils"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { PlaceholderBadge } from "./placeholder-badge"

export function ContactPage() {
  const { lang } = useLang()
  const t = dictionary[lang]

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: Record<string, boolean> = {}
    if (!name.trim()) nextErrors.name = true
    if (!phone.trim()) nextErrors.phone = true
    if (!message.trim()) nextErrors.message = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSent(true)
  }

  const fieldBase =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <div className="mx-auto mb-12 max-w-2xl animate-rise-in text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {t.contact.kicker}
          </p>
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>
            {t.contact.title}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.contact.subtitle}</p>
        </div>

        {/* Corridor map — schematic, since exact office addresses/coordinates
            are not yet confirmed. Shows the real, confirmed geographic order
            of cities rather than a fabricated street map. */}
        <div className="mb-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-1 text-sm font-semibold text-foreground">{t.contact.mapTitle}</h2>
          <p className="mb-6 text-xs text-muted-foreground">{t.contact.mapNote}</p>
          <div dir="ltr" className="flex flex-wrap items-center justify-center gap-x-1 gap-y-4 sm:flex-nowrap sm:justify-between">
            {cities.map((c, i) => (
              <div key={c.en} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5" dir={lang === "fa" ? "rtl" : "ltr"}>
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <span className="whitespace-nowrap text-xs font-medium text-foreground">{c[lang]}</span>
                </div>
                {i < cities.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Offices */}
          <div>
            <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>{t.contact.officesTitle}</span>
              <PlaceholderBadge label={t.contact.hoursNote} />
            </h2>
            <div className="flex flex-col gap-4 3xl:grid 3xl:grid-cols-2 3xl:items-start">
              {t.offices.map((o, i) => {
                const officeLabel = lang === "fa" ? o.nameFa : o.nameEn
                const cityLabel = lang === "fa" ? o.cityFa : o.cityEn
                return (
                  <div key={`${o.cityEn}-${i}`} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-primary" />
                      <p className={`${displayFont(lang)} text-lg font-semibold text-foreground`}>{cityLabel}</p>
                      <span className="text-sm text-muted-foreground">— {officeLabel}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary" />
                        <PlaceholderBadge label={t.footer.officeDetailPlaceholder} />
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        {t.contact.hours}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Message form */}
          <div className="h-fit rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">{t.contact.formTitle}</h2>
            {sent ? (
              <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm leading-relaxed text-accent">
                {t.contact.sent}
              </p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.contact.formName}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.contact.formNamePh}
                    className={`${fieldBase} ${errors.name ? "border-destructive" : ""}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{t.contact.required}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.contact.formPhone}
                  </label>
                  <input
                    dir="ltr"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(toLatinDigits(e.target.value))}
                    placeholder="07xxxxxxxx"
                    className={`${fieldBase} text-start ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{t.contact.required}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.contact.formMessage}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.contact.formMessagePh}
                    rows={4}
                    className={`${fieldBase} resize-none ${errors.message ? "border-destructive" : ""}`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{t.contact.required}</p>}
                </div>
                <button
                  type="submit"
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Send className="size-4" />
                  {t.contact.formSubmit}
                </button>
              </form>
            )}

            <div className="mt-6 flex flex-col gap-2.5 border-t border-border/60 pt-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                {t.footer.contactPlaceholder}
              </span>
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                {t.footer.contactPlaceholder}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
