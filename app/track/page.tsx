import type { Metadata } from "next"
import { BookingLookup } from "@/components/transport/booking-lookup"

// این مسیر (`/track`) از قبل در فوتر (`lib/i18n.ts` → `footer.quick`) لینک
// شده بود، اما هرگز به یک app/track/page.tsx واقعی وصل نشده بود — دقیقاً
// همان الگوی «SearchResults قبل از فاز ۴.۱» که در نقشهٔ مسیرهای سند مادر
// (بخش ۴.۳) هم آمده. مسیر پیشنهادیِ خودِ سند مادر برای این کامپوننت
// («/my-booking») نادیده گرفته شد چون با شواهد واقعی کد (لینک فعلی فوتر)
// نمی‌خواند؛ طبق اصل «عدم جعل اطلاعات»، شواهد واقعی کد بر پیشنهاد سند
// ارجحیت دارد.
export const metadata: Metadata = {
  title: "پیگیری رزرو | سفرِ شب‌رو",
}

export default function TrackPage() {
  return <BookingLookup />
}
