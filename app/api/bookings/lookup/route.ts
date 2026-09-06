import { NextResponse } from "next/server"
import { getBookingByReferenceAndPhone } from "@/lib/supabase/queries"
import { normalizePhone } from "@/lib/phone-utils"

type LookupBody = {
  reference?: string
  phone?: string
}

// جست‌وجوی عمومی رزرو مهمان (صفحهٔ «پیگیری رزرو»، فاز ۴.۳). طبق طراحی
// فاز ۳.۲، اثبات مالکیت = تطابق دقیق کد رهگیری + شمارهٔ تماس؛ به همین
// دلیل همیشه با POST (نه GET با query string) کار می‌کند تا شمارهٔ تماس
// در تاریخچهٔ URL/لاگ سرور ذخیره نشود.
export async function POST(request: Request) {
  let body: LookupBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const reference = body.reference?.trim()
  // نرمال‌سازی دفاعی سمت سرور — طبق بخش ۱۲.۱۸: حتی اگر کلاینتی (فعلی یا
  // آینده) شماره را نرمال نکرده باشد، اینجا هم روی ارقام فارسی/عربی پوشش
  // داده می‌شود، چون دادهٔ ذخیره‌شده در دیتابیس از این پس همیشه نرمال است.
  const phone = normalizePhone(body.phone)

  if (!reference || !phone) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  const booking = await getBookingByReferenceAndPhone(reference, phone)

  if (!booking) {
    // عمداً همان کد خطا چه رزرو اصلاً وجود نداشته باشد چه شمارهٔ تماس
    // نادرست باشد — تا حدس‌زدنِ کد رهگیریِ معتبر با آزمایش شماره‌های
    // مختلف ممکن نباشد.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({ booking })
}
