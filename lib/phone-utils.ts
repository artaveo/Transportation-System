// نرمال‌سازی شمارهٔ تماس — رفع باگ بخش ۱۲.۱۸ پرامپت مادر.
//
// ریشهٔ باگ: کیبورد فارسی ویندوز حین تایپ در فیلدهای شماره تماس (حتی با
// dir="ltr") باز هم ارقام فارسی/عربی (۰۱۲۳...) تولید می‌کند — چون dir فقط
// جهتِ *نمایش* را تعیین می‌کند، نه نوع کاراکتری که کیبورد واقعاً می‌فرستد.
// توابع مقایسهٔ دقیق رشته‌ای (`contact_phone = p_phone`) در
// update_booking_contact_phone/request_booking_cancellation با همین
// ناهماهنگی شکست می‌خورند: نه شمارهٔ قدیم نه جدید match می‌شود.
//
// همان الگوی موجود در lib/date-utils.ts (تبدیل ارقام فارسی برای تقویم)
// اینجا برای شماره تماس تعمیم داده شده. باید دقیقاً معادل تابع
// public.normalize_phone() در phase-5_6-phone-normalization.sql بماند.

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/**
 * فقط تبدیل ارقام فارسی/عربی به لاتین — بدون حذف فاصله/خط‌تیره. برای اعمال
 * زنده روی input هنگام تایپ (onChange) تا کاربر بلافاصله رقم لاتین را ببیند
 * و فرمت‌بندی دلخواهش (فاصله/خط‌تیره) به‌هم نخورد.
 */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
}

/**
 * نرمال‌سازی کامل شمارهٔ تماس — قبل از ارسال به سرور/مقایسه استفاده شود:
 * تبدیل ارقام فارسی/عربی به لاتین، حذف فاصله/خط‌تیره/پرانتز و کاراکترهای
 * جهت‌دهی نامرئی RTL/LTR (که مرورگر/سیستم‌عامل گاهی خودکار درج می‌کند)،
 * با نگه‌داشتن یک + اختیاری در ابتدا (کد کشور).
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return ""
  const cleaned = toLatinDigits(input).replace(/[\u200e\u200f\u061c]/g, "").trim()
  const hasPlus = cleaned.startsWith("+")
  const digitsOnly = cleaned.replace(/[^\d]/g, "")
  if (!digitsOnly) return ""
  return hasPlus ? `+${digitsOnly}` : digitsOnly
}
