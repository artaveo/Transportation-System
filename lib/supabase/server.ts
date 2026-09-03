import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * کلاینت Supabase مخصوص سرور (Server Component / Route Handler / Server Action).
 * نشست کاربر را از روی کوکی‌های درخواست می‌خواند. برای عملیات نوشتن حساس
 * (رزرو، قفل صندلی، تأیید پرداخت) باید در فاز ۴ یک کلاینت جدای دیگر با
 * service_role ساخته شود — این کلاینت هنوز فقط سطح دسترسی anon را دارد.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // از یک Server Component فراخوانی شده (نه Server Action/Route Handler)؛
            // نوشتن کوکی اینجا ممکن نیست و middleware مسئول تازه‌سازی نشست است.
          }
        },
      },
    },
  )
}
