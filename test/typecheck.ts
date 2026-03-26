/**
 * Type-level smoke test — this file is compiled with `tsc --noEmit` only.
 * It verifies that all public types resolve correctly from the package exports.
 * If this file compiles without errors, the type declarations are working.
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
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays,
  resolveUnit,
  dateFormat
} from '../src/index'

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
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  CronField,
  DateFormatStatic,
  DateFormatLike
} from '../src/index'

// ── Factory function ──────────────────────────────────────────────────────────

const a: DateFormat = d8()
const b: DateFormat = d8('2026-01-01')
const c: DateFormat = d8(Date.now())
const d: DateFormat = d8(new Date())
const e: DateFormat = d8('2026-01-01', { utc: true })
const _same: typeof d8 = dateFormat

// ── Static methods ────────────────────────────────────────────────────────────

const parsed: DateFormat = d8.parse('2026-01-01', 'YYYY-MM-DD')
const fromObj: DateFormat = d8.fromObject({ year: 2026, month: 3, day: 15 })
const fromObjUtc: DateFormat = d8.fromObject({ year: 2026 }, { utc: true })
const minD: DateFormat = d8.min('2026-01-01', '2026-06-01')
const maxD: DateFormat = d8.max('2026-01-01', '2026-06-01')
const dur: Duration = d8.duration(5, 'day')
const durAlias: Duration = d8.duration(5, 'd')
d8.locale('en')
d8.locale('fr', { months: [] })
d8.use(() => {})

// ── DateFormat instance ───────────────────────────────────────────────────────

const df = d8('2026-03-15')

// Core
const ms: number = df.valueOf()
const unix: number = df.unix()
const valid: boolean = df.isValid()
const utc: boolean = df.isUtc()
const local: boolean = df.isLocal()
const date: Date = df.toDate()
const cloned: DateFormat = df.clone()

// Get / Set with aliases
const year: number = df.get('year')
const day: number = df.get('day')
const withHour: DateFormat = df.set('hour', 10)
const withAlias: DateFormat = df.set('h', 10)

// Arithmetic with aliases
const added: DateFormat = df.add(1, 'day')
const addedAlias: DateFormat = df.add(1, 'd')
const subtracted: DateFormat = df.subtract(1, 'month')
const subtractedAlias: DateFormat = df.subtract(1, 'M')
const diffMs: number = df.diff(b)
const diffDays: number = df.diff(b, 'day')
const diffFloat: number = df.diff(b, 'hour', true)

// Comparisons
const before: boolean = df.isBefore('2026-12-31')
const after: boolean = df.isAfter('2026-01-01')
const same: boolean = df.isSame('2026-03-15')
const sameDay: boolean = df.isSame('2026-03-15 23:59', 'day')
const sameOrBefore: boolean = df.isSameOrBefore('2026-03-15')
const sameOrAfter: boolean = df.isSameOrAfter('2026-03-15', 'month')
const between: boolean = df.isBetween('2026-01-01', '2026-12-31')
const betweenInclusive: boolean = df.isBetween('2026-01-01', '2026-12-31', undefined, '[]')
const betweenUnit: boolean = df.isBetween('2026-01-01', '2026-12-31', 'month', '[)')

// Weekday queries
const _sun: boolean = df.isSunday()
const _mon: boolean = df.isMonday()
const _weekday: boolean = df.isWeekday()
const _weekend: boolean = df.isWeekend()

// Temporal queries
const _sameYear: boolean = df.isSameYear('2026-06-01')
const _currYear: boolean = df.isCurrentYear()
const _today: boolean = df.isToday()
const _tomorrow: boolean = df.isTomorrow()
const _yesterday: boolean = df.isYesterday()

// Format
const formatted: string = df.format('YYYY-MM-DD')
const escaped: string = df.format('[Year:] YYYY')
const intl: string = df.formatIntl({ weekday: 'long' })

// Relative time
const fromNow: string = df.fromNow()
const cal: string = df.calendar()

// Serialization
const iso: string = df.toISOString()
const json: string = df.toJSON()
const millis: number = df.toMillis()
const rfc2822: string = df.toRFC2822()
const rfc3339: string = df.toRFC3339()
const sql: string = df.toSQL()
const sqlDate: string = df.toSQLDate()
const sqlTime: string = df.toSQLTime()
const excel: number = df.toExcel()
const str: string = df.toString()
const obj = df.toObject()
const _objYear: number = obj.year

// Precise diff
const pdiff: PreciseDiffResult = df.preciseDiff('2020-01-01')
const _humanized: string = pdiff.humanize()
const _years: number = pdiff.years

// Age
const ageResult: AgeResult = df.age()
const _ageStr: string = ageResult.toString()

// Countdown
const cd: CountdownResult = df.countdown()
const _cdFormat: string = cd.format('DD:HH:mm:ss')
const _cdHumanize: string = cd.humanize()

// Calendar grid
const grid: CalendarCell<DateFormat>[][] = df.calendarGrid()
const gridMon: CalendarCell<DateFormat>[][] = df.calendarGrid({ weekStart: 'monday' })
const _cell: CalendarCell<DateFormat> = grid[0][0]
const _cellDate: DateFormat = _cell.date
const _cellToday: boolean = _cell.isToday

// Fiscal
const fy: number = df.fiscalYear({ startMonth: 4 })
const fq: number = df.fiscalQuarter({ startMonth: 4 })

// Start/End
const sod: DateFormat = df.startOf('day')
const eod: DateFormat = df.endOf('day')
const sow: DateFormat = df.startOf('week')
const soq: DateFormat = df.startOf('quarter')

// UTC/Local
const utcD: DateFormat = df.utc()
const localD: DateFormat = df.local()

// Calendar info
const dim: number = df.daysInMonth()
const doy: number = df.dayOfYear()
const iw: number = df.isoWeek()
const iwy: number = df.isoWeekYear()
const wiy: number = df.weeksInYear()
const q: number = df.quarter()
const leap: boolean = df.isLeapYear()
const dst: boolean = df.isDST()

// ── Duration ──────────────────────────────────────────────────────────────────

const d1 = new Duration(5000)
const d2 = Duration.parse('2h30m')
const d3 = Duration.fromISO('P1DT12H')
const d4 = Duration.between(new Date(), new Date())

const _asHours: number = d1.as('hour')
const _asAlias: number = d1.as('h')
const _added: Duration = d1.add(1, 'hour')
const _subbed: Duration = d1.subtract(30, 'minute')

const _toMs: number = d1.toMilliseconds()
const _toSec: number = d1.toSeconds()
const _toMin: number = d1.toMinutes()
const _toHr: number = d1.toHours()
const _toDay: number = d1.toDays()
const _toWk: number = d1.toWeeks()
const _toMo: number = d1.toMonths()
const _toYr: number = d1.toYears()

const _isZero: boolean = d1.isZero()
const _isNeg: boolean = d1.isNegative()
const _isPos: boolean = d1.isPositive()
const _abs: Duration = d1.abs()
const _neg: Duration = d1.negate()

const _eq: boolean = d1.equals(d2)
const _lt: boolean = d1.lessThan(d2)
const _gt: boolean = d1.greaterThan(d2)
const _lte: boolean = d1.lessThanOrEqual(d2)
const _gte: boolean = d1.greaterThanOrEqual(d2)

const _isoStr: string = d1.toISO()
const _humShort: string = d1.humanize()
const _humLong: string = d1.humanize(false)
const _fmt: string = d1.format('HH:mm:ss')

// ── DateRange ─────────────────────────────────────────────────────────────────

const range = d8.range('2026-01-01', '2026-12-31')
const _rv: boolean = range.isValid()
const _rf: boolean = range.isForward()
const _rd: Duration = range.duration()
const _rc: boolean = range.contains('2026-06-15')
const _ro: boolean = range.overlaps(range)
const _ri: DateRange | null = range.intersect(range)
const _rm: DateRange | null = range.merge(range)
const _rs: DateRange[] = range.split(1, 'month')
const _ra: DateFormat[] = range.toArray('month')
const _rh: string = range.humanize()
const _re: boolean = range.equals(range)

// ── DateCollection ────────────────────────────────────────────────────────────

const col = d8.collection(['2026-01-01', '2026-06-15', '2026-12-31'])
const sorted: DateCollection = col.sort('asc')
const filtered: DateCollection = col.filter((d) => d.isWeekday())
const unique: DateCollection = col.unique('day')
const compact: DateCollection = col.compact()
const merged: DateCollection = col.merge(col)
const betweenCol: DateCollection = col.between('2026-01-01', '2026-12-31')

const closest: DateFormat = col.closest(df)
const farthest: DateFormat = col.farthest(df)
const first: DateFormat = col.first()
const last: DateFormat = col.last()
const nth: DateFormat = col.nth(0)
const min: DateFormat = col.min()
const max: DateFormat = col.max()
const found: DateFormat | undefined = col.find((d) => d.isFriday())

const count: number = col.count()
const empty: boolean = col.isEmpty()
const span: DateRange = col.span()

const mapped: string[] = col.map((d) => d.format())
col.forEach((d, i) => {
  const _: string = d.format()
  const _i: number = i
})
const reduced: number = col.reduce((sum, d) => sum + d.get('year'), 0)
const _some: boolean = col.some((d) => d.isWeekend())
const _every: boolean = col.every((d) => d.isValid())

// Iterable
for (const _d of col) {
  const _f: string = _d.format()
}
const spread: DateFormat[] = [...col]

const grouped: Map<string, DateFormat[]> = col.groupBy('month')

// ── Timezone ──────────────────────────────────────────────────────────────────

const tz2 = d8.tz('America/New_York')
const _guess: string = Timezone.guess()
const _isValidTz: boolean = Timezone.isValid('UTC')
const _offMin: number = tz2.offsetMinutes()
const _offStr: string = tz2.offsetString()
const _tzFmt: string = tz2.format(df, 'HH:mm')
const _isDst: boolean = tz2.isDST()
const _tzLocal: DateFormat = tz2.toLocalDate(df)

// ── Cron ──────────────────────────────────────────────────────────────────────

const cron = d8.cron('30 9 * * 1-5')
const _matches: boolean = cron.matches(df)
const _next: DateFormat = cron.next()
const _prev: DateFormat = cron.prev()
const _cronBetween: DateFormat[] = cron.between(a, b, 5)
const _cronHumanize: string = cron.humanize()

// ── Natural Language ──────────────────────────────────────────────────────────

const nlResult: DateFormat = d8.natural('tomorrow at 3pm')
const nlDirect: DateFormat = parseNatural('5 hours ago')

// ── Business Days ─────────────────────────────────────────────────────────────

const _isBd: boolean = isBusinessDay(df)
const _addBd: DateFormat = addBusinessDays(df, 5)
const _subBd: DateFormat = subtractBusinessDays(df, 3)
const _nextBd: DateFormat = nextBusinessDay(df)
const _prevBd: DateFormat = prevBusinessDay(df)
const _bdBetween: number = businessDaysBetween(df, b)
const _holidays: string[] = getHolidays('US', 2026)

// ── Utility ───────────────────────────────────────────────────────────────────

const resolved: Unit = resolveUnit('d')

// ── Type aliases verify ───────────────────────────────────────────────────────

const _unit: Unit = 'day'
const _unitInput: UnitInput = 'd'
const _dateInput: DateInput = '2026-01-01'
const _dateObj: DateObject = { year: 2026 }
const _sort: SortOrder = 'asc'
const _ws: WeekStart = 'monday'
const _inc: Inclusivity = '[]'
const _riu: RangeIterateUnit = 'month'
const _gbu: GroupByUnit = 'quarter'
const _uu: UniqueUnit = 'day'
const _hc: HolidayCountry = 'US'
const _fc: FiscalConfig = { startMonth: 4 }

// Suppress unused warnings
void [a, b, c, d, e, _same, parsed, fromObj, fromObjUtc, minD, maxD, dur, durAlias]
void [ms, unix, valid, utc, local, date, cloned, year, day, withHour, withAlias]
void [added, addedAlias, subtracted, subtractedAlias, diffMs, diffDays, diffFloat]
void [
  before,
  after,
  same,
  sameDay,
  sameOrBefore,
  sameOrAfter,
  between,
  betweenInclusive,
  betweenUnit
]
void [_sun, _mon, _weekday, _weekend, _sameYear, _currYear, _today, _tomorrow, _yesterday]
void [formatted, escaped, intl, fromNow, cal, iso, json, millis, rfc2822, rfc3339]
void [sql, sqlDate, sqlTime, excel, str, obj, _objYear, pdiff, _humanized, _years]
void [ageResult, _ageStr, cd, _cdFormat, _cdHumanize, grid, gridMon, _cell, _cellDate, _cellToday]
void [fy, fq, sod, eod, sow, soq, utcD, localD, dim, doy, iw, iwy, wiy, q, leap, dst]
void [d1, d2, d3, d4, _asHours, _asAlias, _added, _subbed]
void [_toMs, _toSec, _toMin, _toHr, _toDay, _toWk, _toMo, _toYr]
void [
  _isZero,
  _isNeg,
  _isPos,
  _abs,
  _neg,
  _eq,
  _lt,
  _gt,
  _lte,
  _gte,
  _isoStr,
  _humShort,
  _humLong,
  _fmt
]
void [range, _rv, _rf, _rd, _rc, _ro, _ri, _rm, _rs, _ra, _rh, _re]
void [col, sorted, filtered, unique, compact, merged, betweenCol, closest, farthest]
void [
  first,
  last,
  nth,
  min,
  max,
  found,
  count,
  empty,
  span,
  mapped,
  reduced,
  _some,
  _every,
  spread,
  grouped
]
void [tz2, _guess, _isValidTz, _offMin, _offStr, _tzFmt, _isDst, _tzLocal]
void [cron, _matches, _next, _prev, _cronBetween, _cronHumanize]
void [nlResult, nlDirect, _isBd, _addBd, _subBd, _nextBd, _prevBd, _bdBetween, _holidays, resolved]
void [_unit, _unitInput, _dateInput, _dateObj, _sort, _ws, _inc, _riu, _gbu, _uu, _hc, _fc]
