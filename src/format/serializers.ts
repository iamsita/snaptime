// ─────────────────────────────────────────────────────────────────────────────
// Pure serializers for common date interchange formats.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_WEEKDAYS_SHORT, DEFAULT_MONTHS_SHORT, EXCEL_EPOCH_MS } from '../core/constants'
import { pad, formatOffset, getOffsetMinutes } from '../core/helpers'

/** RFC 2822, e.g. `Tue, 17 Mar 2026 09:00:00 +0530`. */
export function toRFC2822(d: Date): string {
  return (
    `${DEFAULT_WEEKDAYS_SHORT[d.getDay()]}, ` +
    `${pad(d.getDate())} ${DEFAULT_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    formatOffset(getOffsetMinutes(d), '')
  )
}

/** RFC 3339, e.g. `2026-03-17T09:00:00+05:30` or `…Z`. */
export function toRFC3339(d: Date): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const off = getOffsetMinutes(d)
  return off === 0 ? `${date}T${time}Z` : `${date}T${time}${formatOffset(off, ':')}`
}

/** ISO 8601 — wrapper for symmetry with the others. */
export function toISO(ms: number): string {
  return new Date(ms).toISOString()
}

/** Excel serial date — fractional days since 1899-12-30. */
export function toExcel(ms: number): number {
  return (ms - EXCEL_EPOCH_MS) / 86_400_000
}

/** From an Excel serial back to milliseconds. */
export function fromExcel(serial: number): number {
  return serial * 86_400_000 + EXCEL_EPOCH_MS
}

/** SQL DATETIME — `YYYY-MM-DD HH:MM:SS`. */
export function toSQL(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

/** SQL DATE — `YYYY-MM-DD`. */
export function toSQLDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** SQL TIME — `HH:MM:SS`. */
export function toSQLTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
