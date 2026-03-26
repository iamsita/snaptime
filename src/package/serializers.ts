/**
 * Pure serialization functions — no DateFormat dependency.
 * Receives native Date, returns formatted strings.
 */

import { DEFAULT_WEEKDAYS, DEFAULT_MONTHS_SHORT } from './constants'
import { pad, formatOffset, getOffsetMinutes } from './helpers'

const WEEKDAYS_SHORT = DEFAULT_WEEKDAYS.map((w) => w.slice(0, 3))

/**
 * RFC 2822: "Tue, 17 Mar 2026 09:00:00 +0530"
 */
export function toRFC2822(d: Date): string {
  const offset = getOffsetMinutes(d)
  return (
    `${WEEKDAYS_SHORT[d.getDay()]}, ` +
    `${pad(d.getDate())} ` +
    `${DEFAULT_MONTHS_SHORT[d.getMonth()]} ` +
    `${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    formatOffset(offset, '')
  )
}

/**
 * RFC 3339: "2026-03-17T09:00:00+05:30" or "...Z"
 */
export function toRFC3339(d: Date): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const offset = getOffsetMinutes(d)
  if (offset === 0) return `${date}T${time}Z`
  return `${date}T${time}${formatOffset(offset, ':')}`
}

/**
 * Excel serial date number.
 * Days since Dec 30, 1899 (accounts for Excel's 1900 leap year bug).
 */
export function toExcel(ms: number): number {
  const EXCEL_EPOCH = new Date(1899, 11, 30).getTime()
  return (ms - EXCEL_EPOCH) / 864e5
}
