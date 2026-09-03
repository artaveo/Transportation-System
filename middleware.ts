import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const ADMIN_LOGIN_PATH = "/admin/login"

/**
 * فاز ۳.۳ — احراز هویت پنل ادمین.
 * این middleware دو کار می‌کند:
 * ۱) نشست Supabase را در هر درخواست تازه نگه می‌دارد (الگوی استاندارد @supabase/ssr).
 * ۲) مسیرهای /admin/* را محافظت می‌کند: کاربر واردنشده → /admin/login،
 *    کاربر واردشده اما غیرادمین (طبق public.is_admin()) → signOut + بازگشت به لاگین،
 *    ادمین معتبری که به‌اشتباه صفحه لاگین را باز کرده → هدایت به /admin.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // مهم: getUser() (نه getSession()) چون توکن را دوباره با سرور Auth تأیید می‌کند.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === ADMIN_LOGIN_PATH

  if (!user) {
    if (isLoginPage) return response
    const url = request.nextUrl.clone()
    url.pathname = ADMIN_LOGIN_PATH
    return NextResponse.redirect(url)
  }

  const { data: isAdmin } = await supabase.rpc("is_admin")

  if (!isAdmin) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = ADMIN_LOGIN_PATH
    url.searchParams.set("error", "not_admin")
    return NextResponse.redirect(url)
  }

  if (isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
