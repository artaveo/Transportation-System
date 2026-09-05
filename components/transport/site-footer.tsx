"use client"

import Link from "next/link"
import { Bus, Mail, MapPin, Phone } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { PlaceholderBadge } from "./placeholder-badge"

export function SiteFooter() {
  const { lang } = useLang()
  const t = dictionary[lang]

  // Group the confirmed offices by city (in corridor order) so the footer
  // stays compact even with 11 real offices (Kabul x3, Kandahar x2, ...).
  const grouped: { city: string; offices: string[] }[] = []
  for (const o of t.offices) {
    const cityLabel = lang === "fa" ? o.cityFa : o.cityEn
    const officeLabel = lang === "fa" ? o.nameFa : o.nameEn
    const existing = grouped.find((g) => g.city === cityLabel)
    if (existing) existing.offices.push(officeLabel)
    else grouped.push({ city: cityLabel, offices: [officeLabel] })
  }

  return (
    <footer id="offices" className="scroll-mt-16 border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        {/* فاز ۴.۸ (رفع ردیف #۲۴ — متوسط): رده میانی sm:grid-cols-2 اضافه شد
            تا تبلت عمودی مستقیم از تک‌ستونه به چهارستونه نپرد. */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bus className="size-5" strokeWidth={2.2} />
              </span>
              <span className={`${displayFont(lang)} text-xl font-semibold text-foreground`}>
                {t.brand}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
          </div>

          {/* Offices */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.footer.officesTitle}
            </h3>
            <ul className="flex flex-col gap-3">
              {grouped.map((g) => (
                <li key={g.city} className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{g.city}</span>
                    {g.offices.length > 1 ? ` — ${g.offices.join("، ")}` : ` — ${g.offices[0]}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <PlaceholderBadge label={t.footer.officeDetailPlaceholder} />
            </div>
          </div>

          {/* Quick links */}
          <div id="support">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.footer.quickTitle}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {t.footer.quick.map((q) => (
                <li key={q.href}>
                  <Link
                    href={q.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t.footer.contactTitle}
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                <span dir="ltr">{localizeNumber("+93 ??? ??? ???", lang)}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                <span dir="ltr">info@[placeholder-domain]</span>
              </li>
              <li>
                <PlaceholderBadge label={t.footer.contactPlaceholder} />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {localizeNumber(new Date().getFullYear(), lang)} {t.brand}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
