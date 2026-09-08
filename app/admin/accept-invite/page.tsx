"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BusFront, CheckCircle2, KeyRound, Loader2 } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"

/**
 * فاز ۵.۱۲ — قدم دوم دعوت ادمین محدود جدید.
 *
 * زمینه: مثل account-reset-password.tsx (فاز ۴.۷)، چون فعلاً SMTP اختصاصی
 * وصل نیست، دعوت هم از قالب پیش‌فرض ایمیل Supabase استفاده می‌کند —
 * «implicit flow» یعنی توکن‌های نشست داخل #hash خودِ لینک می‌آیند، نه یک
 * token_hash که سرور verify کند. کتابخانهٔ @supabase/ssr این #hash را در
 * createClient (مرورگر) خودکار و async می‌خواند، پس دقیقاً همان الگوی
 * دومرحله‌ای (getSession اولیه + onAuthStateChange) لازم است.
 *
 * تفاوت مهم با ریست رمز مسافر: وقتی این لینک باز می‌شود، رکورد admins برای
 * این کاربر از قبل در دیتابیس وجود دارد (در همان لحظه‌ای که super_admin او
 * را دعوت کرد ساخته شد — نگاه کنید به app/api/admin/admins/route.ts)، پس
 * is_admin() از همین حالا true است؛ این صفحه فقط رمز عبور واقعی را
 * می‌سازد، نه دسترسی ادمین را.
 */
export default function AdminAcceptInvitePage() {
  const { lang } = useLang()
  const router = useRouter()

  const t = {
    title: lang === "fa" ? "تکمیل حساب ادمین" : "Complete Admin Account",
    subtitle:
      lang === "fa"
        ? "برای فعال‌سازی حساب، یک رمز عبور تعیین کنید."
        : "Set a password to activate your admin account.",
    password: lang === "fa" ? "رمز عبور جدید" : "New password",
    confirmPassword: lang === "fa" ? "تکرار رمز عبور" : "Confirm password",
    submit: lang === "fa" ? "فعال‌سازی حساب" : "Activate account",
    submitting: lang === "fa" ? "در حال ثبت..." : "Submitting...",
    weakPassword: lang === "fa" ? "رمز عبور باید حداقل ۶ کاراکتر باشد." : "Password must be at least 6 characters.",
    mismatch: lang === "fa" ? "دو رمز عبور یکسان نیستند." : "Passwords do not match.",
    genericError: lang === "fa" ? "مشکلی پیش آمد. لطفاً دوباره تلاش کنید." : "Something went wrong. Please try again.",
    invalidTitle: lang === "fa" ? "لینک نامعتبر است" : "Invalid link",
    invalidBody:
      lang === "fa"
        ? "این لینک دعوت منقضی شده یا قبلاً استفاده شده است. از سوپر‌ادمین بخواهید دوباره دعوتتان کند."
        : "This invite link has expired or was already used. Ask a super admin to invite you again.",
    successTitle: lang === "fa" ? "حساب فعال شد" : "Account activated",
    successBody:
      lang === "fa" ? "می‌توانید وارد پنل مدیریت شوید." : "You can now sign in to the admin panel.",
    goToPanel: lang === "fa" ? "ورود به پنل" : "Go to panel",
  }

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ password?: boolean; confirm?: boolean }>({})
  const [serverError, setServerError] = useState<string | null>(null)
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

  useEffect(() => {
    if (hasSession && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }
  }, [hasSession])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const nextErrors: typeof fieldErrors = {}
    if (!password || password.length < 6) nextErrors.password = true
    if (confirmPassword !== password) nextErrors.confirm = true
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setServerError(error.message.toLowerCase().includes("password") ? t.weakPassword : t.genericError)
        return
      }
      setDone(true)
    } catch {
      setServerError(t.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldBase =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BusFront className="size-5" strokeWidth={2.2} />
          </span>
          <h1 className="text-lg font-semibold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        {checkingSession ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasSession ? (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-destructive/10 px-3 py-4 text-center">
            <p className="text-sm font-semibold text-destructive">{t.invalidTitle}</p>
            <p className="text-xs text-destructive/90">{t.invalidBody}</p>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <CheckCircle2 className="size-9 text-primary" strokeWidth={1.8} />
            <p className="font-semibold text-foreground">{t.successTitle}</p>
            <p className="text-sm text-muted-foreground">{t.successBody}</p>
            <button
              type="button"
              onClick={() => {
                router.push("/admin")
                router.refresh()
              }}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.goToPanel}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.password}</label>
              <input
                dir="ltr"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${fieldBase} ${fieldErrors.password ? "border-destructive" : "border-border"}`}
              />
              {fieldErrors.password && <p className="text-xs text-destructive">{t.weakPassword}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.confirmPassword}</label>
              <input
                dir="ltr"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${fieldBase} ${fieldErrors.confirm ? "border-destructive" : "border-border"}`}
              />
              {fieldErrors.confirm && <p className="text-xs text-destructive">{t.mismatch}</p>}
            </div>

            {serverError && <p className="text-xs text-destructive">{serverError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
