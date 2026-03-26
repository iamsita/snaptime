/**
 * Verify type declarations from the built dist/ output.
 * This simulates what an npm consumer sees.
 */

import d8, {
  DateFormat,
  Duration,
  DateRange,
  DateCollection,
  Timezone,
  Cron,
  parseNatural,
  isBusinessDay,
  getHolidays,
  resolveUnit,
} from '../dist/index'

import type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
  Inclusivity,
  DateFormatLike,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  FiscalConfig,
  HolidayCountry,
  LocaleData,
} from '../dist/index'

// Factory
const a: DateFormat = d8('2026-01-01')
const b: DateFormat = d8.fromObject({ year: 2026, month: 3, day: 15 })
const c: DateFormat = d8.parse('2026-01-01', 'YYYY-MM-DD')
const mn: DateFormat = d8.min('2026-01-01', '2026-06-01')
const mx: DateFormat = d8.max('2026-01-01', '2026-06-01')

// DateFormat instance methods
const fmt: string = a.format('[Year:] YYYY')
const iso: string = a.toISOString()
const sameBefore: boolean = a.isSameOrBefore('2026-12-31')
const sameAfter: boolean = a.isSameOrAfter('2026-01-01', 'year')
const btw: boolean = a.isBetween('2025-01-01', '2027-01-01', undefined, '[]')
const today: boolean = a.isToday()
const str: string = a.toString()
const obj: { year: number; month: number; date: number; hour: number; minute: number; second: number; millisecond: number } = a.toObject()
const rfc: string = a.toRFC2822()
const sql: string = a.toSQL()
const excel: number = a.toExcel()
const pd: PreciseDiffResult = a.preciseDiff('2020-01-01')
const age: AgeResult = a.age()
const cd: CountdownResult = a.countdown()
const grid: CalendarCell<DateFormat>[][] = a.calendarGrid({ weekStart: 'monday' })
const fy: number = a.fiscalYear({ startMonth: 4 })

// Unit aliases work
const added: DateFormat = a.add(1, 'd')
const setted: DateFormat = a.set('h', 10)
const diffed: number = a.diff(b, 'y')

// Duration
const dur = Duration.fromISO('P1DT12H')
const dur2 = Duration.between(new Date(), new Date())
const weeks: number = dur.toWeeks()
const months: number = dur.toMonths()
const pos: boolean = dur.isPositive()
const neg: Duration = dur.negate()
const eq: boolean = dur.equals(dur2)
const isoD: string = dur.toISO()

// DateRange
const range = d8.range('2026-01-01', '2026-12-31')
const contains: boolean = range.contains('2026-06-15')

// DateCollection
const col = d8.collection(['2026-01-01', '2026-06-15'])
const found: DateFormat | undefined = col.find(d => d.isFriday())
const sp: DateRange = col.span()
const merged: DateCollection = col.merge(col)
const some: boolean = col.some(d => d.isWeekend())
for (const d of col) { void d.format() }

// Timezone
const tz = d8.tz('UTC')
const tzFmt: string = tz.format(a, 'HH:mm')

// Cron
const cron = d8.cron('* * * * *')
const next: DateFormat = cron.next()

// NaturalLanguage
const nl: DateFormat = d8.natural('tomorrow at 3pm')
const nl2: DateFormat = parseNatural('5 hours ago')

// Business
const isBd: boolean = isBusinessDay(a)
const hols: string[] = getHolidays('US', 2026)

// Helper
const unit: Unit = resolveUnit('d')

// Types
const _ui: UnitInput = 'ms'
const _di: DateInput = new Date()
const _do: DateObject = { year: 2026, month: 1 }
const _inc: Inclusivity = '[)'
const _hc: HolidayCountry = 'IN'
const _fc: FiscalConfig = { startMonth: 4 }

void [a, b, c, mn, mx, fmt, iso, sameBefore, sameAfter, btw, today, str, obj, rfc, sql, excel]
void [pd, age, cd, grid, fy, added, setted, diffed, dur, dur2, weeks, months, pos, neg, eq, isoD]
void [range, contains, col, found, sp, merged, some, tz, tzFmt, cron, next, nl, nl2, isBd, hols, unit]
void [_ui, _di, _do, _inc, _hc, _fc]
