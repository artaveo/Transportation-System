"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, Loader2, X } from "lucide-react"

/**
 * ابزارهای مشترک برای مدیرهای CRUD فاز ۵.۱ (RouteManager, BusManager,
 * DriverManager, TripScheduler). قبل از این فاز، هیچ الگوی مودال/فرمی در
 * پنل ادمین وجود نداشت (همه چیز فقط جدول‌های خواندنی روی دادهٔ ساختگی
 * بودند)، پس این فایل یک‌بار ساخته شد تا چهار مدیر بعدی تکرار نکنند.
 */

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"

export const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground"

export const primaryBtnClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"

export const secondaryBtnClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"

export const dangerBtnClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"

export const iconBtnClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-lg`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  pending,
  onConfirm,
  onCancel,
  errorMessage,
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
  errorMessage?: string | null
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{body}</p>
      {errorMessage && <ErrorBanner message={errorMessage} className="mt-3" />}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={secondaryBtnClass} onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </button>
        <button type="button" className={dangerBtnClass} onClick={onConfirm} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function ErrorBanner({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive ${className}`}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{message}</p>
}

export function LoadingRows() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
    </div>
  )
}

/** پیام‌های خطای دیتابیس Postgres/PostgREST که هر چهار مدیر ممکن است به آن‌ها برخورد کنند. */
export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505"
}

export function isForeignKeyViolation(error: { code?: string } | null): boolean {
  return error?.code === "23503"
}
