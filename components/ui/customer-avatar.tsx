import Image from "next/image"
import { User } from "lucide-react"

/**
 * فاز ۴.۷ — آواتار مسافر در هدر سایت (درخواست Zakir، بر اساس اسکرین‌شات
 * FlixBus: یک آیکن دایره‌ای کنار دکمهٔ «ثبت‌نام / ورود»).
 *
 * سه حالت، به ترتیب اولویت:
 *   ۱. عکس واقعی (customers.avatar_url) — امروز همیشه null است چون فیچر
 *      آپلود هنوز ساخته نشده (فاز ۴.۷ فقط ستون دیتابیس + این کامپوننت را
 *      آماده کرد)؛ وقتی در فازی بعدی این مقدار پر شود، بدون هیچ تغییر
 *      کدی همینجا نمایش داده می‌شود — دقیقاً همان الگوی «فقط فایل عوض شود»
 *      که در کل پروژه (مثلاً ResponsivePhoto) رعایت شده.
 *   ۲. اگر مسافر وارد شده ولی هنوز عکس ندارد: حرف اول نامش.
 *   ۳. اگر مهمان است (هنوز وارد نشده) یا اصلاً نامی ثبت نشده: آیکن
 *      سایه‌ای عمومی (silhouette) — دقیقاً همان چیزی که در اسکرین‌شات
 *      FlixBus کنار «Register / Sign in» دیده می‌شود.
 */
export function CustomerAvatar({
  name,
  avatarUrl,
  size = 28,
  className = "",
}: {
  name?: string | null
  avatarUrl?: string | null
  size?: number
  className?: string
}) {
  const initial = name?.trim()?.[0]?.toUpperCase()

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : initial ? (
        <span className="text-xs font-semibold" style={{ fontSize: Math.max(10, size * 0.42) }}>
          {initial}
        </span>
      ) : (
        <User
          className="text-muted-foreground"
          style={{ width: size * 0.6, height: size * 0.6 }}
          strokeWidth={2}
        />
      )}
    </span>
  )
}
