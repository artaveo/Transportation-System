import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const ADMIN_LOGIN_PATH = "/admin/login"
const ACCOUNT_LOGIN_PATH = "/account/login"
// این دو مسیر تنها صفحات /account/* هستند که بدون نشست هم باید باز شوند.
// "/account/complete-profile" عمداً اینجا نیست: نیاز به نشست دارد (auth.uid()
// در signup_customer)، اما نیازی به داشتن رکورد customers از قبل ندارد —
// خودِ آن تشخیص را صفحه انجام می‌دهد، نه middleware.
const ACCOUNT_PUBLIC_PATHS = new Set([ACCOUNT_LOGIN_PATH, "/account/signup"])

/**
 * فاز ۳.۳ (پنل ادمین) + فاز ۴.۵ (حساب مسافر) — یک middleware مشترک.
 * ۱) نشست Supabase را در هر درخواست تازه نگه می‌دارد (الگوی استاندارد @supabase/ssr).
 * ۲) /admin/*: کاربر واردنشده یا غیرادمین → /admin/login.
 * ۳) /account/*: کاربر واردنشده (به‌جز صفحهٔ لاگین/ثبت‌نام) → /account/login.
 *    این دو محافظت کاملاً مستقل‌اند — یک مسافر واردشده هرگز ادمین حساب
 *    نمی‌شود و برعکس.
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

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === ADMIN_LOGIN_PATH

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

  if (pathname.startsWith("/account")) {
    const isPublicAccountPage = ACCOUNT_PUBLIC_PATHS.has(pathname)

    if (!user) {
      if (isPublicAccountPage) return response
      const url = request.nextUrl.clone()
      url.pathname = ACCOUNT_LOGIN_PATH
      return NextResponse.redirect(url)
    }

    // مسافرِ واردشده‌ای که به‌اشتباه صفحهٔ ورود/ثبت‌نام را باز کرده — به
    // داشبورد هدایت می‌شود. تشخیص «آیا رکورد customers دارد یا نه» در خودِ
    // app/account/page.tsx انجام می‌شود (نیازمند یک SELECT است که بهتر
    // است فقط یک‌بار در Server Component انجام شود، نه در هر عبور از
    // middleware).
    if (isPublicAccountPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/account"
      return NextResponse.redirect(url)
    }

    return response
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
}
