"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound, CheckCircle2, AlertTriangle } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

/**
 * فاز ۴.۷ — قدم دوم فلوی «فراموشی رمز عبور».
 *
 * موقت (تصمیم Zakir — ۶ سپتامبر ۲۰۲۶، بخش ۱۲.۱۲ پرامپت مادر): چون فعلاً
 * SMTP اختصاصی وصل نیست، از قالب پیش‌فرض ایمیل خودِ Supabase استفاده
 * می‌شود که «implicit flow» است — یعنی به‌جای یک token_hash که سرور
 * verify کند (app/auth/confirm/route.ts، که آماده مانده ولی فعلاً استفاده
 * نمی‌شود)، خودِ لینک ایمیل مستقیماً به همین صفحه با access_token/
 * refresh_token داخل #hash آدرس هدایت می‌کند. کتابخانهٔ @supabase/ssr در
 * createClient (مرورگر) این #hash را خودکار می‌خواند و نشست را می‌سازد —
 * اما این کار async است، پس هم یک‌بار getSession اولیه و هم گوش‌دادن به
 * onAuthStateChange لازم است (دقیقاً همان الگوی site-header.tsx) تا رقابت
 * زمانی (race) بین رندر اول و پردازش hash رخ ندهد. اگر کسی مستقیم و بدون
 * لینک معتبر این آدرس را باز کند، هیچ نشستی ساخته نمی‌شود و پیام «لینک
 * نامعتبر» به‌جای فرم نشان داده می‌شود.
 *
 * ⚠️ وقتی SMTP اختصاصی بعداً وصل شد: قالب ایمیل Reset Password باید به
 * فرمت token_hash تغییر کند (بخش ۱۲.۱۲ پرامپت مادر برای HTML دقیق)، و
 * redirectTo در account-forgot-password.tsx باید به
 * `/auth/confirm?type=recovery&next=/account/reset-password` برگردد —
 * بعد از آن، این کامپوننت هم می‌تواند به بررسی سادهٔ تک‌مرحله‌ای getSession
 * برگردد (چون دیگر رقابت زمانی وجود ندارد، نشست از قبل توسط Route Handler
 * ساخته شده)، هرچند نگه‌داشتن نسخهٔ فعلی (دو-مرحله‌ای) هم اشکالی ندارد.
 */
export function AccountResetPassword() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const router = useRouter()

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ password?: boolean; confirm?: boolean }>({})
  const [serverError, setServerError] = useState<"errorWeakPassword" | "errorGeneric" | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setHasSession(!!session)
      setCheckingSession(false)
    })

    // implicit flow خواندن #hash را async انجام می‌دهد؛ اگر رندر اول زودتر
    // از آن اجرا شود، این listener همان لحظه که نشست ساخته شد ما را باخبر
    // می‌کند (رویداد "PASSWORD_RECOVERY" یا "SIGNED_IN").
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session) {
        setHasSession(true)
        setCheckingSession(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // نکتهٔ امنیتی implicit flow: توکن‌های نشست داخل #hash آدرس نشسته‌اند
  // (قابل‌مشاهده در تاریخچهٔ مرورگر/نوار آدرس). بعد از اینکه نشست ساخته
  // شد، آن‌ها را از URL پاک می‌کنیم — replaceState یعنی بدون رفرش صفحه و
  // بدون افزودن رکورد جدید به تاریخچهٔ back/forward.
  useEffect(() => {
    if (hasSession && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }
  }, [hasSession])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const nextErrors: typeof errors = {}
    if (!password || password.length < 6) nextErrors.password = true
    if (confirmPassword !== password) nextErrors.confirm = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setServerError(error.message.toLowerCase().includes("password") ? "errorWeakPassword" : "errorGeneric")
        return
      }
      setDone(true)
    } catch {
      setServerError("errorGeneric")
    } finally {
      setSubmitting(false)
    }
  }

  const fieldBase =
    "w-full rounded-xl border bg-background px-3.5 py-2.5 text-start text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-md px-5 py-12 sm:px-8 sm:py-16">
        {checkingSession ? null : !hasSession ? (
          <div className="animate-rise-in flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="size-9 text-destructive" strokeWidth={1.8} />
            <p className="font-semibold text-foreground">{t.account.resetLinkInvalidTitle}</p>
            <p className="text-sm text-muted-foreground">{t.account.resetLinkInvalidBody}</p>
            <Link
              href="/account/forgot-password"
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t.account.requestNewLink}
            </Link>
          </div>
        ) : done ? (
          <div className="animate-rise-in flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <CheckCircle2 className="size-9 text-primary" strokeWidth={1.8} />
            <p className="font-semibold text-foreground">{t.account.resetPasswordSuccessTitle}</p>
            <p className="text-sm text-muted-foreground">{t.account.resetPasswordSuccessBody}</p>
            <button
              onClick={() => {
                router.push("/account")
                router.refresh()
              }}
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t.account.goToDashboard}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center animate-rise-in">
              <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground`}>
                {t.account.resetPasswordTitle}
              </h1>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                {t.account.resetPasswordSubtitle}
              </p>
            </div>

            <form onSubmit={submit} className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.newPasswordLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    className={`${fieldBase} ${errors.password ? "border-destructive" : "border-border"}`}
                  />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{t.account.errorWeakPassword}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.confirmPasswordLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="password"
                    value={confirmPassword}
                    onChange={(ev) => setConfirmPassword(ev.target.value)}
                    className={`${fieldBase} ${errors.confirm ? "border-destructive" : "border-border"}`}
                  />
                  {errors.confirm && <p className="mt-1 text-xs text-destructive">{t.account.passwordMismatch}</p>}
                </div>

                {serverError && <p className="text-xs text-destructive">{t.account[serverError]}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
                >
                  <KeyRound className="size-4" />
                  {t.account.resetPasswordSubmit}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
