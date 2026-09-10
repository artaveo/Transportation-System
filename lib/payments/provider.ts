import type { createClient } from "@/lib/supabase/client"
import type { PaymentActionResult, PaymentProviderName } from "./types"

/**
 * قرارداد provider پرداخت — فاز ۶.۱ (فقط زیرساخت، بدون اتصال واقعی HesabPay؛
 * آن اتصال فاز ۶.۳ است، طبق تصمیم مستندشده در app/api/bookings/confirm/route.ts
 * و PHASE-4_2-README.md).
 *
 * فقط دو متدی که همین امروز واقعاً در سیستم وجود دارند اینجا تعریف شده‌اند:
 * تأیید پرداخت آفلاین (admin_confirm_offline_payment) و بازپرداخت
 * (admin_refund_payment، تازه در همین فاز ساخته شد). عمداً چیزی مثل
 * createIntent/verify/parseWebhook اینجا نیست — آن‌ها برای درگاه آنلاین واقعی
 * لازم می‌شوند و نوشتنشان الان یعنی قرارداد فرضی برای چیزی که هنوز طراحی
 * نشده. وقتی فاز ۶.۳ برسد، همین interface گسترش پیدا می‌کند و یک
 * HesabPayProvider جدید پیاده‌سازیش می‌کند — بدون تغییر در جایی که از این
 * فایل استفاده می‌کند (bookings-table.tsx).
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName
  confirmOfflinePayment(bookingId: string): Promise<PaymentActionResult>
  /**
   * amount=null یعنی بازپرداخت کامل (مبلغ کامل پرداخت). فاز ۶.۲: بازپرداخت
   * جزئی هم مجاز است (مثلاً کسر جریمهٔ لغو) — تصمیم صریح Zakir.
   */
  refund(bookingId: string, amount: number | null, reason?: string | null): Promise<PaymentActionResult>
}

type SupabaseBrowserClient = ReturnType<typeof createClient>

export function createManualPaymentProvider(supabase: SupabaseBrowserClient): PaymentProvider {
  return {
    name: "manual",
    async confirmOfflinePayment(bookingId) {
      const { error } = await supabase.rpc("admin_confirm_offline_payment", { p_booking_id: bookingId })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    async refund(bookingId, amount, reason) {
      const { error } = await supabase.rpc("admin_refund_payment", {
        p_booking_id: bookingId,
        p_amount: amount ?? undefined,
        p_reason: reason ?? undefined,
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
  }
}
