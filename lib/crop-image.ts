export type PixelCropArea = { x: number; y: number; width: number; height: number }

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", () => reject(new Error("image-load-failed")))
    img.src = url
  })
}

/**
 * فاز ۵.۱۴ — از یک object URL (بلافاصله بعد از انتخاب فایل، هم‌مبدأ است، پس
 * مشکل CORS ندارد) و ناحیهٔ crop برگشتی از react-easy-crop (بر حسب پیکسل
 * واقعی عکس منبع، نه اندازهٔ نمایشی)، یک Blob از همان ناحیه با کیفیت کامل
 * می‌سازد — بدون هیچ resize اضافه؛ بهینه‌سازی/تبدیل فرمت نهایی را همان
 * پایپ‌لاین next/image (ResponsivePhoto) موقع نمایش انجام می‌دهد.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCropArea,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(pixelCrop.width))
  canvas.height = Math.max(1, Math.round(pixelCrop.height))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no-2d-context")

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("canvas-export-failed"))
      },
      mimeType,
      quality,
    )
  })
}
