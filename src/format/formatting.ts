/**
 * Pure formatting functions — no DateFormat dependency.
 * Receives raw date components and locale data, returns strings.
 */

import { DEFAULT_MONTHS, DEFAULT_MONTHS_SHORT, DEFAULT_WEEKDAYS } from '../core/constants'
import { pad, ordinal, formatOffset, getOffsetMinutes } from '../core/helpers'
import type { LocaleData, LocaleRelativeTime, LocaleCalendar } from '../core/types'

// ─────────────────────────────────────────────────────────────────────────────
// Resolved locale shape (with defaults applied)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedLocale {
  months: string[]
  monthsShort: string[]
  weekdays: string[]
  weekdaysShort: string[]
  weekdaysMin: string[]
  relativeTime?: LocaleRelativeTime
  calendar?: LocaleCalendar
}

export function resolveLocale(data?: LocaleData): ResolvedLocale {
  const months = data?.months ?? DEFAULT_MONTHS
  const monthsShort = data?.monthsShort ?? DEFAULT_MONTHS_SHORT
  const weekdays = data?.weekdays ?? DEFAULT_WEEKDAYS
  return {
    months,
    monthsShort,
    weekdays,
    weekdaysShort: data?.weekdaysShort ?? weekdays.map((w) => w.slice(0, 3)),
    weekdaysMin: data?.weekdaysMin ?? weekdays.map((w) => w.slice(0, 2)),
    relativeTime: data?.relativeTime,
    calendar: data?.calendar,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Date components — everything format() needs, pre-extracted
// ─────────────────────────────────────────────────────────────────────────────

export interface DateComponents {
  year: number
  month: number      // 1-12
  date: number       // 1-31
  hour: number       // 0-23
  minute: number     // 0-59
  second: number     // 0-59
  day: number        // 0=Sun..6=Sat
  timestampMs: number
  dayOfYear: number
  isoWeek: number
  isoWeekYear: number
  nativeDate: Date   // for timezone offset
}

// ─────────────────────────────────────────────────────────────────────────────
// format() — pure function
// ─────────────────────────────────────────────────────────────────────────────

const ESC = '\u0001'

export function formatDate(fmt: string, c: DateComponents, locale: ResolvedLocale): string {
  // Extract escaped sequences
  const escapes: string[] = []
  const cleanFmt = fmt.replace(/\[([^\]]*)\]/g, (_, text) => {
    escapes.push(text)
    return `${ESC}${escapes.length - 1}${ESC}`
  })

  const Y = String(c.year)
  const offset = getOffsetMinutes(c.nativeDate)
  const Z = formatOffset(offset, ':')
  const ZZ = formatOffset(offset, '')

  const tokenMap: Record<string, string> = {
    YYYY: Y,
    YY: Y.slice(-2),
    Q: String(Math.ceil(c.month / 3)),
    gg: String(c.isoWeekYear),
    Mo: ordinal(c.month),
    MMMM: locale.months[c.month - 1] || String(c.month),
    MMM: locale.monthsShort[c.month - 1] || String(c.month),
    MM: pad(c.month),
    M: String(c.month),
    DDDD: pad(c.dayOfYear, 3),
    DDD: String(c.dayOfYear),
    Do: ordinal(c.date),
    DD: pad(c.date),
    D: String(c.date),
    WW: pad(c.isoWeek),
    W: String(c.isoWeek),
    ZZ,
    Z,
    dddd: locale.weekdays[c.day],
    ddd: locale.weekdaysShort[c.day],
    dd: locale.weekdaysMin[c.day],
    d: String(c.day),
    HH: pad(c.hour),
    H: String(c.hour),
    hh: pad(c.hour % 12 || 12),
    h: String(c.hour % 12 || 12),
    mm: pad(c.minute),
    m: String(c.minute),
    ss: pad(c.second),
    s: String(c.second),
    A: c.hour < 12 ? 'AM' : 'PM',
    a: c.hour < 12 ? 'am' : 'pm',
    X: String(Math.floor(c.timestampMs / 1000)),
    x: String(c.timestampMs),
  }

  // Token replacement (longest match first)
  const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length)
  let out = ''
  for (let i = 0; i < cleanFmt.length;) {
    if (cleanFmt[i] === ESC) {
      const end = cleanFmt.indexOf(ESC, i + 1)
      const idx = Number(cleanFmt.substring(i + 1, end))
      out += escapes[idx]
      i = end + 1
      continue
    }
    let matched = false
    for (const t of tokens) {
      if (cleanFmt.slice(i, i + t.length) === t) {
        out += tokenMap[t]
        i += t.length
        matched = true
        break
      }
    }
    if (!matched) out += cleanFmt[i++]
  }

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// formatIntl() — pure function
// ─────────────────────────────────────────────────────────────────────────────

export function formatIntl(
  nativeDate: Date,
  isUtc: boolean,
  localeName: string | undefined,
  opts: Intl.DateTimeFormatOptions
): string {
  const formatter = new Intl.DateTimeFormat(localeName, {
    ...opts,
    timeZone: isUtc ? 'UTC' : undefined,
  })

  if (opts.weekday === 'long' && opts.month === 'long' && opts.day === 'numeric') {
    const formatted = formatter.format(nativeDate)
    if (formatted.indexOf(',') === -1 && formatted.split(' ').length >= 3) {
      const parts = formatted.split(' ')
      return `${parts[0]}, ${parts.slice(1).join(' ')}`
    }
  }

  return formatter.format(nativeDate)
}
