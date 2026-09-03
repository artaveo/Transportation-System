"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BusFront, Loader2 } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"

function AdminLoginForm() {
  const { lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const notAdmin = searchParams.get("error") === "not_admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = {
    title: lang === "fa" ? "ورود ادمین" : "Admin Login",
    subtitle:
      lang === "fa" ? "برای دسترسی به پنل مدیریت وارد شوید" : "Sign in to access the admin panel",
    email: lang === "fa" ? "ایمیل" : "Email",
    password: lang === "fa" ? "رمز عبور" : "Password",
    submit: lang === "fa" ? "ورود" : "Sign in",
    submitting: lang === "fa" ? "در حال ورود..." : "Signing in...",
    invalidCreds: lang === "fa" ? "ایمیل یا رمز عبور نادرست است." : "Invalid email or password.",
    notAdminMsg:
      lang === "fa" ? "این حساب به پنل ادمین دسترسی ندارد." : "This account doesn't have admin access.",
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(t.invalidCreds)
      setLoading(false)
      return
    }

    // بررسی نهایی نقش ادمین سمت middleware انجام می‌شود؛ اینجا فقط هدایت می‌کنیم.
    router.push("/admin")
    router.refresh()
  }

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

        {notAdmin && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t.notAdminMsg}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              dir="ltr"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  )
}
