/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // فاز ۴.۶ (رفع درخواست Zakir — حجم عکس/سرعت اینترنت ضعیف): قبلاً اینجا
    // `unoptimized: true` بود (خروجی پیش‌فرض v0.dev، چون محیط پیش‌نمایش خودِ
    // v0 از این قابلیت پشتیبانی نمی‌کند) که کل پایپ‌لاین بهینه‌سازی تصویر
    // Next.js را خاموش می‌کرد — عکس‌های PNG ۱.۵-۲ مگابایتی دست‌نخورده به
    // کاربر می‌رسیدند. حالا فعال است: Next.js/Vercel هر عکس را خودکار
    // resize + به‌ فرمت مدرن (WebP/AVIF بسته به مرورگر) تبدیل می‌کند، بدون
    // افت محسوس کیفیت (`quality` پیش‌فرض ۷۵؛ عمداً کمی محافظه‌کارانه‌تر
    // تنظیم شد — پایین‌تر همین فایل). این روی هر عکسی که از طریق
    // `next/image`/`getImageProps` سرو شود اعمال می‌شود — یعنی کامپوننت
    // مشترک `ResponsivePhoto` (بخش ۸.۲) به‌طور خودکار همهٔ عکس‌های فعلی و
    // آیندهٔ سایت را پوشش می‌دهد.
    qualities: [75, 82],
    // future-proofing برای وقتی پنل ادمین (فاز ۵.۵ به بعد) خودش امکان
    // آپلود/تعویض عکس را بدهد: تصاویر Supabase Storage از یک دامنهٔ عمومی
    // ثابت (`<project-ref>.supabase.co`) سرو می‌شوند؛ با اضافه‌کردن آن به
    // remotePatterns از همین حالا، هر عکسی که بعداً از آنجا لینک شود هم
    // بدون هیچ تغییر کدی از همان پایپ‌لاین بهینه‌سازی عبور می‌کند.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ppbdsrcdnmckosqhhamm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
