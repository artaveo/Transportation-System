import { cities } from "@/lib/i18n"
import { bookingReference, hash, DEFAULT_BUS_CAPACITY } from "@/lib/booking-data"

export type BookingStatus = "confirmed" | "pending" | "cancelled"

export type AdminBooking = {
  ref: string
  passenger: string
  fromEn: string
  toEn: string
  dayOffset: number // days ago
  seats: number
  amount: number
  status: BookingStatus
}

export type AdminTrip = {
  id: string
  fromEn: string
  toEn: string
  departMinutes: number
  bus: string
  occupancy: number // 0-100
  totalSeats: number
}

export type AdminBus = {
  code: string
  plate: string
  type: "vip" | "standard"
  totalSeats: number
  status: "active" | "maintenance"
}

export type AdminRoute = {
  fromEn: string
  toEn: string
  hours: number
  price: number
  dailyTrips: number
}

const FIRST_NAMES = [
  "احمد", "فاطمه", "زینب", "امید", "فرشته", "رویا", "حمید", "لطیفه",
  "نوید", "ثریا", "فرید", "کبری", "مصطفی", "نرگس", "بشیر", "شکریه",
  "جاوید", "پروین", "سمیع", "آسیه",
]
const LAST_NAMES = [
  "احمدی", "کریمی", "رحیمی", "امینی", "یوسفی", "سلطانی", "نوری", "عظیمی",
  "حیدری", "قاسمی",
]

function nameFor(seed: number): string {
  const first = FIRST_NAMES[seed % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(seed / FIRST_NAMES.length) % LAST_NAMES.length]
  return `${first} ${last}`
}

// Real corridor is a single line (Kabul..Herat); any two stops on that line
// are a valid bookable pair, so all-pairs among the confirmed cities is
// correct here (see lib/i18n.ts `cities` for the confirmed real corridor).
function routePairs(): [string, string][] {
  const pairs: [string, string][] = []
  for (const a of cities) {
    for (const b of cities) {
      if (a.en !== b.en) pairs.push([a.en, b.en])
    }
  }
  return pairs
}

const STATUSES: BookingStatus[] = ["confirmed", "confirmed", "confirmed", "pending", "cancelled"]
const BASE_DEPARTURES = [360, 540, 690, 840, 990, 1140, 1320]

export function getAdminBookings(count = 40): AdminBooking[] {
  const pairs = routePairs()
  const bookings: AdminBooking[] = []
  for (let i = 0; i < count; i++) {
    const seed = hash(`booking-${i}`)
    const [fromEn, toEn] = pairs[seed % pairs.length]
    const seats = 1 + (seed % 4)
    const pricePerSeat = 700 + (seed % 12) * 100
    const status = STATUSES[seed % STATUSES.length]
    const ref = bookingReference(`${fromEn}-${toEn}-${i}`, [`seat-${seed % 40}`])
    bookings.push({
      ref,
      passenger: nameFor(seed),
      fromEn,
      toEn,
      dayOffset: seed % 6,
      seats,
      amount: seats * pricePerSeat,
      status,
    })
  }
  return bookings.sort((a, b) => a.dayOffset - b.dayOffset)
}

export function getAdminTrips(count = 12): AdminTrip[] {
  const pairs = routePairs()
  const trips: AdminTrip[] = []
  for (let i = 0; i < count; i++) {
    const seed = hash(`admin-trip-${i}`)
    const [fromEn, toEn] = pairs[seed % pairs.length]
    const isVip = seed % 3 === 0
    const totalSeats = isVip ? DEFAULT_BUS_CAPACITY.vip : DEFAULT_BUS_CAPACITY.standard
    trips.push({
      id: `${fromEn}-${toEn}-${i}`,
      fromEn,
      toEn,
      departMinutes: BASE_DEPARTURES[seed % BASE_DEPARTURES.length],
      bus: `${isVip ? "VIP" : "STD"}-${100 + (seed % 40)}`,
      occupancy: 20 + (seed % 76),
      totalSeats,
    })
  }
  return trips.sort((a, b) => a.departMinutes - b.departMinutes)
}

export function getAdminBuses(count = 14): AdminBus[] {
  const buses: AdminBus[] = []
  for (let i = 0; i < count; i++) {
    const seed = hash(`admin-bus-${i}`)
    const isVip = seed % 3 === 0
    buses.push({
      code: `${isVip ? "VIP" : "STD"}-${100 + (seed % 40)}`,
      plate: `${1200 + (seed % 800)} د ${20 + (seed % 60)}`,
      type: isVip ? "vip" : "standard",
      totalSeats: isVip ? DEFAULT_BUS_CAPACITY.vip : DEFAULT_BUS_CAPACITY.standard,
      status: seed % 11 === 0 ? "maintenance" : "active",
    })
  }
  return buses
}

export function getAdminRoutes(): AdminRoute[] {
  const pairs = routePairs()
  return pairs.slice(0, 14).map(([fromEn, toEn], i) => {
    const seed = hash(`admin-route-${fromEn}-${toEn}`)
    return {
      fromEn,
      toEn,
      hours: 4 + (seed % 10),
      price: 700 + (seed % 12) * 100,
      dailyTrips: 3 + (seed % 8),
    }
  })
}

export function getAdminStats() {
  const bookings = getAdminBookings()
  const today = bookings.filter((b) => b.dayOffset === 0 && b.status !== "cancelled")
  const revenueToday = today.reduce((sum, b) => sum + b.amount, 0)
  const trips = getAdminTrips()
  const avgOccupancy = Math.round(trips.reduce((s, t) => s + t.occupancy, 0) / trips.length)
  return {
    bookingsToday: today.length,
    bookingsDelta: 8,
    revenueToday,
    revenueDelta: 5,
    avgOccupancy,
    occupancyDelta: -3,
    activeTrips: trips.length,
    tripsDelta: 2,
  }
}
