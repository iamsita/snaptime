// ─────────────────────────────────────────────────────────────────────────────
// Pure utility helpers used across the library. Nothing in this file should
// import from non-leaf modules to avoid cycles.
// ─────────────────────────────────────────────────────────────────────────────

/** Zero-pad a number to `len` digits. */
export function pad(n: number, len = 2): string {
  return String(Math.abs(n)).padStart(len, '0')
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

/** Pluralize an English unit label. */
export function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** Format an offset in minutes as "+HH:MM" / "-HH:MM" (or no separator). */
export function formatOffset(offsetMinutes: number, separator = ':'): string {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hh = pad(Math.floor(abs / 60))
  const mm = pad(abs % 60)
  return `${sign}${hh}${separator}${mm}`
}

/** UTC offset of a JS Date in minutes (positive = ahead of UTC). */
export function getOffsetMinutes(d: Date): number {
  return -d.getTimezoneOffset()
}

/** Clamp a number to an inclusive range. */
export function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}

/** Days in month for any year (1-indexed month). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** True if year is leap. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Field accessors — keyed by UTC vs local mode. Used by DateTime.get/set.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldGetter = (d: Date) => number
export type FieldSetter = (d: Date, v: number) => void

export const LOCAL_GETTERS: Record<string, FieldGetter> = {
  year: (d) => d.getFullYear(),
  month: (d) => d.getMonth() + 1,
  date: (d) => d.getDate(),
  day: (d) => d.getDay(),
  hour: (d) => d.getHours(),
  minute: (d) => d.getMinutes(),
  second: (d) => d.getSeconds(),
  millisecond: (d) => d.getMilliseconds()
}

export const UTC_GETTERS: Record<string, FieldGetter> = {
  year: (d) => d.getUTCFullYear(),
  month: (d) => d.getUTCMonth() + 1,
  date: (d) => d.getUTCDate(),
  day: (d) => d.getUTCDay(),
  hour: (d) => d.getUTCHours(),
  minute: (d) => d.getUTCMinutes(),
  second: (d) => d.getUTCSeconds(),
  millisecond: (d) => d.getUTCMilliseconds()
}

export const LOCAL_SETTERS: Record<string, FieldSetter> = {
  year: (d, v) => d.setFullYear(v),
  month: (d, v) => d.setMonth(v - 1),
  date: (d, v) => d.setDate(v),
  hour: (d, v) => d.setHours(v),
  minute: (d, v) => d.setMinutes(v),
  second: (d, v) => d.setSeconds(v),
  millisecond: (d, v) => d.setMilliseconds(v)
}

export const UTC_SETTERS: Record<string, FieldSetter> = {
  year: (d, v) => d.setUTCFullYear(v),
  month: (d, v) => d.setUTCMonth(v - 1),
  date: (d, v) => d.setUTCDate(v),
  hour: (d, v) => d.setUTCHours(v),
  minute: (d, v) => d.setUTCMinutes(v),
  second: (d, v) => d.setUTCSeconds(v),
  millisecond: (d, v) => d.setUTCMilliseconds(v)
}
