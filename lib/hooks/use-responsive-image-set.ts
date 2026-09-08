"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  RESPONSIVE_IMAGE_BREAKPOINTS,
  getResponsiveImageSection,
  type ResponsiveImageBreakpoint,
} from "@/lib/responsive-image-sections"

/**
 * فاز ۵.۱۴ — برای یک section_key ثبت‌شده در lib/responsive-image-sections.ts،
 * مقادیر ۴ برش را برمی‌گرداند: اگر ادمین از پنل «عکس‌های چندبرشی» چیزی
 * آپلود کرده باشد همان (URL واقعی از Storage)، وگرنه فایل استاتیک پیش‌فرض
 * همان بخش در public/images — دقیقاً همان اصل no-fabrication که در بقیهٔ
 * فاز ۵.۱۳/۵.۱۴ رعایت شده: نبودِ داده باعث نمایش خالی/شکسته نمی‌شود.
 */
export function useResponsiveImageSet(sectionKey: string): Record<ResponsiveImageBreakpoint, string> {
  const section = getResponsiveImageSection(sectionKey)
  const [overrides, setOverrides] = useState<Partial<Record<ResponsiveImageBreakpoint, string>>>({})

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("responsive_site_images")
        .select("breakpoint, image_url")
        .eq("section_key", sectionKey)

      if (!active || error || !data) return
      const map: Partial<Record<ResponsiveImageBreakpoint, string>> = {}
      for (const row of data) {
        map[row.breakpoint as ResponsiveImageBreakpoint] = row.image_url
      }
      setOverrides(map)
    }

    load()
    return () => {
      active = false
    }
  }, [sectionKey])

  const result = {} as Record<ResponsiveImageBreakpoint, string>
  for (const bp of RESPONSIVE_IMAGE_BREAKPOINTS) {
    result[bp] = overrides[bp] ?? section?.defaultSrc[bp] ?? ""
  }
  return result
}
