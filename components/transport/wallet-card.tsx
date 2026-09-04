import { Wallet } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import type { CustomerAccount } from "@/lib/supabase/queries"

const TX_LABEL_KEYS = ["cashback", "referral_bonus", "redeemed", "manual_adjustment"] as const

export function WalletCard({ account, lang }: { account: CustomerAccount; lang: Lang }) {
  const t = dictionary[lang]

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Wallet className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{t.account.walletTitle}</p>
          <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`}>
            {localizeNumber(account.walletBalance, lang)} {t.routes.currency}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
        {account.walletTransactions.length === 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{t.account.walletEmpty}</p>
        ) : (
          account.walletTransactions.slice(0, 6).map((tx) => {
            const typeLabel = TX_LABEL_KEYS.includes(tx.type as (typeof TX_LABEL_KEYS)[number])
              ? t.account.walletTxType[tx.type as (typeof TX_LABEL_KEYS)[number]]
              : tx.type
            const dateLabel = new Date(tx.createdAt).toLocaleDateString(lang === "fa" ? "fa-AF-u-nu-arabext" : "en-US", {
              month: "short",
              day: "numeric",
            })
            return (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {typeLabel} · {dateLabel}
                </span>
                <span
                  className={`${displayFont(lang)} font-medium ${tx.amount >= 0 ? "text-accent" : "text-destructive"}`}
                  dir="ltr"
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {localizeNumber(tx.amount, lang)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
