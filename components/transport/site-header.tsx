"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bus, Menu, X } from "lucide-react"
import { dictionary, displayFont } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

export function SiteHeader() {
  const { lang, toggle } = useLang()
  const t = dictionary[lang]
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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
          <Link
            href="/account"
            className="hidden rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
          >
            {t.login}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
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
                className="mt-1 block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                {t.login}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
