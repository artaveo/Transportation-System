"use client"

// فاز ۵.۱۵ — سطح دوم safety net. برخلاف app/error.tsx (که فقط زیر
// LangProvider را می‌گیرد)، این فایل خطاهای داخل خودِ app/layout.tsx
// (از جمله LangProvider) را می‌گیرد — دقیقاً همان نقطه‌ای که باگ
// «دکمهٔ جستجوی هیرو جواب نمی‌دهد» در آن بود (localStorage.setItem بدون
// try/catch در useEffect یک provider که دور کل <body> پیچیده شده بود).
// طبق قرارداد Next.js، چون این فایل جای کل RootLayout می‌نشیند، باید خودش
// <html>/<body> را دوباره تعریف کند — نمی‌تواند از LangProvider/فونت‌ها/
// context عادی سایت استفاده کند چون خودِ آن‌ها ممکن است منشأ خطا باشند.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fa-AF" dir="rtl">
      <body style={{ margin: 0, background: "#16213e", color: "#ede7da" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600 }}>مشکلی پیش آمد</p>
          <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 420, lineHeight: 1.7 }}>
            سایت با خطا مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.
            <br />
            <span dir="ltr" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
              The site hit an error. Please reload the page.
            </span>
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: 12,
              background: "#e8a33d",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#16213e",
              border: "none",
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  )
}
