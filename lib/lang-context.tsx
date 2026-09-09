"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Lang } from "@/lib/i18n"
import { dictionary } from "@/lib/i18n"
import { LANG_COOKIE_NAME, isValidLang } from "@/lib/lang-cookie"

type LangContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

// فاز ۴.۸ (ردیف #۲۳): مقدار اولیه دیگر همیشه "fa" نیست — از کوکی‌ای که
// app/layout.tsx (سرور) خوانده می‌آید، تا با همان چیزی که سرور روی <html>
// رندر کرده یکی باشد و هیچ فلاش/میسمچ هیدریتی رخ ندهد.
export function LangProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang: Lang
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  // Keep <html> direction/lang and storage in sync with the current language.
  // این افکت روی همهٔ صفحات (چون LangProvider دور کل <body> است) در همان
  // اولین هیدریت اجرا می‌شود؛ اگر مرورگر localStorage/cookie را مسدود کرده
  // باشد (حالت خصوصی سخت‌گیرانه، «Block all cookies»، پالیسی سازمانی، …)
  // بدون try/catch یک SecurityError پرتاب می‌شد که — چون هیچ app/error.tsx
  // ای در پروژه نبود — کل هیدریت React را برای کل سایت می‌ترکاند: HTML سمت
  // سرور همچنان نمایش داده می‌شد (ظاهر صفحه سالم به نظر می‌رسید) اما هیچ
  // event handler ای (از جمله دکمهٔ جستجوی هیرو) دیگر attach نمی‌شد. همان
  // ریسکی که در lib/pending-profile.ts قبلاً شناسایی و try/catch شده بود،
  // اینجا رعایت نشده بود.
  useEffect(() => {
    document.documentElement.lang = lang === "fa" ? "fa-AF" : "en"
    document.documentElement.dir = dictionary[lang].dir
    try {
      window.localStorage.setItem("shabraw-lang", lang)
    } catch {
      // بی‌ضرر — localStorage صرفاً برای همگام‌سازی بین تب‌هاست؛ کوکی زیر
      // (اگر آن هم مسدود باشد) تنها روی رندر اولیهٔ لود بعدی اثر می‌گذارد.
    }
    // کوکی هم موازی نوشته می‌شود تا رندر سرور بعدی (لود بعدی صفحه) هم درست باشد.
    try {
      document.cookie = `${LANG_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      // بی‌ضرر — فقط یعنی زبان پیش‌فرض لود بعدی از کوکی خوانده نمی‌شود.
    }
  }, [lang])

  // اگر یک تب دیگر زبان را عوض کند، این تب هم همگام شود (localStorage همچنان
  // منبع همگام‌سازی بین تب‌هاست؛ کوکی فقط برای رندر اولیهٔ سرور است).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "shabraw-lang" && isValidLang(e.newValue) && e.newValue !== lang) {
        setLangState(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [lang])

  const value: LangContextValue = {
    lang,
    setLang: setLangState,
    toggle: () => setLangState((l) => (l === "fa" ? "en" : "fa")),
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used within a LangProvider")
  return ctx
}
