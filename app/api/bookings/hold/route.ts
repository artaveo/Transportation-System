import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { MAX_SEATS_PER_BOOKING } from "@/lib/booking-data"

// طبق بخش ۴.۲ سند مادر: قفل موقت اتمیک صندلی، فقط از طریق service_role در
// یک Route Handler (نه از Client Component مستقیم). هیچ داده حساسی اینجا
// برنمی‌گردد؛ فقط تأیید یا رد قفل.

const HOLD_MINUTES = 10

export async function POST(request: Request) {
  let body: { tripId?: string; seatIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const { tripId, seatIds } = body
  if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }
  if (seatIds.length > MAX_SEATS_PER_BOOKING) {
    return NextResponse.json({ error: "TOO_MANY_SEATS" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("hold_seats", {
    p_trip_id: tripId,
    p_seat_ids: seatIds,
    p_hold_minutes: HOLD_MINUTES,
  })

  if (error) {
    // پیام دقیق raise exception در Postgres داخل error.message برمی‌گردد
    if (error.message.includes("SEATS_UNAVAILABLE")) {
      return NextResponse.json({ error: "SEATS_UNAVAILABLE" }, { status: 409 })
    }
    console.error("[api/bookings/hold]", error.message)
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 })
  }

  return NextResponse.json({ heldSeats: data, holdMinutes: HOLD_MINUTES })
}
