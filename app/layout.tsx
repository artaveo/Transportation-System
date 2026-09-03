import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Vazirmatn } from 'next/font/google'
import { LangProvider } from '@/lib/lang-context'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'سفرِ شب‌رو | Shabraw — بلیت بس بین‌شهری افغانستان',
  description:
    'رزرو آنلاین بلیت بس‌های بین‌شهری در کریدور کابل تا هرات — کابل، غزنی، قلات، کندهار، هلمند، نیمروز، فراه، هرات. Online intercity bus ticket booking on the Kabul-to-Herat corridor.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#16213E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa-AF" dir="rtl" className={`${vazirmatn.variable} ${fraunces.variable} bg-background`}>
      <body className="antialiased">
        <LangProvider>{children}</LangProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
