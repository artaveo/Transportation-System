import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPanel } from "@/components/transport/admin-panel"

// این صفحه یک لایهٔ دفاعی دومِ سمت سرور است، مکمل middleware.ts
// (طبق اصل «عملیات حساس همیشه سمت سرور تأیید شود» — بخش ۸.۲ پرامپت مادر).
export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: isAdmin } = await supabase.rpc("is_admin")

  if (!isAdmin) {
    await supabase.auth.signOut()
    redirect("/admin/login?error=not_admin")
  }

  return <AdminPanel />
}
