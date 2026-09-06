import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizePhone } from "@/lib/phone-utils"

type CancelBody = {
  reference?: string
  phone?: string
}

// درخواست کنسلی رزرو مهمان از صفحهٔ «پیگیری رزرو» (فاز ۴.۳). طبق تابع
// request_booking_cancellation (phase-4_3-schema-additions.sql)، این کنسلی
// فقط برای رزروهای هنوز 'pending' واقعاً انجام می‌شود (صندلی‌ها بلافاصله
// به available برمی‌گردند)؛ برای رزروِ از قبل 'confirmed' عمداً مسدود است
// چون باید از مسیر بازپرداخت/بررسی دستی ادمین (فاز ۵.۲ / ۶) عبور کند.
export async function POST(request: Request) {
  let body: CancelBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const reference = body.reference?.trim()
  // نرمال‌سازی دفاعی سمت سرور — بخش ۱۲.۱۸ (رفع باگ ارقام فارسی/عربی).
  const phone = normalizePhone(body.phone)

  if (!reference || !phone) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc("request_booking_cancellation", {
    p_reference: reference,
    p_phone: phone,
  })

  if (error) {
    const knownErrors = ["BOOKING_NOT_FOUND", "ALREADY_CANCELLED", "NOT_CANCELLABLE"]
    const code = knownErrors.find((c) => error.message.includes(c))
    if (code) {
      return NextResponse.json({ error: code }, { status: code === "BOOKING_NOT_FOUND" ? 404 : 409 })
    }
    console.error("[api/bookings/request-cancellation]", error.message)
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
