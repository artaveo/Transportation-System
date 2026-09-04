"use client"

import { useState } from "react"
import { Check, Copy, Users } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import type { CustomerAccount } from "@/lib/supabase/queries"

export function ReferralCard({ account, lang }: { account: CustomerAccount; lang: Lang }) {
  const t = dictionary[lang]
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(account.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // کپی خودکار در برخی مرورگرها/زمینه‌های غیر-HTTPS ممکن نیست؛ کد همچنان
      // به‌صورت متن قابل‌انتخاب روی صفحه هست.
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{t.account.referralTitle}</p>
          <p className={`${displayFont(lang)} text-xl font-semibold tracking-wide text-foreground`} dir="ltr">
            {account.referralCode}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t.account.referralSubtitle}</p>

      <button
        type="button"
        onClick={copyCode}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
        {copied ? t.account.referralCopied : t.account.referralCopy}
      </button>

      <div className="mt-4 flex justify-between border-t border-border/60 pt-3 text-sm">
        <span className="text-muted-foreground">{t.account.referralCompletedCountLabel}</span>
        <span className={`${displayFont(lang)} font-medium text-foreground`}>
          {localizeNumber(account.completedReferralCount, lang)}
        </span>
      </div>
    </div>
  )
}
