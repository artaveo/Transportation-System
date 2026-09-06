import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizePhone } from "@/lib/phone-utils"
import { MAX_SEATS_PER_BOOKING } from "@/lib/booking-data"

type PassengerInput = {
  seatId: string
  fullName: string
  nationalId?: string
  gender?: "male" | "female"
  phone?: string
}

type ConfirmBody = {
  tripId?: string
  seatIds?: string[]
  contactName?: string
  contactPhone?: string
  passengers?: PassengerInput[]
  paymentMethod?: "online" | "offline"
  couponCode?: string
}

// ثبت نهایی رزرو. طبق تصمیم این چت: هر دو روش پرداخت (آنلاین/آفلاین) در
// همین فاز فعال‌اند و رزرو آنلاین هم فعلاً با payments.status='pending'
// ثبت می‌شود (بدون درگاه واقعی HesabPay — آن اتصال فاز ۶.۳ است).
//
// افزودهٔ فاز ۴.۵: اگر درخواست از یک مسافرِ واردشده (Supabase Auth session)
// بیاید، customer_id واقعی‌اش خودکار به confirm_booking پاس داده می‌شود —
// بدون هیچ تغییری در فرم پرداخت (checkout-form.tsx دست‌نخورده ماند). این
// یعنی تخفیف سطح باشگاه مشتریان و اتصال رزرو به تاریخچهٔ حساب کاربری از
// همین حالا برای مسافران واردشده کار می‌کند؛ مهمان‌ها دقیقاً مثل قبل عمل
// می‌کنند (customer_id همچنان null).
export async function POST(request: Request) {
  let body: ConfirmBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const { tripId, seatIds, contactName, contactPhone, passengers, paymentMethod, couponCode } = body

  if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }
  if (seatIds.length > MAX_SEATS_PER_BOOKING) {
    return NextResponse.json({ error: "TOO_MANY_SEATS" }, { status: 400 })
  }
  if (!contactName?.trim() || !contactPhone?.trim()) {
    return NextResponse.json({ error: "MISSING_CONTACT" }, { status: 400 })
  }
  if (!Array.isArray(passengers) || passengers.length !== seatIds.length) {
    return NextResponse.json({ error: "PASSENGER_COUNT_MISMATCH" }, { status: 400 })
  }
  if (passengers.some((p) => !p.fullName?.trim() || !p.seatId)) {
    return NextResponse.json({ error: "MISSING_PASSENGER_FIELDS" }, { status: 400 })
  }
  if (paymentMethod !== "online" && paymentMethod !== "offline") {
    return NextResponse.json({ error: "INVALID_PAYMENT_METHOD" }, { status: 400 })
  }

  // کلاینت anon (نه service_role) فقط برای خواندنِ session/هویت خودِ درخواست‌دهنده
  // — دقیقاً همان چیزی که customers_self_select در فاز ۳.۲ برایش طراحی شده.
  let customerId: string | null = null
  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()
    if (user) {
      const { data: customer } = await authClient
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()
      customerId = customer?.id ?? null
    }
  } catch (err) {
    // نبودِ session یا نبودِ پروفایل customers، خطای مسدودکننده نیست —
    // رزرو به‌صورت مهمان ادامه پیدا می‌کند.
    console.error("[api/bookings/confirm] customer lookup failed:", err)
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("confirm_booking", {
    p_trip_id: tripId,
    p_seat_ids: seatIds,
    p_contact_name: contactName.trim(),
    p_contact_phone: normalizePhone(contactPhone),
    p_passengers: passengers.map((p) => ({
      seat_id: p.seatId,
      full_name: p.fullName.trim(),
      phone: p.phone ? normalizePhone(p.phone) || null : null,
      national_id: p.nationalId?.trim() || null,
      gender: p.gender ?? null,
    })),
    p_payment_method: paymentMethod,
    p_coupon_code: couponCode?.trim() || null,
    p_customer_id: customerId,
  })

  if (error) {
    const knownErrors = [
      "TRIP_NOT_FOUND",
      "NO_SEATS_SELECTED",
      "PASSENGER_COUNT_MISMATCH",
      "SEATS_NOT_HELD",
      "COUPON_INVALID",
    ]
    const code = knownErrors.find((c) => error.message.includes(c))
    if (code) {
      // SEATS_NOT_HELD یعنی مهلت قفل ۱۰ دقیقه‌ای گذشته یا صندلی از قبل رزرو
      // شده — کاربر باید به صفحهٔ انتخاب صندلی برگردد و دوباره انتخاب کند.
      return NextResponse.json({ error: code }, { status: code === "COUPON_INVALID" ? 400 : 409 })
    }
    console.error("[api/bookings/confirm]", error.message)
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data
  return NextResponse.json({ booking: result })
}
