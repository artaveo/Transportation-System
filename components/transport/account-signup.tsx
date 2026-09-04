"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { savePendingProfile } from "@/lib/pending-profile"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

export function AccountSignup() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [errors, setErrors] = useState<{ phone?: boolean; email?: boolean; password?: boolean }>({})
  const [serverError, setServerError] = useState<
    "errorEmailInUse" | "errorWeakPassword" | "errorGeneric" | "errorPhoneTaken" | "errorInvalidReferral" | null
  >(null)
  const [confirmNoticeShown, setConfirmNoticeShown] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const nextErrors: typeof errors = {}
    if (!phone.trim()) nextErrors.phone = true
    if (!email.trim()) nextErrors.email = true
    if (!password || password.length < 6) nextErrors.password = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setServerError("errorEmailInUse")
        } else if (error.message.toLowerCase().includes("password")) {
          setServerError("errorWeakPassword")
        } else {
          setServerError("errorGeneric")
        }
        return
      }

      const profile = {
        phone: phone.trim(),
        fullName: fullName.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
      }

      if (data.session) {
        // تأیید ایمیل در این پروژه غیرفعال است (یا از قبل تأیید شده) — نشست
        // بلافاصله فعال است، پس پروفایل customers همین الان ساخته می‌شود.
        const { error: signupError } = await supabase.rpc("signup_customer", {
          p_phone: profile.phone,
          p_full_name: profile.fullName ?? null,
          p_email: email.trim(),
          p_referral_code: profile.referralCode ?? null,
        })
        if (signupError) {
          setServerError(
            signupError.message.includes("PHONE_ALREADY_REGISTERED")
              ? "errorPhoneTaken"
              : signupError.message.includes("INVALID_REFERRAL_CODE")
                ? "errorInvalidReferral"
                : "errorGeneric",
          )
          return
        }
        router.push("/account")
        router.refresh()
        return
      }

      // نشست فوری نیست — یعنی تأیید ایمیل لازم است. اطلاعات پروفایل را
      // موقتاً نگه می‌داریم تا بعد از تأیید و ورود مجدد تکمیل شود.
      savePendingProfile(profile)
      setConfirmNoticeShown(true)
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
        <div className="mb-8 text-center animate-rise-in">
          <h1 className={`${displayFont(lang)} text-3xl font-semibold tracking-tight text-foreground`}>
            {t.account.signupTitle}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.account.signupSubtitle}</p>
        </div>

        {confirmNoticeShown ? (
          <div className="animate-rise-in rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm leading-relaxed text-foreground">{t.account.confirmEmailNotice}</p>
            <Link href="/account/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              {t.account.goLogin}
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.fullNameLabel}
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${fieldBase} border-border`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.phoneLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.account.phonePlaceholder}
                    className={`${fieldBase} ${errors.phone ? "border-destructive" : "border-border"}`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{t.account.required}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.emailLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${fieldBase} ${errors.email ? "border-destructive" : "border-border"}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{t.account.required}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.passwordLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${fieldBase} ${errors.password ? "border-destructive" : "border-border"}`}
                  />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{t.account.errorWeakPassword}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.referralCodeLabel}
                  </label>
                  <input
                    dir="ltr"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className={`${fieldBase} border-border`}
                  />
                </div>

                {serverError && <p className="text-xs text-destructive">{t.account[serverError]}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
                >
                  <UserPlus className="size-4" />
                  {t.account.signupSubmit}
                </button>
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {t.account.haveAccount}{" "}
              <Link href="/account/login" className="font-medium text-primary hover:underline">
                {t.account.goLogin}
              </Link>
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
