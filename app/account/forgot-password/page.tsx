import type { Metadata } from "next"
import { AccountForgotPassword } from "@/components/transport/account-forgot-password"

export const metadata: Metadata = {
  title: "بازیابی رمز عبور | سفرِ شب‌رو",
}

export default function AccountForgotPasswordPage() {
  return <AccountForgotPassword />
}
