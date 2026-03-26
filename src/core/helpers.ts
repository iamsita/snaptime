import type { Unit } from './types'
import { UNIT_ALIASES } from './constants'

/**
 * Resolve a unit string (including aliases and plurals) to a canonical Unit.
 * Returns 'unknown' for unrecognized inputs.
 */
export function resolveUnit(input: string): Unit {
  const canonical = UNIT_ALIASES[input]
  if (canonical) return canonical
  // Already a canonical unit?
  const known: Unit[] = [
    'millisecond', 'second', 'minute', 'hour',
    'day', 'date', 'month', 'year', 'week', 'fortnight', 'unknown',
  ]
  if (known.includes(input as Unit)) return input as Unit
  return 'unknown'
}

/** Zero-pad a number to `len` digits. */
export function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/** English ordinal suffix: 1st, 2nd, 3rd, 4th, … */
export function ordinal(n: number): string {
  const k = n % 100
  const j = n % 10
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
}

/** Pluralize a unit label: pluralize(1, 'day') → '1 day', pluralize(3, 'day') → '3 days'. */
export function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * Format a UTC offset in minutes as "+HH:MM" or "-HH:MM".
 */
export function formatOffset(offsetMinutes: number, separator = ':'): string {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hh = pad(Math.floor(abs / 60))
  const mm = pad(abs % 60)
  return `${sign}${hh}${separator}${mm}`
}

/**
 * Get the UTC offset in minutes for a native Date (positive = ahead of UTC).
 */
export function getOffsetMinutes(d: Date): number {
  return -d.getTimezoneOffset()
}

/**
 * Getter maps for reading date components, keyed by UTC vs local mode.
 */
export const LOCAL_GETTERS: Record<string, (d: Date) => number> = {
  year: (d) => d.getFullYear(),
  month: (d) => d.getMonth() + 1,
  date: (d) => d.getDate(),
  day: (d) => d.getDay(),
  hour: (d) => d.getHours(),
  minute: (d) => d.getMinutes(),
  second: (d) => d.getSeconds(),
  millisecond: (d) => d.getMilliseconds(),
}

export const UTC_GETTERS: Record<string, (d: Date) => number> = {
  year: (d) => d.getUTCFullYear(),
  month: (d) => d.getUTCMonth() + 1,
  date: (d) => d.getUTCDate(),
  day: (d) => d.getUTCDay(),
  hour: (d) => d.getUTCHours(),
  minute: (d) => d.getUTCMinutes(),
  second: (d) => d.getUTCSeconds(),
  millisecond: (d) => d.getUTCMilliseconds(),
}

export const LOCAL_SETTERS: Record<string, (d: Date, v: number) => void> = {
  year: (d, v) => { d.setFullYear(v) },
  month: (d, v) => { d.setMonth(v - 1) },
  date: (d, v) => { d.setDate(v) },
  hour: (d, v) => { d.setHours(v) },
  minute: (d, v) => { d.setMinutes(v) },
  second: (d, v) => { d.setSeconds(v) },
  millisecond: (d, v) => { d.setMilliseconds(v) },
}

export const UTC_SETTERS: Record<string, (d: Date, v: number) => void> = {
  year: (d, v) => { d.setUTCFullYear(v) },
  month: (d, v) => { d.setUTCMonth(v - 1) },
  date: (d, v) => { d.setUTCDate(v) },
  hour: (d, v) => { d.setUTCHours(v) },
  minute: (d, v) => { d.setUTCMinutes(v) },
  second: (d, v) => { d.setUTCSeconds(v) },
  millisecond: (d, v) => { d.setUTCMilliseconds(v) },
}
