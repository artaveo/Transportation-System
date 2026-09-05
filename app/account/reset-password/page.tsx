import type { Metadata } from "next"
import { AccountResetPassword } from "@/components/transport/account-reset-password"

export const metadata: Metadata = {
  title: "تعیین رمز عبور جدید | سفرِ شب‌رو",
}

export default function AccountResetPasswordPage() {
  return <AccountResetPassword />
}
