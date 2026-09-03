import { createClient } from "@/lib/supabase/server"
import { isoToday } from "@/lib/date-utils"
import type { AmenityKey, BusType } from "@/lib/booking-data"

/**
 * لایهٔ دسترسی به دادهٔ واقعی Supabase برای جست‌وجوی مسیر و نمایش نتایج
 * (فاز ۴.۱). فقط از Server Component ها فراخوانی شود — از کلاینت anon
 * (lib/supabase/server.ts) استفاده می‌کند، دقیقاً همان کلاینتی که فاز ۳.۳
 * ساخت. هیچ عملیات نوشتن حساسی اینجا انجام نمی‌شود.
 */

export type CityOption = {
  id: string
  nameEn: string
  nameFa: string
}

export type SearchTrip = {
  id: string
  fromEn: string
  toEn: string
  serviceDate: string // ISO yyyy-mm-dd
  /** null یعنی schedule_type = fill_and_go (بدون ساعت حرکت ثابت) */
  departMinutes: number | null
  scheduleType: "fixed_time" | "fill_and_go"
  durationMinutes: number
  price: number
  seatsLeft: number
  totalSeats: number
  busType: BusType
  amenities: AmenityKey[]
}

const KNOWN_AMENITIES: AmenityKey[] = ["ac", "wifi", "charging", "refreshment", "reclining"]

function timeStringToMinutes(time: string | null): number | null {
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * فهرست شهرهای فعال، به ترتیب واقعیِ کریدور (cities.display_order).
 * جایگزین لیست ثابت `cities` در lib/i18n.ts برای اجزایی که حالا به دادهٔ
 * واقعی وصل شده‌اند (HeroSearch). خودِ lib/i18n.ts دست‌نخورده می‌ماند چون
 * کامپوننت‌های دیگر (فاز ۴.۲ به بعد) هنوز به آن وابسته‌اند.
 */
export async function getActiveCities(): Promise<CityOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .select("id, name_en, name_fa")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("[getActiveCities] Supabase error:", error.message)
    return []
  }

  return (data ?? []).map((c) => ({ id: c.id, nameEn: c.name_en, nameFa: c.name_fa }))
}

/**
 * جست‌وجوی سفرهای واقعی برای یک جفت شهر (بر اساس name_en، دقیقاً همان
 * شناسهٔ متنی که در سراسر اپ برای لینک‌ها/پارامترهای URL استفاده می‌شود).
 * اگر `date` داده نشود، همهٔ سفرهای از امروز به بعد برگردانده می‌شود (چند
 * تاریخ در یک لیست) و SearchResults باید تاریخ هر کارت را جداگانه نشان دهد.
 */
export async function searchTrips(params: {
  fromEn: string
  toEn: string
  date?: string
}): Promise<SearchTrip[]> {
  const { fromEn, toEn, date } = params
  const supabase = await createClient()

  const { data: cityRows, error: cityError } = await supabase
    .from("cities")
    .select("id, name_en")
    .in("name_en", [fromEn, toEn])

  if (cityError) {
    console.error("[searchTrips] city lookup failed:", cityError.message)
    return []
  }

  const originCity = cityRows?.find((c) => c.name_en === fromEn)
  const destinationCity = cityRows?.find((c) => c.name_en === toEn)
  if (!originCity || !destinationCity) return []

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, typical_duration_minutes")
    .eq("origin_city_id", originCity.id)
    .eq("destination_city_id", destinationCity.id)
    .eq("is_active", true)
    .maybeSingle()

  if (routeError) {
    console.error("[searchTrips] route lookup failed:", routeError.message)
    return []
  }
  // مسیری برای این جهت مشخص تعریف نشده (هنوز در پنل ادمین ثبت نشده) —
  // نتیجهٔ خالی، نه خطا. جدول routes جهت‌دار است، پس Herat→Kabul رکورد
  // جداگانه‌ای از Kabul→Herat است.
  if (!route) return []

  let tripsQuery = supabase
    .from("trips")
    .select(
      `id, service_date, departure_time, schedule_type, price_per_seat,
       total_seats_snapshot, status,
       bus:buses(bus_type, amenities),
       trip_seats(status)`,
    )
    .eq("route_id", route.id)
    .in("status", ["scheduled", "boarding"])

  tripsQuery = date ? tripsQuery.eq("service_date", date) : tripsQuery.gte("service_date", isoToday())

  const { data: tripRows, error: tripsError } = await tripsQuery
    .order("service_date", { ascending: true })
    .order("departure_time", { ascending: true, nullsFirst: false })

  if (tripsError) {
    console.error("[searchTrips] trips lookup failed:", tripsError.message)
    return []
  }

  return (tripRows ?? []).map((row): SearchTrip => {
    const seatRows = (row.trip_seats ?? []) as { status: string }[]
    // اگر نقشهٔ صندلی هنوز برای این سفر تولید نشده (trip_seats خالی)، فرض
    // می‌شود همهٔ ظرفیت خالی است؛ نه صفر — تا سفرهای تازه‌ساخته‌شدهٔ ادمین
    // که هنوز trip_seats ندارند به‌اشتباه «تکمیل» نشان داده نشوند.
    const seatsLeft =
      seatRows.length > 0 ? seatRows.filter((s) => s.status === "available").length : row.total_seats_snapshot

    const bus = Array.isArray(row.bus) ? row.bus[0] : row.bus
    const rawAmenities: string[] = bus?.amenities ?? []
    const amenities = rawAmenities.filter((a): a is AmenityKey =>
      (KNOWN_AMENITIES as string[]).includes(a),
    )

    return {
      id: row.id,
      fromEn,
      toEn,
      serviceDate: row.service_date,
      departMinutes: timeStringToMinutes(row.departure_time),
      scheduleType: row.schedule_type,
      durationMinutes: route.typical_duration_minutes,
      price: Number(row.price_per_seat),
      seatsLeft,
      totalSeats: row.total_seats_snapshot,
      busType: (bus?.bus_type as BusType) ?? "standard",
      amenities,
    }
  })
}
