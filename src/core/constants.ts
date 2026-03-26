import type { Unit } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Milliseconds per unit (approximate for month/year)
// ─────────────────────────────────────────────────────────────────────────────

export const MS_PER_UNIT: Record<Unit, number> = {
  millisecond: 1,
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  date: 86_400_000,
  week: 604_800_000,
  fortnight: 1_209_600_000,
  month: 2_592_000_000,
  year: 31_536_000_000,
  unknown: NaN
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit aliases — lets users write 'y' instead of 'year', etc.
// ─────────────────────────────────────────────────────────────────────────────

export const UNIT_ALIASES: Record<string, Unit> = {
  ms: 'millisecond',
  milliseconds: 'millisecond',
  s: 'second',
  seconds: 'second',
  m: 'minute',
  minutes: 'minute',
  h: 'hour',
  hours: 'hour',
  d: 'day',
  days: 'day',
  D: 'date',
  dates: 'date',
  w: 'week',
  weeks: 'week',
  M: 'month',
  months: 'month',
  y: 'year',
  years: 'year'
}

// ─────────────────────────────────────────────────────────────────────────────
// Default locale data
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const DEFAULT_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export const DEFAULT_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export const DEFAULT_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─────────────────────────────────────────────────────────────────────────────
// Parse token → regex mapping
// ─────────────────────────────────────────────────────────────────────────────

export const PARSE_TOKEN_RE: Record<string, string> = {
  YYYY: '(\\d{4})',
  MM: '(\\d{1,2})',
  DD: '(\\d{1,2})',
  HH: '(\\d{1,2})',
  hh: '(\\d{1,2})',
  mm: '(\\d{1,2})',
  ss: '(\\d{1,2})',
  X: '(-?\\d+)',
  x: '(-?\\d+)',
  DDD: '(\\d{1,3})',
  DDDD: '(\\d{3})',
  Z: '([+-]\\d{2}:?\\d{2}|Z)'
}
