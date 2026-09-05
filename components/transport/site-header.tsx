"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bus, Menu, X } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { createClient } from "@/lib/supabase/client"
import { CustomerAvatar } from "../ui/customer-avatar"

type HeaderCustomer = { full_name: string | null; avatar_url: string | null } | null

export function SiteHeader() {
  const { lang, toggle } = useLang()
  const t = dictionary[lang]
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // فاز ۴.۷ — تشخیص نشست سمت کلاینت برای تعویض دکمهٔ «ورود» با آواتار
  // مسافر واردشده (درخواست Zakir، طرح از اسکرین‌شات FlixBus). undefined
  // یعنی «هنوز مشخص نشده» (رندر اول، جلوگیری از فلش نادرست به حالت مهمان)؛
  // null یعنی مهمان؛ آبجکت یعنی مسافر واردشده. SELECT از customers طبق
  // policy «customers_self_select» (بخش ۳.۲ RLS) برای کلاینت مرورگر مجاز
  // است — نیازی به service_role یا Route Handler جداگانه نیست.
  const [customer, setCustomer] = useState<HeaderCustomer | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadCustomer(userId: string | null) {
      if (!userId) {
        if (active) setCustomer(null)
        return
      }
      const { data } = await supabase
        .from("customers")
        .select("full_name, avatar_url")
        .eq("auth_user_id", userId)
        .maybeSingle()
      if (active) setCustomer(data ?? null)
    }

    supabase.auth.getUser().then(({ data: { user } }) => loadCustomer(user?.id ?? null))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadCustomer(session?.user?.id ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const accountLabel = customer ? customer.full_name?.trim().split(" ")[0] || t.account.dashboardTitle : t.login

  // Each label now matches exactly one real page's own title — the old
  // list had "Fleet" and "Offices" pointing at the About and Contact pages
  // respectively, which read as if they were different destinations than
  // the page you actually landed on.
  const links = [
    { label: t.nav.routes, href: "/routes" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.faq, href: "/faq" },
    { label: t.nav.contact, href: "/contact" },
  ]

  // usePathname ignores the #hash and ?query, so /about#fleet still
  // correctly highlights "About us" as the active section.
  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 3xl:max-w-7xl 4xl:max-w-[110rem]">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Bus className="size-5" strokeWidth={2.2} />
          </span>
          <span className={`${displayFont(lang)} text-xl font-semibold tracking-tight text-foreground`}>
            {t.brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 text-sm transition-colors focus-visible:outline-none ${
                  active
                    ? "font-semibold text-primary after:absolute after:-bottom-[22px] after:inset-x-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground focus-visible:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Switch language / تغییر زبان"
          >
            {t.langButton}
          </button>
          {/* فاز ۴.۷ — قبلاً یک دکمهٔ متنی ساده («ورود») بود؛ حالا مثل
              اسکرین‌شات FlixBus یک آیکن پروفایل دایره‌ای + متن است. برای
              مهمان همان آیکن سایه‌ای عمومی (CustomerAvatar بدون avatarUrl)
              نمایش داده می‌شود؛ برای مسافر واردشده نام کوچکش. هر وقت
              customers.avatar_url مقدار بگیرد (فیچر آپلود، فازی بعدی)،
              همینجا بدون هیچ تغییر کدی عکس واقعی جای آیکن را می‌گیرد. */}
          <Link
            href="/account"
            className="hidden items-center gap-2 rounded-full border border-border py-1 pe-3.5 ps-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
            aria-label={customer ? t.account.dashboardTitle : t.login}
          >
            <CustomerAvatar name={customer?.full_name} avatarUrl={customer?.avatar_url} size={26} />
            <span>{accountLabel}</span>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-11 items-center justify-center rounded-md text-foreground md:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => {
              const active = isActive(l.href)
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <CustomerAvatar name={customer?.full_name} avatarUrl={customer?.avatar_url} size={22} />
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
