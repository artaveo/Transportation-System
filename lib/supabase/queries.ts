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
       trip_seats(status, held_until)`,
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
    const seatRows = (row.trip_seats ?? []) as { status: string; held_until: string | null }[]
    // اگر نقشهٔ صندلی هنوز برای این سفر تولید نشده (trip_seats خالی)، فرض
    // می‌شود همهٔ ظرفیت خالی است؛ نه صفر — تا سفرهای تازه‌ساخته‌شدهٔ ادمین
    // که هنوز trip_seats ندارند به‌اشتباه «تکمیل» نشان داده نشوند. صندلیِ
    // held ای که held_until آن گذشته هم عملاً خالی حساب می‌شود (فاز ۴.۲).
    const now = Date.now()
    const seatsLeft =
      seatRows.length > 0
        ? seatRows.filter(
            (s) => s.status === "available" || (s.status === "held" && s.held_until !== null && new Date(s.held_until).getTime() < now),
          ).length
        : row.total_seats_snapshot

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

export type SeatInfo = {
  id: string
  seatNumber: string
  row: number
  col: string
  status: "available" | "held" | "booked"
}

export type TripDetail = {
  id: string
  fromEn: string
  toEn: string
  serviceDate: string
  departMinutes: number | null
  scheduleType: "fixed_time" | "fill_and_go"
  durationMinutes: number
  price: number
  busType: BusType
  totalSeats: number
  seats: SeatInfo[]
}

/**
 * جزئیات کامل یک سفر + نقشهٔ واقعی صندلی، برای صفحات انتخاب صندلی/پرداخت
 * (فاز ۴.۲). صندلیِ held ای که held_until آن گذشته، برای نمایش «available»
 * حساب می‌شود (قفل واقعاً منقضی‌شده)؛ اما تصمیم نهایی و اتمیک همیشه در
 * hold_seats/confirm_booking (سمت سرور) گرفته می‌شود، نه اینجا.
 */
export async function getTripWithSeats(tripId: string): Promise<TripDetail | null> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("trips")
    .select(
      `id, service_date, departure_time, schedule_type, price_per_seat, total_seats_snapshot,
       route:routes!inner(typical_duration_minutes,
         origin:cities!routes_origin_city_id_fkey(name_en),
         destination:cities!routes_destination_city_id_fkey(name_en)),
       bus:buses(bus_type),
       trip_seats(id, seat_number, row_number, col_label, status, held_until)`,
    )
    .eq("id", tripId)
    .maybeSingle()

  if (error) {
    console.error("[getTripWithSeats] Supabase error:", error.message)
    return null
  }
  if (!row) return null

  const route = Array.isArray(row.route) ? row.route[0] : row.route
  const origin = Array.isArray(route?.origin) ? route.origin[0] : route?.origin
  const destination = Array.isArray(route?.destination) ? route.destination[0] : route?.destination
  const bus = Array.isArray(row.bus) ? row.bus[0] : row.bus
  if (!route || !origin || !destination) return null

  const now = Date.now()
  const seats: SeatInfo[] = ((row.trip_seats ?? []) as any[])
    .map((s) => {
      const expired = s.status === "held" && s.held_until && new Date(s.held_until).getTime() < now
      return {
        id: s.id,
        seatNumber: s.seat_number,
        row: s.row_number,
        col: s.col_label,
        status: (expired ? "available" : s.status) as SeatInfo["status"],
      }
    })
    .sort((a, b) => a.row - b.row || a.col.localeCompare(b.col))

  return {
    id: row.id,
    fromEn: origin.name_en,
    toEn: destination.name_en,
    serviceDate: row.service_date,
    departMinutes: timeStringToMinutes(row.departure_time),
    scheduleType: row.schedule_type,
    durationMinutes: route.typical_duration_minutes,
    price: Number(row.price_per_seat),
    busType: (bus?.bus_type as BusType) ?? "standard",
    totalSeats: row.total_seats_snapshot,
    seats,
  }
}

export type BookingPassengerDetail = {
  seatNumber: string
  fullName: string
  nationalId: string | null
  gender: "male" | "female" | null
}

export type BookingDetail = {
  bookingReference: string
  status: string
  contactName: string
  contactPhone: string
  seatsCount: number
  subtotalAmount: number
  serviceFeeAmount: number
  couponDiscountAmount: number
  tierDiscountAmount: number
  totalAmount: number
  paymentMethod: "online" | "offline"
  trip: {
    id: string
    fromEn: string
    toEn: string
    serviceDate: string
    departMinutes: number | null
  }
  passengers: BookingPassengerDetail[]
}

/**
 * جزئیات کامل یک رزرو با کد رهگیری — از طریق service_role، چون طبق فاز ۳.۲
 * (`bookings_owner_select`) خواندن رزروِ مهمان (customer_id = null) برای
 * anon اصلاً مجاز نیست. فقط از Server Component صدا زده شود (هرگز از
 * Client Component)، دقیقاً طبق هشدار امنیتی lib/supabase/service.ts.
 */
export async function getBookingByReference(reference: string): Promise<BookingDetail | null> {
  const { createServiceClient } = await import("./service")
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from("bookings")
    .select(
      `booking_reference, status, contact_name, contact_phone, seats_count,
       subtotal_amount, service_fee_amount, coupon_discount_amount, tier_discount_amount,
       total_amount, payment_method,
       trip:trips!inner(id, service_date, departure_time,
         route:routes!inner(
           origin:cities!routes_origin_city_id_fkey(name_en),
           destination:cities!routes_destination_city_id_fkey(name_en))),
       booking_passengers(passenger_full_name, national_id, gender, trip_seats(seat_number))`,
    )
    .eq("booking_reference", reference)
    .maybeSingle()

  if (error) {
    console.error("[getBookingByReference] Supabase error:", error.message)
    return null
  }
  if (!row) return null

  const trip = Array.isArray(row.trip) ? row.trip[0] : row.trip
  const route = Array.isArray(trip?.route) ? trip.route[0] : trip?.route
  const origin = Array.isArray(route?.origin) ? route.origin[0] : route?.origin
  const destination = Array.isArray(route?.destination) ? route.destination[0] : route?.destination
  if (!trip || !route || !origin || !destination) return null

  const passengers: BookingPassengerDetail[] = ((row.booking_passengers ?? []) as any[]).map((p) => {
    const seat = Array.isArray(p.trip_seats) ? p.trip_seats[0] : p.trip_seats
    return {
      seatNumber: seat?.seat_number ?? "—",
      fullName: p.passenger_full_name,
      nationalId: p.national_id,
      gender: p.gender,
    }
  })

  return {
    bookingReference: row.booking_reference,
    status: row.status,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    seatsCount: row.seats_count,
    subtotalAmount: Number(row.subtotal_amount),
    serviceFeeAmount: Number(row.service_fee_amount),
    couponDiscountAmount: Number(row.coupon_discount_amount),
    tierDiscountAmount: Number(row.tier_discount_amount),
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    trip: {
      id: trip.id,
      fromEn: origin.name_en,
      toEn: destination.name_en,
      serviceDate: trip.service_date,
      departMinutes: timeStringToMinutes(trip.departure_time),
    },
    passengers,
  }
}
