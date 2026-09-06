import { cities, type Lang } from "@/lib/i18n"

export type AmenityKey = "ac" | "wifi" | "charging" | "refreshment" | "reclining"
export type BusType = "vip" | "standard"

/**
 * حداکثر تعداد چوکی قابل‌انتخاب در یک رزرو — طبق FAQ سایت («در هر رزرو تا
 * شش چوکی قابل انتخاب است»، lib/i18n.ts → faq.groups[0].items[1]). یک منبع
 * واحد چون هم UI (seat-selection.tsx) و هم API سرور (app/api/bookings/hold)
 * باید دقیقاً همین عدد را اعمال کنند.
 */
export const MAX_SEATS_PER_BOOKING = 6

export type Trip = {
  id: string
  fromEn: string
  toEn: string
  departMinutes: number // minutes from midnight
  durationMinutes: number
  price: number
  seatsLeft: number
  totalSeats: number
  busType: BusType
  amenities: AmenityKey[]
}

// Small deterministic hash so the same route always yields the same trips
// (no randomness that would differ between server and client renders).
export function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function cityLabel(en: string, lang: Lang): string {
  const c = cities.find((x) => x.en === en)
  return c ? c[lang] : en
}

/**
 * Single source of truth for coach capacity, per the master prompt's
 * instruction that bus capacity must be one adjustable value (not a magic
 * number scattered across the codebase) since the exact factory/company
 * figure is still pending confirmation. Standard 2+2, VIP 1+2 (fewer,
 * wider seats). Update these two numbers once the company confirms exact
 * per-bus capacity — every screen (search, seat map, admin) reads from here.
 */
export const DEFAULT_BUS_CAPACITY: Record<BusType, number> = {
  vip: 33,
  standard: 48,
}

/**
 * Formats a clock time in each language's 12-hour convention
 * (e.g. "6:00 AM" / "۶:۰۰ ب.ظ").
 */
export function formatTime(minutes: number, lang: Lang): string {
  const m = ((minutes % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mm = m % 60
  const period = h24 < 12 ? "am" : "pm"
  const h12raw = h24 % 12
  const h12 = h12raw === 0 ? 12 : h12raw
  const mins = String(mm).padStart(2, "0")

  if (lang === "en") {
    return `${h12}:${mins} ${period.toUpperCase()}`
  }

  const faDigits: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
  }
  const toFa = (s: string) => s.replace(/[0-9]/g, (d) => faDigits[d])
  const faPeriod = period === "am" ? "ق.ظ" : "ب.ظ"
  return `${toFa(String(h12))}:${toFa(mins)} ${faPeriod}`
}

const ALL_AMENITIES: AmenityKey[] = ["ac", "wifi", "charging", "refreshment", "reclining"]

const BASE_DEPARTURES = [360, 540, 690, 840, 990, 1140, 1320] // 06:00 .. 22:00

export function getTrips(fromEn: string, toEn: string): Trip[] {
  const seed = hash(fromEn + "→" + toEn)
  // Base duration derived from the route so it's stable.
  const baseDuration = 240 + (seed % 9) * 60 // 4h .. 12h

  const count = 5 + (seed % 3) // 5-7 trips
  const trips: Trip[] = []

  for (let i = 0; i < count; i++) {
    const s = hash(`${fromEn}-${toEn}-${i}`)
    const depart = BASE_DEPARTURES[i % BASE_DEPARTURES.length]
    const durationMinutes = baseDuration + (s % 3) * 30
    const isVip = i % 3 === 0
    const busType: BusType = isVip ? "vip" : "standard"
    const basePrice = 700 + (seed % 12) * 100
    const price = isVip ? Math.round((basePrice + 500) / 50) * 50 : Math.round(basePrice / 50) * 50
    const totalSeats = DEFAULT_BUS_CAPACITY[busType]
    const seatsLeft = s % 9 === 0 ? 0 : 2 + (s % (isVip ? 18 : 30))
    const amenities = isVip
      ? ALL_AMENITIES
      : (["ac", "charging", ...(s % 2 ? (["wifi"] as AmenityKey[]) : [])] as AmenityKey[])

    trips.push({
      id: `${fromEn}-${toEn}-${i}`,
      fromEn,
      toEn,
      departMinutes: depart,
      durationMinutes,
      price,
      seatsLeft,
      totalSeats,
      busType,
      amenities,
    })
  }
  return trips
}

export function getTripById(id: string): Trip | null {
  // id format: fromEn-toEn-index. City names contain no dashes except
  // "Mazar-i-Sharif", so parse from the known city list instead of splitting.
  const idx = Number(id.slice(id.lastIndexOf("-") + 1))
  const rest = id.slice(0, id.lastIndexOf("-"))
  for (const from of cities) {
    if (rest.startsWith(from.en + "-")) {
      const toEn = rest.slice(from.en.length + 1)
      if (cities.some((c) => c.en === toEn)) {
        const trips = getTrips(from.en, toEn)
        return trips[idx] ?? null
      }
    }
  }
  return null
}

export const SERVICE_FEE_PER_SEAT = 30

export function pricing(pricePerSeat: number, seatCount: number) {
  const subtotal = pricePerSeat * seatCount
  const serviceFee = seatCount * SERVICE_FEE_PER_SEAT
  return { subtotal, serviceFee, grandTotal: subtotal + serviceFee }
}

// Deterministic booking reference so the same trip + seat selection always
// resolves to the same code (no backend to persist a random one against).
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no ambiguous 0/O/1/I

export function bookingReference(tripId: string, seats: string[]): string {
  let seed = hash(`${tripId}|${[...seats].sort().join(",")}`)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += REF_CHARS[seed % REF_CHARS.length]
    seed = hash(`${seed}-${i}`)
  }
  return `SB-${code}`
}

export type SeatStatus = "available" | "booked"
export type Seat = {
  id: string // e.g. "12A"
  row: number
  col: string
  status: SeatStatus
}

export type CoachLayout = {
  rows: Seat[][] // each row: seats left group + aisle handled by cols
  leftCols: string[]
  rightCols: string[]
  totalRows: number
}

// Build a realistic multi-row coach layout with a center aisle.
// VIP = 1+2 (three seats per row), Standard = 2+2 (four seats per row).
export function buildCoach(tripId: string, busType: BusType): CoachLayout {
  const leftCols = busType === "vip" ? ["A"] : ["A", "B"]
  const rightCols = busType === "vip" ? ["B", "C"] : ["C", "D"]
  const perRow = leftCols.length + rightCols.length
  const totalSeats = DEFAULT_BUS_CAPACITY[busType]
  const totalRows = Math.ceil(totalSeats / perRow)
  const seed = hash(tripId)

  const rows: Seat[][] = []
  let seatCount = 0
  for (let r = 1; r <= totalRows; r++) {
    const rowSeats: Seat[] = []
    for (const col of [...leftCols, ...rightCols]) {
      seatCount++
      if (seatCount > totalSeats) break
      // Deterministic "booked" pattern, roughly 35% occupancy.
      const booked = hash(`${tripId}-${r}-${col}`) % 100 < 35 && seed % 7 !== 0
      rowSeats.push({
        id: `${r}${col}`,
        row: r,
        col,
        status: booked ? "booked" : "available",
      })
    }
    rows.push(rowSeats)
  }
  return { rows, leftCols, rightCols, totalRows }
}

export type PublicRoute = {
  fromEn: string
  toEn: string
  hours: number
  price: number
  dailyTrips: number
}

/**
 * Public "routes and prices" listing: one row per unique city pair
 * (regardless of direction) along the real corridor, using the same seed
 * formula as getTrips so the duration shown here lines up with what search
 * results later show for that same route. Price/dailyTrips are still demo
 * numbers — the routes-index page displays them behind an explicit
 * [PLACEHOLDER] notice (see routesPage.priceNote) rather than presenting
 * them as confirmed.
 */
export function getAllRoutes(): PublicRoute[] {
  const seen = new Set<string>()
  const list: PublicRoute[] = []
  for (const a of cities) {
    for (const b of cities) {
      if (a.en === b.en) continue
      const key = [a.en, b.en].sort().join("|")
      if (seen.has(key)) continue
      seen.add(key)
      const seed = hash(`${a.en}→${b.en}`)
      const hours = Math.round((240 + (seed % 9) * 60) / 60)
      const price = Math.round((700 + (seed % 12) * 100) / 50) * 50
      const dailyTrips = 5 + (seed % 3)
      list.push({ fromEn: a.en, toEn: b.en, hours, price, dailyTrips })
    }
  }
  return list.sort((x, y) => x.hours - y.hours)
}
