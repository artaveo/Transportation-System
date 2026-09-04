"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { readPendingProfile, clearPendingProfile } from "@/lib/pending-profile"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

export function AccountLogin() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const nextErrors: typeof errors = {}
    if (!email.trim()) nextErrors.email = true
    if (!password) nextErrors.password = true
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setServerError(t.account.errorInvalidCredentials)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle()

        if (!existing) {
          const pending = readPendingProfile()
          if (pending?.phone) {
            const { error: signupError } = await supabase.rpc("signup_customer", {
              p_phone: pending.phone,
              p_full_name: pending.fullName ?? null,
              p_email: email.trim(),
              p_referral_code: pending.referralCode ?? null,
            })
            clearPendingProfile()
            if (signupError) {
              router.push("/account/complete-profile")
              return
            }
          } else {
            router.push("/account/complete-profile")
            return
          }
        }
      }

      router.push("/account")
      router.refresh()
    } catch {
      setServerError(t.account.errorGeneric)
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
            {t.account.loginTitle}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{t.account.loginSubtitle}</p>
        </div>

        <form onSubmit={submit} className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.account.emailLabel}</label>
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
              {errors.password && <p className="mt-1 text-xs text-destructive">{t.account.required}</p>}
            </div>

            {serverError && <p className="text-xs text-destructive">{serverError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
            >
              <LogIn className="size-4" />
              {t.account.loginSubmit}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t.account.noAccountYet}{" "}
          <Link href="/account/signup" className="font-medium text-primary hover:underline">
            {t.account.goSignup}
          </Link>
        </p>
      </div>

      <SiteFooter />
    </div>
  )
}
