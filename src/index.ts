// ─────────────────────────────────────────────────────────────────────────────
// Public API.
//
// Two equivalent entry points:
//   1. The factory function — `dateTime(input)`. Mirrors moment().
//   2. The `DateTime` class itself, plus static factories.
//
// All other classes (Duration, DateRange, DatePeriod, DateCollection,
// Timezone, Cron) are exposed as named exports.
//
// `DateFormat` is re-exported as an alias of `DateTime` for backwards
// compatibility with earlier 0.x versions of the package.
// ─────────────────────────────────────────────────────────────────────────────

import DateTime from './core/DateTime'
import Duration from './core/Duration'
import DateRange from './collections/DateRange'
import DatePeriod from './collections/DatePeriod'
import DateCollection from './collections/DateCollection'
import Timezone from './ecosystem/Timezone'
import Cron from './ecosystem/Cron'
import parseNatural, { NaturalLanguage } from './ecosystem/NaturalLanguage'
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays
} from './ecosystem/BusinessDay'
import { Holidays } from './ecosystem/holidays/index'
import { Locales } from './locale/registry'
import { Macros } from './plugin/macros'
import { Clock } from './core/Clock'
import { resolveUnit } from './core/units'
import { toNumerals, toWesternNumerals, type NumeralSystem } from './core/numerals'

// New top-level modules (also available via sub-path imports)
import RangeSet from './collections/RangeSet'
import { BikramSambat } from './calendars/bs'
import { RRule, parseRRule, stringifyRRule } from './rrule'
import * as Astronomy from './astronomy'
import { DateRule } from './validate'

import type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
  CreateOptions,
  SortOrder,
  WeekStart,
  Inclusivity,
  RangeIterateUnit,
  GroupByUnit,
  UniqueUnit,
  HolidayCountry,
  LocaleData,
  LocaleRelativeTime,
  LocaleCalendar,
  LocaleLongDateFormats,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  CronField,
  PluginFn,
  Macro,
  StaticMacro,
  DateTimePluginMethods
} from './core/types'
import type { DatePeriodOptions } from './collections/DatePeriod'
import type { ResolvedLocale } from './locale/registry'
import type { Pattern as NaturalLanguagePattern } from './ecosystem/NaturalLanguage'

// ─────────────────────────────────────────────────────────────────────────────
// Factory function — main entry point. `dateTime()` calls work like Moment.
// ─────────────────────────────────────────────────────────────────────────────

export const dateTime = Object.assign(
  function dateTime(input?: DateInput, opts?: CreateOptions): DateTime {
    return new DateTime(input as DateInput | undefined, opts)
  },
  {
    // Construction
    now: () => DateTime.now(),
    today: () => DateTime.today(),
    tomorrow: () => DateTime.tomorrow(),
    yesterday: () => DateTime.yesterday(),
    parse: (str: string, fmt = '', strict = false, locale?: string) =>
      DateTime.parse(str, fmt, strict, locale),
    fromObject: (obj: DateObject, opts?: CreateOptions) => DateTime.fromObject(obj, opts),
    fromUnix: (s: number, opts?: CreateOptions) => DateTime.fromUnix(s, opts),
    fromTimestamp: (ms: number, opts?: CreateOptions) => DateTime.fromTimestamp(ms, opts),
    fromExcel: (serial: number) => DateTime.fromExcel(serial),
    fromDate: (d: Date, opts?: CreateOptions) => DateTime.fromDate(d, opts),

    // Comparison helpers
    min: (...args: DateInput[]) => DateTime.min(...args),
    max: (...args: DateInput[]) => DateTime.max(...args),
    average: (...args: DateInput[]) => DateTime.average(...args),

    // Companion classes
    duration: (n: number, unit: UnitInput) => DateTime.duration(n, unit),
    range: (start: DateInput, end: DateInput) => new DateRange(start, end),
    period: (opts: DatePeriodOptions) => new DatePeriod(opts),
    rangeSet: (ranges: ConstructorParameters<typeof RangeSet>[0]) => new RangeSet(ranges),
    collection: (dates: DateInput[]) => new DateCollection(dates),
    tz: (zone: string) => new Timezone(zone),
    cron: (expression: string) => new Cron(expression),
    natural: (input: string, ref?: DateTime) => parseNatural(input, ref),
    rrule: (input: string) => RRule.parse(input),
    rule: () => DateRule.empty(),
    bs: (input: DateInput) =>
      BikramSambat.fromAD(input instanceof DateTime ? input : new DateTime(input)),

    // Locale
    locale: (name?: string, data?: LocaleData) => {
      if (data) Locales.register(name ?? data.name ?? 'custom', data)
      if (name) Locales.setDefault(name)
      return Locales.getDefault()
    },
    getLocale: () => Locales.getDefault(),

    // Plugin / extensibility
    use: <O>(plugin: PluginFn<O>, options?: O) => DateTime.use(plugin, options),
    macro: (name: string, fn: Macro) => DateTime.macro(name, fn),
    macroStatic: (name: string, fn: StaticMacro) => DateTime.macroStatic(name, fn),

    // Test mocking
    setTestNow: (t: string | number | Date | null) => DateTime.setTestNow(t),

    // Business-day helpers
    business: {
      isBusinessDay,
      addBusinessDays,
      subtractBusinessDays,
      nextBusinessDay,
      prevBusinessDay,
      businessDaysBetween,
      getHolidays
    },

    // Registries
    Locales,
    Holidays,
    Macros,
    Clock,
    NaturalLanguage,

    // New top-level modules
    BikramSambat,
    RRule,
    Astronomy,
    DateRule,

    // Numeral conversion
    toNumerals,
    toWesternNumerals,

    // Constructors (escape hatches)
    DateTime,
    Duration,
    DateRange,
    DatePeriod,
    DateCollection,
    RangeSet,
    Timezone,
    Cron
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Named exports
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Classes
  DateTime,
  Duration,
  DateRange,
  DatePeriod,
  DateCollection,
  RangeSet,
  Timezone,
  Cron,

  // New modules
  BikramSambat,
  RRule,
  parseRRule,
  stringifyRRule,
  Astronomy,
  DateRule,

  // Functions
  parseNatural,
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays,
  resolveUnit,
  toNumerals,
  toWesternNumerals,

  // Registries
  Locales,
  Holidays,
  Macros,
  Clock,
  NaturalLanguage
}

// ─────────────────────────────────────────────────────────────────────────────
// Backwards-compat alias — older code imports `DateFormat`.
// ─────────────────────────────────────────────────────────────────────────────

export { DateTime as DateFormat }

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
  CreateOptions,
  SortOrder,
  WeekStart,
  Inclusivity,
  RangeIterateUnit,
  GroupByUnit,
  UniqueUnit,
  HolidayCountry,
  LocaleData,
  LocaleRelativeTime,
  LocaleCalendar,
  LocaleLongDateFormats,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  CronField,
  PluginFn,
  Macro,
  StaticMacro,
  DateTimePluginMethods,
  DatePeriodOptions,
  ResolvedLocale,
  NaturalLanguagePattern,
  NumeralSystem
}

export type { ValidationResult } from './validate'
export type { Freq, Weekday as RRuleWeekday, WeekdayWithN, RRuleOptions } from './rrule'
export type { BSDate } from './calendars/bs'
export type { MoonPhase, MoonPhaseName, Season } from './astronomy'

// Auto-load any user extensions on first import. Side-effecting only.
import './extensions/index'

export default dateTime
