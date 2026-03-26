/**
 * Pure relative-time functions — no DateFormat dependency.
 * Receives timestamps and date components, returns results.
 */

import { pad, pluralize } from './helpers'
import type { PreciseDiffResult, AgeResult, CountdownResult, LocaleRelativeTime, LocaleCalendar } from './type'

// ─────────────────────────────────────────────────────────────────────────────
// fromNow — relative time string
// ─────────────────────────────────────────────────────────────────────────────

export function relativeTime(
  diffMs: number,
  relativeTimeLocale?: LocaleRelativeTime,
): string {
  const isNeg = diffMs < 0
  const absMs = Math.abs(diffMs)

  let value: number
  let unit: string

  if (absMs < 1000) {
    value = Math.round(absMs)
    unit = value === 1 ? 'millisecond' : 'milliseconds'
  } else if (absMs < 60_000) {
    value = Math.round(absMs / 1000)
    unit = value === 1 ? 'second' : 'seconds'
  } else if (absMs < 3_600_000) {
    value = Math.round(absMs / 60_000)
    unit = value === 1 ? 'minute' : 'minutes'
  } else if (absMs < 86_400_000) {
    value = Math.round(absMs / 3_600_000)
    unit = value === 1 ? 'hour' : 'hours'
  } else if (absMs < 2_592_000_000) {
    value = Math.round(absMs / 86_400_000)
    unit = value === 1 ? 'day' : 'days'
  } else if (absMs < 31_536_000_000) {
    value = Math.round(absMs / 2_592_000_000)
    unit = value === 1 ? 'month' : 'months'
  } else {
    value = Math.round(absMs / 31_536_000_000)
    unit = value === 1 ? 'year' : 'years'
  }

  // Use locale relativeTime if available
  if (relativeTimeLocale) {
    const keyMap: Record<string, string> = {
      millisecond: 's', milliseconds: 's',
      second: 's', seconds: 'ss',
      minute: 'm', minutes: 'mm',
      hour: 'h', hours: 'hh',
      day: 'd', days: 'dd',
      month: 'M', months: 'MM',
      year: 'y', years: 'yy',
    }
    const tmpl = relativeTimeLocale[keyMap[unit] as keyof LocaleRelativeTime]
    const label = tmpl.replace('%d', String(value))
    return isNeg
      ? relativeTimeLocale.past.replace('%s', label)
      : relativeTimeLocale.future.replace('%s', label)
  }

  // Default English
  const label = `${value} ${unit}`
  return isNeg ? `${label} ago` : `in ${label}`
}

// ─────────────────────────────────────────────────────────────────────────────
// calendar — "Today at 3:00 PM" style
// ─────────────────────────────────────────────────────────────────────────────

export function calendarLabel(
  thisMs: number,
  todayStartMs: number,
  formattedTime: string,
  formattedDate: string,
  calendarLocale?: LocaleCalendar,
): string {
  const diff = thisMs - todayStartMs
  const D = 864e5

  if (diff >= 0 && diff < D) return calendarLocale?.sameDay?.replace('{time}', formattedTime) ?? `Today at ${formattedTime}`
  if (diff < 0 && diff > -D) return calendarLocale?.lastDay?.replace('{time}', formattedTime) ?? `Yesterday at ${formattedTime}`
  if (diff >= D && diff < 2 * D) return calendarLocale?.nextDay?.replace('{time}', formattedTime) ?? `Tomorrow at ${formattedTime}`
  return calendarLocale?.sameElse ?? formattedDate
}

// ─────────────────────────────────────────────────────────────────────────────
// preciseDiff — component-by-component difference
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

export function preciseDiff(
  aMs: number,
  bMs: number,
  aParts: DateParts,
  bParts: DateParts,
  daysInPrevMonth: number,
): PreciseDiffResult {
  const isAfter = bMs >= aMs
  const lo = isAfter ? aParts : bParts
  const hi = isAfter ? bParts : aParts
  const dim = isAfter ? daysInPrevMonth : daysInPrevMonth

  let years = hi.year - lo.year
  let months = hi.month - lo.month
  let days = hi.date - lo.date
  let hours = hi.hour - lo.hour
  let minutes = hi.minute - lo.minute
  let seconds = hi.second - lo.second
  let milliseconds = hi.millisecond - lo.millisecond

  if (milliseconds < 0) { milliseconds += 1000; seconds-- }
  if (seconds < 0) { seconds += 60; minutes-- }
  if (minutes < 0) { minutes += 60; hours-- }
  if (hours < 0) { hours += 24; days-- }
  if (days < 0) { days += dim; months-- }
  if (months < 0) { months += 12; years-- }

  return {
    years, months, days, hours, minutes, seconds, milliseconds,
    humanize(): string {
      const parts: string[] = []
      if (years > 0) parts.push(pluralize(years, 'year'))
      if (months > 0) parts.push(pluralize(months, 'month'))
      if (days > 0) parts.push(pluralize(days, 'day'))
      if (hours > 0) parts.push(pluralize(hours, 'hour'))
      if (minutes > 0) parts.push(pluralize(minutes, 'minute'))
      if (seconds > 0) parts.push(pluralize(seconds, 'second'))
      return parts.slice(0, 3).join(', ') || 'just now'
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// age — calendar age from a birthdate
// ─────────────────────────────────────────────────────────────────────────────

export function age(diffResult: PreciseDiffResult): AgeResult {
  return {
    years: diffResult.years,
    months: diffResult.months,
    days: diffResult.days,
    toString(): string {
      const parts: string[] = []
      if (this.years > 0) parts.push(`${this.years}y`)
      if (this.months > 0) parts.push(`${this.months}mo`)
      if (this.days > 0) parts.push(`${this.days}d`)
      return parts.join(' ') || '0d'
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// countdown — time remaining to a target
// ─────────────────────────────────────────────────────────────────────────────

export function countdown(targetMs: number, nowMs: number): CountdownResult {
  const total = targetMs - nowMs
  const isPast = total < 0
  const abs = Math.abs(total)

  const days = Math.floor(abs / 864e5)
  const hours = Math.floor((abs % 864e5) / 36e5)
  const minutes = Math.floor((abs % 36e5) / 6e4)
  const seconds = Math.floor((abs % 6e4) / 1e3)
  const milliseconds = Math.floor(abs % 1e3)

  return {
    days, hours, minutes, seconds, milliseconds, total, isPast,
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
    },
    humanize(): string {
      if (isPast) return 'already passed'
      const parts: string[] = []
      if (days > 0) parts.push(pluralize(days, 'day'))
      if (hours > 0) parts.push(pluralize(hours, 'hour'))
      if (minutes > 0) parts.push(pluralize(minutes, 'minute'))
      if (seconds > 0) parts.push(pluralize(seconds, 'second'))
      return parts.slice(0, 2).join(', ') || 'now'
    },
  }
}
