import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * ⚠️ وضعیت فعلی (۶ سپتامبر ۲۰۲۶، بخش ۱۲.۱۲ پرامپت مادر): این فایل فعلاً
 * توسط هیچ لینک ایمیلی صدا زده نمی‌شود — چون بدون SMTP اختصاصی، قالب
 * ایمیل «Reset Password» در پنل Supabase قابل‌ویرایش نیست (قفل روی قالب
 * پیش‌فرض implicit-flow مانده) و account-forgot-password.tsx فعلاً
 * مستقیم به /account/reset-password اشاره می‌کند، نه به اینجا. این فایل
 * عمداً حذف نشده — دقیقاً همان چیزی است که بعد از وصل‌شدن SMTP (بدون هیچ
 * تغییر کدی در همین فایل) دوباره فعال می‌شود؛ فقط دو جای دیگر باید عوض
 * شوند: قالب ایمیل در پنل Supabase، و یک خط redirectTo در
 * account-forgot-password.tsx. جزئیات کامل در بخش ۱۲.۱۲ پرامپت مادر.
 *
 * فاز ۴.۷ — نقطهٔ مشترک تأیید لینک‌های ایمیلی Supabase Auth (PKCE flow).
 *
 * چرا این فایل لازم است: چون پروژه از @supabase/ssr با نشست کوکی‌محور
 * استفاده می‌کند (نه implicit flow)، لینک داخل ایمیل «بازیابی رمز عبور»
 * توکن خام نمی‌فرستد؛ یک token_hash می‌فرستد که باید سمت سرور با
 * verifyOtp() «نقد» شود تا کوکی نشست واقعی ساخته شود. این دقیقاً همان
 * الگوی رسمی مستندات Supabase برای Next.js App Router است (بخش
 * «Resetting a password» → PKCE flow، docs/guides/auth/passwords).
 *
 * مسیر: {SITE_URL}/auth/confirm?token_hash=...&type=recovery&next=/account/reset-password
 * این لینک را باید در قالب ایمیل «Reset Password» پنل Supabase (Authentication →
 * Email Templates) جایگزین {{ .ConfirmationURL }} پیش‌فرض کرد — دستورالعمل
 * دقیق در پاسخ همین چت (بخش SMTP) آمده.
 *
 * همین مسیر برای «تأیید ثبت‌نام ایمیل» (type=signup/email) هم به‌کار
 * می‌رود — امروز فعال نیست چون ثبت‌نام مسافر با auto-confirm انجام می‌شود
 * (فاز ۴.۵)، اما اگر بعداً تأیید ایمیل الزامی شود، همین یک فایل کافی است.
 *
 * middleware.ts عمداً این مسیر را نمی‌بیند (matcher فقط /admin و /account
 * است)، پس بدون نیاز به هیچ استثنای اضافه در آنجا کار می‌کند.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/account/reset-password"

  const redirectTo = request.nextUrl.clone()
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")
  redirectTo.searchParams.delete("next")

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      redirectTo.pathname = next
      return NextResponse.redirect(redirectTo)
    }
  }

  // لینک منقضی‌شده، از قبل استفاده‌شده، یا دست‌کاری‌شده — کاربر با یک
  // پیام قابل‌فهم به صفحهٔ فراموشی رمز برمی‌گردد، نه یک خطای فنی خام.
  redirectTo.pathname = "/auth/auth-code-error"
  return NextResponse.redirect(redirectTo)
}
