import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/**
 * کلاینت Supabase با کلید service_role — RLS را دور می‌زند.
 *
 * هشدار امنیتی مهم: این فایل هرگز نباید از یک Client Component
 * (`"use client"`) یا هر مسیری که به باندل مرورگر می‌رسد ایمپورت شود.
 * import "server-only" این را در زمان build اجباری می‌کند (اگر اشتباهاً
 * از سمت کلاینت ایمپورت شود، build خطا می‌دهد، نه این‌که کلید نشت کند).
 *
 * فقط از این‌ها استفاده کن:
 *   - Route Handler ها (app/api/bookings/*)
 *   - Server Component هایی که باید داده‌ای بخوانند که RLS برای anon مسدود
 *     کرده (مثلاً رزرو مهمان در صفحهٔ تأییدیه، چون bookings_owner_select
 *     نیازمند customer_id غیر-نال است — طبق فاز ۳.۲).
 *
 * طبق بخش ۴.۲ سند مادر: «رزرو اتمیک صندلی ... از طریق service_role در
 * Route Handler انجام می‌شود».
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY تنظیم نشده. این متغیر را در .env.local اضافه کنید " +
        "(از Supabase Dashboard → Settings → API → service_role — هرگز نباید NEXT_PUBLIC_ باشد).",
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
