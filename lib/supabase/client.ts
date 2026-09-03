import { createBrowserClient } from "@supabase/ssr"

/**
 * کلاینت Supabase مخصوص مرورگر (Client Component ها).
 * فقط با کلید anon/publishable کار می‌کند؛ عملیات حساس (service_role)
 * هرگز نباید از این کلاینت انجام شود — طبق بخش ۸.۲ پرامپت مادر.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
