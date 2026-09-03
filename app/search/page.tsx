import type { Metadata } from "next"
import { cities as staticCities } from "@/lib/i18n"
import { getActiveCities, searchTrips } from "@/lib/supabase/queries"
import { SearchResults } from "@/components/transport/search-results"

// این تنها روت واقعی جدیدی است که در فاز ۴.۱ ساخته شده؛ طبق نقشهٔ مسیرهای
// سند مادر (بخش ۴.۳)، SearchResults از قبل نوشته شده بود اما هرگز به یک
// app/search/page.tsx واقعی وصل نشده بود.

type SearchPageProps = {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { from, to } = await searchParams
  const fromLabel = staticCities.find((c) => c.en === from)?.fa ?? from ?? ""
  const toLabel = staticCities.find((c) => c.en === to)?.fa ?? to ?? ""
  const title = from && to ? `${fromLabel} به ${toLabel} | سفرِ شب‌رو` : "نتایج جست‌وجو | سفرِ شب‌رو"
  return { title }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  // اعتبارسنجی مقادیر ورودی دقیقاً مثل منطق قبلیِ خودِ SearchResults (که
  // قبلاً این کار را با لیست ثابت i18n انجام می‌داد)، اما حالا در برابر
  // شهرهای واقعی و فعالِ دیتابیس.
  const cities = await getActiveCities()
  const fallbackFrom = cities[0]?.nameEn ?? staticCities[0].en
  const fallbackTo = cities[1]?.nameEn ?? staticCities[1].en

  const fromEn = params.from && cities.some((c) => c.nameEn === params.from) ? params.from : fallbackFrom
  const toEnRaw = params.to && cities.some((c) => c.nameEn === params.to) ? params.to : fallbackTo
  const toEn = toEnRaw === fromEn ? cities.find((c) => c.nameEn !== fromEn)?.nameEn ?? fallbackTo : toEnRaw
  const date = params.date ?? ""

  const trips = await searchTrips({ fromEn, toEn, date: date || undefined })

  return <SearchResults cities={cities} fromEn={fromEn} toEn={toEn} date={date} trips={trips} />
}
