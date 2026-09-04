import type { Metadata } from "next"
import { getActiveCities, getRoutesOverview } from "@/lib/supabase/queries"
import { RoutesIndex } from "@/components/transport/routes-index"

// این مسیر (`/routes`) طبق نقشهٔ مسیرهای سند مادر (بخش ۴.۳) هنوز به یک
// page.tsx واقعی وصل نشده بود. RoutesIndex از قبل نوشته شده بود اما دادهٔ
// خودش را از `getAllRoutes()` در lib/booking-data.ts می‌ساخت — تابعی که هر
// ۲۸ جفتِ ممکنِ شهرها را با اعداد کاملاً ساختگی (hash) فهرست می‌کرد. حالا
// Server Component است و فقط مسیرهای واقعاً ثبت‌شده در جدول `routes` را
// (با مدت سفر واقعی) پاس می‌دهد.
export const metadata: Metadata = {
  title: "مسیرها و قیمت‌ها | سفرِ شب‌رو",
}

export default async function RoutesPage() {
  const [cities, routes] = await Promise.all([getActiveCities(), getRoutesOverview()])

  return <RoutesIndex routes={routes} cities={cities} />
}
