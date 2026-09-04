import type { Metadata } from "next"
import { AccountLogin } from "@/components/transport/account-login"

export const metadata: Metadata = {
  title: "ورود به حساب | سفرِ شب‌رو",
}

export default function AccountLoginPage() {
  return <AccountLogin />
}
