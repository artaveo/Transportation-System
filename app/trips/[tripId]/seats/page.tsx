import Link from "next/link"
import { dictionary } from "@/lib/i18n"
import { getTripWithSeats } from "@/lib/supabase/queries"
import { SeatSelection } from "@/components/transport/seat-selection"
import { SiteHeader } from "@/components/transport/site-header"

// طبق فاز ۴.۲: نیازی به query param جداگانهٔ `date` نیست — service_date از
// خودِ رکورد سفر (tripId) خوانده می‌شود، نه از URL. این یک ساده‌سازی نسبت
// به نسخهٔ mock فاز قبل است (که date را جدا در URL نگه می‌داشت).
export default async function SeatsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const trip = await getTripWithSeats(tripId)

  if (!trip) {
    const t = dictionary.fa
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="text-muted-foreground">{t.search.noResults}</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            {t.confirm.home}
          </Link>
        </div>
      </div>
    )
  }

  return <SeatSelection trip={trip} />
}
