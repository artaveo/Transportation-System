"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { dictionary, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { EmptyState, ErrorBanner, LoadingRows, ScrollFade, ToggleSwitch, inputClass } from "./admin-ui"

/**
 * فاز ۵.۹ — مدیریت شهرها/ولایت‌ها.
 *
 * زمینه: جدول `cities` از فاز ۳.۱ ستون `is_active` داشت اما تا این فاز
 * فقط از طریق SQL دستی قابل تغییر بود؛ فقط ۸ شهر کریدور فعلی seed شده
 * بودند. این فاز ۲۶ ولایت باقی‌ماندهٔ افغانستان را (با `is_active=false`)
 * اضافه کرد (migration `phase_5_9_add_remaining_provinces`، نام‌های
 * دری/انگلیسی رسمی هرکدام قبل از insert با Zakir تأیید شد).
 *
 * این تب فقط یک سوییچ فعال/غیرفعال روی هر شهر است — نه CRUD کامل (افزودن/
 * حذف شهر خارج از scope این فاز است، چون فهرست ۳۴ ولایت رسمی و ثابت
 * است). toggle بلافاصله در دیتابیس ذخیره می‌شود و همان لحظه هم روی
 * دراپ‌داون مسیر ادمین (RouteManager) هم روی سرچ صفحهٔ اصلی مشتری
 * (getActiveCities) اثر می‌گذارد، چون هر دو مستقیماً از همین ستون
 * `cities.is_active` می‌خوانند.
 */

type CityRow = {
  id: string
  name_en: string
  name_fa: string
  is_active: boolean
  display_order: number
}

export function CityManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const [query, setQuery] = useState("")

  async function load() {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from("cities")
      .select("id, name_en, name_fa, is_active, display_order")
      .order("display_order", { ascending: true })

    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    setCities((data ?? []) as CityRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleActive(city: CityRow) {
    setSavingId(city.id)
    setRowError(null)
    const nextValue = !city.is_active

    const { error } = await supabase.from("cities").update({ is_active: nextValue }).eq("id", city.id)

    if (error) {
      setRowError({ id: city.id, message: t.admin.manage.genericError })
      setSavingId(null)
      return
    }

    setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_active: nextValue } : c)))
    setSavingId(null)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cities
    return cities.filter((c) => c.name_en.toLowerCase().includes(q) || c.name_fa.includes(query.trim()))
  }, [cities, query])

  const activeCount = cities.filter((c) => c.is_active).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.admin.cities.title}</h2>
          <p className="text-xs text-muted-foreground">
            {t.admin.cities.subtitleCount
              .replace("{active}", String(activeCount))
              .replace("{total}", String(cities.length))}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin.cities.searchPlaceholder}
            className={`${inputClass} ps-9`}
          />
        </div>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
          <div className="overflow-x-auto">
            {loading ? (
              <LoadingRows />
            ) : filtered.length === 0 ? (
              <EmptyState message={t.admin.cities.empty} />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.cities.nameFa}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.cities.nameEn}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {t.admin.manage.active}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{c.name_fa}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{c.name_en}</td>
                      <td className="px-1 py-1.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={c.is_active}
                              disabled={savingId === c.id}
                              onChange={() => toggleActive(c)}
                              label={`${c.name_fa} — ${t.admin.manage.active}`}
                            />
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                c.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {c.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                            </span>
                          </div>
                          {rowError?.id === c.id && <ErrorBanner message={rowError.message} className="w-fit" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ScrollFade>
      </div>
    </div>
  )
}
