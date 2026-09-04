import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

type UpdateContactBody = {
  reference?: string
  phone?: string
  newPhone?: string
}

// ویرایش شمارهٔ تماس یک رزرو مهمان از صفحهٔ «پیگیری رزرو» (فاز ۴.۳).
// نوشتن واقعی همیشه از طریق تابع service_role انجام می‌شود
// (update_booking_contact_phone در phase-4_3-schema-additions.sql)، نه
// یک UPDATE مستقیم روی جدول — دقیقاً همان الگوی hold_seats/confirm_booking
// در فاز ۴.۲، چون این تابع هم خودش تطابق کد رهگیری + شمارهٔ تماس فعلی را
// اتمیک (در یک WHERE واحد) بررسی می‌کند.
export async function POST(request: Request) {
  let body: UpdateContactBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const reference = body.reference?.trim()
  const phone = body.phone?.trim()
  const newPhone = body.newPhone?.trim()

  if (!reference || !phone || !newPhone) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc("update_booking_contact_phone", {
    p_reference: reference,
    p_phone: phone,
    p_new_phone: newPhone,
  })

  if (error) {
    if (error.message.includes("BOOKING_NOT_FOUND")) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }
    if (error.message.includes("INVALID_PHONE")) {
      return NextResponse.json({ error: "INVALID_PHONE" }, { status: 400 })
    }
    console.error("[api/bookings/update-contact]", error.message)
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
