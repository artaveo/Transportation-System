"use client"

import { useEffect, useState } from "react"
import { Loader2, RotateCcw, Upload } from "lucide-react"
import { dictionary, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  RESPONSIVE_IMAGE_BREAKPOINTS,
  RESPONSIVE_IMAGE_SECTIONS,
  BREAKPOINT_LABEL,
  type ResponsiveImageBreakpoint,
} from "@/lib/responsive-image-sections"
import { ConfirmDialog, ErrorBanner, LoadingRows, secondaryBtnClass } from "./admin-ui"
import { ImageCropModal } from "./image-crop-modal"

/**
 * فاز ۵.۱۴ — Responsive Image CMS.
 *
 * زمینه: فاز ۵.۱۳ عمداً عکس‌های پس‌زمینهٔ هیرو/ناوگان/درباره‌ما را کنار
 * گذاشت چون این‌ها سیستم ۴-برشی (mobile/tablet/desktop/wide) دارند و
 * ادمین‌کردنشان به یک ابزار crop واقعی نیاز داشت، نه یک آپلود ساده. تصمیم
 * صریح Zakir: (۱) کراپ باید داخل خودِ سایت با پیش‌نمایش زنده باشد، (۲)
 * سیستم باید عمومی/توسعه‌پذیر باشد — «برای هر بخشی که عکس لازم داشته
 * باشه» — نه فقط این سه بخش شناخته‌شدهٔ فعلی.
 *
 * طراحی: فهرست بخش‌ها و نسبت ابعاد هر برش در lib/responsive-image-
 * sections.ts (کد، نه دیتابیس — چون نسبت ابعاد به کلاس CSS aspect-[...]
 * همان کامپوننت گره خورده). این کامپوننت فقط همان فهرست را می‌خواند و
 * برایش UI می‌سازد؛ افزودن بخش جدید در آینده فقط یک آیتم به آن فایل اضافه
 * می‌کند، این کامپوننت خودکار slot های جدید را رندر می‌کند.
 *
 * هر اسلات مستقل است: آپلود = انتخاب فایل → مودال کراپ (قفل‌شده روی نسبت
 * ابعاد دقیق همان breakpoint، با پیش‌نمایش زنده — دقیقاً درخواست Zakir) →
 * تولید Blob با canvas → آپلود در bucket site-content با نام نسخه‌بندی‌شده
 * (`responsive/{section}/{breakpoint}-{timestamp}.jpg`) → upsert در
 * responsive_site_images. «بازگشت به پیش‌فرض» فقط ردیف دیتابیس را حذف
 * می‌کند (فایل در Storage باقی می‌ماند — همان تصمیم بدهی مستند فاز ۵.۱۳
 * برای fleet_photo_url) تا کامپوننت پابلیک به فایل استاتیک fallback برگردد.
 */

type OverrideMap = Record<string, Partial<Record<ResponsiveImageBreakpoint, string>>>

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SOURCE_BYTES = 15 * 1024 * 1024

function aspectToRatio(aspect: string): number {
  const [w, h] = aspect.split("/").map(Number)
  return w / h
}

export function ResponsiveImageManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const tr = t.admin.responsiveImages
  const supabase = createClient()

  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [pending, setPending] = useState<{
    sectionKey: string
    breakpoint: ResponsiveImageBreakpoint
    objectUrl: string
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cropError, setCropError] = useState<string | null>(null)
  const [slotError, setSlotError] = useState<{ sectionKey: string; breakpoint: string; message: string } | null>(
    null,
  )

  const [resetting, setResetting] = useState<{ sectionKey: string; breakpoint: ResponsiveImageBreakpoint } | null>(
    null,
  )
  const [resettingBusy, setResettingBusy] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase.from("responsive_site_images").select("section_key, breakpoint, image_url")

    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    const map: OverrideMap = {}
    for (const row of data ?? []) {
      if (!map[row.section_key]) map[row.section_key] = {}
      map[row.section_key][row.breakpoint as ResponsiveImageBreakpoint] = row.image_url
    }
    setOverrides(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openPicker(sectionKey: string, breakpoint: ResponsiveImageBreakpoint, file: File) {
    setSlotError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSlotError({ sectionKey, breakpoint, message: tr.invalidType })
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setSlotError({ sectionKey, breakpoint, message: tr.tooLarge })
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setCropError(null)
    setPending({ sectionKey, breakpoint, objectUrl })
  }

  function closeCropModal() {
    if (uploading) return
    if (pending) URL.revokeObjectURL(pending.objectUrl)
    setPending(null)
  }

  async function handleCropConfirm(blob: Blob) {
    if (!pending) return
    setUploading(true)
    setCropError(null)

    const { sectionKey, breakpoint } = pending
    const path = `responsive/${sectionKey}/${breakpoint}-${Date.now()}.jpg`

    const { error: uploadErr } = await supabase.storage.from("site-content").upload(path, blob, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/jpeg",
    })

    if (uploadErr) {
      setUploading(false)
      setCropError(t.admin.manage.genericError)
      return
    }

    const { data: publicUrlData } = supabase.storage.from("site-content").getPublicUrl(path)

    const { error: upsertErr } = await supabase
      .from("responsive_site_images")
      .upsert(
        { section_key: sectionKey, breakpoint, image_url: publicUrlData.publicUrl },
        { onConflict: "section_key,breakpoint" },
      )

    setUploading(false)

    if (upsertErr) {
      setCropError(t.admin.manage.genericError)
      return
    }

    setOverrides((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [breakpoint]: publicUrlData.publicUrl },
    }))
    URL.revokeObjectURL(pending.objectUrl)
    setPending(null)
  }

  async function handleReset() {
    if (!resetting) return
    setResettingBusy(true)
    setResetError(null)

    const { error } = await supabase
      .from("responsive_site_images")
      .delete()
      .eq("section_key", resetting.sectionKey)
      .eq("breakpoint", resetting.breakpoint)

    setResettingBusy(false)

    if (error) {
      setResetError(t.admin.manage.genericError)
      return
    }

    setOverrides((prev) => {
      const next = { ...prev }
      if (next[resetting.sectionKey]) {
        const { [resetting.breakpoint]: _removed, ...rest } = next[resetting.sectionKey]
        next[resetting.sectionKey] = rest
      }
      return next
    })
    setResetting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{tr.title}</h3>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{tr.subtitle}</p>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      {loading ? (
        <div className="rounded-xl border border-border bg-card">
          <LoadingRows />
        </div>
      ) : (
        RESPONSIVE_IMAGE_SECTIONS.map((section) => (
          <div key={section.key} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h4 className="mb-3 text-sm font-semibold text-foreground">{section.label[lang]}</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {RESPONSIVE_IMAGE_BREAKPOINTS.map((bp) => {
                const currentUrl = overrides[section.key]?.[bp] ?? section.defaultSrc[bp]
                const isCustom = Boolean(overrides[section.key]?.[bp])
                const inputId = `responsive-upload-${section.key}-${bp}`
                const err = slotError && slotError.sectionKey === section.key && slotError.breakpoint === bp

                return (
                  <div key={bp} className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{BREAKPOINT_LABEL[bp][lang]}</p>
                    <div
                      className="w-full overflow-hidden rounded-lg border border-border bg-muted"
                      style={{ aspectRatio: section.aspect[bp] }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentUrl} alt="" className="size-full object-cover" />
                    </div>
                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        isCustom ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCustom ? tr.customBadge : tr.defaultBadge}
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      <label htmlFor={inputId} className={`${secondaryBtnClass} cursor-pointer !px-2.5 !py-1.5 text-xs`}>
                        <Upload className="size-3.5" />
                        {isCustom ? tr.replace : tr.upload}
                        <input
                          id={inputId}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) openPicker(section.key, bp, file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                      {isCustom && (
                        <button
                          type="button"
                          className={`${secondaryBtnClass} !px-2.5 !py-1.5 text-xs`}
                          onClick={() => {
                            setResetError(null)
                            setResetting({ sectionKey: section.key, breakpoint: bp })
                          }}
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {err && <ErrorBanner message={slotError!.message} className="w-fit" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {pending && (
        <ImageCropModal
          imageSrc={pending.objectUrl}
          aspect={aspectToRatio(
            RESPONSIVE_IMAGE_SECTIONS.find((s) => s.key === pending.sectionKey)!.aspect[pending.breakpoint],
          )}
          title={tr.cropTitle}
          hint={tr.cropHint}
          zoomLabel={tr.zoomLabel}
          applyLabel={tr.apply}
          cancelLabel={t.admin.manage.cancel}
          uploadingLabel={tr.uploading}
          busy={uploading}
          error={cropError}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title={tr.resetConfirmTitle}
          body={tr.resetConfirmBody}
          confirmLabel={tr.reset}
          cancelLabel={t.admin.manage.cancel}
          pending={resettingBusy}
          errorMessage={resetError}
          onConfirm={handleReset}
          onCancel={() => setResetting(null)}
        />
      )}
    </div>
  )
}
