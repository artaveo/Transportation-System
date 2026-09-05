"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, CheckCircle2 } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

/**
 * فاز ۴.۷ — قدم اول فلوی «رمز عبور را فراموش کرده‌اید؟».
 *
 * نکتهٔ امنیتی عمدی: چه ایمیل در سیستم ثبت باشد چه نباشد، همیشه همان پیام
 * موفقیت نشان داده می‌شود (Supabase خودش هم همین رفتار را دارد — خطای
 * جداگانه برای «ایمیل پیدا نشد» برنمی‌گرداند). این از افشای اینکه یک ایمیل
 * مشخص صاحب حساب است یا نه (Email Enumeration) جلوگیری می‌کند.
 */
export function AccountForgotPassword() {
  const { lang } = useLang()
  const t = dictionary[lang]

  const [email, setEmail] = useState("")
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError(true)
      return
    }
    setError(false)
    setSubmitting(true)
    try {
      const supabase = createClient()
      // موقت (تصمیم Zakir — ۶ سپتامبر ۲۰۲۶، بخش ۱۲.۱۲ پرامپت مادر): چون بدون
      // SMTP اختصاصی، پنل Supabase اصلاً اجازهٔ ویرایش قالب ایمیل «Reset
      // Password» را نمی‌دهد (باکس آبی «Set up custom SMTP to edit
      // templates»)، فعلاً از قالب پیش‌فرض خودِ Supabase استفاده می‌شود که
      // لینک implicit-flow می‌سازد (توکن‌ها در #hash خودِ redirectTo، نه در
      // یک صفحهٔ واسط مثل /auth/confirm). به همین دلیل اینجا مستقیم به
      // /account/reset-password اشاره می‌کند. وقتی SMTP وصل شد و قالب ایمیل
      // به فرمت token_hash تغییر کرد، این خط باید به حالت قبلی برگردد:
      // `${window.location.origin}/auth/confirm?type=recovery&next=/account/reset-password`
      // — جزئیات کامل رفع در بخش ۱۲.۱۲ پرامپت مادر.
      const redirectTo = `${window.location.origin}/account/reset-password`
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    } finally {
      // عمداً بدون بررسی error از resetPasswordForEmail — طبق توضیح بالا،
      // موفقیت همیشه یکسان نمایش داده می‌شود، حتی اگر خطای شبکه‌ای/سرویسی
      // رخ داده باشد (کاربر واقعی هم همان چیزی را می‌بیند که مهاجم می‌بیند).
      setSubmitting(false)
      setSent(true)
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
            {t.account.forgotPasswordTitle}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            {t.account.forgotPasswordSubtitle}
          </p>
        </div>

        {sent ? (
          <div className="animate-rise-in flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <CheckCircle2 className="size-9 text-primary" strokeWidth={1.8} />
            <p className="font-semibold text-foreground">{t.account.forgotPasswordSuccessTitle}</p>
            <p className="text-sm text-muted-foreground">{t.account.forgotPasswordSuccessBody}</p>
            <Link
              href="/account/login"
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {t.account.backToLogin}
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="animate-rise-in rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t.account.emailLabel}
                  </label>
                  <input
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className={`${fieldBase} ${error ? "border-destructive" : "border-border"}`}
                  />
                  {error && <p className="mt-1 text-xs text-destructive">{t.account.required}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
                >
                  <Mail className="size-4" />
                  {t.account.forgotPasswordSubmit}
                </button>
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              <Link href="/account/login" className="font-medium text-primary hover:underline">
                {t.account.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
