"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { dictionary, localizeNumber, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingRows,
  Modal,
  ScrollFade,
  dangerBtnClass,
  iconBtnClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  isForeignKeyViolation,
  isUniqueViolation,
} from "./admin-ui"

type CityRow = { id: string; name_en: string; name_fa: string; is_active: boolean }

type RouteRow = {
  id: string
  origin_city_id: string
  destination_city_id: string
  distance_km: number | null
  typical_duration_minutes: number
  is_active: boolean
  origin: CityRow | null
  destination: CityRow | null
}

type FormState = {
  originId: string
  destinationId: string
  distanceKm: string
  durationMinutes: string
  isActive: boolean
}

const EMPTY_FORM: FormState = { originId: "", destinationId: "", distanceKm: "", durationMinutes: "", isActive: true }

function cityName(city: CityRow | null, lang: Lang): string {
  if (!city) return "—"
  return lang === "fa" ? city.name_fa : city.name_en
}

export function RouteManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const supabase = createClient()

  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deletingRoute, setDeletingRoute] = useState<RouteRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    const [citiesRes, routesRes] = await Promise.all([
      supabase.from("cities").select("id, name_en, name_fa, is_active").order("display_order", { ascending: true }),
      supabase
        .from("routes")
        .select(
          `id, origin_city_id, destination_city_id, distance_km, typical_duration_minutes, is_active,
           origin:cities!routes_origin_city_id_fkey(id, name_en, name_fa, is_active),
           destination:cities!routes_destination_city_id_fkey(id, name_en, name_fa, is_active)`,
        )
        .order("created_at", { ascending: false }),
    ])

    if (citiesRes.error || routesRes.error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    setCities((citiesRes.data ?? []) as CityRow[])
    setRoutes(
      (routesRes.data ?? []).map((r: any) => ({
        ...r,
        origin: Array.isArray(r.origin) ? r.origin[0] : r.origin,
        destination: Array.isArray(r.destination) ? r.destination[0] : r.destination,
      })),
    )
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

  function openEdit(route: RouteRow) {
    setModalMode("edit")
    setEditingId(route.id)
    setForm({
      originId: route.origin_city_id,
      destinationId: route.destination_city_id,
      distanceKm: route.distance_km !== null ? String(route.distance_km) : "",
      durationMinutes: String(route.typical_duration_minutes),
      isActive: route.is_active,
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
    if (!form.originId || !form.destinationId) {
      setFormError(t.admin.routes.origin + " / " + t.admin.routes.destination)
      return
    }
    if (form.originId === form.destinationId) {
      setFormError(t.admin.routes.sameCityError)
      return
    }
    const durationMinutes = Number(form.durationMinutes)
    if (!durationMinutes || durationMinutes <= 0) {
      setFormError(t.admin.routes.durationMinutes)
      return
    }
    const distanceKm = form.distanceKm.trim() === "" ? null : Number(form.distanceKm)

    setSaving(true)
    setFormError(null)

    const payload = {
      origin_city_id: form.originId,
      destination_city_id: form.destinationId,
      distance_km: distanceKm,
      typical_duration_minutes: durationMinutes,
      is_active: form.isActive,
    }

    const { error } = modalMode === "edit" && editingId
      ? await supabase.from("routes").update(payload).eq("id", editingId)
      : await supabase.from("routes").insert(payload)

    setSaving(false)

    if (error) {
      setFormError(isUniqueViolation(error) ? t.admin.routes.duplicateError : t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingId(null)
    await load()
  }

  async function handleDelete() {
    if (!deletingRoute) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from("routes").delete().eq("id", deletingRoute.id)
    setDeleting(false)

    if (error) {
      setDeleteError(isForeignKeyViolation(error) ? t.admin.routes.deleteInUseError : t.admin.manage.genericError)
      return
    }

    setDeletingRoute(null)
    await load()
  }

  const destinationOptions = cities.filter((c) => c.id !== form.originId)
  const originOptions = cities.filter((c) => c.id !== form.destinationId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.admin.routes.title}</h2>
          <p className="text-xs text-muted-foreground">{t.admin.routes.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtnClass}>
          <Plus className="size-4" />
          {t.admin.routes.addRoute}
        </button>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingRows />
          ) : routes.length === 0 ? (
            <EmptyState message={t.admin.routes.empty} />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.routes.from}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.routes.to}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.routes.duration}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.routes.distanceKm}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                    {t.admin.manage.active}
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                      {cityName(r.origin, lang)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                      {cityName(r.destination, lang)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                      {localizeNumber(r.typical_duration_minutes, lang)} {lang === "fa" ? "دقیقه" : "min"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                      {r.distance_km !== null ? `${localizeNumber(r.distance_km, lang)} ${lang === "fa" ? "کم" : "km"}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={iconBtnClass} onClick={() => openEdit(r)} aria-label={t.admin.manage.edit}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={iconBtnClass}
                          onClick={() => {
                            setDeletingRoute(r)
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
        <Modal title={modalMode === "edit" ? t.admin.routes.editRoute : t.admin.routes.addRoute} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{t.admin.routes.origin}</label>
              <select
                className={inputClass}
                value={form.originId}
                onChange={(e) => setForm((f) => ({ ...f, originId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  {t.hero.originPlaceholder}
                </option>
                {originOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cityName(c, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.admin.routes.destination}</label>
              <select
                className={inputClass}
                value={form.destinationId}
                onChange={(e) => setForm((f) => ({ ...f, destinationId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  {t.hero.destinationPlaceholder}
                </option>
                {destinationOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cityName(c, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t.admin.routes.durationMinutes}</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.admin.routes.distanceKm} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className={inputClass}
                  value={form.distanceKm}
                  onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              {t.admin.routes.isActive}
            </label>

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

      {deletingRoute && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={t.admin.routes.deleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={deleting}
          errorMessage={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRoute(null)}
        />
      )}
    </div>
  )
}
