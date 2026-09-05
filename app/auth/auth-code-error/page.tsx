"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { dictionary } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { SiteHeader } from "@/components/transport/site-header"
import { SiteFooter } from "@/components/transport/site-footer"

/**
 * فاز ۴.۷ — مقصد app/auth/confirm/route.ts وقتی verifyOtp شکست بخورد
 * (لینک ایمیل منقضی‌شده، قبلاً استفاده‌شده، یا دست‌کاری‌شده). این مسیر
 * عمومی است (خارج از /account، پس middleware.ts روی آن اثر ندارد).
 */
export default function AuthCodeErrorPage() {
  const { lang } = useLang()
  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-md px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
          <AlertTriangle className="size-9 text-destructive" strokeWidth={1.8} />
          <p className="font-semibold text-foreground">{t.account.resetLinkInvalidTitle}</p>
          <p className="text-sm text-muted-foreground">{t.account.resetLinkInvalidBody}</p>
          <Link
            href="/account/forgot-password"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {t.account.requestNewLink}
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
