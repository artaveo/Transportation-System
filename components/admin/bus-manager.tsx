"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { dictionary, localizeNumber, type Lang } from "@/lib/i18n"
import { DEFAULT_BUS_CAPACITY, type AmenityKey, type BusType } from "@/lib/booking-data"
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
  isUniqueViolation,
} from "./admin-ui"

type BusStatus = "active" | "maintenance" | "retired"

type BusRow = {
  id: string
  code: string
  plate_number: string | null
  bus_type: BusType
  total_seats: number
  status: BusStatus
  amenities: string[]
}

type FormState = {
  code: string
  plateNumber: string
  busType: BusType
  totalSeats: string
  status: BusStatus
  amenities: AmenityKey[]
}

const ALL_AMENITIES: AmenityKey[] = ["ac", "wifi", "charging", "refreshment", "reclining"]
const ALL_STATUSES: BusStatus[] = ["active", "maintenance", "retired"]

const EMPTY_FORM: FormState = {
  code: "",
  plateNumber: "",
  busType: "standard",
  totalSeats: String(DEFAULT_BUS_CAPACITY.standard),
  status: "active",
  amenities: [],
}

export function BusManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [buses, setBuses] = useState<BusRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deletingBus, setDeletingBus] = useState<BusRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from("buses")
      .select("id, code, plate_number, bus_type, total_seats, status, amenities")
      .order("created_at", { ascending: false })

    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }
    setBuses((data ?? []) as BusRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setModalMode("create")
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openEdit(bus: BusRow) {
    setModalMode("edit")
    setEditingId(bus.id)
    setForm({
      code: bus.code,
      plateNumber: bus.plate_number ?? "",
      busType: bus.bus_type,
      totalSeats: String(bus.total_seats),
      status: bus.status,
      amenities: (bus.amenities ?? []).filter((a): a is AmenityKey => (ALL_AMENITIES as string[]).includes(a)),
    })
    setFormError(null)
  }

  function closeModal() {
    if (saving) return
    setModalMode(null)
    setEditingId(null)
  }

  function onBusTypeChange(busType: BusType) {
    setForm((f) => {
      // فقط هنگام ساخت بس جدید، ظرفیت پیش‌فرض نوع را پیشنهاد بده؛ در ویرایش،
      // ظرفیت واقعی ثبت‌شدهٔ همین بس دست‌نخورده می‌ماند (طبق کامنت جدول buses).
      const shouldSuggestDefault = modalMode === "create"
      return { ...f, busType, totalSeats: shouldSuggestDefault ? String(DEFAULT_BUS_CAPACITY[busType]) : f.totalSeats }
    })
  }

  function toggleAmenity(key: AmenityKey) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = form.code.trim()
    const totalSeats = Number(form.totalSeats)
    if (!code) {
      setFormError(t.admin.buses.code)
      return
    }
    if (!totalSeats || totalSeats <= 0) {
      setFormError(t.admin.buses.totalSeats)
      return
    }

    setSaving(true)
    setFormError(null)

    const payload = {
      code,
      plate_number: form.plateNumber.trim() || null,
      bus_type: form.busType,
      total_seats: totalSeats,
      status: form.status,
      amenities: form.amenities,
    }

    const { error } = modalMode === "edit" && editingId
      ? await supabase.from("buses").update(payload).eq("id", editingId)
      : await supabase.from("buses").insert(payload)

    setSaving(false)

    if (error) {
      setFormError(isUniqueViolation(error) ? t.admin.buses.duplicateCodeError : t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingId(null)
    await load()
  }

  async function handleDelete() {
    if (!deletingBus) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from("buses").delete().eq("id", deletingBus.id)
    setDeleting(false)

    if (error) {
      setDeleteError(t.admin.manage.genericError)
      return
    }
    setDeletingBus(null)
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.admin.buses.title}</h2>
          <p className="text-xs text-muted-foreground">{t.admin.buses.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtnClass}>
          <Plus className="size-4" />
          {t.admin.buses.addBus}
        </button>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingRows />
          ) : buses.length === 0 ? (
            <EmptyState message={t.admin.buses.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.cols.bus}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.buses.plateNumber}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.search.busType}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.buses.totalSeats}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.buses.status}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground" dir="ltr">
                      {bus.code}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                      {bus.plate_number ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{t.busTypes[bus.bus_type]}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                      {localizeNumber(bus.total_seats, lang)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          bus.status === "active"
                            ? "bg-accent/15 text-accent"
                            : bus.status === "maintenance"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.admin.busStatus[bus.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={iconBtnClass} onClick={() => openEdit(bus)} aria-label={t.admin.manage.edit}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={iconBtnClass}
                          onClick={() => {
                            setDeletingBus(bus)
                            setDeleteError(null)
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

      {modalMode && (
        <Modal title={modalMode === "edit" ? t.admin.buses.editBus : t.admin.buses.addBus} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t.admin.buses.code}</label>
                <input
                  dir="ltr"
                  className={inputClass}
                  placeholder="VIP-101"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.admin.buses.plateNumber} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  dir="ltr"
                  className={inputClass}
                  value={form.plateNumber}
                  onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t.search.busType}</label>
                <select
                  className={inputClass}
                  value={form.busType}
                  onChange={(e) => onBusTypeChange(e.target.value as BusType)}
                >
                  <option value="standard">{t.busTypes.standard}</option>
                  <option value="vip">{t.busTypes.vip}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.admin.buses.totalSeats}</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.totalSeats}
                  onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t.admin.buses.status}</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BusStatus }))}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t.admin.busStatus[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.search.amenities}</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ALL_AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-1.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={form.amenities.includes(a)}
                      onChange={() => toggleAmenity(a)}
                    />
                    {t.amenities[a]}
                  </label>
                ))}
              </div>
            </div>

            {formError && <ErrorBanner message={formError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeModal} disabled={saving}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingBus && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={t.admin.buses.deleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={deleting}
          errorMessage={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBus(null)}
        />
      )}
    </div>
  )
}
