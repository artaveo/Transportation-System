import type { Lang } from "@/lib/i18n"

/**
 * فاز ۴.۸ (رفع ردیف #۲۳ — فلاش جهت RTL/LTR): این کوکی موازی با localStorage
 * ذخیره می‌شود تا app/layout.tsx (Server Component) بتواند در همان لحظهٔ
 * رندر سرور، dir/lang درست را روی <html> بگذارد — بدون نیاز به صبر برای
 * هیدریت و خواندن localStorage در کلاینت.
 *
 * localStorage همچنان به‌عنوان منبع اصلی برای خودِ کلاینت باقی می‌ماند (کوکی
 * فقط برای رندر سرور خوانده می‌شود)؛ هر دو در lang-context.tsx هم‌زمان
 * نوشته می‌شوند تا از هم عقب نیفتند.
 */
export const LANG_COOKIE_NAME = "shabraw-lang"

export function isValidLang(value: string | undefined | null): value is Lang {
  return value === "fa" || value === "en"
}
