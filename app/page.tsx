import { TransportHome } from "@/components/transport/transport-home"
import { getActiveCities } from "@/lib/supabase/queries"

// از فاز ۴.۱ به بعد یک Server Component است: شهرهای فعال را از Supabase
// می‌خواند و به‌عنوان prop به TransportHome/HeroSearch (کلاینت) می‌دهد،
// طبق توصیهٔ صریح بخش ۴.۱ سند مادر برای اتصال کامپوننت‌های لیستی به داده
// واقعی. اگر دیتابیس در دسترس نباشد، آرایهٔ خالی برمی‌گردد و HeroSearch
// دراپ‌داون‌های خالی نشان می‌دهد (نه کرش).
export default async function Home() {
  const cities = await getActiveCities()
  return <TransportHome cities={cities} />
}
