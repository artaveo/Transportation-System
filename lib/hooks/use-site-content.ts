"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * فاز ۵.۱۳ — Public CMS Lite.
 *
 * دو هوک مشترک برای ۴ کامپوننت پابلیکی که به همین دو منبع نیاز دارند
 * (site-footer، contact-page، about-page، trust-stats) — تا منطق fetch/
 * fallback یک‌بار نوشته شود، نه چهار بار. هر دو هوک روی خطا/عدم‌بارگذاری
 * مقدار null برمی‌گردانند تا کامپوننت فراخوان همان placeholder فعلی
 * lib/i18n.ts را نگه دارد (طبق اصل no-fabrication پروژه) — هیچ‌کدام هیچ‌وقت
 * مقدار پیش‌فرض ساختگی جای داده‌ی گم‌شده نمی‌گذارند.
 */

export type SiteSettings = {
  company_phone: string | null
  company_email: string | null
  about_years_active: number | null
  about_cities_covered: number | null
  about_buses_in_fleet: number | null
  about_daily_trips: number | null
  fleet_photo_url: string | null
}

export function useSiteSettings(): { settings: SiteSettings | null; loading: boolean } {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "company_phone, company_email, about_years_active, about_cities_covered, about_buses_in_fleet, about_daily_trips, fleet_photo_url",
        )
        .eq("id", true)
        .single()

      if (!active) return
      setSettings(error ? null : (data as SiteSettings))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}

export type OfficeContent = {
  id: string
  city_id: string
  name_fa: string
  name_en: string
  address_fa: string | null
  address_en: string | null
  phone: string | null
  hours_fa: string | null
  hours_en: string | null
  city: { name_fa: string; name_en: string } | null
}

export function useActiveOffices(): { offices: OfficeContent[] | null; loading: boolean } {
  const [offices, setOffices] = useState<OfficeContent[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("offices")
        .select(
          "id, city_id, name_fa, name_en, address_fa, address_en, phone, hours_fa, hours_en, city:cities(name_fa, name_en)",
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!active) return
      setOffices(
        error
          ? null
          : ((data ?? []).map((o: any) => ({
              ...o,
              city: Array.isArray(o.city) ? (o.city[0] ?? null) : o.city,
            })) as OfficeContent[]),
      )
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { offices, loading }
}
