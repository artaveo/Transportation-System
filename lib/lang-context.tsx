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
  useEffect(() => {
    document.documentElement.lang = lang === "fa" ? "fa-AF" : "en"
    document.documentElement.dir = dictionary[lang].dir
    window.localStorage.setItem("shabraw-lang", lang)
    // کوکی هم موازی نوشته می‌شود تا رندر سرور بعدی (لود بعدی صفحه) هم درست باشد.
    document.cookie = `${LANG_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`
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
