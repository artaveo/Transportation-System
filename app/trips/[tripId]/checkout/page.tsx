import Link from "next/link"
import { dictionary } from "@/lib/i18n"
import { getTripWithSeats } from "@/lib/supabase/queries"
import { CheckoutForm } from "@/components/transport/checkout-form"
import { SiteHeader } from "@/components/transport/site-header"

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>
  searchParams: Promise<{ seats?: string }>
}) {
  const { tripId } = await params
  const { seats } = await searchParams
  const trip = await getTripWithSeats(tripId)

  // فقط seat id هایی که واقعاً به همین سفر تعلق دارند نگه داشته می‌شوند —
  // یک محافظت سبک در برابر URL دستکاری‌شده؛ اعتبارسنجی قطعی و اتمیک همیشه
  // در confirm_booking (سمت سرور) انجام می‌شود، نه اینجا.
  const requestedIds = (seats || "").split(",").filter(Boolean)
  const seatIds = trip ? requestedIds.filter((id) => trip.seats.some((s) => s.id === id)) : []

  if (!trip || seatIds.length === 0) {
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

  return <CheckoutForm trip={trip} seatIds={seatIds} />
}
