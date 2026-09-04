"use client"

import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import type { BookingHistoryItem, CustomerAccount } from "@/lib/supabase/queries"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { TierBadge } from "./tier-badge"
import { WalletCard } from "./wallet-card"
import { ReferralCard } from "./referral-card"
import { BookingHistoryList } from "./booking-history-list"
import { AccountLogoutButton } from "./account-logout-button"

export function AccountDashboard({
  account,
  bookings,
}: {
  account: CustomerAccount
  bookings: BookingHistoryItem[]
}) {
  const { lang } = useLang()
  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${displayFont(lang)} text-2xl font-semibold tracking-tight text-foreground sm:text-3xl`}>
              {t.account.dashboardTitle}
            </h1>
            {account.fullName && <p className="mt-1 text-sm text-muted-foreground">{account.fullName}</p>}
          </div>
          <AccountLogoutButton />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <TierBadge account={account} lang={lang} />
          <WalletCard account={account} lang={lang} />
          <ReferralCard account={account} lang={lang} />
        </div>

        <div className="mt-5">
          <BookingHistoryList bookings={bookings} lang={lang} />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
