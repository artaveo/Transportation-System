import Link from "next/link"
import { dictionary } from "@/lib/i18n"
import { getBookingByReference } from "@/lib/supabase/queries"
import { BookingConfirmation } from "@/components/transport/booking-confirmation"
import { SiteHeader } from "@/components/transport/site-header"

// نکتهٔ امنیتی: طبق فاز ۳.۲، رزروِ مهمان (customer_id = null) اصلاً از طریق
// anon RLS قابل‌خواندن نیست؛ این صفحه با service_role (در getBookingByReference)
// می‌خواند. برخلاف صفحهٔ آیندهٔ «پیگیری رزرو» (فاز ۴.۳) که باید علاوه بر کد
// رهگیری، شمارهٔ تماس را هم برای اثبات مالکیت بخواهد، این صفحه بلافاصله بعد
// از پرداخت باز می‌شود و فقط با ref کار می‌کند — دقیقاً مثل صفحهٔ موفقیت
// اکثر درگاه‌های پرداخت (نه یک ابزار عمومی جست‌وجوی رزرو).
export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams
  const booking = ref ? await getBookingByReference(ref) : null

  if (!booking) {
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

  return <BookingConfirmation booking={booking} />
}
