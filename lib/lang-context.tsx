"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Lang } from "@/lib/i18n"
import { dictionary } from "@/lib/i18n"

type LangContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa")

  // Restore the saved preference once, on mount.
  useEffect(() => {
    const saved = window.localStorage.getItem("shabraw-lang")
    if (saved === "fa" || saved === "en") setLangState(saved)
  }, [])

  // Keep <html> direction/lang and storage in sync with the current language.
  useEffect(() => {
    document.documentElement.lang = lang === "fa" ? "fa-AF" : "en"
    document.documentElement.dir = dictionary[lang].dir
    window.localStorage.setItem("shabraw-lang", lang)
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
