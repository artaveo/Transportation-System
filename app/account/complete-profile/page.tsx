import type { Metadata } from "next"
import { AccountCompleteProfile } from "@/components/transport/account-complete-profile"

export const metadata: Metadata = {
  title: "تکمیل پروفایل | سفرِ شب‌رو",
}

export default function AccountCompleteProfilePage() {
  return <AccountCompleteProfile />
}
