// فاز ۶.۱ — انواع مشترک لایهٔ پرداخت. قبل از این فاز، این union typeها به‌صورت
// پراکنده و تکراری داخل bookings-table.tsx و جاهای دیگر تعریف شده بودند؛
// اینجا یک‌بار تعریف می‌شوند تا هم این فایل هم فایل‌های بعدی (چک‌اوت، گزارش‌ها)
// از همین‌ها استفاده کنند.

export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded"
export type PaymentMethod = "online" | "offline"

// manual = تأیید دستی ادمین (امروز، برای رزروهای offline).
// gateway_pending = رزرو online ثبت شده ولی هیچ درگاه واقعی وصل نیست —
// دقیقاً محدودیت مستندشده در app/api/bookings/confirm/route.ts. مقدار
// 'hesabpay' در فاز ۶.۳ که HesabPay واقعی وصل شود اضافه می‌شود (هم اینجا،
// هم در چک‌کانستریت ستون payments.provider).
export type PaymentProviderName = "manual" | "gateway_pending"

export type PaymentActionResult = { ok: true } | { ok: false; error: string }
