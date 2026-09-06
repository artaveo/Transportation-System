import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Vazirmatn } from 'next/font/google'
import { cookies } from 'next/headers'
import { LangProvider } from '@/lib/lang-context'
import { dictionary, type Lang } from '@/lib/i18n'
import { LANG_COOKIE_NAME, isValidLang } from '@/lib/lang-cookie'
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
  metadataBase: new URL('https://transportation-system-blue.vercel.app'),
  title: 'سفرِ شب‌رو | Shabraw — بلیت بس بین‌شهری افغانستان',
  description:
    'رزرو آنلاین بلیت بس‌های بین‌شهری در مسیر کابل تا هرات — کابل، غزنی، قلات، کندهار، هلمند، نیمروز، فراه، هرات. Online intercity bus ticket booking on the Kabul-to-Herat corridor.',
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'fa_AF',
    alternateLocale: ['en_US'],
    url: '/',
    siteName: 'سفرِ شب‌رو | Shabraw',
    title: 'سفرِ شب‌رو | Shabraw — بلیت بس بین‌شهری افغانستان',
    description:
      'رزرو آنلاین بلیت بس‌های بین‌شهری در مسیر کابل تا هرات — کابل، غزنی، قلات، کندهار، هلمند، نیمروز، فراه، هرات.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'سفرِ شب‌رو | Shabraw — رزرو بلیت بس بین‌شهری افغانستان',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سفرِ شب‌رو | Shabraw — بلیت بس بین‌شهری افغانستان',
    description:
      'رزرو آنلاین بلیت بس‌های بین‌شهری در مسیر کابل تا هرات.',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#16213E',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // فاز ۴.۸ (رفع ردیف #۲۳ — بحرانی): زبان از کوکی (نه localStorage) در همان
  // لحظهٔ رندر سرور خوانده می‌شود تا dir/lang درست از همان اولین بایتِ HTML
  // روی <html> باشد و کاربر انگلیسی‌زبان دیگر فلاش RTL نبیند. الگوی رسمی
  // Next.js برای مشکلات هم‌خانواده (فلاش تم/زبان).
  const cookieStore = await cookies()
  const savedLang = cookieStore.get(LANG_COOKIE_NAME)?.value
  const initialLang: Lang = isValidLang(savedLang) ? savedLang : 'fa'
  const htmlLang = initialLang === 'fa' ? 'fa-AF' : 'en'
  const htmlDir = dictionary[initialLang].dir

  return (
    <html
      lang={htmlLang}
      dir={htmlDir}
      className={`${vazirmatn.variable} ${fraunces.variable} bg-background`}
    >
      <body className="antialiased">
        <LangProvider initialLang={initialLang}>{children}</LangProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
