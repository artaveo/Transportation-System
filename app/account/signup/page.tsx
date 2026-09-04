import type { Metadata } from "next"
import { AccountSignup } from "@/components/transport/account-signup"

export const metadata: Metadata = {
  title: "ساخت حساب | سفرِ شب‌رو",
}

export default function AccountSignupPage() {
  return <AccountSignup />
}
