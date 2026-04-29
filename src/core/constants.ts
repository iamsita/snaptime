import type { Unit } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Milliseconds per canonical unit. Month/year/decade/century/millennium use
// average lengths; for calendar-correct math the DateTime class delegates to
// JS Date setters which respect month boundaries.
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
  quarter: 7_776_000_000,
  year: 31_536_000_000,
  decade: 315_360_000_000,
  century: 3_153_600_000_000,
  millennium: 31_536_000_000_000
}

// ─────────────────────────────────────────────────────────────────────────────
// Input alias → canonical unit.
// ─────────────────────────────────────────────────────────────────────────────

export const UNIT_ALIASES: Record<string, Unit> = {
  ms: 'millisecond',
  millisecond: 'millisecond',
  milliseconds: 'millisecond',
  s: 'second',
  sec: 'second',
  secs: 'second',
  second: 'second',
  seconds: 'second',
  m: 'minute',
  min: 'minute',
  mins: 'minute',
  minute: 'minute',
  minutes: 'minute',
  h: 'hour',
  hr: 'hour',
  hrs: 'hour',
  hour: 'hour',
  hours: 'hour',
  d: 'day',
  day: 'day',
  days: 'day',
  D: 'date',
  date: 'date',
  dates: 'date',
  w: 'week',
  week: 'week',
  weeks: 'week',
  fortnight: 'fortnight',
  fortnights: 'fortnight',
  M: 'month',
  month: 'month',
  months: 'month',
  Q: 'quarter',
  quarter: 'quarter',
  quarters: 'quarter',
  y: 'year',
  yr: 'year',
  yrs: 'year',
  year: 'year',
  years: 'year',
  decade: 'decade',
  decades: 'decade',
  century: 'century',
  centuries: 'century',
  millennium: 'millennium',
  millennia: 'millennium'
}

// ─────────────────────────────────────────────────────────────────────────────
// Default English month / weekday names. Locale data overrides these.
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
export const DEFAULT_WEEKDAYS_MIN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─────────────────────────────────────────────────────────────────────────────
// Excel epoch: 1899-12-30 (accounts for the 1900 leap-year bug).
// ─────────────────────────────────────────────────────────────────────────────

export const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)

// ─────────────────────────────────────────────────────────────────────────────
// Weekday → number map for ISO week math.
// 0 = Sunday (matches JS Date.getDay)
// ─────────────────────────────────────────────────────────────────────────────

export const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
}
