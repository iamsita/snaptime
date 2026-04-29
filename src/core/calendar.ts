// ─────────────────────────────────────────────────────────────────────────────
// Calendar arithmetic — pure functions over JS Date.
// Used by DateTime to compute dayOfYear, ISO week, quarter, etc. without
// circular imports back into the class.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1-indexed day of year (Jan 1 = 1).
 */
export function dayOfYear(d: Date, isUtc: boolean): number {
  if (isUtc) {
    const start = Date.UTC(d.getUTCFullYear(), 0, 1)
    return Math.floor((d.getTime() - start) / 86_400_000) + 1
  }
  const start = new Date(d.getFullYear(), 0, 1).getTime()
  // Account for DST transitions across the year start
  const diff = d.getTime() - start
  return Math.floor(diff / 86_400_000) + 1
}

/**
 * ISO 8601 week number (1-53). Week 1 contains the first Thursday of the year.
 */
export function isoWeek(d: Date, isUtc: boolean): number {
  const target = new Date(isUtc ? d.getTime() : d.getTime())
  if (isUtc) {
    target.setUTCHours(0, 0, 0, 0)
    // Move to Thursday of this ISO week (Mon=1..Sun=7 with Sun mapped to 7)
    const dayNum = target.getUTCDay() || 7
    target.setUTCDate(target.getUTCDate() + 4 - dayNum)
    const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1)
    return Math.ceil(((target.getTime() - yearStart) / 86_400_000 + 1) / 7)
  }
  target.setHours(0, 0, 0, 0)
  const dayNum = target.getDay() || 7
  target.setDate(target.getDate() + 4 - dayNum)
  const yearStart = new Date(target.getFullYear(), 0, 1).getTime()
  return Math.ceil(((target.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

/**
 * The "ISO week year" — sometimes differs from the calendar year for dates near
 * the year boundary (e.g. Jan 1 may belong to ISO week 52 of the prior year).
 */
export function isoWeekYear(d: Date, isUtc: boolean): number {
  const target = new Date(d.getTime())
  if (isUtc) {
    target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
    return target.getUTCFullYear()
  }
  target.setDate(target.getDate() + 4 - (target.getDay() || 7))
  return target.getFullYear()
}

/** Total ISO weeks in a year — 52 or 53. */
export function weeksInIsoYear(year: number): number {
  // Year has 53 weeks if Jan 1 is Thursday, or Dec 31 is Thursday (leap years)
  const lastDayOfYear = new Date(year, 11, 31)
  const isoWeekOfDec31 = isoWeek(lastDayOfYear, false)
  return isoWeekOfDec31 === 1 ? 52 : isoWeekOfDec31
}

/** 1-4. */
export function quarterOf(month1to12: number): number {
  return Math.ceil(month1to12 / 3)
}

/** Weekday index (0=Sunday..6=Saturday). */
export function weekday(d: Date, isUtc: boolean): number {
  return isUtc ? d.getUTCDay() : d.getDay()
}

/** Locale-aware weekday: 0..6 starting from `weekStart`. */
export function localeWeekday(d: Date, isUtc: boolean, weekStart: 'sunday' | 'monday' | 'saturday'): number {
  const dow = weekday(d, isUtc)
  const offset = weekStart === 'sunday' ? 0 : weekStart === 'monday' ? 1 : 6
  return (dow - offset + 7) % 7
}

/** True if a year is a leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Days in a year — 365 or 366. */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}
