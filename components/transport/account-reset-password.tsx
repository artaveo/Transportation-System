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
 * این صفحه فقط زمانی کار می‌کند که کاربر از طریق app/auth/confirm/route.ts
 * (که token_hash داخل لینک ایمیل را verify کرده) به اینجا رسیده باشد —
 * یعنی از قبل یک نشست موقت «recovery» در کوکی‌هایش نشسته. اگر کسی مستقیم
 * این آدرس را باز کند (لینک قدیمی/دوباره‌استفاده‌شده)، هیچ نشستی وجود
 * ندارد و به‌جای فرم، پیام «لینک نامعتبر» با راه بازگشت نشان داده می‌شود —
 * نه یک فرم گمراه‌کننده که بعداً با خطای عمومی شکست می‌خورد.
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setCheckingSession(false)
    })
  }, [])

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
