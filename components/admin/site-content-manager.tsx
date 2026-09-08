"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { dictionary, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingRows,
  Modal,
  ScrollFade,
  iconBtnClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./admin-ui"

/**
 * فاز ۵.۱۳ — Public CMS Lite.
 *
 * زمینه: طبق ROAD-MAP بخش ۷، پیش از کد با Zakir تأیید شد که چه چیزی
 * قابل‌ویرایش شود: تماس شرکت (فوتر)، آمار «درباره ما»، عکس واقعی ناوگان،
 * و آدرس/تلفن/ساعت کاری هر دفتر — هرکدام مستقل، نه یک بلاک تماس واحد.
 * پس‌زمینهٔ چندبرش‌ی هیرو/ناوگان/درباره‌ما (ResponsivePhoto فاز ۴.۶) عمداً
 * از این فاز خارج ماند چون از قبل عکس واقعی دارد و آپلودش نیاز به یک
 * pipeline تولید ۴ برش (نه یک فایل ساده) دارد — طبق اصل ROAD-MAP «نه کل
 * ساختار صفحه»، این بدهی جداگانه‌ای می‌ماند نه چیزی که اینجا حل شود.
 *
 * دو بخش مستقل: (۱) site_settings — جدول singleton مثل loyalty_settings
 * فاز ۵.۴ (دقیقاً یک ردیف id=true)، (۲) offices — CRUD کامل مثل RouteManager
 * فاز ۵.۱. هر دو پشت RLS با has_admin_section('content') قفل‌اند (migration
 * فاز ۵.۱۳ بخش 'content' را به admins_allowed_sections_valid هم اضافه کرد).
 *
 * مقدار NULL در site_settings/offices یعنی «هنوز از شرکت تأیید نشده» —
 * طبق اصل no-fabrication پروژه (نگاه کنید به trust-stats.tsx)، فرم اینجا
 * هیچ‌وقت یک مقدار پیش‌فرض ساختگی جای NULL نمی‌گذارد؛ فیلد خالی می‌ماند و
 * صفحات پابلیک هم در این حالت placeholder موجودشان را حفظ می‌کنند.
 *
 * عکس ناوگان در bucket استوریج `site-content` (پابلیک، محدود به فاز ۵.۱۳)
 * با نام نسخه‌بندی‌شده (`fleet/fleet-{timestamp}.ext`) ذخیره می‌شود — طبق
 * تجربهٔ کش تصویر تلگرام/واتساپ (memory)، آپلود دوباره با همان نام هیچ‌وقت
 * در پیش‌نمایش‌های کش‌شده رفرش نمی‌شود.
 */

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"]

type SettingsRow = {
  company_phone: string | null
  company_email: string | null
  about_years_active: number | null
  about_cities_covered: number | null
  about_buses_in_fleet: number | null
  about_daily_trips: number | null
  fleet_photo_url: string | null
}

type SettingsForm = {
  companyPhone: string
  companyEmail: string
  yearsActive: string
  citiesCovered: string
  busesInFleet: string
  dailyTrips: string
}

function rowToForm(row: SettingsRow): SettingsForm {
  return {
    companyPhone: row.company_phone ?? "",
    companyEmail: row.company_email ?? "",
    yearsActive: row.about_years_active !== null ? String(row.about_years_active) : "",
    citiesCovered: row.about_cities_covered !== null ? String(row.about_cities_covered) : "",
    busesInFleet: row.about_buses_in_fleet !== null ? String(row.about_buses_in_fleet) : "",
    dailyTrips: row.about_daily_trips !== null ? String(row.about_daily_trips) : "",
  }
}

function numOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

type CityRow = { id: string; name_en: string; name_fa: string; is_active: boolean }

type OfficeRow = {
  id: string
  city_id: string
  name_fa: string
  name_en: string
  address_fa: string | null
  address_en: string | null
  phone: string | null
  hours_fa: string | null
  hours_en: string | null
  is_active: boolean
  city: CityRow | null
}

type OfficeForm = {
  cityId: string
  nameFa: string
  nameEn: string
  addressFa: string
  addressEn: string
  phone: string
  hoursFa: string
  hoursEn: string
  isActive: boolean
}

const EMPTY_OFFICE_FORM: OfficeForm = {
  cityId: "",
  nameFa: "",
  nameEn: "",
  addressFa: "",
  addressEn: "",
  phone: "",
  hoursFa: "",
  hoursEn: "",
  isActive: true,
}

function cityOptionLabel(city: CityRow, lang: Lang, inactiveLabel: string): string {
  const name = lang === "fa" ? city.name_fa : city.name_en
  return city.is_active ? name : `${name} (${inactiveLabel})`
}

export function SiteContentManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const ts = t.admin.siteContent
  const supabase = createClient()

  // --- تنظیمات سراسری (site_settings) ---
  const [settingsRow, setSettingsRow] = useState<SettingsRow | null>(null)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // --- دفاتر (offices) ---
  const [offices, setOffices] = useState<OfficeRow[]>([])
  const [cities, setCities] = useState<CityRow[]>([])
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [officeForm, setOfficeForm] = useState<OfficeForm>(EMPTY_OFFICE_FORM)
  const [officeFormError, setOfficeFormError] = useState<string | null>(null)
  const [savingOffice, setSavingOffice] = useState(false)
  const [deletingOffice, setDeletingOffice] = useState<OfficeRow | null>(null)
  const [deletingOfficeBusy, setDeletingOfficeBusy] = useState(false)
  const [deleteOfficeError, setDeleteOfficeError] = useState<string | null>(null)

  async function load() {
    setLoadingSettings(true)
    setLoadError(null)

    const [settingsRes, citiesRes, officesRes] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", true).single(),
      supabase.from("cities").select("id, name_en, name_fa, is_active").order("display_order", { ascending: true }),
      supabase
        .from("offices")
        .select(
          `id, city_id, name_fa, name_en, address_fa, address_en, phone, hours_fa, hours_en, is_active,
           city:cities(id, name_en, name_fa, is_active)`,
        )
        .order("display_order", { ascending: true }),
    ])

    if (settingsRes.error || citiesRes.error || officesRes.error) {
      setLoadError(t.admin.manage.genericError)
      setLoadingSettings(false)
      return
    }

    const settings = settingsRes.data as SettingsRow
    setSettingsRow(settings)
    setForm(rowToForm(settings))
    setCities((citiesRes.data ?? []) as CityRow[])
    setOffices(
      (officesRes.data ?? []).map((o: any) => ({
        ...o,
        city: Array.isArray(o.city) ? o.city[0] ?? null : o.city,
      })),
    )
    setLoadingSettings(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSavingSettings(true)
    setSettingsError(null)
    setSettingsSaved(false)

    const payload = {
      company_phone: form.companyPhone.trim() === "" ? null : form.companyPhone.trim(),
      company_email: form.companyEmail.trim() === "" ? null : form.companyEmail.trim(),
      about_years_active: numOrNull(form.yearsActive),
      about_cities_covered: numOrNull(form.citiesCovered),
      about_buses_in_fleet: numOrNull(form.busesInFleet),
      about_daily_trips: numOrNull(form.dailyTrips),
    }

    const { data, error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", true)
      .select("*")
      .single()

    setSavingSettings(false)

    if (error || !data) {
      setSettingsError(t.admin.manage.genericError)
      return
    }

    setSettingsRow(data as SettingsRow)
    setForm(rowToForm(data as SettingsRow))
    setSettingsSaved(true)
  }

  async function handleUploadPhoto(file: File) {
    setPhotoError(null)

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError(ts.fleetPhotoInvalidType)
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(ts.fleetPhotoTooLarge)
      return
    }

    setUploadingPhoto(true)
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    // نام نسخه‌بندی‌شده — هر آپلود جدید یک فایل تازه است تا کش CDN/کلاینت
    // قدیمی هیچ‌وقت با فایل جدید اشتباه گرفته نشود.
    const path = `fleet/fleet-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from("site-content").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    })

    if (uploadError) {
      setUploadingPhoto(false)
      setPhotoError(t.admin.manage.genericError)
      return
    }

    const { data: publicUrlData } = supabase.storage.from("site-content").getPublicUrl(path)

    const { data, error } = await supabase
      .from("site_settings")
      .update({ fleet_photo_url: publicUrlData.publicUrl })
      .eq("id", true)
      .select("*")
      .single()

    setUploadingPhoto(false)

    if (error || !data) {
      setPhotoError(t.admin.manage.genericError)
      return
    }

    setSettingsRow(data as SettingsRow)
  }

  async function handleRemovePhoto() {
    setPhotoError(null)
    setUploadingPhoto(true)

    const { data, error } = await supabase
      .from("site_settings")
      .update({ fleet_photo_url: null })
      .eq("id", true)
      .select("*")
      .single()

    setUploadingPhoto(false)

    if (error || !data) {
      setPhotoError(t.admin.manage.genericError)
      return
    }

    setSettingsRow(data as SettingsRow)
  }

  // --- دفاتر ---
  function openCreateOffice() {
    setModalMode("create")
    setEditingId(null)
    setOfficeForm({ ...EMPTY_OFFICE_FORM, cityId: cities.find((c) => c.is_active)?.id ?? "" })
    setOfficeFormError(null)
  }

  function openEditOffice(office: OfficeRow) {
    setModalMode("edit")
    setEditingId(office.id)
    setOfficeForm({
      cityId: office.city_id,
      nameFa: office.name_fa,
      nameEn: office.name_en,
      addressFa: office.address_fa ?? "",
      addressEn: office.address_en ?? "",
      phone: office.phone ?? "",
      hoursFa: office.hours_fa ?? "",
      hoursEn: office.hours_en ?? "",
      isActive: office.is_active,
    })
    setOfficeFormError(null)
  }

  function closeOfficeModal() {
    if (savingOffice) return
    setModalMode(null)
    setEditingId(null)
  }

  async function handleSubmitOffice(e: React.FormEvent) {
    e.preventDefault()
    if (!officeForm.cityId || !officeForm.nameFa.trim() || !officeForm.nameEn.trim()) {
      setOfficeFormError(`${ts.officeCity} / ${ts.officeNameFa} / ${ts.officeNameEn}`)
      return
    }

    setSavingOffice(true)
    setOfficeFormError(null)

    const payload = {
      city_id: officeForm.cityId,
      name_fa: officeForm.nameFa.trim(),
      name_en: officeForm.nameEn.trim(),
      address_fa: officeForm.addressFa.trim() === "" ? null : officeForm.addressFa.trim(),
      address_en: officeForm.addressEn.trim() === "" ? null : officeForm.addressEn.trim(),
      phone: officeForm.phone.trim() === "" ? null : officeForm.phone.trim(),
      hours_fa: officeForm.hoursFa.trim() === "" ? null : officeForm.hoursFa.trim(),
      hours_en: officeForm.hoursEn.trim() === "" ? null : officeForm.hoursEn.trim(),
      is_active: officeForm.isActive,
    }

    const { error } =
      modalMode === "edit" && editingId
        ? await supabase.from("offices").update(payload).eq("id", editingId)
        : await supabase.from("offices").insert({ ...payload, display_order: offices.length + 1 })

    setSavingOffice(false)

    if (error) {
      setOfficeFormError(t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingId(null)
    await load()
  }

  async function handleDeleteOffice() {
    if (!deletingOffice) return
    setDeletingOfficeBusy(true)
    setDeleteOfficeError(null)

    const { error } = await supabase.from("offices").delete().eq("id", deletingOffice.id)

    setDeletingOfficeBusy(false)

    if (error) {
      setDeleteOfficeError(t.admin.manage.genericError)
      return
    }

    setDeletingOffice(null)
    await load()
  }

  const inactiveLabel = t.admin.manage.inactive

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold text-foreground">{ts.title}</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{ts.subtitle}</p>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      {/* بخش ۱: تنظیمات سراسری */}
      {loadingSettings || !form ? (
        <div className="rounded-xl border border-border bg-card">
          <LoadingRows />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">{ts.settingsSectionTitle}</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{ts.companyPhone}</label>
              <input
                type="text"
                dir="ltr"
                className={`${inputClass} text-start`}
                placeholder={ts.companyPhonePlaceholder}
                value={form.companyPhone}
                onChange={(e) => setForm((f) => (f ? { ...f, companyPhone: e.target.value } : f))}
              />
            </div>
            <div>
              <label className={labelClass}>{ts.companyEmail}</label>
              <input
                type="email"
                dir="ltr"
                className={`${inputClass} text-start`}
                placeholder={ts.companyEmailPlaceholder}
                value={form.companyEmail}
                onChange={(e) => setForm((f) => (f ? { ...f, companyEmail: e.target.value } : f))}
              />
            </div>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-foreground">{ts.statsSectionTitle}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{ts.statsSectionSubtitle}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>{ts.yearsActive}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.yearsActive}
                onChange={(e) => setForm((f) => (f ? { ...f, yearsActive: e.target.value } : f))}
              />
            </div>
            <div>
              <label className={labelClass}>{ts.citiesCovered}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.citiesCovered}
                onChange={(e) => setForm((f) => (f ? { ...f, citiesCovered: e.target.value } : f))}
              />
            </div>
            <div>
              <label className={labelClass}>{ts.busesInFleet}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.busesInFleet}
                onChange={(e) => setForm((f) => (f ? { ...f, busesInFleet: e.target.value } : f))}
              />
            </div>
            <div>
              <label className={labelClass}>{ts.dailyTrips}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.dailyTrips}
                onChange={(e) => setForm((f) => (f ? { ...f, dailyTrips: e.target.value } : f))}
              />
            </div>
          </div>

          {settingsError && <ErrorBanner message={settingsError} className="mt-4" />}
          {settingsSaved && !settingsError && (
            <p className="mt-4 text-xs font-medium text-accent">{ts.settingsSaved}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="submit" className={primaryBtnClass} disabled={savingSettings}>
              {savingSettings && <Loader2 className="size-3.5 animate-spin" />}
              {ts.saveSettings}
            </button>
          </div>
        </form>
      )}

      {/* بخش ۲: عکس واقعی ناوگان */}
      {settingsRow && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">{ts.fleetPhotoSectionTitle}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{ts.fleetPhotoSectionSubtitle}</p>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {settingsRow.fleet_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settingsRow.fleet_photo_url}
                alt=""
                className="h-28 w-44 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                {ts.fleetPhotoNone}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <label className={`${secondaryBtnClass} cursor-pointer`}>
                {uploadingPhoto ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {settingsRow.fleet_photo_url ? ts.fleetPhotoReplace : ts.fleetPhotoUpload}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadPhoto(file)
                    e.target.value = ""
                  }}
                />
              </label>
              {settingsRow.fleet_photo_url && (
                <button
                  type="button"
                  className={secondaryBtnClass}
                  disabled={uploadingPhoto}
                  onClick={handleRemovePhoto}
                >
                  <X className="size-3.5" />
                  {ts.fleetPhotoRemove}
                </button>
              )}
            </div>
          </div>

          {photoError && <ErrorBanner message={photoError} className="mt-3 w-fit" />}
        </div>
      )}

      {/* بخش ۳: دفاتر */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{ts.officesSectionTitle}</h3>
            <p className="text-xs text-muted-foreground">{ts.officesSectionSubtitle}</p>
          </div>
          <button type="button" onClick={openCreateOffice} className={primaryBtnClass}>
            <Plus className="size-4" />
            {ts.addOffice}
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-card">
          <ScrollFade>
            <div className="overflow-x-auto">
              {loadingSettings ? (
                <LoadingRows />
              ) : offices.length === 0 ? (
                <EmptyState message={ts.officeEmpty} />
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                        {ts.colOffice}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                        {ts.colCity}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                        {ts.colPhone}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                        {t.admin.manage.active}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {offices.map((o) => (
                      <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                          {lang === "fa" ? o.name_fa : o.name_en}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                          {o.city ? (lang === "fa" ? o.city.name_fa : o.city.name_en) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                          {o.phone ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              o.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {o.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-end">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className={iconBtnClass}
                              onClick={() => openEditOffice(o)}
                              aria-label={t.admin.manage.edit}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              className={iconBtnClass}
                              onClick={() => {
                                setDeletingOffice(o)
                                setDeleteOfficeError(null)
                              }}
                              aria-label={t.admin.manage.delete}
                            >
                              <Trash2 className="size-4" />
                            </button>
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

      {modalMode && (
        <Modal title={modalMode === "edit" ? ts.editOffice : ts.addOffice} onClose={closeOfficeModal} wide>
          <form onSubmit={handleSubmitOffice} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{ts.officeCity}</label>
              <select
                className={inputClass}
                value={officeForm.cityId}
                onChange={(e) => setOfficeForm((f) => ({ ...f, cityId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  {ts.officeCity}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cityOptionLabel(c, lang, inactiveLabel)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{ts.officeNameFa}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={officeForm.nameFa}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, nameFa: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{ts.officeNameEn}</label>
                <input
                  type="text"
                  dir="ltr"
                  className={`${inputClass} text-start`}
                  value={officeForm.nameEn}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, nameEn: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {ts.officeAddressFa} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={officeForm.addressFa}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, addressFa: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {ts.officeAddressEn} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className={`${inputClass} text-start`}
                  value={officeForm.addressEn}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, addressEn: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {ts.officePhone} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
              </label>
              <input
                type="text"
                dir="ltr"
                className={`${inputClass} text-start`}
                value={officeForm.phone}
                onChange={(e) => setOfficeForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {ts.officeHoursFa} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={officeForm.hoursFa}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, hoursFa: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {ts.officeHoursEn} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className={`${inputClass} text-start`}
                  value={officeForm.hoursEn}
                  onChange={(e) => setOfficeForm((f) => ({ ...f, hoursEn: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={officeForm.isActive}
                onChange={(e) => setOfficeForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              {ts.officeIsActive}
            </label>

            {officeFormError && <ErrorBanner message={officeFormError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeOfficeModal} disabled={savingOffice}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={savingOffice}>
                {savingOffice && <Loader2 className="size-3.5 animate-spin" />}
                {t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingOffice && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={ts.officeDeleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={deletingOfficeBusy}
          errorMessage={deleteOfficeError}
          onConfirm={handleDeleteOffice}
          onCancel={() => setDeletingOffice(null)}
        />
      )}
    </div>
  )
}
