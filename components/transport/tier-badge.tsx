import { Award } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import type { CustomerAccount } from "@/lib/supabase/queries"

export function TierBadge({ account, lang }: { account: CustomerAccount; lang: Lang }) {
  const t = dictionary[lang]
  const tierName = lang === "fa" ? account.tier.nameFa : account.tier.nameEn
  const nextTierName = account.nextTier ? (lang === "fa" ? account.nextTier.nameFa : account.nextTier.nameEn) : null
  const tripsToNext = account.nextTier ? account.nextTier.minCompletedTrips - account.lifetimeCompletedTrips : 0

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Award className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{t.account.tierTitle}</p>
          <p className={`${displayFont(lang)} text-xl font-semibold text-foreground`}>{tierName}</p>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2.5 border-t border-border/60 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t.account.tripsCompletedLabel}</dt>
          <dd className={`${displayFont(lang)} font-medium text-foreground`}>
            {localizeNumber(account.lifetimeCompletedTrips, lang)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t.account.tierDiscountLabel}</dt>
          <dd className={`${displayFont(lang)} font-semibold text-accent`}>
            {localizeNumber(account.tier.discountPercent, lang)}٪
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-secondary/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {account.nextTier ? (
          <>
            {t.account.tripsToNextTierPrefix} {localizeNumber(tripsToNext, lang)} {t.account.tripsToNextTierSuffix}{" "}
            <span className="font-medium text-foreground">{nextTierName}</span>
          </>
        ) : (
          t.account.tierMaxReached
        )}
      </p>
    </div>
  )
}
