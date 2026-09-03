"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { jalaaliMonthLength } from "jalaali-js"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import { dictionary } from "@/lib/i18n"
import {
  type CalendarSystem,
  GREGORIAN_MONTHS_EN,
  GREGORIAN_MONTHS_FA,
  GREGORIAN_WEEKDAYS_EN,
  GREGORIAN_WEEKDAYS_FA,
  SHAMSI_MONTHS_EN,
  SHAMSI_MONTHS_FA,
  SHAMSI_WEEKDAYS_EN,
  SHAMSI_WEEKDAYS_FA,
  addDaysIso,
  formatDate,
  isoToShamsi,
  isoToday,
  localizeDigits,
  parseTyped,
  shamsiToIso,
} from "@/lib/date-utils"

// How far ahead travel dates can be searched — long enough for advance
// planning, short enough that the grid never needs to page through years.
const MAX_DAYS_AHEAD = 180
const POPUP_WIDTH = 300

type Cell = { iso: string; day: number; inMonth: boolean; disabled: boolean }

export function DatePicker({
  lang,
  value,
  onChange,
}: {
  lang: Lang
  value: string
  onChange: (iso: string) => void
}) {
  const t = dictionary[lang]
  const today = useMemo(() => isoToday(), [])
  const maxDate = useMemo(() => addDaysIso(today, MAX_DAYS_AHEAD), [today])

  // Afghanistan's civil calendar (Shamsi) is the sensible default for a
  // Dari UI; Gregorian defaults for English, but either can switch anytime —
  // calendar system is a user preference independent of UI language.
  const [system, setSystem] = useState<CalendarSystem>(lang === "fa" ? "shamsi" : "gregorian")
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => formatDate(value, lang, system))
  const [inputError, setInputError] = useState(false)
  const [viewY, setViewY] = useState(0)
  const [viewM, setViewM] = useState(0)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  // fieldRef anchors the visible input (used to compute the popover's
  // position); popoverRef is the portaled dropdown itself. Both must be
  // checked for outside-click, since the portal renders outside fieldRef's
  // own DOM subtree.
  const fieldRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function viewOf(iso: string, sys: CalendarSystem) {
    if (sys === "shamsi") {
      const j = isoToShamsi(iso)
      return { y: j.jy, m: j.jm }
    }
    const [y, m] = iso.split("-").map(Number)
    return { y, m }
  }

  function updateCoords() {
    const el = fieldRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const rawLeft = lang === "fa" ? rect.right - POPUP_WIDTH : rect.left
    const clampedLeft = Math.min(Math.max(rawLeft, 8), window.innerWidth - POPUP_WIDTH - 8)
    setCoords({ top: rect.bottom + 8, left: clampedLeft })
  }

  useEffect(() => {
    const v = viewOf(value || today, system)
    setViewY(v.y)
    setViewM(v.m)
  }, [system]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setText(formatDate(value, lang, system))
    setInputError(false)
  }, [value, lang, system])

  // Outside-click closes the popover; scrolling or resizing just repositions
  // it (it used to close on scroll because its position was tied to normal
  // document flow inside a clipped ancestor — this keeps it open and anchored).
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (fieldRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleReposition() {
      updateCoords()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("scroll", handleReposition, true)
    window.addEventListener("resize", handleReposition)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", handleReposition, true)
      window.removeEventListener("resize", handleReposition)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function openPicker() {
    const v = viewOf(value || today, system)
    setViewY(v.y)
    setViewM(v.m)
    updateCoords()
    setOpen(true)
  }

  function commitText() {
    const trimmed = text.trim()
    if (!trimmed) {
      onChange("")
      setInputError(false)
      return
    }
    const iso = parseTyped(trimmed, system)
    if (!iso || iso < today || iso > maxDate) {
      setInputError(true)
      return
    }
    setInputError(false)
    onChange(iso)
  }

  function selectDay(iso: string) {
    onChange(iso)
    setOpen(false)
  }

  const cells: Cell[] = useMemo(() => {
    if (!viewY) return []
    const out: Cell[] = []
    if (system === "shamsi") {
      const len = jalaaliMonthLength(viewY, viewM)
      const firstIso = shamsiToIso(viewY, viewM, 1)
      const dow = new Date(firstIso + "T00:00:00").getDay() // 0=Sun..6=Sat
      const leading = (dow + 1) % 7 // shift so week starts Saturday
      for (let i = 0; i < leading; i++) out.push({ iso: "", day: 0, inMonth: false, disabled: true })
      for (let d = 1; d <= len; d++) {
        const iso = shamsiToIso(viewY, viewM, d)
        out.push({ iso, day: d, inMonth: true, disabled: iso < today || iso > maxDate })
      }
    } else {
      const len = new Date(viewY, viewM, 0).getDate()
      const dow = new Date(viewY, viewM - 1, 1).getDay()
      for (let i = 0; i < dow; i++) out.push({ iso: "", day: 0, inMonth: false, disabled: true })
      for (let d = 1; d <= len; d++) {
        const iso = `${viewY}-${String(viewM).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        out.push({ iso, day: d, inMonth: true, disabled: iso < today || iso > maxDate })
      }
    }
    return out
  }, [system, viewY, viewM, today, maxDate])

  function pad(n: number) {
    return String(n).padStart(2, "0")
  }

  function goPrevMonth() {
    if (viewM === 1) { setViewY((y) => y - 1); setViewM(12) } else setViewM((m) => m - 1)
  }
  function goNextMonth() {
    if (viewM === 12) { setViewY((y) => y + 1); setViewM(1) } else setViewM((m) => m + 1)
  }

  const prevDisabled = useMemo(() => {
    if (!viewY) return true
    if (system === "shamsi") {
      const py = viewM === 1 ? viewY - 1 : viewY
      const pm = viewM === 1 ? 12 : viewM - 1
      return shamsiToIso(py, pm, jalaaliMonthLength(py, pm)) < today
    }
    const prevLast = new Date(viewY, viewM - 1, 0)
    return `${prevLast.getFullYear()}-${pad(prevLast.getMonth() + 1)}-${pad(prevLast.getDate())}` < today
  }, [system, viewY, viewM, today])

  const nextDisabled = useMemo(() => {
    if (!viewY) return true
    const ny = viewM === 12 ? viewY + 1 : viewY
    const nm = viewM === 12 ? 1 : viewM + 1
    if (system === "shamsi") return shamsiToIso(ny, nm, 1) > maxDate
    return `${ny}-${pad(nm)}-01` > maxDate
  }, [system, viewY, viewM, maxDate])

  const monthLabel = useMemo(() => {
    if (!viewY) return ""
    const months =
      system === "shamsi"
        ? lang === "fa" ? SHAMSI_MONTHS_FA : SHAMSI_MONTHS_EN
        : lang === "fa" ? GREGORIAN_MONTHS_FA : GREGORIAN_MONTHS_EN
    return `${months[viewM - 1]} ${localizeDigits(viewY, lang)}`
  }, [system, viewY, viewM, lang])

  const weekdayLabels =
    system === "shamsi"
      ? lang === "fa" ? SHAMSI_WEEKDAYS_FA : SHAMSI_WEEKDAYS_EN
      : lang === "fa" ? GREGORIAN_WEEKDAYS_FA : GREGORIAN_WEEKDAYS_EN

  const fieldBase =
    "w-full rounded-xl border bg-background/60 py-3 text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div ref={fieldRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.hero.date}</label>
      <button
        type="button"
        onClick={openPicker}
        aria-label={t.hero.date}
        className="absolute bottom-3.5 start-3 z-10 text-muted-foreground hover:text-primary"
      >
        <CalendarIcon className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onFocus={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitText()
          }
        }}
        placeholder={system === "shamsi" ? "۱۴۰۵/۰۶/۱۲" : "2026-09-03"}
        className={`${fieldBase} ps-9 pe-3 ${inputError ? "border-destructive" : "border-border"}`}
      />

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            dir={lang === "fa" ? "rtl" : "ltr"}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: POPUP_WIDTH }}
            className="z-[200] rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40"
          >
            {/* Calendar system toggle — always visible so it's never ambiguous
                which calendar the grid/date belongs to. */}
            <div className="mb-3 flex gap-1 rounded-lg bg-secondary p-1 text-xs">
              <button
                type="button"
                onClick={() => setSystem("shamsi")}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  system === "shamsi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "fa" ? "شمسی" : "Shamsi"}
              </button>
              <button
                type="button"
                onClick={() => setSystem("gregorian")}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  system === "gregorian" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "fa" ? "میلادی" : "Gregorian"}
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={prevDisabled}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
              >
                {lang === "fa" ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </button>
              <span className={`${lang === "en" ? "font-serif" : ""} text-sm font-semibold text-foreground`}>
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goNextMonth}
                disabled={nextDisabled}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
              >
                {lang === "fa" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
              {weekdayLabels.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                if (!c.inMonth) return <span key={i} />
                const isSelected = c.iso === value
                const isToday = c.iso === today
                return (
                  <button
                    key={c.iso}
                    type="button"
                    disabled={c.disabled}
                    onClick={() => selectDay(c.iso)}
                    className={`flex size-9 items-center justify-center rounded-lg text-sm transition-colors ${
                      isSelected
                        ? "bg-primary font-semibold text-primary-foreground"
                        : isToday
                          ? "border border-primary text-primary"
                          : c.disabled
                            ? "text-muted-foreground/30"
                            : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {localizeDigits(c.day, lang)}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => selectDay(today)}
              className="mt-3 w-full rounded-lg border border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-secondary"
            >
              {lang === "fa" ? "امروز" : "Today"}
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
