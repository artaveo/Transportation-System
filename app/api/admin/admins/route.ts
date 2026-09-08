import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type InviteBody = {
  fullName?: string
  email?: string
  role?: "super_admin" | "limited_admin"
  allowedSections?: string[]
  canManageAdmins?: boolean
}

const VALID_SECTIONS = ["routes", "fleet", "trips", "bookings", "payments", "loyalty", "customers"] as const

// فاز ۵.۱۲ — دعوت ادمین محدود/کامل جدید.
//
// این تنها بخشی از «مدیریت ادمین‌ها» است که واقعاً به service_role نیاز
// دارد (بخش ۴ پرامپت مادر: «service-role فقط در server و با authorization
// صریح»)، چون ساخت حساب Auth واقعی (auth.admin.inviteUserByEmail) یک
// عملیات مدیریتی GoTrue است که با anon key ممکن نیست. درج ردیف جدول
// admins عمداً با کلاینت anon+نشستِ خودِ کاربر درخواست‌دهنده انجام
// می‌شود (نه service_role) — چون RLS (admins_super_write برای super_admin،
// admins_manager_insert برای مدیر کل — ریزفاز ۵.۱۲.۲) از قبل این را مجاز
// کرده، و این‌طور تریگر audit (log_admin_access_change) و تریگر مرز
// صلاحیت (enforce_admin_management_boundaries) هر دو auth.uid() درست را
// می‌بینند — با service_role هیچ auth.uid()ای وجود ندارد.
//
// ریزفاز ۵.۱۲.۲: حالا هم super_admin هم «مدیر کل» (can_manage_admins=true)
// می‌توانند اینجا ادمین محدود بسازند؛ فقط super_admin واقعی می‌تواند
// role=super_admin بدهد یا can_manage_admins=true بدهد. بررسی‌های زیر
// عمداً همان قانون تریگر دیتابیس را زودتر و با پیام روشن‌تر تکرار می‌کنند
// (لایهٔ دفاعی دوم، نه جایگزین تریگر).
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
  const requestedCanManageAdmins = body.canManageAdmins === true

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

  const [{ data: isSuperAdmin }, { data: canManage }] = await Promise.all([
    authClient.rpc("is_super_admin"),
    authClient.rpc("can_manage_admins"),
  ])

  if (!canManage) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }
  // مدیر کل (can_manage_admins=true ولی role واقعی‌اش super_admin نیست)
  // نه می‌تواند super_admin بسازد، نه می‌تواند پرچم can_manage_admins را
  // به کسی بدهد — فقط یک super_admin واقعی این دو کار را می‌تواند.
  if (!isSuperAdmin && role === "super_admin") {
    return NextResponse.json({ error: "MANAGER_CANNOT_GRANT_SUPER_ADMIN" }, { status: 403 })
  }
  if (!isSuperAdmin && requestedCanManageAdmins) {
    return NextResponse.json({ error: "MANAGER_CANNOT_GRANT_MANAGE_FLAG" }, { status: 403 })
  }

  const serviceClient = createServiceClient()

  // ریزفاز ۵.۱۲.۱ — قبل از هرگونه دعوت، چک کن این ایمیل از قبل یک مسافر
  // ثبت‌نام‌شده نیست (چک سریع سمت API؛ لایهٔ واقعی enforcement تریگر
  // prevent_admin_customer_overlap روی خودِ جدول admins است — پایین‌تر).
  const { data: existingCustomer } = await serviceClient
    .from("customers")
    .select("id")
    .ilike("email", email)
    .maybeSingle()

  if (existingCustomer) {
    return NextResponse.json({ error: "EMAIL_IS_CUSTOMER" }, { status: 409 })
  }

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
      can_manage_admins: role === "limited_admin" ? requestedCanManageAdmins : false,
      is_active: true,
    })
    .select("id, full_name, role, allowed_sections, can_manage_admins, is_active, created_at")
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
    if (insertError.message?.includes("AUTH_USER_ALREADY_CUSTOMER")) {
      return NextResponse.json({ error: "EMAIL_IS_CUSTOMER" }, { status: 409 })
    }
    if (insertError.message?.includes("MANAGER_CANNOT_GRANT_SUPER_ADMIN")) {
      return NextResponse.json({ error: "MANAGER_CANNOT_GRANT_SUPER_ADMIN" }, { status: 403 })
    }
    if (insertError.message?.includes("MANAGER_CANNOT_GRANT_MANAGE_FLAG")) {
      return NextResponse.json({ error: "MANAGER_CANNOT_GRANT_MANAGE_FLAG" }, { status: 403 })
    }
    console.error("[api/admin/admins] admins insert error:", insertError.message)
    return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, admin: adminRow })
}
