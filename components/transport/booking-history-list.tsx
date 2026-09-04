import Link from "next/link"
import { ArrowLeftRight, History } from "lucide-react"
import { dictionary, displayFont, localizeNumber } from "@/lib/i18n"
import type { Lang } from "@/lib/i18n"
import { cityLabel, formatTime } from "@/lib/booking-data"
import type { BookingHistoryItem } from "@/lib/supabase/queries"

export function BookingHistoryList({ bookings, lang }: { bookings: BookingHistoryItem[]; lang: Lang }) {
  const t = dictionary[lang]
  const statusLabels = t.admin.status as Record<string, string>

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{t.account.bookingHistoryTitle}</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">{t.account.bookingHistoryEmpty}</p>
          <Link
            href="/"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {t.account.startBooking}
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span>{cityLabel(b.trip.fromEn, lang)}</span>
                  <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{cityLabel(b.trip.toEn, lang)}</span>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {statusLabels[b.status] ?? b.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span dir="ltr">
                  {b.trip.serviceDate}
                  {b.trip.departMinutes !== null ? ` · ${formatTime(b.trip.departMinutes, lang)}` : ""}
                </span>
                <span className={displayFont(lang)}>
                  {localizeNumber(b.seatsCount, lang)} {t.common.seats} ·{" "}
                  <span dir="ltr">{localizeNumber(b.totalAmount, lang)}</span> {t.routes.currency}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                <span className={`${displayFont(lang)} text-xs font-medium text-primary`} dir="ltr">
                  {b.bookingReference}
                </span>
                <Link
                  href={`/trips/${b.trip.id}/confirmation?ref=${encodeURIComponent(b.bookingReference)}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t.account.viewBookingLink}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
