import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCustomerAccount, getCustomerBookingHistory } from "@/lib/supabase/queries"
import { AccountDashboard } from "@/components/transport/account-dashboard"

export const metadata: Metadata = {
  title: "حساب من | سفرِ شب‌رو",
}

// این صفحه در middleware.ts فقط از نظر «آیا اصلاً وارد شده یا نه» محافظت
// می‌شود؛ تشخیص «آیا رکورد customers دارد یا نه» عمداً همین‌جا (نه در
// middleware) انجام می‌شود، چون فقط این یک مسیر به آن SELECT اضافی نیاز دارد.
export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/account/login")
  }

  const account = await getCustomerAccount()
  if (!account) {
    redirect("/account/complete-profile")
  }

  const bookings = await getCustomerBookingHistory()

  return <AccountDashboard account={account} bookings={bookings} />
}
