import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// آزادسازی دستی صندلی — تلاش best-effort است (اگر کاربر مرورگر را ببندد،
// held_until به‌هرحال بعد از ۱۰ دقیقه خودش منقضی می‌شود؛ این فقط تجربهٔ
// کاربری را برای بازگشت آگاهانه بهتر می‌کند، پس خطای آن هرگز navigation
// کاربر را بلاک نمی‌کند).

export async function POST(request: Request) {
  let body: { tripId?: string; seatIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const { tripId, seatIds } = body
  if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return NextResponse.json({ ok: true }) // چیزی برای آزادسازی نبود
  }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc("release_seats", { p_trip_id: tripId, p_seat_ids: seatIds })

  if (error) {
    console.error("[api/bookings/release]", error.message)
  }

  return NextResponse.json({ ok: true })
}
