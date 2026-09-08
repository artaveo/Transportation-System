"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { Loader2 } from "lucide-react"
import { Modal, ErrorBanner, primaryBtnClass, secondaryBtnClass } from "./admin-ui"
import { getCroppedImageBlob } from "@/lib/crop-image"

/**
 * فاز ۵.۱۴ — ابزار کراپ درون‌سایتی (تصمیم Zakir: نه دستی بیرون از سایت).
 * قاب crop دقیقاً با `aspect` قفل است (همان نسبتی که کامپوننت پابلیک روی
 * سایت با `aspect-[...]` نمایش می‌دهد) — یعنی چیزی که ادمین اینجا می‌بیند
 * دقیقاً همان چیزی است که کاربر نهایی می‌بیند، نه یک تخمین.
 */
export function ImageCropModal({
  imageSrc,
  aspect,
  title,
  hint,
  zoomLabel,
  applyLabel,
  cancelLabel,
  uploadingLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  imageSrc: string
  aspect: number
  title: string
  hint: string
  zoomLabel: string
  applyLabel: string
  cancelLabel: string
  uploadingLabel: string
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [preparing, setPreparing] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  async function handleApply() {
    if (!croppedAreaPixels) return
    setPreparing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setPreparing(false)
    }
  }

  const busyNow = busy || preparing

  return (
    <Modal title={title} onClose={onCancel} wide>
      <p className="mb-3 text-xs text-muted-foreground">{hint}</p>

      <div className="relative h-72 w-full overflow-hidden rounded-lg bg-black sm:h-96">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          restrictPosition
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="shrink-0 text-xs font-medium text-muted-foreground">{zoomLabel}</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {error && <ErrorBanner message={error} className="mt-3" />}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={secondaryBtnClass} onClick={onCancel} disabled={busyNow}>
          {cancelLabel}
        </button>
        <button type="button" className={primaryBtnClass} onClick={handleApply} disabled={busyNow || !croppedAreaPixels}>
          {busyNow && <Loader2 className="size-3.5 animate-spin" />}
          {busy ? uploadingLabel : applyLabel}
        </button>
      </div>
    </Modal>
  )
}
