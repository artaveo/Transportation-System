import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPanel } from "@/components/transport/admin-panel"

// این صفحه یک لایهٔ دفاعی دومِ سمت سرور است، مکمل middleware.ts
// (طبق اصل «عملیات حساس همیشه سمت سرور تأیید شود» — بخش ۸.۲ پرامپت مادر).
//
// فاز ۵.۱۲: علاوه بر چک is_admin، این‌جا role/allowed_sections خودِ ادمین
// لاگین‌شده هم یک‌بار (سمت سرور، نه در هر رندر کلاینت) خوانده و به
// AdminPanel پاس داده می‌شود تا sidebar را بر همان اساس فیلتر کند —
// دقیقاً همان چیزی که ROAD-MAP فاز ۵.۱۲ به‌عنوان «چیزی که نیست» ثبت کرده
// بود. خواندن ردیف admins خودِ کاربر با همین کلاینت anon+نشست مجاز است
// چون RLS policy admins_self_or_super_select (فاز ۳.۲) دقیقاً `auth_user_id
// = auth.uid()` را برای خودِ ردیف اجازه می‌دهد.
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

  const { data: adminRow } = await supabase
    .from("admins")
    .select("role, allowed_sections")
    .eq("auth_user_id", user.id)
    .single()

  return <AdminPanel role={adminRow?.role ?? "limited_admin"} allowedSections={adminRow?.allowed_sections ?? []} />
}
