"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { dictionary, localizeNumber, localizePercent, type Lang } from "@/lib/i18n"
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

type LoyaltyTier = {
  id: string
  tier_key: string
  name_fa: string
  name_en: string
  min_completed_trips: number
  discount_percent: number
  sort_order: number
  is_active: boolean
}

type DiscountType = "percent" | "fixed"

type Coupon = {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  is_stackable_with_tier: boolean
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
}

type TierFormState = { minCompletedTrips: string; discountPercent: string; isActive: boolean }
type CouponFormState = {
  code: string
  discountType: DiscountType
  discountValue: string
  isStackable: boolean
  usageLimit: string
  validFrom: string
  validTo: string
  isActive: boolean
}

const EMPTY_COUPON_FORM: CouponFormState = {
  code: "",
  discountType: "percent",
  discountValue: "",
  isStackable: false,
  usageLimit: "",
  validFrom: "",
  validTo: "",
  isActive: true,
}

function tierName(tier: LoyaltyTier, lang: Lang): string {
  return lang === "fa" ? tier.name_fa : tier.name_en
}

/**
 * فاز ۵.۴ — LoyaltyManager. سه بخش مستقل روی همان جداول مستند‌شده در نگاشت
 * بخش ۳.۲ زیر عنوان 'loyalty' (loyalty_tiers, coupons, و — تازه در همین
 * فاز — loyalty_settings):
 *
 * ۱. سطوح عضویت — فقط آستانه/درصد/فعال‌بودن هر سه سطح ثابت (برنز/نقره/طلا)
 *    قابل‌ویرایش است؛ نام و کلید سطح عمداً ویرایش‌پذیر نیستند چون در جاهای
 *    دیگر سایت (متن‌های ثابت هیرو/درباره‌ما/حساب کاربری) به همین نام‌ها
 *    ارجاع داده شده و افزودن/حذف سطح یک تصمیم کسب‌وکاری بخش ۵ پرامپت
 *    مادر است، نه چیزی که این فاز خودسرانه تغییر دهد.
 * ۲. پاداش کد معرفی — یک عدد سراسری در loyalty_settings (جدول تازهٔ همین
 *    فاز)؛ قبلاً در handle_booking_completed() هاردکد بود (فاز ۴.۵).
 * ۳. کدهای تخفیف — CRUD کامل روی coupons.
 */
export function LoyaltyManager({ lang }: { lang: Lang }) {
  const t = dictionary[lang]
  const tl = t.admin.loyaltyPanel
  const supabase = createClient()

  const [adminId, setAdminId] = useState<string | null>(null)

  // --- سطوح عضویت ---
  const [tiers, setTiers] = useState<LoyaltyTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(true)
  const [tiersError, setTiersError] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [tierForm, setTierForm] = useState<TierFormState>({ minCompletedTrips: "", discountPercent: "", isActive: true })
  const [tierFormError, setTierFormError] = useState<string | null>(null)
  const [tierSaving, setTierSaving] = useState(false)

  // --- پاداش رفرال ---
  const [referralReward, setReferralReward] = useState<string>("")
  const [referralLoading, setReferralLoading] = useState(true)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [referralSaving, setReferralSaving] = useState(false)
  const [referralSaved, setReferralSaved] = useState(false)

  // --- کوپن‌ها ---
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [couponsError, setCouponsError] = useState<string | null>(null)
  const [couponModalMode, setCouponModalMode] = useState<"create" | "edit" | null>(null)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [couponForm, setCouponForm] = useState<CouponFormState>(EMPTY_COUPON_FORM)
  const [couponFormError, setCouponFormError] = useState<string | null>(null)
  const [couponSaving, setCouponSaving] = useState(false)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [couponDeleting, setCouponDeleting] = useState(false)
  const [couponDeleteError, setCouponDeleteError] = useState<string | null>(null)

  async function loadTiers() {
    setTiersLoading(true)
    setTiersError(null)
    const { data, error } = await supabase
      .from("loyalty_tiers")
      .select("id, tier_key, name_fa, name_en, min_completed_trips, discount_percent, sort_order, is_active")
      .order("sort_order", { ascending: true })
    if (error) {
      setTiersError(t.admin.manage.genericError)
      setTiersLoading(false)
      return
    }
    setTiers((data ?? []) as LoyaltyTier[])
    setTiersLoading(false)
  }

  async function loadReferralSetting() {
    setReferralLoading(true)
    setReferralError(null)
    const { data, error } = await supabase.from("loyalty_settings").select("referral_reward_amount").eq("id", true).maybeSingle()
    if (error || !data) {
      setReferralError(t.admin.manage.genericError)
      setReferralLoading(false)
      return
    }
    setReferralReward(String(data.referral_reward_amount))
    setReferralLoading(false)
  }

  async function loadCoupons() {
    setCouponsLoading(true)
    setCouponsError(null)
    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, is_stackable_with_tier, usage_limit, used_count, valid_from, valid_to, is_active",
      )
      .order("created_at", { ascending: false })
    if (error) {
      setCouponsError(t.admin.manage.genericError)
      setCouponsLoading(false)
      return
    }
    setCoupons((data ?? []) as Coupon[])
    setCouponsLoading(false)
  }

  useEffect(() => {
    loadTiers()
    loadReferralSetting()
    loadCoupons()

    async function loadCurrentAdmin() {
      const { data: userRes } = await supabase.auth.getUser()
      const uid = userRes.user?.id
      if (!uid) return
      const { data } = await supabase.from("admins").select("id").eq("auth_user_id", uid).maybeSingle()
      if (data) setAdminId(data.id)
    }
    loadCurrentAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------- سطوح عضویت ----------------

  function openEditTier(tier: LoyaltyTier) {
    setEditingTier(tier)
    setTierForm({
      minCompletedTrips: String(tier.min_completed_trips),
      discountPercent: String(tier.discount_percent),
      isActive: tier.is_active,
    })
    setTierFormError(null)
  }

  function closeTierModal() {
    if (tierSaving) return
    setEditingTier(null)
  }

  const otherTierThresholds = editingTier
    ? {
        lower: tiers.filter((x) => x.sort_order < editingTier.sort_order).map((x) => x.min_completed_trips),
        higher: tiers.filter((x) => x.sort_order > editingTier.sort_order).map((x) => x.min_completed_trips),
      }
    : null

  const tierThresholdWarning = (() => {
    if (!editingTier || !otherTierThresholds) return null
    const value = Number(tierForm.minCompletedTrips)
    if (Number.isNaN(value)) return null
    const lowerViolation = otherTierThresholds.lower.some((v) => v >= value)
    const higherViolation = otherTierThresholds.higher.some((v) => v <= value)
    return lowerViolation || higherViolation ? tl.nonIncreasingWarning : null
  })()

  async function handleTierSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTier) return

    const minTrips = Number(tierForm.minCompletedTrips)
    const discount = Number(tierForm.discountPercent)

    if (!Number.isFinite(minTrips) || minTrips < 0) {
      setTierFormError(tl.thresholdRangeError)
      return
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setTierFormError(tl.discountRangeError)
      return
    }

    setTierSaving(true)
    setTierFormError(null)

    const { error } = await supabase
      .from("loyalty_tiers")
      .update({ min_completed_trips: minTrips, discount_percent: discount, is_active: tierForm.isActive })
      .eq("id", editingTier.id)

    setTierSaving(false)

    if (error) {
      setTierFormError(t.admin.manage.genericError)
      return
    }

    setEditingTier(null)
    await loadTiers()
  }

  // ---------------- پاداش رفرال ----------------

  async function handleReferralSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(referralReward)
    if (!Number.isFinite(amount) || amount < 0) {
      setReferralError(tl.thresholdRangeError)
      return
    }

    setReferralSaving(true)
    setReferralError(null)
    setReferralSaved(false)

    const { error } = await supabase.from("loyalty_settings").update({ referral_reward_amount: amount }).eq("id", true)

    setReferralSaving(false)

    if (error) {
      setReferralError(t.admin.manage.genericError)
      return
    }

    setReferralSaved(true)
  }

  // ---------------- کوپن‌ها ----------------

  function openCreateCoupon() {
    setCouponModalMode("create")
    setEditingCouponId(null)
    setCouponForm(EMPTY_COUPON_FORM)
    setCouponFormError(null)
  }

  function openEditCoupon(coupon: Coupon) {
    setCouponModalMode("edit")
    setEditingCouponId(coupon.id)
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: String(coupon.discount_value),
      isStackable: coupon.is_stackable_with_tier,
      usageLimit: coupon.usage_limit !== null ? String(coupon.usage_limit) : "",
      validFrom: coupon.valid_from ?? "",
      validTo: coupon.valid_to ?? "",
      isActive: coupon.is_active,
    })
    setCouponFormError(null)
  }

  function closeCouponModal() {
    if (couponSaving) return
    setCouponModalMode(null)
    setEditingCouponId(null)
  }

  async function handleCouponSubmit(e: React.FormEvent) {
    e.preventDefault()

    const code = couponForm.code.trim().toUpperCase()
    if (!code) {
      setCouponFormError(tl.code)
      return
    }

    const discountValue = Number(couponForm.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setCouponFormError(tl.invalidDiscountValue)
      return
    }
    if (couponForm.discountType === "percent" && (discountValue <= 0 || discountValue > 100)) {
      setCouponFormError(tl.invalidPercentValue)
      return
    }

    const validFrom = couponForm.validFrom.trim() === "" ? null : couponForm.validFrom
    const validTo = couponForm.validTo.trim() === "" ? null : couponForm.validTo
    if (validFrom && validTo && validTo < validFrom) {
      setCouponFormError(tl.invalidDateRangeError)
      return
    }

    const usageLimit = couponForm.usageLimit.trim() === "" ? null : Number(couponForm.usageLimit)
    if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit <= 0)) {
      setCouponFormError(tl.usageLimit)
      return
    }

    setCouponSaving(true)
    setCouponFormError(null)

    const payload = {
      code,
      discount_type: couponForm.discountType,
      discount_value: discountValue,
      is_stackable_with_tier: couponForm.isStackable,
      usage_limit: usageLimit,
      valid_from: validFrom,
      valid_to: validTo,
      is_active: couponForm.isActive,
      ...(couponModalMode === "create" ? { created_by_admin_id: adminId } : {}),
    }

    const { error } =
      couponModalMode === "edit" && editingCouponId
        ? await supabase.from("coupons").update(payload).eq("id", editingCouponId)
        : await supabase.from("coupons").insert(payload)

    setCouponSaving(false)

    if (error) {
      setCouponFormError(isUniqueViolation(error) ? tl.duplicateCodeError : t.admin.manage.genericError)
      return
    }

    setCouponModalMode(null)
    setEditingCouponId(null)
    await loadCoupons()
  }

  function requestDeleteCoupon(coupon: Coupon) {
    setCouponDeleteError(coupon.used_count > 0 ? tl.deleteUsedError : null)
    setDeletingCoupon(coupon)
  }

  async function handleCouponDelete() {
    if (!deletingCoupon) return
    if (deletingCoupon.used_count > 0) {
      setCouponDeleteError(tl.deleteUsedError)
      return
    }

    setCouponDeleting(true)
    setCouponDeleteError(null)
    const { error } = await supabase.from("coupons").delete().eq("id", deletingCoupon.id)
    setCouponDeleting(false)

    if (error) {
      setCouponDeleteError(t.admin.manage.genericError)
      return
    }

    setDeletingCoupon(null)
    await loadCoupons()
  }

  function couponValueLabel(c: Coupon): string {
    return c.discount_type === "percent"
      ? localizePercent(c.discount_value, lang)
      : `${localizeNumber(c.discount_value, lang)} ${t.routes.currency}`
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold text-foreground">{tl.title}</h2>
        <p className="text-xs text-muted-foreground">{tl.subtitle}</p>
      </div>

      {/* ۱. سطوح عضویت */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{tl.tiersTitle}</h3>
          <p className="text-xs text-muted-foreground">{tl.tiersSubtitle}</p>
        </div>

        {tiersError && <ErrorBanner message={tiersError} />}

        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            {tiersLoading ? (
              <LoadingRows />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tl.colTier}</th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.colThreshold}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.colDiscount}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.colTierStatus}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-foreground">{tierName(tier, lang)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {localizeNumber(tier.min_completed_trips, lang)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {localizePercent(tier.discount_percent, lang)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            tier.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {tier.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end">
                        <button
                          type="button"
                          className={iconBtnClass}
                          onClick={() => openEditTier(tier)}
                          aria-label={t.admin.manage.edit}
                        >
                          <Pencil className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ۲. پاداش رفرال */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{tl.referralTitle}</h3>
          <p className="text-xs text-muted-foreground">{tl.referralSubtitle}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          {referralLoading ? (
            <LoadingRows />
          ) : (
            <form onSubmit={handleReferralSubmit} className="flex flex-col gap-3 sm:max-w-xs">
              <div>
                <label className={labelClass}>{tl.referralAmountLabel}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className={inputClass}
                    value={referralReward}
                    onChange={(e) => {
                      setReferralReward(e.target.value)
                      setReferralSaved(false)
                    }}
                    required
                  />
                  <span className="whitespace-nowrap text-sm text-muted-foreground">{t.routes.currency}</span>
                </div>
              </div>
              {referralError && <ErrorBanner message={referralError} />}
              {referralSaved && !referralError && <p className="text-xs text-accent">{tl.referralSaved}</p>}
              <div>
                <button type="submit" className={primaryBtnClass} disabled={referralSaving}>
                  {referralSaving && <Loader2 className="size-3.5 animate-spin" />}
                  {t.admin.manage.save}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ۳. کدهای تخفیف */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{tl.couponsTitle}</h3>
            <p className="text-xs text-muted-foreground">{tl.couponsSubtitle}</p>
          </div>
          <button type="button" onClick={openCreateCoupon} className={primaryBtnClass}>
            <Plus className="size-4" />
            {tl.addCoupon}
          </button>
        </div>

        {couponsError && <ErrorBanner message={couponsError} />}

        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            {couponsLoading ? (
              <LoadingRows />
            ) : coupons.length === 0 ? (
              <EmptyState message={tl.empty} />
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">{tl.code}</th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.discountValue}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.stackableWithTier}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.usedCount}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.validFrom}/{tl.validTo}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium text-muted-foreground">
                      {tl.colTierStatus}
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-primary" dir="ltr">
                        {c.code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">{couponValueLabel(c)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                        {c.is_stackable_with_tier ? tl.yes : tl.no}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                        {localizeNumber(c.used_count, lang)} / {c.usage_limit !== null ? localizeNumber(c.usage_limit, lang) : tl.unlimited}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                        {c.valid_from ?? tl.noDateLimit} – {c.valid_to ?? tl.noDateLimit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {c.is_active ? t.admin.manage.active : t.admin.manage.inactive}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className={iconBtnClass}
                            onClick={() => openEditCoupon(c)}
                            aria-label={t.admin.manage.edit}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className={iconBtnClass}
                            onClick={() => requestDeleteCoupon(c)}
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
      </div>

      {/* مودال ویرایش سطح */}
      {editingTier && (
        <Modal title={`${tl.editTier} — ${tierName(editingTier, lang)}`} onClose={closeTierModal}>
          <form onSubmit={handleTierSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{tl.thresholdLabel}</label>
              <input
                type="number"
                min={0}
                step="1"
                className={inputClass}
                value={tierForm.minCompletedTrips}
                onChange={(e) => setTierForm((f) => ({ ...f, minCompletedTrips: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{tl.discountLabel}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  className={inputClass}
                  value={tierForm.discountPercent}
                  onChange={(e) => setTierForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  required
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={tierForm.isActive}
                onChange={(e) => setTierForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              {tl.tierActiveLabel}
            </label>

            {tierThresholdWarning && <ErrorBanner message={tierThresholdWarning} />}
            {tierFormError && <ErrorBanner message={tierFormError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeTierModal} disabled={tierSaving}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={tierSaving}>
                {tierSaving && <Loader2 className="size-3.5 animate-spin" />}
                {t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* مودال افزودن/ویرایش کوپن */}
      {couponModalMode && (
        <Modal title={couponModalMode === "edit" ? tl.editCoupon : tl.addCoupon} onClose={closeCouponModal} wide>
          <form onSubmit={handleCouponSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>{tl.code}</label>
              <input
                type="text"
                dir="ltr"
                className={`${inputClass} uppercase`}
                value={couponForm.code}
                onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{tl.codeHelper}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{tl.discountType}</label>
                <select
                  className={inputClass}
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))}
                >
                  <option value="percent">{tl.discountTypePercent}</option>
                  <option value="fixed">{tl.discountTypeFixed}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{tl.discountValue}</label>
                <input
                  type="number"
                  min={0}
                  step={couponForm.discountType === "percent" ? "0.1" : "1"}
                  className={inputClass}
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm((f) => ({ ...f, discountValue: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{tl.validFrom}</label>
                <input
                  type="date"
                  dir="ltr"
                  className={inputClass}
                  value={couponForm.validFrom}
                  onChange={(e) => setCouponForm((f) => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>{tl.validTo}</label>
                <input
                  type="date"
                  dir="ltr"
                  className={inputClass}
                  value={couponForm.validTo}
                  min={couponForm.validFrom || undefined}
                  onChange={(e) => setCouponForm((f) => ({ ...f, validTo: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {tl.usageLimit} <span className="text-muted-foreground/70">({t.admin.manage.optional})</span>
              </label>
              <input
                type="number"
                min={1}
                step="1"
                className={inputClass}
                value={couponForm.usageLimit}
                onChange={(e) => setCouponForm((f) => ({ ...f, usageLimit: e.target.value }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">{tl.usageLimitHelper}</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={couponForm.isStackable}
                onChange={(e) => setCouponForm((f) => ({ ...f, isStackable: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              {tl.stackableWithTier}
            </label>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={couponForm.isActive}
                onChange={(e) => setCouponForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              {tl.couponActive}
            </label>

            {couponFormError && <ErrorBanner message={couponFormError} />}

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className={secondaryBtnClass} onClick={closeCouponModal} disabled={couponSaving}>
                {t.admin.manage.cancel}
              </button>
              <button type="submit" className={primaryBtnClass} disabled={couponSaving}>
                {couponSaving && <Loader2 className="size-3.5 animate-spin" />}
                {t.admin.manage.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingCoupon && (
        <ConfirmDialog
          title={t.admin.manage.confirmDeleteTitle}
          body={tl.deleteConfirmBody}
          confirmLabel={t.admin.manage.delete}
          cancelLabel={t.admin.manage.cancel}
          pending={couponDeleting}
          errorMessage={couponDeleteError}
          onConfirm={handleCouponDelete}
          onCancel={() => setDeletingCoupon(null)}
        />
      )}
    </div>
  )
}
