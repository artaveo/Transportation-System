"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { dictionary, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingRows,
  Modal,
  iconBtnClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  isUniqueViolation,
} from "./admin-ui"

type DriverStatus = "active" | "inactive"

type DriverRow = {
  id: string
  full_name: string
  phone: string
  license_number: string | null
  status: DriverStatus
}

type FormState = {
  fullName: string
  phone: string
  licenseNumber: string
  status: DriverStatus
}

const EMPTY_FORM: FormState = { fullName: "", phone: "", licenseNumber: "", status: "active" }

export function DriverManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deletingDriver, setDeletingDriver] = useState<DriverRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from("drivers")
      .select("id, full_name, phone, license_number, status")
      .order("created_at", { ascending: false })

    if (error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }
    setDrivers((data ?? []) as DriverRow[])
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

  function openEdit(driver: DriverRow) {
    setModalMode("edit")
    setEditingId(driver.id)
    setForm({
      fullName: driver.full_name,
      phone: driver.phone,
      licenseNumber: driver.license_number ?? "",
      status: driver.status,
    })
    setFormError(null)
  }

  function closeModal() {
    if (saving) return
    setModalMode(null)
    setEditingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullName = form.fullName.trim()
    const phone = form.phone.trim()
    if (!fullName) {
      setFormError(t.admin.drivers.fullName)
      return
    }
    if (!phone) {
      setFormError(t.admin.drivers.phone)
      return
    }

    setSaving(true)
    setFormError(null)

    const payload = {
      full_name: fullName,
      phone,
      license_number: form.licenseNumber.trim() || null,
      status: form.status,
    }

    const { error } = modalMode === "edit" && editingId
      ? await supabase.from("drivers").update(payload).eq("id", editingId)
      : await supabase.from("drivers").insert(payload)

    setSaving(false)

    if (error) {
      setFormError(isUniqueViolation(error) ? t.admin.drivers.duplicatePhoneError : t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingId(null)
    await load()
  }

  async function handleDelete() {
    if (!deletingDriver) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from("drivers").delete().eq("id", deletingDriver.id)
    setDeleting(false)

    if (error) {
      setDeleteError(t.admin.manage.genericError)
      return
    }
    setDeletingDriver(null)
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.admin.drivers.title}</h2>
          <p className="text-xs text-muted-foreground">{t.admin.drivers.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtnClass}>
          <Plus className="size-4" />
          {t.admin.drivers.addDriver}
        </button>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingRows />
          ) : drivers.length === 0 ? (
            <EmptyState message={t.admin.drivers.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.drivers.fullName}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.drivers.phone}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.drivers.licenseNumber}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.drivers.status}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{d.full_name}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                      {d.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                      {d.license_number ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === "active" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.admin.driverStatus[d.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={iconBtnClass} onClick={() => openEdit(d)} aria-label={t.admin.manage.edit}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={iconBtnClass}
                          onClick={() => {
                            setDeletingDriver(d)
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
      </div>

      {modalMode && (
        <Modal title={modalMode === "edit" ? t.admin.drivers.editDriver : t.admin.drivers.addDriver} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{t.admin.drivers.fullName}</label>
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t.admin.drivers.phone}</label>
                <input
                  dir="ltr"
                  type="tel"
                  className={inputClass}
                  placeholder="07xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.admin.drivers.licenseNumber} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  dir="ltr"
                  className={inputClass}
                  value={form.licenseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t.admin.drivers.status}</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DriverStatus }))}
              >
                <option value="active">{t.admin.driverStatus.active}</option>
                <option value="inactive">{t.admin.driverStatus.inactive}</option>
              </select>
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

      {deletingDriver && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={t.admin.drivers.deleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={deleting}
          errorMessage={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeletingDriver(null)}
        />
      )}
    </div>
  )
}
