import DateTime from '../core/DateTime'
import type { HolidayCountry } from '../core/types'
import { Holidays } from './holidays/index'

/** True when `date` is a weekday and not in `holidays` (YYYY-MM-DD strings). */
export function isBusinessDay(date: DateTime, holidays?: string[]): boolean {
  const day = date.get('day')
  if (day === 0 || day === 6) return false
  if (holidays && holidays.includes(date.format('YYYY-MM-DD'))) return false
  return true
}

/** Add `n` business days. Negative `n` goes backwards. */
export function addBusinessDays(date: DateTime, n: number, holidays?: string[]): DateTime {
  if (n === 0) return date
  const dir = n > 0 ? 1 : -1
  let remaining = Math.abs(n)
  let cursor = date
  while (remaining > 0) {
    cursor = cursor.add(dir, 'day')
    if (isBusinessDay(cursor, holidays)) remaining--
  }
  return cursor
}

export function subtractBusinessDays(date: DateTime, n: number, holidays?: string[]): DateTime {
  return addBusinessDays(date, -n, holidays)
}

export function nextBusinessDay(date: DateTime, holidays?: string[]): DateTime {
  return addBusinessDays(date, 1, holidays)
}

export function prevBusinessDay(date: DateTime, holidays?: string[]): DateTime {
  return addBusinessDays(date, -1, holidays)
}

/**
 * Count business days strictly between `start` and `end` (exclusive).
 * Returns negative when `end` is before `start`.
 */
export function businessDaysBetween(start: DateTime, end: DateTime, holidays?: string[]): number {
  const s = start.valueOf()
  const e = end.valueOf()
  if (s === e) return 0
  const dir = e > s ? 1 : -1
  let count = 0
  let cursor = start

  while (true) {
    cursor = cursor.add(dir, 'day')
    if ((dir === 1 && cursor.valueOf() >= e) || (dir === -1 && cursor.valueOf() <= e)) break
    if (isBusinessDay(cursor, holidays)) count++
  }
  return count * dir
}

/** Built-in country calendars — delegates to the holidays registry. */
export function getHolidays(country: HolidayCountry | string, year: number): string[] {
  return Holidays.for(country, year)
}
