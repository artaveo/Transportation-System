"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserCheck } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { normalizePhone, toLatinDigits } from "@/lib/phone-utils"
import { readPendingProfile, clearPendingProfile } from "@/lib/pending-profile"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

export function AccountCompleteProfile() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const router = useRouter()

  const [email, setEmail] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [errors, setErrors] = useState<{ phone?: boolean }>({})
  const [serverError, setServerError] = useState<
    "errorPhoneTaken" | "errorInvalidReferral" | "errorGeneric" | null
  >(null)
  const [submitting, setSubmitting] = useState(false)

  // پیش‌پرکردن از پروفایل موقت (اگر از فرم ثبت‌نام این‌جا رسیده) + خواندن
  // ایمیلِ نشستِ فعلی برای نمایش («شما به‌عنوان ... وارد شده‌اید»).
  useEffect(() => {
    const pending = readPendingProfile()
    if (pending) {
      setPhone(pending.phone)
      setFullName(pending.fullName ?? "")
      setReferralCode(pending.referralCode ?? "")
    }
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    if (!phone.trim()) {
      setErrors({ phone: true })
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("signup_customer", {
        p_phone: normalizePhone(phone),
        p_full_name: fullName.trim() || null,
        p_email: email,
        p_referral_code: referralCode.trim() || null,
      })

      if (error) {
        if (error.message.includes("PHONE_ALREADY_REGISTERED")) {
          setServerError("errorPhoneTaken")
        } else if (error.message.includes("INVALID_REFERRAL_CODE")) {
          setServerError("errorInvalidReferral")
        } else if (error.message.includes("CUSTOMER_ALREADY_EXISTS")) {
          // نشست از قبل پروفایل داشته — فقط به داشبورد برو
          router.push("/account")
          router.refresh()
          return
        } else {
          setServerError("errorGeneric")
        }
        return
      }

      clearPendingProfile()
      router.push("/account")
      router.refresh()
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
            {t.account.completeProfileTitle}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            {t.account.completeProfileSubtitle}
          </p>
        </div>

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
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.account.phoneLabel}</label>
              <input
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(toLatinDigits(e.target.value))}
                placeholder={t.account.phonePlaceholder}
                className={`${fieldBase} ${errors.phone ? "border-destructive" : "border-border"}`}
              />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{t.account.required}</p>}
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
              <UserCheck className="size-4" />
              {t.account.completeProfileSubmit}
            </button>
          </div>
        </form>
      </div>

      <SiteFooter />
    </div>
  )
}
