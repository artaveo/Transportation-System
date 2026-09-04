"use client"

/**
 * اگر تأیید ایمیل در تنظیمات Supabase Auth این پروژه فعال باشد، بلافاصله
 * بعد از signUp() هیچ نشستی وجود ندارد که بشود signup_customer را صدا زد.
 * اطلاعات فرم (شماره تماس/نام/کد معرفی) موقتاً اینجا نگه داشته می‌شود تا
 * بعد از تأیید ایمیل و اولین ورود، خودکار تکمیل شود — فقط یک بهبود تجربهٔ
 * کاربری است؛ اگر این storage در دسترس نباشد (مرورگر/دستگاه عوض شده)،
 * صفحهٔ /account/complete-profile همچنان راه مطمئن تکمیل ثبت‌نام است.
 */
const KEY = "shabraw_pending_profile"

export type PendingProfile = {
  phone: string
  fullName?: string
  referralCode?: string
}

export function savePendingProfile(profile: PendingProfile) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // بی‌ضرر — complete-profile fallback است
  }
}

export function readPendingProfile(): PendingProfile | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.phone !== "string" || !parsed.phone) return null
    return parsed as PendingProfile
  } catch {
    return null
  }
}

export function clearPendingProfile() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // بی‌ضرر
  }
}
