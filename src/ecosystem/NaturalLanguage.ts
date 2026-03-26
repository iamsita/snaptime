import DateFormat from '../core/DateFormat'
import type { Unit } from '../core/types'

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
}

const MONTH_PATTERN =
  'january|february|march|april|may|june|july|august|september|october|november|december'
const WEEKDAY_PATTERN = 'sunday|monday|tuesday|wednesday|thursday|friday|saturday'

const UNIT_MAP: Record<string, Unit> = {
  second: 'second',
  seconds: 'second',
  minute: 'minute',
  minutes: 'minute',
  hour: 'hour',
  hours: 'hour',
  day: 'day',
  days: 'day',
  week: 'week',
  weeks: 'week',
  month: 'month',
  months: 'month',
  year: 'year',
  years: 'year'
}

function parseMonth(s: string): number | undefined {
  return MONTHS[s.toLowerCase()]
}

function parseWeekday(s: string): number | undefined {
  return WEEKDAYS[s.toLowerCase()]
}

function nthWeekdayOfMonth(n: number, weekday: number, month: number, year: number): DateFormat {
  let d = new DateFormat(new Date(year, month - 1, 1))
  const firstDow = d.get('day')
  let offset = (weekday - firstDow + 7) % 7
  offset += (n - 1) * 7
  d = d.add(offset, 'day')
  if (d.get('month') !== month) return new DateFormat(NaN)
  return d
}

/**
 * Apply a time string like "3pm", "10:30", "14:45" to a DateFormat.
 */
function applyTime(date: DateFormat, timeStr: string): DateFormat {
  const lower = timeStr.toLowerCase().trim()

  // "noon"
  if (lower === 'noon') return date.set('hour', 12).set('minute', 0).set('second', 0)
  // "midnight"
  if (lower === 'midnight') return date.set('hour', 0).set('minute', 0).set('second', 0)

  // "3pm", "3:30pm", "3:30:15pm", "15:30", "3:30 pm"
  const m = lower.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/)
  if (!m) return date

  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const sec = m[3] ? parseInt(m[3], 10) : 0
  const ampm = m[4]

  if (ampm === 'pm' && h < 12) h += 12
  if (ampm === 'am' && h === 12) h = 0

  return date.set('hour', h).set('minute', min).set('second', sec)
}

export default function parseNatural(input: string, ref?: DateFormat): DateFormat {
  const base = ref ?? new DateFormat()
  const s = input.trim()
  const lower = s.toLowerCase()

  // "now", "today", "tomorrow", "yesterday"
  if (lower === 'now' || lower === 'today') return base
  if (lower === 'tomorrow') return base.add(1, 'day')
  if (lower === 'yesterday') return base.subtract(1, 'day')
  if (lower === 'noon') return base.set('hour', 12).set('minute', 0).set('second', 0)
  if (lower === 'midnight') return base.set('hour', 0).set('minute', 0).set('second', 0)

  // "beginning of day/week/month/year"
  let m = lower.match(/^beginning\s+of\s+(day|week|month|year)$/)
  if (m) return base.startOf(m[1] as Unit | 'week')

  // "end of day/week/month/year"
  m = lower.match(/^end\s+of\s+(day|week|month|year)$/)
  if (m) return base.endOf(m[1] as Unit | 'week')

  // "this week/month/year"
  m = lower.match(/^this\s+(week|month|year)$/)
  if (m) return base.startOf(m[1] as Unit | 'week')

  // "tomorrow at 3pm", "yesterday at 10:30"
  m = lower.match(/^(today|tomorrow|yesterday)\s+at\s+(.+)$/)
  if (m) {
    let d = base
    if (m[1] === 'tomorrow') d = base.add(1, 'day')
    else if (m[1] === 'yesterday') d = base.subtract(1, 'day')
    return applyTime(d, m[2])
  }

  // "next/last Monday..Sunday" with optional "at TIME"
  m = lower.match(new RegExp(`^(next|last)\\s+(${WEEKDAY_PATTERN})(?:\\s+at\\s+(.+))?$`))
  if (m) {
    const dir = m[1]
    const targetDay = parseWeekday(m[2])!
    const currentDay = base.get('day')
    let d: DateFormat
    if (dir === 'next') {
      let diff = (targetDay - currentDay + 7) % 7
      if (diff === 0) diff = 7
      d = base.add(diff, 'day')
    } else {
      let diff = (currentDay - targetDay + 7) % 7
      if (diff === 0) diff = 7
      d = base.subtract(diff, 'day')
    }
    return m[3] ? applyTime(d, m[3]) : d
  }

  // "next/last week/month/year"
  m = lower.match(/^(next|last)\s+(week|month|year)$/)
  if (m) {
    const unit = UNIT_MAP[m[2]]!
    return m[1] === 'next' ? base.add(1, unit) : base.subtract(1, unit)
  }

  // "N seconds/minutes/hours/days/weeks/months/years ago"
  m = lower.match(/^(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago$/)
  if (m) {
    const n = parseInt(m[1], 10)
    const unit = UNIT_MAP[m[2]]!
    return base.subtract(n, unit)
  }

  // "in N seconds/minutes/hours/days/weeks/months/years"
  m = lower.match(/^in\s+(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)$/)
  if (m) {
    const n = parseInt(m[1], 10)
    const unit = UNIT_MAP[m[2]]!
    return base.add(n, unit)
  }

  // "N seconds/minutes/hours/days/weeks/months/years from now"
  m = lower.match(/^(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+from\s+now$/)
  if (m) {
    const n = parseInt(m[1], 10)
    const unit = UNIT_MAP[m[2]]!
    return base.add(n, unit)
  }

  // "last day of March" or "last day of March 2026"
  m = lower.match(new RegExp(`^last\\s+day\\s+of\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?$`))
  if (m) {
    const month = parseMonth(m[1])!
    const year = m[2] ? parseInt(m[2], 10) : base.get('year')
    const lastDay = new Date(year, month, 0).getDate()
    return new DateFormat(new Date(year, month - 1, lastDay))
  }

  // "first day of March" or "first day of March 2026"
  m = lower.match(new RegExp(`^first\\s+day\\s+of\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?$`))
  if (m) {
    const month = parseMonth(m[1])!
    const year = m[2] ? parseInt(m[2], 10) : base.get('year')
    return new DateFormat(new Date(year, month - 1, 1))
  }

  // "Nth weekday of month [year]" e.g. "3rd Friday of January" or "2nd Tuesday of March 2026"
  m = lower.match(
    new RegExp(
      `^(\\d+)(?:st|nd|rd|th)\\s+(${WEEKDAY_PATTERN})\\s+of\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?$`
    )
  )
  if (m) {
    const n = parseInt(m[1], 10)
    const weekday = parseWeekday(m[2])!
    const month = parseMonth(m[3])!
    const year = m[4] ? parseInt(m[4], 10) : base.get('year')
    return nthWeekdayOfMonth(n, weekday, month, year)
  }

  // "next Monday at 3pm" already handled above via the weekday pattern

  // No pattern matched
  return new DateFormat(NaN)
}
