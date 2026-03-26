import DateFormat from './DateFormat'
import Duration from './Duration'
import DateRange from './DateRange'
import DateCollection from './DateCollection'
import Timezone from './Timezone'
import Cron from './Cron'
import parseNatural from './NaturalLanguage'
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays,
} from './BusinessDay'
import { resolveUnit } from './helpers'
import type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
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
  PluginFn,
  DateFormatPluginMethods,
  DateFormatLike,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  CronField,
  DateFormatStatic,
} from './type'

// ─────────────────────────────────────────────────────────────────────────────
// Factory function — main entry point
// ─────────────────────────────────────────────────────────────────────────────

const dateFormat = Object.assign(
  (input: DateInput = Date.now(), opts: { utc?: boolean } = {}) => {
    return new DateFormat(input as string | number | Date | DateFormat, opts)
  },
  {
    // Core static methods
    parse: (str: string, fmt: string, strict?: boolean) => DateFormat.parse(str, fmt, strict),
    fromObject: (obj: DateObject, opts?: { utc?: boolean }) => DateFormat.fromObject(obj, opts),
    min: (...args: DateInput[]) => DateFormat.min(...args),
    max: (...args: DateInput[]) => DateFormat.max(...args),
    duration: (n: number, unit: UnitInput) => DateFormat.duration(n, unit),
    locale: (name: string, data?: LocaleData) => DateFormat.locale(name, data),
    use: (plugin: PluginFn) => DateFormat.use(plugin),

    // Date range
    range: (start: DateInput, end: DateInput) => new DateRange(start, end),

    // Natural language
    natural: (input: string, ref?: DateFormat) => parseNatural(input, ref),

    // Cron
    cron: (expression: string) => new Cron(expression),

    // Collection
    collection: (dates: DateInput[]) => new DateCollection(dates),

    // Timezone
    tz: (timezone: string) => new Timezone(timezone),

    // Business days
    business: {
      isBusinessDay,
      addBusinessDays,
      subtractBusinessDays,
      nextBusinessDay,
      prevBusinessDay,
      businessDaysBetween,
      getHolidays,
    },
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Named exports
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Classes
  DateFormat,
  Duration,
  DateRange,
  DateCollection,
  Timezone,
  Cron,

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

  // Factory
  dateFormat,
}

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
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
  PluginFn,
  DateFormatPluginMethods,
  DateFormatLike,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  CronField,
  DateFormatStatic,
}

export default dateFormat
