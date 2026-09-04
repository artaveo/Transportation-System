import type { Metadata } from "next"
import { ContactPage } from "@/components/transport/contact-page"

export const metadata: Metadata = {
  title: "تماس با ما | سفرِ شب‌رو",
}

export default function Contact() {
  return <ContactPage />
}
