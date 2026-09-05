import { getImageProps } from "next/image"

/**
 * Shared responsive photo primitive (Phase 4.6 — master prompt section 8.2).
 *
 * Renders a <picture> that serves a different image file per device tier
 * instead of relying on CSS object-fit alone to crop one oversized/undersized
 * file for every screen. Same visual family across tiers, different crop.
 *
 * Breakpoint cascade (matches the project's Tailwind scale in globals.css):
 *   >= 1600px (3xl, wide/ultra-wide monitor) -> `wide`
 *   >= 1024px (lg, tablet-landscape/small-laptop and up) -> `desktop`
 *   >=  768px (md, tablet-portrait)                     -> `tablet`
 *   <   768px (phones)                                   -> `mobile` (or `desktop` as fallback)
 *
 * Designed to degrade gracefully: a section that only has one image so far
 * (nothing shot for other tiers yet) just passes `desktop` and gets a plain
 * <img>, identical to today's behavior — no broken sources, nothing to
 * update later beyond adding the missing tier props once those crops exist.
 * This is the one shared pattern meant for every image on the site, not a
 * one-off for hero/fleet/about.
 *
 * درخواست Zakir (فاز ۴.۶ — سرعت روی اینترنت ضعیف): هر srcSet اینجا دیگر
 * مستقیم به فایل PNG اصلی (۱.۵-۲ مگابایتی) اشاره نمی‌کند؛ با getImageProps
 * از next/image ساخته می‌شود، یعنی از همان پایپ‌لاین رسمی بهینه‌سازی
 * Next.js/Vercel رد می‌شود — resize خودکار به چند اندازه + تبدیل به فرمت
 * مدرن (WebP/AVIF بسته به مرورگر کاربر)، بدون افت محسوس کیفیت (quality
 * پیش‌فرض اینجا ۸۲، کمی بالاتر از پیش‌فرض خودِ Next یعنی ۷۵، عمداً برای
 * اطمینان بیشتر از حفظ کیفیت روی عکس‌های اتمسفریک هیرو/ناوگان).
 * این تغییر ریشه‌ای است: چون در سطح همین کامپوننت مشترک اعمال شده، هر عکس
 * دیگری — امروز یا در آینده (مثلاً عکس‌هایی که پنل ادمین در فازهای بعدی از
 * Supabase Storage آپلود/لینک می‌کند) — تا وقتی از همین کامپوننت (یا
 * next/image به‌طور مستقیم) رندر شود، خودکار از همین بهینه‌سازی برخوردار
 * می‌شود؛ نیازی به فشرده‌سازی دستی قبل از آپلود نیست.
 */
export interface ResponsivePhotoProps {
  /** Accessible alt text. Use "" for purely decorative/background photos. */
  alt: string
  className?: string
  /** Required — also used as the ultimate fallback source. */
  desktop: string
  /** Optional — phones, roughly < 768px. Falls back to `desktop` if omitted. */
  mobile?: string
  /** Optional — tablet portrait, roughly 768–1023px. */
  tablet?: string
  /** Optional — wide/ultra-wide monitors, roughly >= 1600px. */
  wide?: string
  "aria-hidden"?: boolean | "true" | "false"
  /**
   * Only for a photo that's visible immediately on load (typically the
   * hero) — skips lazy-loading and asks the browser to fetch it with high
   * priority, since it's usually the page's LCP element.
   */
  priority?: boolean
  /**
   * CSS `object-position` for the underlying `<img>`. Defaults to center
   * (identical to plain `object-cover` behavior). فاز ۴.۶ (رفع ردیف ۱۲.۸ —
   * بریدگی عکس روی مانیتور خیلی بزرگ): برای عکس‌های اتمسفریک این خانواده
   * (هیرو/ناوگان/درباره‌ما)، سوژهٔ اصلی — درخشش غروب و خط کوه‌ها — طبق
   * اندازه‌گیری واقعی پیکسل، حدود ۵۵٪ تا ۱۰۰٪ ارتفاعِ عکس است، نه وسط آن؛
   * وقتی باکس نمایش خیلی عریض/کوتاه می‌شود (مانیتور فوق‌عریض) و برشِ
   * عمودی زیادی لازم است، `object-position: center` وسط تصویر (که فقط
   * آسمان خالی است) را نگه می‌دارد و دقیقاً همان قسمت کوه‌ها/درخشش را
   * می‌بُرد. `center 70%` این را با پایین‌کشیدن نقطهٔ لنگر جبران می‌کند.
   */
  objectPosition?: string
}

// عمداً کمی بالاتر از پیش‌فرض ۷۵ خودِ Next.js — این عکس‌ها اتمسفریک/تمام‌عرض
// هستند و فشرده‌سازی بیش‌ازحد روی گرادیان‌های آسمان غروب مصنوعی می‌تواند
// banding ایجاد کند؛ باید در next.config.mjs (images.qualities) هم مجاز
// باشد.
const QUALITY = 82

function opt(src: string, priority?: boolean) {
  return getImageProps({
    src,
    alt: "",
    fill: true,
    sizes: "100vw",
    quality: QUALITY,
    priority,
  }).props
}

export function ResponsivePhoto({
  alt,
  className,
  desktop,
  mobile,
  tablet,
  wide,
  priority,
  objectPosition,
  ...rest
}: ResponsivePhotoProps) {
  const desktopImg = opt(desktop, priority)
  const mobileImg = opt(mobile ?? desktop, priority)
  const tabletImg = tablet ? opt(tablet, priority) : null
  const wideImg = wide ? opt(wide, priority) : null

  return (
    <picture>
      {wideImg && <source media="(min-width: 1600px)" srcSet={wideImg.srcSet} />}
      <source media="(min-width: 1024px)" srcSet={desktopImg.srcSet} />
      {tabletImg && <source media="(min-width: 768px)" srcSet={tabletImg.srcSet} />}
      <img
        {...mobileImg}
        src={mobileImg.src}
        alt={alt}
        className={className}
        style={objectPosition ? { ...mobileImg.style, objectPosition } : mobileImg.style}
        {...rest}
      />
    </picture>
  )
}
