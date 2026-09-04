import type { Metadata } from "next"
import { FaqPage } from "@/components/transport/faq-page"

export const metadata: Metadata = {
  title: "سوالات متداول | سفرِ شب‌رو",
}

export default function Faq() {
  return <FaqPage />
}
