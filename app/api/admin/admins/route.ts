import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type InviteBody = {
  fullName?: string
  email?: string
  role?: "super_admin" | "limited_admin"
  allowedSections?: string[]
}

const VALID_SECTIONS = ["routes", "fleet", "trips", "bookings", "payments", "loyalty", "customers"] as const

// فاز ۵.۱۲ — دعوت ادمین محدود/کامل جدید.
//
// این تنها بخشی از «مدیریت ادمین‌ها» است که واقعاً به service_role نیاز
// دارد (بخش ۴ پرامپت مادر: «service-role فقط در server و با authorization
// صریح»)، چون ساخت حساب Auth واقعی (auth.admin.inviteUserByEmail) یک
// عملیات مدیریتی GoTrue است که با anon key ممکن نیست. درج ردیف جدول
// admins عمداً با کلاینت anon+نشستِ خودِ super_admin درخواست‌دهنده انجام
// می‌شود (نه service_role) — چون RLS policy admins_super_write (فاز ۳.۲)
// از قبل این را برای super_admin مجاز کرده، و این‌طور تریگر audit
// (log_admin_access_change، فاز ۵.۱۲) auth.uid() درست را می‌بیند (با
// service_role هیچ auth.uid()ای وجود ندارد).
//
// بررسی دوم سمت سرور (is_super_admin) عمداً اینجا هم تکرار می‌شود؛ همان
// اصل «لایهٔ دفاعی دوم مکمل middleware» که در app/admin/page.tsx هست.
export async function POST(request: Request) {
  let body: InviteBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const fullName = body.fullName?.trim()
  const email = body.email?.trim().toLowerCase()
  const role = body.role
  const allowedSections = Array.isArray(body.allowedSections) ? body.allowedSections : []

  if (!fullName) {
    return NextResponse.json({ error: "MISSING_FULL_NAME" }, { status: 400 })
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 })
  }
  if (role !== "super_admin" && role !== "limited_admin") {
    return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 })
  }
  if (allowedSections.some((s) => !VALID_SECTIONS.includes(s as (typeof VALID_SECTIONS)[number]))) {
    return NextResponse.json({ error: "INVALID_SECTION" }, { status: 400 })
  }

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { data: isSuperAdmin } = await authClient.rpc("is_super_admin")
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const serviceClient = createServiceClient()
  const origin = new URL(request.url).origin

  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/admin/accept-invite`,
    data: { full_name: fullName },
  })

  if (inviteError || !inviteData?.user) {
    const message = inviteError?.message?.toLowerCase() ?? ""
    if (message.includes("already") || message.includes("registered")) {
      return NextResponse.json({ error: "EMAIL_ALREADY_REGISTERED" }, { status: 409 })
    }
    console.error("[api/admin/admins] invite error:", inviteError?.message)
    return NextResponse.json({ error: "INVITE_FAILED" }, { status: 500 })
  }

  const newAuthUserId = inviteData.user.id

  const { data: adminRow, error: insertError } = await authClient
    .from("admins")
    .insert({
      auth_user_id: newAuthUserId,
      full_name: fullName,
      role,
      allowed_sections: role === "limited_admin" ? allowedSections : null,
      is_active: true,
    })
    .select("id, full_name, role, allowed_sections, is_active, created_at")
    .single()

  if (insertError) {
    // تلاش best-effort برای پاک‌کردن حساب Auth یتیم (دعوت موفق شد ولی
    // ردیف admins ساخته نشد) — اگر این هم شکست بخورد، فقط لاگ می‌شود؛
    // خطای اصلی همچنان به سوپرادمین برمی‌گردد.
    try {
      await serviceClient.auth.admin.deleteUser(newAuthUserId)
    } catch (cleanupError) {
      console.error("[api/admin/admins] orphan cleanup failed:", cleanupError)
    }

    if (insertError.code === "23505") {
      return NextResponse.json({ error: "EMAIL_ALREADY_REGISTERED" }, { status: 409 })
    }
    console.error("[api/admin/admins] admins insert error:", insertError.message)
    return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, admin: adminRow })
}
