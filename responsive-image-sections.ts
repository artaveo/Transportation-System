import type { Lang } from "./i18n"

/**
 * فاز ۵.۱۴ — Responsive Image CMS.
 *
 * فهرست بخش‌های سایت که پس‌زمینهٔ اتمسفریک ۴-برشی (mobile/tablet/desktop/
 * wide — دقیقاً همان سیستم ResponsivePhoto فاز ۴.۶) دارند. این فهرست عمداً
 * در کد است، نه دیتابیس: نسبت ابعاد هر برش مستقیماً به کلاس CSS
 * `aspect-[...]` همان کامپوننت گره خورده (یک تصمیم layout/کد است)، نه
 * محتوایی که قرار است ادمین آزادانه تغییرش دهد. برای اضافه‌کردن یک بخش
 * جدید در آینده، فقط یک آیتم اینجا اضافه کنید — جدول دیتابیس
 * (`responsive_site_images`) و پنل ادمین (`ResponsiveImageManager`) هر دو
 * از همین فهرست می‌خوانند، نیازی به migration جدید نیست.
 */

export const RESPONSIVE_IMAGE_BREAKPOINTS = ["mobile", "tablet", "desktop", "wide"] as const
export type ResponsiveImageBreakpoint = (typeof RESPONSIVE_IMAGE_BREAKPOINTS)[number]

export type ResponsiveImageSection = {
  key: string
  label: Record<Lang, string>
  /** نسبت ابعاد به شکل "عرض/ارتفاع" — دقیقاً همان مقدار داخل کلاس aspect-[...] */
  aspect: Record<ResponsiveImageBreakpoint, string>
  /** فایل استاتیک فعلی در public/images — وقتی هنوز از پنل چیزی آپلود نشده استفاده می‌شود */
  defaultSrc: Record<ResponsiveImageBreakpoint, string>
}

const SHARED_ATMOSPHERIC_ASPECT: Record<ResponsiveImageBreakpoint, string> = {
  mobile: "1122/1402",
  tablet: "1448/1086",
  desktop: "1672/941",
  wide: "1915/821",
}

export const RESPONSIVE_IMAGE_SECTIONS: ResponsiveImageSection[] = [
  {
    key: "hero",
    label: { fa: "هیرو صفحهٔ اصلی", en: "Homepage hero" },
    aspect: SHARED_ATMOSPHERIC_ASPECT,
    // موقت (بازطراحی ریسپانسیو هیرو): از ۴ اسلات فعلی، فقط hero-road-dusk.png
    // واقعاً همان بس/جادهٔ هیرو را نشان می‌دهد. mobile قبلاً به یک عکس جادهٔ
    // بدون بس اشاره می‌کرد و tablet/wide به عکس‌های صفحهٔ درباره‌ما
    // (about-corridor-dusk-*) که اصلاً بس ندارند — یعنی روی ۳ برش از ۴ برش،
    // سوژهٔ اصلی هیرو اصلاً در تصویر وجود نداشت (مستقل از هر مشکل layout).
    // تا رسیدن ۴ عکس نهاییِ اختصاصی هیرو (نام‌گذاری پیشنهادی: hero-mobile,
    // hero-tablet, hero-desktop, hero-wide)، هر ۴ برش موقتاً به همین یک عکس
    // واقعی هیرو اشاره می‌کنند؛ ResponsivePhoto با object-position مشترک
    // (۳۴٪ افقی / ۶۲٪ عمودی — دقیقاً روی بس) هر ۴ نسبت تصویر را از همین یک
    // فایل می‌سازد. جایگزینی بعدی این ۴ فایل هیچ تغییری در layout نمی‌خواهد.
    defaultSrc: {
      mobile: "/images/hero-road-dusk.png",
      tablet: "/images/hero-road-dusk.png",
      desktop: "/images/hero-road-dusk.png",
      wide: "/images/hero-road-dusk.png",
    },
  },
  {
    key: "fleet",
    label: { fa: "پس‌زمینهٔ بخش ناوگان", en: "Fleet section background" },
    aspect: SHARED_ATMOSPHERIC_ASPECT,
    defaultSrc: {
      mobile: "/images/fleet-580-dusk-mobile.png",
      tablet: "/images/fleet-580-dusk-tablet.png",
      desktop: "/images/fleet-580-dusk.png",
      wide: "/images/fleet-580-dusk-wide.png",
    },
  },
  {
    key: "about",
    label: { fa: "پس‌زمینهٔ صفحهٔ درباره ما", en: "About page background" },
    aspect: SHARED_ATMOSPHERIC_ASPECT,
    defaultSrc: {
      mobile: "/images/about-corridor-dusk-mobile.png",
      tablet: "/images/about-corridor-dusk-tablet.png",
      desktop: "/images/about-corridor-dusk.png",
      wide: "/images/about-corridor-dusk-wide.png",
    },
  },
]

export function getResponsiveImageSection(key: string): ResponsiveImageSection | undefined {
  return RESPONSIVE_IMAGE_SECTIONS.find((s) => s.key === key)
}

export const BREAKPOINT_LABEL: Record<ResponsiveImageBreakpoint, Record<Lang, string>> = {
  mobile: { fa: "موبایل (زیر ۷۶۸px)", en: "Mobile (< 768px)" },
  tablet: { fa: "تبلت (۷۶۸ تا ۱۰۲۴px)", en: "Tablet (768–1024px)" },
  desktop: { fa: "دسکتاپ (۱۰۲۴ تا ۱۶۰۰px)", en: "Desktop (1024–1600px)" },
  wide: { fa: "مانیتور واید (بالای ۱۶۰۰px)", en: "Wide monitor (> 1600px)" },
}
