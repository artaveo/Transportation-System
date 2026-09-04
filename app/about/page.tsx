import type { Metadata } from "next"
import { AboutPage } from "@/components/transport/about-page"

export const metadata: Metadata = {
  title: "دربارهٔ ما | سفرِ شب‌رو",
}

export default function About() {
  return <AboutPage />
}
