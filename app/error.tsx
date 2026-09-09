"use client"

import { useEffect } from "react"

// فاز ۵.۱۵ (Debt تاریخی / افزوده‌شده پس از audit — رفع باگ «دکمهٔ جستجو
// جواب نمی‌دهد»): در کل پروژه حتی یک App Router error boundary وجود نداشت،
// یعنی هر خطای پیش‌بینی‌نشدهٔ سمت کلاینت (نه فقط localStorage — هر crash
// دیگری هم) کل صفحه را بدون هیچ پیام یا راه فراری بی‌جواب/سفید می‌کرد.
// این فایل فقط خطاهای داخل خودِ صفحات (زیر LangProvider) را می‌گیرد؛
// خطای دقیقی که همین فاز رفعش کرد (داخل LangProvider، بالای این baseline)
// را global-error.tsx می‌گیرد.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p className="text-lg font-semibold text-foreground">مشکلی پیش آمد</p>
      <p className="max-w-md text-sm text-muted-foreground">
        این صفحه با خطا مواجه شد. لطفاً دوباره تلاش کنید.
        <br />
        <span dir="ltr" className="mt-1 block text-xs">
          This page hit an error. Please try again.
        </span>
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        تلاش دوباره
      </button>
    </div>
  )
}
