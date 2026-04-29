// ─────────────────────────────────────────────────────────────────────────────
// Relative-time, calendar-label, precise-diff, age, countdown.
// All functions are pure — they take primitives and return primitives.
// ─────────────────────────────────────────────────────────────────────────────

import { pad, pluralize } from '../core/helpers'
import type {
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  LocaleRelativeTime,
  LocaleCalendar
} from '../core/types'

// ── Thresholds (milliseconds → unit). Mirrors Moment.js semantics. ─────────

const SEC = 1_000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

interface UnitThreshold {
  bound: number
  divisor: number
  singularKey: keyof LocaleRelativeTime
  pluralKey: keyof LocaleRelativeTime
}

const RELATIVE_THRESHOLDS: UnitThreshold[] = [
  { bound: 45 * SEC, divisor: SEC, singularKey: 's', pluralKey: 's' },
  { bound: MIN, divisor: SEC, singularKey: 'ss', pluralKey: 'ss' },
  { bound: 90 * MIN, divisor: MIN, singularKey: 'm', pluralKey: 'mm' },
  { bound: 22 * HOUR, divisor: HOUR, singularKey: 'h', pluralKey: 'hh' },
  { bound: 26 * DAY, divisor: DAY, singularKey: 'd', pluralKey: 'dd' },
  { bound: 11 * MONTH, divisor: MONTH, singularKey: 'M', pluralKey: 'MM' },
  { bound: Infinity, divisor: YEAR, singularKey: 'y', pluralKey: 'yy' }
]

export function relativeTime(
  diffMs: number,
  loc?: LocaleRelativeTime,
  withoutSuffix = false
): string {
  const isPast = diffMs < 0
  const abs = Math.abs(diffMs)

  let value = 0
  let key: keyof LocaleRelativeTime = 's'
  for (const th of RELATIVE_THRESHOLDS) {
    if (abs < th.bound) {
      value = Math.round(abs / th.divisor) || 1
      key = value === 1 ? th.singularKey : th.pluralKey
      break
    }
  }

  const fallback: LocaleRelativeTime = {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  }
  const L = loc ?? fallback
  const tmpl = (L[key] ?? fallback[key]) as string
  const label = tmpl.replace('%d', String(value))

  if (withoutSuffix) return label
  return (isPast ? L.past : L.future).replace('%s', label)
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar label — "Today at 3:00 PM" style.
// ─────────────────────────────────────────────────────────────────────────────

export function calendarLabel(
  diffDays: number,
  formattedTime: string,
  formattedDate: string,
  weekdayName: string,
  loc?: LocaleCalendar
): string {
  const sub = (tpl: string) =>
    tpl.replace('{time}', formattedTime).replace('{day}', weekdayName).replace('L', formattedDate)

  if (diffDays >= 0 && diffDays < 1) return sub(loc?.sameDay ?? '[Today at] {time}')
  if (diffDays >= 1 && diffDays < 2) return sub(loc?.nextDay ?? '[Tomorrow at] {time}')
  if (diffDays >= 2 && diffDays < 7) return sub(loc?.nextWeek ?? '{day} [at] {time}')
  if (diffDays < 0 && diffDays >= -1) return sub(loc?.lastDay ?? '[Yesterday at] {time}')
  if (diffDays < -1 && diffDays >= -7) return sub(loc?.lastWeek ?? '[Last] {day} [at] {time}')
  return sub(loc?.sameElse ?? formattedDate)
}

// ─────────────────────────────────────────────────────────────────────────────
// Precise diff — calendar-correct year/month/day/h/m/s/ms breakdown.
// ─────────────────────────────────────────────────────────────────────────────

interface DateParts {
  year: number
  month: number
  date: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

export function preciseDiff(aParts: DateParts, bParts: DateParts, dimPrev: number): PreciseDiffResult {
  // Always compute |b - a| treating the larger as upper. Caller orders args.
  let years = bParts.year - aParts.year
  let months = bParts.month - aParts.month
  let days = bParts.date - aParts.date
  let hours = bParts.hour - aParts.hour
  let minutes = bParts.minute - aParts.minute
  let seconds = bParts.second - aParts.second
  let milliseconds = bParts.millisecond - aParts.millisecond

  if (milliseconds < 0) {
    milliseconds += 1000
    seconds--
  }
  if (seconds < 0) {
    seconds += 60
    minutes--
  }
  if (minutes < 0) {
    minutes += 60
    hours--
  }
  if (hours < 0) {
    hours += 24
    days--
  }
  if (days < 0) {
    days += dimPrev
    months--
  }
  if (months < 0) {
    months += 12
    years--
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    humanize(maxParts = 3): string {
      const parts: string[] = []
      if (years > 0) parts.push(pluralize(years, 'year'))
      if (months > 0) parts.push(pluralize(months, 'month'))
      if (days > 0) parts.push(pluralize(days, 'day'))
      if (hours > 0) parts.push(pluralize(hours, 'hour'))
      if (minutes > 0) parts.push(pluralize(minutes, 'minute'))
      if (seconds > 0) parts.push(pluralize(seconds, 'second'))
      return parts.slice(0, maxParts).join(', ') || 'just now'
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Age (calendar) — wrapper over preciseDiff.
// ─────────────────────────────────────────────────────────────────────────────

export function age(diff: PreciseDiffResult): AgeResult {
  return {
    years: diff.years,
    months: diff.months,
    days: diff.days,
    toString(): string {
      const parts: string[] = []
      if (this.years > 0) parts.push(`${this.years}y`)
      if (this.months > 0) parts.push(`${this.months}mo`)
      if (this.days > 0) parts.push(`${this.days}d`)
      return parts.join(' ') || '0d'
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown — time remaining to a target instant.
// ─────────────────────────────────────────────────────────────────────────────

export function countdown(targetMs: number, nowMs: number): CountdownResult {
  const total = targetMs - nowMs
  const isPast = total < 0
  const abs = Math.abs(total)

  const days = Math.floor(abs / DAY)
  const hours = Math.floor((abs % DAY) / HOUR)
  const minutes = Math.floor((abs % HOUR) / MIN)
  const seconds = Math.floor((abs % MIN) / SEC)
  const milliseconds = Math.floor(abs % SEC)

  return {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    total,
    isPast,
    format(tpl: string): string {
      return tpl
        .replace(/DD/g, pad(days))
        .replace(/D/g, String(days))
        .replace(/HH/g, pad(hours))
        .replace(/H/g, String(hours))
        .replace(/mm/g, pad(minutes))
        .replace(/m/g, String(minutes))
        .replace(/ss/g, pad(seconds))
        .replace(/s/g, String(seconds))
        .replace(/SSS/g, pad(milliseconds, 3))
    },
    humanize(): string {
      if (isPast) return 'already passed'
      const parts: string[] = []
      if (days > 0) parts.push(pluralize(days, 'day'))
      if (hours > 0) parts.push(pluralize(hours, 'hour'))
      if (minutes > 0) parts.push(pluralize(minutes, 'minute'))
      if (seconds > 0) parts.push(pluralize(seconds, 'second'))
      return parts.slice(0, 2).join(', ') || 'now'
    }
  }
}
