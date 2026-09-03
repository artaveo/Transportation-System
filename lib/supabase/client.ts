import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

/**
 * کلاینت Supabase مخصوص مرورگر (Client Component ها).
 * فقط با کلید anon/publishable کار می‌کند؛ عملیات حساس (service_role)
 * هرگز نباید از این کلاینت انجام شود — طبق بخش ۸.۲ پرامپت مادر.
 * از فاز ۴.۲ به بعد با Database (تولیدشده از Supabase:generate_typescript_types)
 * typed است تا اشتباه تایپی در نام ستون/جدول موقع build گرفته شود.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
