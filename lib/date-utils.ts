import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js"
import type { Lang } from "@/lib/i18n"

const FA_DIGITS: Record<string, string> = {
  "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
  "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
}

// Digit-only localization with NO thousands separator — unlike lib/i18n.ts's
// localizeNumber (which grouping-formats via toLocaleString, correct for
// prices but wrong for a bare year like "1405" or "2026").
export function localizeDigits(value: number, lang: Lang): string {
  const str = String(value)
  return lang === "fa" ? str.replace(/[0-9]/g, (d) => FA_DIGITS[d]) : str
}

export type CalendarSystem = "shamsi" | "gregorian"

/**
 * Afghanistan's official civil calendar is the Solar Hijri ("Shamsi")
 * calendar — used for government records, schools, and national holidays —
 * while Gregorian ("Miladi") is mainly used for international documents.
 * Both are offered here; the app's own data model always stores/passes the
 * Gregorian ISO date ("YYYY-MM-DD") regardless of which one is displayed.
 */
export const SHAMSI_MONTHS_FA = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت",
]
export const SHAMSI_MONTHS_EN = [
  "Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sonbola",
  "Mizan", "Aqrab", "Qaws", "Jadi", "Dalw", "Hoot",
]
export const GREGORIAN_MONTHS_FA = [
  "جنوری", "فبروری", "مارچ", "اپریل", "می", "جون",
  "جولای", "اگست", "سپتمبر", "اکتوبر", "نومبر", "دسمبر",
]
export const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// Shamsi weeks start Saturday (the traditional Afghan work week runs
// Saturday-Wednesday, with Friday as the main rest day).
export const SHAMSI_WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"]
export const SHAMSI_WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
// Gregorian grid keeps the common Sunday-first convention used elsewhere in the app.
export const GREGORIAN_WEEKDAYS_FA = ["ی", "د", "س", "چ", "پ", "ج", "ش"]
export const GREGORIAN_WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

export function isoToShamsi(iso: string) {
  const [gy, gm, gd] = iso.split("-").map(Number)
  return toJalaali(gy, gm, gd)
}

export function shamsiToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export function formatDate(iso: string, lang: Lang, system: CalendarSystem): string {
  if (!iso) return ""
  if (system === "shamsi") {
    const { jy, jm, jd } = isoToShamsi(iso)
    const months = lang === "fa" ? SHAMSI_MONTHS_FA : SHAMSI_MONTHS_EN
    return `${localizeDigits(jd, lang)} ${months[jm - 1]} ${localizeDigits(jy, lang)}`
  }
  const [gy, gm, gd] = iso.split("-").map(Number)
  const months = lang === "fa" ? GREGORIAN_MONTHS_FA : GREGORIAN_MONTHS_EN
  return `${localizeDigits(gd, lang)} ${months[gm - 1]} ${localizeDigits(gy, lang)}`
}

// Compact typed formats a user can type or paste directly:
//   Shamsi:     1405/06/12
//   Gregorian:  2026-09-03 (matches the field's own ISO storage format)
// Accepts both Latin and Persian digits.
export function parseTyped(input: string, system: CalendarSystem): string | null {
  const latin = input.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  const cleaned = latin.trim()
  const m = cleaned.match(/^(\d{3,4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (!m) return null
  const [, yStr, mStr, dStr] = m
  const y = Number(yStr)
  const mo = Number(mStr)
  const d = Number(dStr)

  if (system === "shamsi") {
    if (!isValidJalaaliDate(y, mo, d) || mo < 1 || mo > 12 || d < 1 || d > jalaaliMonthLength(y, mo)) return null
    return shamsiToIso(y, mo, d)
  }
  if (mo < 1 || mo > 12) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${y}-${pad(mo)}-${pad(d)}`
}
