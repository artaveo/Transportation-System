"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { dictionary } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"

export function AccountLogoutButton() {
  const { lang } = useLang()
  const t = dictionary[lang]
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
    >
      <LogOut className="size-3.5" />
      {t.account.logout}
    </button>
  )
}
