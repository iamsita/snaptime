import DateFormat from './DateFormat'
import type { HolidayCountry } from './type'

/**
 * Check if a date falls on a business day (Mon-Fri, not a holiday).
 */
export function isBusinessDay(date: DateFormat, holidays?: string[]): boolean {
  const day = date.get('day')
  if (day === 0 || day === 6) return false
  if (holidays && holidays.includes(date.format('YYYY-MM-DD'))) return false
  return true
}

/**
 * Add n business days to a date, skipping weekends and holidays.
 * Supports negative n to go backwards.
 */
export function addBusinessDays(date: DateFormat, n: number, holidays?: string[]): DateFormat {
  if (n === 0) return date

  const direction = n > 0 ? 1 : -1
  let remaining = Math.abs(n)
  let current = date

  while (remaining > 0) {
    current = current.add(direction, 'day')
    if (isBusinessDay(current, holidays)) {
      remaining--
    }
  }

  return current
}

/**
 * Subtract n business days from a date.
 */
export function subtractBusinessDays(date: DateFormat, n: number, holidays?: string[]): DateFormat {
  return addBusinessDays(date, -n, holidays)
}

/**
 * Get the next business day after the given date.
 */
export function nextBusinessDay(date: DateFormat, holidays?: string[]): DateFormat {
  return addBusinessDays(date, 1, holidays)
}

/**
 * Get the previous business day before the given date.
 */
export function prevBusinessDay(date: DateFormat, holidays?: string[]): DateFormat {
  return addBusinessDays(date, -1, holidays)
}

/**
 * Count business days between two dates (exclusive of both endpoints).
 * Returns a positive count if end > start, negative if end < start.
 */
export function businessDaysBetween(
  start: DateFormat,
  end: DateFormat,
  holidays?: string[]
): number {
  const startMs = start.valueOf()
  const endMs = end.valueOf()

  if (startMs === endMs) return 0

  const direction = endMs > startMs ? 1 : -1
  let count = 0
  let current = start

  while (true) {
    current = current.add(direction, 'day')
    if (
      (direction === 1 && current.valueOf() >= endMs) ||
      (direction === -1 && current.valueOf() <= endMs)
    ) {
      break
    }
    if (isBusinessDay(current, holidays)) {
      count++
    }
  }

  return count * direction
}

// ---------------------------------------------------------------------------
// Holiday helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD. */
function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Compute the date of Easter Sunday for a given year using the
 * Anonymous Gregorian algorithm.
 */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

/** Nth occurrence of a weekday in a given month (1-indexed). weekday: 0=Sun..6=Sat */
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(year, month - 1, 1).getDay()
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7
  return day
}

/** Last occurrence of a weekday in a given month. */
function lastWeekday(year: number, month: number, weekday: number): number {
  const last = new Date(year, month, 0) // last day of month
  const lastDay = last.getDay()
  let diff = lastDay - weekday
  if (diff < 0) diff += 7
  return last.getDate() - diff
}

/**
 * Return an array of ISO date strings for common public holidays of a country.
 * Supported countries: "US", "UK", "IN", "DE", "FR", "CA", "AU".
 */
export function getHolidays(country: HolidayCountry | string, year: number): string[] {
  const y = year
  const easter = easterSunday(y)
  const easterDate = new Date(y, easter.month - 1, easter.day)
  const easterMs = easterDate.getTime()

  const easterOffset = (days: number): string => {
    const d = new Date(easterMs + days * 864e5)
    return iso(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  const goodFriday = easterOffset(-2)
  const easterMonday = easterOffset(1)
  const easterSun = iso(y, easter.month, easter.day)

  switch (country.toUpperCase()) {
    case 'US':
      return [
        iso(y, 1, 1), // New Year's Day
        iso(y, 1, nthWeekday(y, 1, 1, 3)), // MLK Day (3rd Mon Jan)
        iso(y, 2, nthWeekday(y, 2, 1, 3)), // Presidents' Day (3rd Mon Feb)
        iso(y, 5, lastWeekday(y, 5, 1)), // Memorial Day (last Mon May)
        iso(y, 6, 19), // Juneteenth
        iso(y, 7, 4), // Independence Day
        iso(y, 9, nthWeekday(y, 9, 1, 1)), // Labor Day (1st Mon Sep)
        iso(y, 10, nthWeekday(y, 10, 1, 2)), // Columbus Day (2nd Mon Oct)
        iso(y, 11, 11), // Veterans Day
        iso(y, 11, nthWeekday(y, 11, 4, 4)), // Thanksgiving (4th Thu Nov)
        iso(y, 12, 25) // Christmas
      ]

    case 'UK':
      return [
        iso(y, 1, 1), // New Year's Day
        goodFriday, // Good Friday
        easterMonday, // Easter Monday
        iso(y, 5, nthWeekday(y, 5, 1, 1)), // Early May Bank Holiday
        iso(y, 5, lastWeekday(y, 5, 1)), // Spring Bank Holiday
        iso(y, 8, lastWeekday(y, 8, 1)), // Summer Bank Holiday
        iso(y, 12, 25), // Christmas
        iso(y, 12, 26) // Boxing Day
      ]

    case 'IN':
      return [
        iso(y, 1, 1), // New Year's Day
        iso(y, 1, 26), // Republic Day
        iso(y, 3, 29), // Holi (approx)
        goodFriday, // Good Friday
        iso(y, 5, 1), // May Day
        iso(y, 8, 15), // Independence Day
        iso(y, 10, 2), // Gandhi Jayanti
        iso(y, 10, 24), // Dussehra (approx)
        iso(y, 11, 1), // Diwali (approx)
        iso(y, 11, 14), // Children's Day
        iso(y, 12, 25) // Christmas
      ]

    case 'DE':
      return [
        iso(y, 1, 1), // Neujahr
        iso(y, 1, 6), // Heilige Drei Konige
        goodFriday, // Karfreitag
        easterSun, // Ostersonntag
        easterMonday, // Ostermontag
        iso(y, 5, 1), // Tag der Arbeit
        easterOffset(39), // Christi Himmelfahrt
        easterOffset(49), // Pfingstsonntag
        easterOffset(50), // Pfingstmontag
        easterOffset(60), // Fronleichnam
        iso(y, 10, 3), // Tag der Deutschen Einheit
        iso(y, 11, 1), // Allerheiligen
        iso(y, 12, 25), // 1. Weihnachtstag
        iso(y, 12, 26) // 2. Weihnachtstag
      ]

    case 'FR':
      return [
        iso(y, 1, 1), // Jour de l'an
        easterMonday, // Lundi de Paques
        iso(y, 5, 1), // Fete du Travail
        iso(y, 5, 8), // Victoire 1945
        easterOffset(39), // Ascension
        easterOffset(50), // Lundi de Pentecote
        iso(y, 7, 14), // Fete nationale
        iso(y, 8, 15), // Assomption
        iso(y, 11, 1), // Toussaint
        iso(y, 11, 11), // Armistice
        iso(y, 12, 25) // Noel
      ]

    case 'CA':
      return [
        iso(y, 1, 1), // New Year's Day
        iso(y, 2, nthWeekday(y, 2, 1, 3)), // Family Day (3rd Mon Feb)
        goodFriday, // Good Friday
        iso(y, 5, lastWeekday(y, 5, 1)), // Victoria Day (Mon before May 25)
        iso(y, 7, 1), // Canada Day
        iso(y, 9, nthWeekday(y, 9, 1, 1)), // Labour Day (1st Mon Sep)
        iso(y, 9, 30), // National Day for Truth & Reconciliation
        iso(y, 10, nthWeekday(y, 10, 1, 2)), // Thanksgiving (2nd Mon Oct)
        iso(y, 11, 11), // Remembrance Day
        iso(y, 12, 25), // Christmas
        iso(y, 12, 26) // Boxing Day
      ]

    case 'AU':
      return [
        iso(y, 1, 1), // New Year's Day
        iso(y, 1, 26), // Australia Day
        goodFriday, // Good Friday
        easterOffset(-1), // Easter Saturday
        easterSun, // Easter Sunday
        easterMonday, // Easter Monday
        iso(y, 4, 25), // ANZAC Day
        iso(y, 6, nthWeekday(y, 6, 1, 2)), // Queen's Birthday (2nd Mon Jun)
        iso(y, 12, 25), // Christmas
        iso(y, 12, 26) // Boxing Day
      ]

    default:
      return []
  }
}
