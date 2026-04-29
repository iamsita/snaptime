// ─────────────────────────────────────────────────────────────────────────────
// Core public types for the library.
// All other modules import from here. Keep this file dependency-free.
// ─────────────────────────────────────────────────────────────────────────────

import type DateTime from './DateTime'

// ── Time units ──────────────────────────────────────────────────────────────

export type Unit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'date'
  | 'week'
  | 'fortnight'
  | 'month'
  | 'quarter'
  | 'year'
  | 'decade'
  | 'century'
  | 'millennium'

export type UnitInput =
  | Unit
  | 'ms'
  | 'milliseconds'
  | 's'
  | 'seconds'
  | 'm'
  | 'minutes'
  | 'h'
  | 'hours'
  | 'd'
  | 'days'
  | 'D'
  | 'dates'
  | 'w'
  | 'weeks'
  | 'M'
  | 'months'
  | 'Q'
  | 'quarters'
  | 'y'
  | 'years'

/** Units valid for arithmetic (add/subtract). */
export type ArithmeticUnit = Exclude<Unit, 'date' | 'fortnight'>

/** Units valid for startOf/endOf. */
export type BoundaryUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'isoWeek'
  | 'day'
  | 'date'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

/** Iso/locale weekday — 0=Sunday in JS Date, but we expose 1=Monday for ISO. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

// ── Date inputs ─────────────────────────────────────────────────────────────

/**
 * Anything that has been seen by the library: a primitive timestamp, a string,
 * a native Date, or another DateTime. Functions accepting a `DateInput`
 * normalize via `toDateTime()`.
 */
export type DateInput = string | number | Date | DateTimeLike

/**
 * Structural type for DateTime — used in pure modules that must avoid a
 * circular import on the DateTime class itself. Anything that walks like a
 * DateTime is treated as one.
 */
export interface DateTimeLike {
  valueOf(): number
  isValid(): boolean
  isUtc(): boolean
  get(unit: Unit | 'day'): number
  clone(): DateTimeLike
  toDate(): Date
}

export interface DateObject {
  year: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

export interface CreateOptions {
  /** Treat the input as a UTC instant rather than local-time. */
  utc?: boolean
  /** Locale name to attach to this instance (overrides global default). */
  locale?: string
}

// ── Comparison / range ──────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc'
export type WeekStart = 'sunday' | 'monday' | 'saturday'

/** Boundary inclusivity for `isBetween`. */
export type Inclusivity = '()' | '[]' | '[)' | '(]'

export type RangeIterateUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

export type GroupByUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour'
export type UniqueUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'

// ── Locale ──────────────────────────────────────────────────────────────────

export interface LocaleRelativeTime {
  future: string
  past: string
  s: string
  ss?: string
  m: string
  mm: string
  h: string
  hh: string
  d: string
  dd: string
  M: string
  MM: string
  y: string
  yy: string
}

export interface LocaleCalendar {
  sameDay?: string
  nextDay?: string
  lastDay?: string
  nextWeek?: string
  lastWeek?: string
  sameElse?: string
}

export interface LocaleLongDateFormats {
  LT?: string
  LTS?: string
  L?: string
  LL?: string
  LLL?: string
  LLLL?: string
  l?: string
  ll?: string
  lll?: string
  llll?: string
}

export interface LocaleData {
  /** Locale code, e.g. "en", "fr", "ja". */
  name?: string
  months?: string[]
  monthsShort?: string[]
  weekdays?: string[]
  weekdaysShort?: string[]
  weekdaysMin?: string[]
  meridiem?: (hour: number, minute: number, isLower: boolean) => string
  ordinal?: (n: number) => string
  weekStart?: WeekStart
  longDateFormat?: LocaleLongDateFormats
  relativeTime?: LocaleRelativeTime
  calendar?: LocaleCalendar
}

// ── Diff / age / countdown ──────────────────────────────────────────────────

export interface PreciseDiffResult {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  /** "2 years, 3 months" */
  humanize(maxParts?: number): string
}

export interface AgeResult {
  years: number
  months: number
  days: number
  /** "32y 3mo 5d" */
  toString(): string
}

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  /** Signed total ms — negative if target already passed. */
  total: number
  isPast: boolean
  format(template: string): string
  humanize(): string
}

// ── Calendar grid ───────────────────────────────────────────────────────────

export interface CalendarCell<D = unknown> {
  date: D
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

export interface CalendarGridOptions {
  weekStart?: WeekStart
}

// ── Fiscal year ─────────────────────────────────────────────────────────────

export interface FiscalConfig {
  /** 1-12 — month the fiscal year begins. */
  startMonth: number
}

// ── Cron ────────────────────────────────────────────────────────────────────

export interface CronField {
  values: Set<number>
  any: boolean
}

// ── Holidays ────────────────────────────────────────────────────────────────

export type HolidayCountry =
  | 'US'
  | 'UK'
  | 'IN'
  | 'DE'
  | 'FR'
  | 'CA'
  | 'AU'
  | 'JP'
  | 'NZ'
  | 'IT'
  | 'ES'
  | 'BR'
  | 'NP'

// ── Plugins / macros ────────────────────────────────────────────────────────

/**
 * A plugin receives the DateTime constructor and may register macros, locales,
 * or any other side effects. Plugins are called once at registration time.
 */
export type PluginFn<O = unknown> = (DT: typeof DateTime, options?: O) => void

/** A user-defined instance method. `this` is bound to the DateTime instance. */
export type Macro = (this: DateTime, ...args: unknown[]) => unknown

/** A user-defined static method. */
export type StaticMacro = (...args: unknown[]) => unknown

/**
 * Augment this interface via declaration merging to give types to your macros.
 *
 * @example
 *   declare module '@anilkumarthakur/d8' {
 *     interface DateTimePluginMethods {
 *       greet(): string
 *     }
 *   }
 */
export interface DateTimePluginMethods {
  // Intentionally empty — extended by users.
  [key: string]: unknown
}
