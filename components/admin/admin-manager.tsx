"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus } from "lucide-react"
import { dictionary, type Lang } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import {
  EmptyState,
  ErrorBanner,
  LoadingRows,
  Modal,
  ScrollFade,
  ToggleSwitch,
  iconBtnClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./admin-ui"

/**
 * فاز ۵.۱۲ — Limited Admin و Permission Center.
 *
 * این تب فقط برای super_admin رندر می‌شود (فیلتر در admin-panel.tsx، بر
 * اساس role که app/admin/page.tsx سمت سرور خوانده — نگاه کنید به همان‌جا
 * برای چرایی). با این‌حال «دفاع در عمق» هم رعایت شده: خودِ توابع
 * list_admins_with_email/list_admin_audit_log هم is_super_admin() را
 * چک می‌کنند (صفر ردیف برمی‌گردانند، نه خطا)، و نوشتن مستقیم روی جدول
 * admins هم زیر RLS policy admins_super_write (فاز ۳.۲) است — یعنی حتی
 * اگر یک limited_admin با DevTools این کامپوننت را اجبار به رندر کند،
 * هیچ داده‌ای نمی‌بیند و هیچ نوشتنی موفق نمی‌شود.
 *
 * ۷ بخش (routes/fleet/trips/bookings/payments/loyalty/customers) دقیقاً
 * همان‌هایی‌اند که has_admin_section() در فاز ۳.۲ از قبل روی جدول‌های
 * واقعی چک می‌کند — نه یک لیست جدید. دو مورد از این ۷ (routes هم
 * cities را می‌پوشاند چون RLS همین‌طور نوشته شده؛ bookings هم عملاً
 * دیدن داشبورد/گزارش‌ها را ممکن می‌کند چون آن دو تب از جدول bookings
 * می‌خوانند) — این نگاشت در متن sectionsHelper/برچسب هر بخش (lib/i18n.ts)
 * توضیح داده شده تا برای Zakir موقع تنظیم دسترسی یک ادمین محدود گیج‌کننده نباشد.
 *
 * ساخت ادمین جدید یک درخواست به app/api/admin/admins/route.ts می‌زند
 * (تنها جایی که واقعاً به service_role نیاز است: دعوت ایمیلی حساب Auth
 * جدید). ویرایش نقش/دسترسی/غیرفعال‌سازی ادمین موجود مستقیماً از همین
 * کامپوننت روی جدول admins انجام می‌شود — نیازی به API route ندارد چون
 * RLS از قبل این را برای super_admin مجاز کرده (و همین یعنی auth.uid()
 * درست به تریگر audit می‌رسد).
 */

const SECTION_KEYS = ["routes", "fleet", "trips", "bookings", "payments", "loyalty", "customers"] as const
type SectionKey = (typeof SECTION_KEYS)[number]

type AdminRow = {
  id: string
  auth_user_id: string | null
  email: string | null
  full_name: string
  role: "super_admin" | "limited_admin"
  allowed_sections: string[] | null
  is_active: boolean
  last_sign_in_at: string | null
  created_at: string
}

type AuditRow = {
  id: string
  target_admin_id: string
  target_full_name: string | null
  actor_auth_user_id: string | null
  actor_full_name: string | null
  change_type: "created" | "role_changed" | "sections_changed" | "activated" | "deactivated" | "renamed"
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  occurred_at: string
}

type FormState = {
  fullName: string
  email: string
  role: "super_admin" | "limited_admin"
  sections: SectionKey[]
}

const EMPTY_FORM: FormState = { fullName: "", email: "", role: "limited_admin", sections: [] }

export function AdminManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const ta = t.admin.admins
  const supabase = createClient()

  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAudit, setShowAudit] = useState(false)

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingRow, setEditingRow] = useState<AdminRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    const [userRes, adminsRes, auditRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("list_admins_with_email"),
      supabase.rpc("list_admin_audit_log", { p_limit: 30 }),
    ])

    if (adminsRes.error) {
      setLoadError(t.admin.manage.genericError)
      setLoading(false)
      return
    }

    setCurrentAuthUserId(userRes.data.user?.id ?? null)
    setAdmins((adminsRes.data ?? []) as AdminRow[])
    setAudit((auditRes.data ?? []) as AuditRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setModalMode("create")
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openEdit(row: AdminRow) {
    setModalMode("edit")
    setEditingRow(row)
    setForm({
      fullName: row.full_name,
      email: row.email ?? "",
      role: row.role,
      sections: (row.allowed_sections ?? []).filter((s): s is SectionKey =>
        (SECTION_KEYS as readonly string[]).includes(s),
      ),
    })
    setFormError(null)
  }

  function closeModal() {
    if (saving) return
    setModalMode(null)
    setEditingRow(null)
  }

  function toggleSection(section: SectionKey) {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(section) ? f.sections.filter((s) => s !== section) : [...f.sections, section],
    }))
  }

  function isSelf(row: AdminRow) {
    return row.auth_user_id !== null && row.auth_user_id === currentAuthUserId
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      setFormError(ta.errorMissingFullName)
      return
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setFormError(ta.errorInvalidEmail)
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          role: form.role,
          allowedSections: form.role === "limited_admin" ? form.sections : [],
        }),
      })
      const resBody = await res.json().catch(() => ({}) as { error?: string })

      if (!res.ok) {
        if (resBody.error === "EMAIL_ALREADY_REGISTERED") setFormError(ta.errorEmailTaken)
        else if (resBody.error === "INVALID_EMAIL") setFormError(ta.errorInvalidEmail)
        else if (resBody.error === "MISSING_FULL_NAME") setFormError(ta.errorMissingFullName)
        else setFormError(ta.errorInviteFailed)
        return
      }

      setModalMode(null)
      setEditingRow(null)
      await load()
    } catch {
      setFormError(ta.errorInviteFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRow) return
    if (!form.fullName.trim()) {
      setFormError(ta.errorMissingFullName)
      return
    }

    setSaving(true)
    setFormError(null)

    const { error } = await supabase
      .from("admins")
      .update({
        full_name: form.fullName.trim(),
        role: form.role,
        allowed_sections: form.role === "limited_admin" ? form.sections : null,
      })
      .eq("id", editingRow.id)

    setSaving(false)

    if (error) {
      setFormError(error.message.includes("SELF_ROLE_CHANGE_BLOCKED") ? ta.errorSelfRoleChange : t.admin.manage.genericError)
      return
    }

    setModalMode(null)
    setEditingRow(null)
    await load()
  }

  async function toggleActive(row: AdminRow) {
    setTogglingId(row.id)
    setRowError(null)
    const { error } = await supabase.from("admins").update({ is_active: !row.is_active }).eq("id", row.id)

    if (error) {
      setRowError({
        id: row.id,
        message: error.message.includes("SELF_DEACTIVATE_BLOCKED") ? ta.errorSelfDeactivate : t.admin.manage.genericError,
      })
      setTogglingId(null)
      return
    }

    setAdmins((prev) => prev.map((a) => (a.id === row.id ? { ...a, is_active: !a.is_active } : a)))
    setTogglingId(null)
  }

  function formatDateTime(value: string | null) {
    if (!value) return "—"
    return new Date(value).toLocaleString(lang === "fa" ? "fa-AF" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  function sectionLabel(section: string) {
    return (ta.sections as Record<string, string>)[section] ?? section
  }

  function summarizeAudit(row: AuditRow): string {
    const roleLabel = (r: string) => (r === "super_admin" ? ta.roleSuperAdmin : ta.roleLimitedAdmin)
    switch (row.change_type) {
      case "created":
        return ta.auditChange.created
      case "role_changed":
        return `${ta.auditChange.role_changed}: ${roleLabel((row.old_value?.role as string) ?? "")} → ${roleLabel(
          (row.new_value?.role as string) ?? "",
        )}`
      case "sections_changed": {
        const oldSections = ((row.old_value?.allowed_sections as string[]) ?? []).map(sectionLabel).join("، ")
        const newSections = ((row.new_value?.allowed_sections as string[]) ?? []).map(sectionLabel).join("، ")
        return `${ta.auditChange.sections_changed}: ${oldSections || ta.noSectionsLabel} → ${newSections || ta.noSectionsLabel}`
      }
      case "activated":
        return ta.auditChange.activated
      case "deactivated":
        return ta.auditChange.deactivated
      case "renamed":
        return `${ta.auditChange.renamed}: ${(row.old_value?.full_name as string) ?? ""} → ${(row.new_value?.full_name as string) ?? ""}`
      default:
        return row.change_type
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{ta.title}</h2>
          <p className="text-xs text-muted-foreground">{ta.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className={primaryBtnClass}>
          <Plus className="size-4" />
          {ta.addAdmin}
        </button>
      </div>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="rounded-xl border border-border bg-card">
        <ScrollFade>
          <div className="overflow-x-auto">
            {loading ? (
              <LoadingRows />
            ) : admins.length === 0 ? (
              <EmptyState message={ta.empty} />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colName}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colEmail}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colRole}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colSections}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colStatus}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {ta.colLastSignIn}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const self = isSelf(a)
                    return (
                      <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                          {a.full_name} {self && <span className="text-xs text-muted-foreground">{ta.youLabel}</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                          {a.email ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              a.role === "super_admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {a.role === "super_admin" ? ta.roleSuperAdmin : ta.roleLimitedAdmin}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {a.role === "super_admin" ? (
                            ta.allSectionsLabel
                          ) : (a.allowed_sections ?? []).length === 0 ? (
                            ta.noSectionsLabel
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(a.allowed_sections ?? []).map((s) => (
                                <span key={s} className="rounded-full bg-muted px-2 py-0.5 whitespace-nowrap">
                                  {sectionLabel(s)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-1 py-1.5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <ToggleSwitch
                                checked={a.is_active}
                                disabled={togglingId === a.id || self}
                                onChange={() => toggleActive(a)}
                                label={`${a.full_name} — ${t.admin.manage.active}`}
                              />
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  a.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {a.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                              </span>
                            </div>
                            {rowError?.id === a.id && <ErrorBanner message={rowError.message} className="w-fit" />}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground" dir="ltr">
                          {a.last_sign_in_at ? formatDateTime(a.last_sign_in_at) : ta.neverSignedIn}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-end">
                          <button
                            type="button"
                            className={iconBtnClass}
                            onClick={() => openEdit(a)}
                            aria-label={t.admin.manage.edit}
                          >
                            <Pencil className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </ScrollFade>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowAudit((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground"
        >
          {ta.auditTitle}
          {showAudit ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {showAudit && (
          <div className="border-t border-border/60 px-4 py-3">
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ta.auditEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {audit.map((row) => (
                  <li key={row.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{row.target_full_name ?? "—"}</span>
                    {" — "}
                    {summarizeAudit(row)}
                    {row.actor_full_name && (
                      <span className="text-muted-foreground/70">
                        {" "}
                        ({ta.auditActor} {row.actor_full_name})
                      </span>
                    )}
                    <span className="text-muted-foreground/70" dir="ltr">
                      {" · "}
                      {formatDateTime(row.occurred_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {modalMode && (
        <Modal title={modalMode === "edit" ? ta.editTitle : ta.inviteTitle} onClose={closeModal}>
          <form onSubmit={modalMode === "edit" ? handleEditSubmit : handleCreateSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{ta.fullNameLabel}</label>
              <input
                type="text"
                className={inputClass}
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>

            {modalMode === "create" ? (
              <div>
                <label className={labelClass}>{ta.emailLabel}</label>
                <input
                  type="email"
                  dir="ltr"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">{ta.emailHelper}</p>
              </div>
            ) : (
              editingRow?.email && (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {editingRow.email}
                </p>
              )
            )}

            <div>
              <label className={labelClass}>{ta.roleLabel}</label>
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as FormState["role"] }))}
                disabled={modalMode === "edit" && !!editingRow && isSelf(editingRow)}
              >
                <option value="limited_admin">{ta.roleLimitedAdmin}</option>
                <option value="super_admin">{ta.roleSuperAdmin}</option>
              </select>
              {modalMode === "edit" && editingRow && isSelf(editingRow) && (
                <p className="mt-1 text-xs text-muted-foreground">{ta.selfRoleLocked}</p>
              )}
            </div>

            {form.role === "limited_admin" && (
              <div>
                <label className={labelClass}>{ta.sectionsLabel}</label>
                <p className="mb-1.5 text-xs text-muted-foreground">{ta.sectionsHelper}</p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {SECTION_KEYS.map((section) => (
                    <label key={section} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={form.sections.includes(section)}
                        onChange={() => toggleSection(section)}
                        className="size-4 rounded border-border"
                      />
                      {sectionLabel(section)}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formError && <ErrorBanner message={formError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeModal} disabled={saving}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {modalMode === "create" ? (saving ? ta.inviteSending : ta.inviteSubmit) : t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
