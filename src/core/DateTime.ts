import type {
  Unit,
  UnitInput,
  DateInput,
  DateObject,
  Inclusivity,
  CreateOptions,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  DateTimePluginMethods
} from './types'
import { Clock } from './Clock'
import { resolveUnit, msPerUnit } from './units'
import {
  LOCAL_GETTERS,
  UTC_GETTERS,
  LOCAL_SETTERS,
  UTC_SETTERS,
  daysInMonth as _daysInMonth,
  isLeapYear as _isLeapYear
} from './helpers'
import {
  startOf as _startOf,
  endOf as _endOf,
  type BoundaryUnit,
  firstOf as _firstOf,
  lastOf as _lastOf,
  nthOf as _nthOf,
  floorTo as _floor,
  ceilTo as _ceil,
  roundTo as _round,
  roundToMultiple as _roundToMultiple,
  addMonths as _addMonths,
  addYears as _addYears,
  type Mode
} from './manipulate'
import {
  dayOfYear as _dayOfYear,
  isoWeek as _isoWeek,
  isoWeekYear as _isoWeekYear,
  weeksInIsoYear as _weeksInIsoYear,
  quarterOf as _quarterOf,
  daysInYear as _daysInYear
} from './calendar'

import { formatDate } from '../format/format'
import { parseWithFormat } from '../format/parse'
import {
  toISO,
  toRFC2822 as _toRFC2822,
  toRFC3339 as _toRFC3339,
  toExcel as _toExcel,
  fromExcel as _fromExcel,
  toSQL as _toSQL,
  toSQLDate as _toSQLDate,
  toSQLTime as _toSQLTime
} from '../format/serializers'
import { formatIntl as _formatIntl } from '../format/intl'
import {
  relativeTime as _relativeTime,
  calendarLabel as _calendarLabel,
  preciseDiff as _preciseDiff,
  age as _age,
  countdown as _countdown
} from '../format/relative'
import type { DateComponents } from '../format/tokens'

import { Locales, type ResolvedLocale } from '../locale/registry'
import { Macros, type MacroFn, type StaticMacroFn } from '../plugin/macros'
import { install, type PluginFn } from '../plugin/plugin'
import Duration from './Duration'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_NO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

function isDateTime(x: unknown): x is DateTime {
  return x instanceof DateTime
}

/**
 * Coerce any DateInput into a DateTime instance. Accepts the structural
 * `DateTimeLike` from older instances of the library across realms.
 */
function toDT(input: DateInput, opts?: CreateOptions): DateTime {
  if (isDateTime(input)) return input
  return new DateTime(input as string | number | Date, opts)
}

/**
 * The main user-facing class. Immutable: every modifier returns a new instance.
 *
 * Construction:
 *   new DateTime()                       — now
 *   new DateTime('2026-04-29')           — ISO date
 *   new DateTime(1700000000000)          — ms epoch
 *   new DateTime(jsDate)                 — wrap a JS Date
 *   new DateTime(other)                  — clone another DateTime
 *
 * Static factories for everything else: `parse`, `fromObject`, `fromUnix`, etc.
 */
class DateTime {
  // ── Internal state ───────────────────────────────────────────────────────
  private readonly _d: Date
  private readonly _utc: boolean
  private _localeName: string | null

  // Type-level extension hook for plugins
  declare ['constructor']: typeof DateTime

  constructor(input: DateInput | undefined = undefined, opts: CreateOptions = {}) {
    let isUtc = opts.utc ?? false
    let raw: DateInput = input ?? Clock.now()

    // ISO strings without an explicit zone are treated as UTC instants
    if (typeof raw === 'string') {
      if (raw.endsWith('Z')) {
        isUtc = true
        raw = raw.slice(0, -1)
      } else if (ISO_DATETIME_NO_TZ.test(raw) || ISO_DATE.test(raw)) {
        isUtc = true
      }
    }

    if (isDateTime(raw)) {
      this._d = new Date(raw.valueOf())
      this._utc = raw._utc
    } else if (raw instanceof Date) {
      this._d = new Date(raw.getTime())
      this._utc = isUtc
    } else if (typeof raw === 'number') {
      this._d = new Date(raw)
      this._utc = isUtc
    } else {
      const s = raw as string
      if (isUtc && !/[zZ]$/.test(s) && !/[+-]\d\d:?\d\d$/.test(s)) {
        this._d = new Date(s + 'Z')
      } else {
        this._d = new Date(s)
      }
      this._utc = isUtc
    }

    this._localeName = opts.locale ?? null

    // Apply any registered macros lazily — only need to do it once per class
    DateTime._ensureMacros()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Plugin & locale machinery (static)
  // ─────────────────────────────────────────────────────────────────────────

  private static _macrosApplied = false

  private static _ensureMacros(): void {
    if (DateTime._macrosApplied) return
    DateTime._macrosApplied = true
    Macros.apply(DateTime)
  }

  /** Register a plugin. Plugins run exactly once. */
  static use<O>(plugin: PluginFn<O>, options?: O): typeof DateTime {
    install(DateTime, plugin, options)
    Macros.apply(DateTime)
    return DateTime
  }

  /** Register an instance macro. Use declaration merging on
   *  {@link DateTimePluginMethods} for type-safety. */
  static macro(name: string, fn: MacroFn): typeof DateTime {
    Macros.register(name, fn)
    Macros.apply(DateTime)
    return DateTime
  }

  /** Register a static macro on the DateTime constructor. */
  static macroStatic(name: string, fn: StaticMacroFn): typeof DateTime {
    Macros.registerStatic(name, fn)
    Macros.apply(DateTime)
    return DateTime
  }

  /** Pin the library's notion of "now" to a specific instant (test helper). */
  static setTestNow(t: string | number | Date | null): void {
    Clock.setTestNow(t)
  }

  /** Set or get the global default locale. */
  static locale(name?: string): string {
    if (name) Locales.setDefault(name)
    return Locales.getDefault()
  }

  static getLocale(): string {
    return Locales.getDefault()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Static factories
  // ─────────────────────────────────────────────────────────────────────────

  static now(): DateTime {
    return new DateTime(Clock.now())
  }

  static today(): DateTime {
    return DateTime.now().startOf('day')
  }

  static tomorrow(): DateTime {
    return DateTime.now().add(1, 'day').startOf('day')
  }

  static yesterday(): DateTime {
    return DateTime.now().subtract(1, 'day').startOf('day')
  }

  static fromObject(obj: DateObject, opts: CreateOptions = {}): DateTime {
    const { year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0 } = obj
    if (opts.utc) {
      return new DateTime(Date.UTC(year, month - 1, day, hour, minute, second, millisecond), opts)
    }
    return new DateTime(new Date(year, month - 1, day, hour, minute, second, millisecond), opts)
  }

  static fromUnix(seconds: number, opts: CreateOptions = {}): DateTime {
    return new DateTime(seconds * 1000, { utc: true, ...opts })
  }

  static fromTimestamp(ms: number, opts: CreateOptions = {}): DateTime {
    return new DateTime(ms, opts)
  }

  static fromExcel(serial: number): DateTime {
    return new DateTime(_fromExcel(serial), { utc: true })
  }

  static fromDate(d: Date, opts: CreateOptions = {}): DateTime {
    return new DateTime(d, opts)
  }

  /**
   * Strict-or-loose format parse. Returns an invalid DateTime (NaN) on
   * mismatch. Pass `strict=true` to also enforce that fields are in range.
   */
  static parse(input: string, fmt = '', strict = false, locale?: string): DateTime {
    if (!fmt) {
      return new DateTime(input)
    }
    const result = parseWithFormat(input, fmt, Locales.get(locale), strict)
    if (Number.isNaN(result.ms)) return new DateTime(NaN)
    return new DateTime(result.ms, { utc: result.hadOffset })
  }

  static min(...args: DateInput[]): DateTime {
    if (args.length === 0) throw new Error('DateTime.min requires at least one argument')
    return args.map((a) => toDT(a)).reduce((a, b) => (a.isBefore(b) ? a : b))
  }

  static max(...args: DateInput[]): DateTime {
    if (args.length === 0) throw new Error('DateTime.max requires at least one argument')
    return args.map((a) => toDT(a)).reduce((a, b) => (a.isAfter(b) ? a : b))
  }

  static average(...args: DateInput[]): DateTime {
    if (args.length === 0) throw new Error('DateTime.average requires at least one argument')
    const ms = args.map((a) => toDT(a).valueOf())
    const avg = ms.reduce((a, b) => a + b, 0) / ms.length
    return new DateTime(avg)
  }

  static duration(n: number, unit: UnitInput): Duration {
    return new Duration(n * msPerUnit(resolveUnit(unit)))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core
  // ─────────────────────────────────────────────────────────────────────────

  valueOf(): number {
    return this._d.getTime()
  }

  /** Unix seconds (integer). */
  unix(): number {
    return Math.floor(this.valueOf() / 1000)
  }

  /** Alias for `valueOf()`. */
  timestamp(): number {
    return this.valueOf()
  }

  isValid(): boolean {
    return !Number.isNaN(this._d.getTime())
  }

  isUtc(): boolean {
    return this._utc
  }

  isLocal(): boolean {
    return !this._utc
  }

  toDate(): Date {
    return new Date(this.valueOf())
  }

  /** Alias of `toDate()`. */
  toJSDate(): Date {
    return this.toDate()
  }

  clone(): DateTime {
    const c = new DateTime(this, { utc: this._utc })
    if (this._localeName) c._localeName = this._localeName
    return c
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Per-instance locale
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set or read this instance's locale. Returns a new instance when setting.
   *   .locale()              -> 'en'
   *   .locale('fr')          -> new DateTime with locale='fr'
   */
  locale(name?: string): DateTime | string {
    if (name === undefined) return this._localeName ?? Locales.getDefault()
    const c = this.clone()
    ;c._localeName = name
    return c
  }

  /** Resolved locale data — never null. */
  getLocaleData(): ResolvedLocale {
    return Locales.get(this._localeName ?? undefined)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Get / Set
  // ─────────────────────────────────────────────────────────────────────────

  get(unit: Unit | 'day'): number {
    if (unit === 'quarter') return _quarterOf(this.get('month'))
    if (unit === 'week') return _isoWeek(this._d, this._utc)
    if (unit === 'fortnight') return Math.ceil(_isoWeek(this._d, this._utc) / 2)
    if (unit === 'decade') return Math.floor(this.get('year') / 10)
    if (unit === 'century') return Math.floor(this.get('year') / 100) + 1
    if (unit === 'millennium') return Math.floor(this.get('year') / 1000) + 1
    const fn = (this._utc ? UTC_GETTERS : LOCAL_GETTERS)[unit]
    if (!fn) throw new RangeError(`Cannot get unit "${unit}"`)
    return fn(this._d)
  }

  set(unit: UnitInput, value: number): DateTime {
    const canonical = resolveUnit(unit)
    const c = this.clone()
    const fn = (this._utc ? UTC_SETTERS : LOCAL_SETTERS)[canonical]
    if (!fn) throw new RangeError(`Cannot set unit "${canonical}"`)
    fn(c._d, value)
    return c
  }

  // Sugar getters/setters — Carbon-style
  year(v?: number): number | DateTime {
    return v == null ? this.get('year') : this.set('year', v)
  }
  month(v?: number): number | DateTime {
    return v == null ? this.get('month') : this.set('month', v)
  }
  date(v?: number): number | DateTime {
    return v == null ? this.get('date') : this.set('date', v)
  }
  hour(v?: number): number | DateTime {
    return v == null ? this.get('hour') : this.set('hour', v)
  }
  minute(v?: number): number | DateTime {
    return v == null ? this.get('minute') : this.set('minute', v)
  }
  second(v?: number): number | DateTime {
    return v == null ? this.get('second') : this.set('second', v)
  }
  millisecond(v?: number): number | DateTime {
    return v == null ? this.get('millisecond') : this.set('millisecond', v)
  }
  /** Day-of-week (0=Sun..6=Sat). Read-only. */
  dayOfWeek(): number {
    return this.get('day')
  }
  /** Day-of-year (1..366). */
  dayOfYear(): number {
    return _dayOfYear(this._d, this._utc)
  }
  /** ISO week number (1..53). */
  isoWeek(): number {
    return _isoWeek(this._d, this._utc)
  }
  isoWeekYear(): number {
    return _isoWeekYear(this._d, this._utc)
  }
  /** ISO weeks in the current ISO year — 52 or 53. */
  weeksInIsoYear(): number {
    return _weeksInIsoYear(this.isoWeekYear())
  }
  /** Locale-default week number (currently aliased to ISO). */
  week(): number {
    return this.isoWeek()
  }
  /** Total days in the current month. */
  daysInMonth(): number {
    return _daysInMonth(this.get('year'), this.get('month'))
  }
  daysInYear(): number {
    return _daysInYear(this.get('year'))
  }
  quarter(): number {
    return _quarterOf(this.get('month'))
  }
  weekday(): number {
    return this.get('day')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Arithmetic
  // ─────────────────────────────────────────────────────────────────────────

  add(n: number, unit: UnitInput): DateTime {
    const u = resolveUnit(unit)
    const c = this.clone()
    if (u === 'month') return DateTime._wrap(_addMonths(c._d, n, this._mode()), this._utc, this._localeName)
    if (u === 'quarter')
      return DateTime._wrap(_addMonths(c._d, n * 3, this._mode()), this._utc, this._localeName)
    if (u === 'year') return DateTime._wrap(_addYears(c._d, n, this._mode()), this._utc, this._localeName)
    if (u === 'decade')
      return DateTime._wrap(_addYears(c._d, n * 10, this._mode()), this._utc, this._localeName)
    if (u === 'century')
      return DateTime._wrap(_addYears(c._d, n * 100, this._mode()), this._utc, this._localeName)
    if (u === 'millennium')
      return DateTime._wrap(_addYears(c._d, n * 1000, this._mode()), this._utc, this._localeName)
    const ms = msPerUnit(u)
    return DateTime._wrap(new Date(this.valueOf() + n * ms), this._utc, this._localeName)
  }

  subtract(n: number, unit: UnitInput): DateTime {
    return this.add(-n, unit)
  }

  /** Difference between this and `other` in `unit`. Floored unless `floating`. */
  diff(other: DateInput, unit: UnitInput = 'millisecond', floating = false): number {
    const o = toDT(other)
    const u = resolveUnit(unit)
    const ms = this.valueOf() - o.valueOf()

    // For calendar units use calendar arithmetic (not raw ms / approx)
    if (u === 'year' || u === 'month' || u === 'quarter') {
      const sign = ms < 0 ? -1 : 1
      const a = sign === 1 ? o : this
      const b = sign === 1 ? this : o
      let units: number
      if (u === 'year') {
        units = b.get('year') - a.get('year')
        const probe = a.add(units, 'year')
        if (probe.isAfter(b)) units -= 1
      } else if (u === 'month') {
        units =
          (b.get('year') - a.get('year')) * 12 + (b.get('month') - a.get('month'))
        const probe = a.add(units, 'month')
        if (probe.isAfter(b)) units -= 1
      } else {
        units =
          (b.get('year') - a.get('year')) * 4 + (b.quarter() - a.quarter())
        const probe = a.add(units, 'quarter')
        if (probe.isAfter(b)) units -= 1
      }
      const result = sign * units
      if (!floating) return result
      // Floating refinement
      const startSame = a.add(units, u).valueOf()
      const endNext = a.add(units + 1, u).valueOf()
      const frac = (b.valueOf() - startSame) / (endNext - startSame)
      return Math.round((sign * (units + frac) + Number.EPSILON) * 100) / 100
    }

    const per = msPerUnit(u)
    const result = ms / per
    if (floating) return Math.round((result + Number.EPSILON) * 100) / 100
    return Math[result < 0 ? 'ceil' : 'floor'](result)
  }

  /** Convenience diffs. */
  diffInMilliseconds(other: DateInput): number {
    return this.diff(other, 'millisecond')
  }
  diffInSeconds(other: DateInput): number {
    return this.diff(other, 'second')
  }
  diffInMinutes(other: DateInput): number {
    return this.diff(other, 'minute')
  }
  diffInHours(other: DateInput): number {
    return this.diff(other, 'hour')
  }
  diffInDays(other: DateInput): number {
    return this.diff(other, 'day')
  }
  diffInWeeks(other: DateInput): number {
    return this.diff(other, 'week')
  }
  diffInMonths(other: DateInput): number {
    return this.diff(other, 'month')
  }
  diffInQuarters(other: DateInput): number {
    return this.diff(other, 'quarter')
  }
  diffInYears(other: DateInput): number {
    return this.diff(other, 'year')
  }

  /**
   * Count weekdays (Mon-Fri) between this and `other`. Excludes both endpoints.
   * Negative if `other` is earlier than this.
   */
  diffInWeekdays(other: DateInput): number {
    const a = this.valueOf() < toDT(other).valueOf() ? this : toDT(other)
    const b = this.valueOf() < toDT(other).valueOf() ? toDT(other) : this
    let count = 0
    let cursor = a.add(1, 'day').startOf('day')
    while (cursor.isBefore(b)) {
      if (cursor.isWeekday()) count++
      cursor = cursor.add(1, 'day')
    }
    return this.valueOf() < toDT(other).valueOf() ? count : -count
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Comparisons
  // ─────────────────────────────────────────────────────────────────────────

  isBefore(o: DateInput): boolean {
    return this.valueOf() < toDT(o).valueOf()
  }
  isAfter(o: DateInput): boolean {
    return this.valueOf() > toDT(o).valueOf()
  }
  isSame(o: DateInput, unit?: UnitInput): boolean {
    if (!unit) return this.valueOf() === toDT(o).valueOf()
    const u = resolveUnit(unit)
    return this.startOf(u as BoundaryUnit).valueOf() === toDT(o).startOf(u as BoundaryUnit).valueOf()
  }
  isSameOrBefore(o: DateInput, unit?: UnitInput): boolean {
    return this.isSame(o, unit) || this.isBefore(o)
  }
  isSameOrAfter(o: DateInput, unit?: UnitInput): boolean {
    return this.isSame(o, unit) || this.isAfter(o)
  }
  isBetween(a: DateInput, b: DateInput, unit?: UnitInput, inclusivity: Inclusivity = '()'): boolean {
    const self = unit
      ? this.startOf(resolveUnit(unit) as BoundaryUnit).valueOf()
      : this.valueOf()
    const A = unit
      ? toDT(a).startOf(resolveUnit(unit) as BoundaryUnit).valueOf()
      : toDT(a).valueOf()
    const B = unit
      ? toDT(b).startOf(resolveUnit(unit) as BoundaryUnit).valueOf()
      : toDT(b).valueOf()
    const leftOk = inclusivity[0] === '[' ? self >= A : self > A
    const rightOk = inclusivity[1] === ']' ? self <= B : self < B
    return leftOk && rightOk
  }

  // Operator-style aliases
  eq(o: DateInput): boolean {
    return this.valueOf() === toDT(o).valueOf()
  }
  ne(o: DateInput): boolean {
    return !this.eq(o)
  }
  lt(o: DateInput): boolean {
    return this.isBefore(o)
  }
  lte(o: DateInput): boolean {
    return this.isSameOrBefore(o)
  }
  gt(o: DateInput): boolean {
    return this.isAfter(o)
  }
  gte(o: DateInput): boolean {
    return this.isSameOrAfter(o)
  }

  /** Return the earlier of `this` and `other`. */
  min(other: DateInput): DateTime {
    return this.isBefore(other) ? this : toDT(other)
  }

  /** Return the later of `this` and `other`. */
  max(other: DateInput): DateTime {
    return this.isAfter(other) ? this : toDT(other)
  }

  /** From a list of candidates, return the one nearest to `this`. */
  closestTo(candidates: DateInput[]): DateTime {
    if (candidates.length === 0) throw new Error('closestTo: empty candidates')
    return candidates
      .map((c) => toDT(c))
      .reduce((best, next) =>
        Math.abs(next.valueOf() - this.valueOf()) < Math.abs(best.valueOf() - this.valueOf())
          ? next
          : best
      )
  }

  /** From a list of candidates, return the one farthest from `this`. */
  farthestFrom(candidates: DateInput[]): DateTime {
    if (candidates.length === 0) throw new Error('farthestFrom: empty candidates')
    return candidates
      .map((c) => toDT(c))
      .reduce((best, next) =>
        Math.abs(next.valueOf() - this.valueOf()) > Math.abs(best.valueOf() - this.valueOf())
          ? next
          : best
      )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // State queries
  // ─────────────────────────────────────────────────────────────────────────

  isDST(): boolean {
    if (this._utc) return false
    const y = this.get('year')
    const jan = new Date(y, 0, 1).getTimezoneOffset()
    const jul = new Date(y, 6, 1).getTimezoneOffset()
    return Math.min(jan, jul) === this._d.getTimezoneOffset()
  }

  isLeapYear(): boolean {
    return _isLeapYear(this.get('year'))
  }

  isWeekday(): boolean {
    const d = this.get('day')
    return d !== 0 && d !== 6
  }
  isWeekend(): boolean {
    return !this.isWeekday()
  }
  isSunday(): boolean {
    return this.get('day') === 0
  }
  isMonday(): boolean {
    return this.get('day') === 1
  }
  isTuesday(): boolean {
    return this.get('day') === 2
  }
  isWednesday(): boolean {
    return this.get('day') === 3
  }
  isThursday(): boolean {
    return this.get('day') === 4
  }
  isFriday(): boolean {
    return this.get('day') === 5
  }
  isSaturday(): boolean {
    return this.get('day') === 6
  }

  isPast(): boolean {
    return this.valueOf() < Clock.now()
  }
  isFuture(): boolean {
    return this.valueOf() > Clock.now()
  }
  isNow(): boolean {
    return this.valueOf() === Clock.now()
  }
  isMidnight(): boolean {
    return (
      this.get('hour') === 0 &&
      this.get('minute') === 0 &&
      this.get('second') === 0 &&
      this.get('millisecond') === 0
    )
  }
  isStartOfDay(): boolean {
    return this.isMidnight()
  }
  isEndOfDay(): boolean {
    return (
      this.get('hour') === 23 &&
      this.get('minute') === 59 &&
      this.get('second') === 59 &&
      this.get('millisecond') === 999
    )
  }

  /**
   * "Same Mar-15 as the birthday" — month + date match.
   */
  isBirthday(birthday: DateInput): boolean {
    const b = toDT(birthday)
    return b.get('month') === this.get('month') && b.get('date') === this.get('date')
  }

  // Same/Current/Next/Last variants — generated programmatically below
  isSameYear(o: DateInput): boolean {
    return this.isSame(o, 'year')
  }
  isSameMonth(o: DateInput): boolean {
    return this.isSame(o, 'month')
  }
  isSameWeek(o: DateInput): boolean {
    return this.isSame(o, 'week')
  }
  isSameDay(o: DateInput): boolean {
    return this.isSame(o, 'day')
  }
  isSameHour(o: DateInput): boolean {
    return this.isSame(o, 'hour')
  }
  isSameMinute(o: DateInput): boolean {
    return this.isSame(o, 'minute')
  }
  isSameSecond(o: DateInput): boolean {
    return this.isSame(o, 'second')
  }
  isSameQuarter(o: DateInput): boolean {
    return (
      this.get('year') === toDT(o).get('year') && this.quarter() === toDT(o).quarter()
    )
  }

  isToday(): boolean {
    return this.isSame(DateTime.now(), 'day')
  }
  isTomorrow(): boolean {
    return this.isSame(DateTime.now().add(1, 'day'), 'day')
  }
  isYesterday(): boolean {
    return this.isSame(DateTime.now().subtract(1, 'day'), 'day')
  }
  isCurrentWeek(): boolean {
    return this.isSame(DateTime.now(), 'week')
  }
  isNextWeek(): boolean {
    return this.isSame(DateTime.now().add(1, 'week'), 'week')
  }
  isLastWeek(): boolean {
    return this.isSame(DateTime.now().subtract(1, 'week'), 'week')
  }
  isCurrentMonth(): boolean {
    return this.isSame(DateTime.now(), 'month')
  }
  isNextMonth(): boolean {
    return this.isSame(DateTime.now().add(1, 'month'), 'month')
  }
  isLastMonth(): boolean {
    return this.isSame(DateTime.now().subtract(1, 'month'), 'month')
  }
  isCurrentQuarter(): boolean {
    return this.isSameQuarter(DateTime.now())
  }
  isNextQuarter(): boolean {
    return this.isSameQuarter(DateTime.now().add(1, 'quarter'))
  }
  isLastQuarter(): boolean {
    return this.isSameQuarter(DateTime.now().subtract(1, 'quarter'))
  }
  isCurrentYear(): boolean {
    return this.isSame(DateTime.now(), 'year')
  }
  isNextYear(): boolean {
    return this.isSame(DateTime.now().add(1, 'year'), 'year')
  }
  isLastYear(): boolean {
    return this.isSame(DateTime.now().subtract(1, 'year'), 'year')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTC / local
  // ─────────────────────────────────────────────────────────────────────────

  utc(): DateTime {
    return new DateTime(this.valueOf(), { utc: true, locale: this._localeName ?? undefined })
  }

  local(): DateTime {
    return new DateTime(this.valueOf(), { utc: false, locale: this._localeName ?? undefined })
  }

  /** UTC offset in minutes (positive = ahead of UTC). */
  utcOffset(): number {
    return this._utc ? 0 : -this._d.getTimezoneOffset()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Boundary navigation
  // ─────────────────────────────────────────────────────────────────────────

  startOf(unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_startOf(this._d, u, this._mode()), this._utc, this._localeName)
  }

  endOf(unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_endOf(this._d, u, this._mode()), this._utc, this._localeName)
  }

  /** First occurrence within month/quarter/year. Optionally pinned to weekday. */
  firstOf(container: 'month' | 'quarter' | 'year', weekday?: number): DateTime {
    return DateTime._wrap(
      _firstOf(this._d, container, this._mode(), weekday),
      this._utc,
      this._localeName
    )
  }

  /** Last occurrence within month/quarter/year. Optionally pinned to weekday. */
  lastOf(container: 'month' | 'quarter' | 'year', weekday?: number): DateTime {
    return DateTime._wrap(
      _lastOf(this._d, container, this._mode(), weekday),
      this._utc,
      this._localeName
    )
  }

  /**
   * Nth occurrence of `weekday` within `container`.
   * Returns invalid DateTime (NaN) if N exceeds count of that weekday.
   */
  nthOf(container: 'month' | 'quarter' | 'year', n: number, weekday: number): DateTime {
    const r = _nthOf(this._d, container, n, weekday, this._mode())
    if (r === null) return new DateTime(NaN)
    return DateTime._wrap(r, this._utc, this._localeName)
  }

  /**
   * Move to the next occurrence of a weekday (0=Sun..6=Sat). Without
   * argument, advances to the same weekday next week.
   */
  next(weekday?: number): DateTime {
    const target = weekday ?? this.get('day')
    const dow = this.get('day')
    let diff = (target - dow + 7) % 7
    if (diff === 0) diff = 7
    return this.add(diff, 'day')
  }

  /** Move to the previous occurrence of a weekday. */
  previous(weekday?: number): DateTime {
    const target = weekday ?? this.get('day')
    const dow = this.get('day')
    let diff = (dow - target + 7) % 7
    if (diff === 0) diff = 7
    return this.subtract(diff, 'day')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Round / Floor / Ceil
  // ─────────────────────────────────────────────────────────────────────────

  round(unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_round(this._d, u, this._mode()), this._utc, this._localeName)
  }
  floor(unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_floor(this._d, u, this._mode()), this._utc, this._localeName)
  }
  ceil(unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_ceil(this._d, u, this._mode()), this._utc, this._localeName)
  }
  /** Round to the nearest multiple of `n` of `unit`. */
  roundTo(n: number, unit: UnitInput | BoundaryUnit): DateTime {
    const u = (unit === 'isoWeek' ? 'isoWeek' : resolveUnit(unit as UnitInput)) as BoundaryUnit
    return DateTime._wrap(_roundToMultiple(this._d, n, u), this._utc, this._localeName)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Formatting
  // ─────────────────────────────────────────────────────────────────────────

  format(fmt = 'YYYY-MM-DD HH:mm:ss'): string {
    if (!this.isValid()) return 'Invalid Date'
    return formatDate(fmt, this._components(), this.getLocaleData())
  }

  formatIntl(opts: Intl.DateTimeFormatOptions = {}): string {
    return _formatIntl(this.toDate(), this._utc, this._localeName ?? Locales.getDefault(), opts)
  }

  toString(): string {
    return this.isValid() ? this.toISOString() : 'Invalid Date'
  }
  toISOString(): string {
    return toISO(this.valueOf())
  }
  toJSON(): string {
    return this.toISOString()
  }
  toRFC2822(): string {
    return _toRFC2822(this._d)
  }
  toRFC3339(): string {
    return _toRFC3339(this._d)
  }
  toExcel(): number {
    return _toExcel(this.valueOf())
  }
  toSQL(): string {
    return _toSQL(this._d)
  }
  toSQLDate(): string {
    return _toSQLDate(this._d)
  }
  toSQLTime(): string {
    return _toSQLTime(this._d)
  }
  toMillis(): number {
    return this.valueOf()
  }
  toUnix(): number {
    return this.unix()
  }

  toObject(): Required<Omit<DateObject, 'day'>> & { day: number } {
    return {
      year: this.get('year'),
      month: this.get('month'),
      day: this.get('date'),
      hour: this.get('hour'),
      minute: this.get('minute'),
      second: this.get('second'),
      millisecond: this.get('millisecond')
    }
  }

  toArray(): [number, number, number, number, number, number, number] {
    return [
      this.get('year'),
      this.get('month') - 1,
      this.get('date'),
      this.get('hour'),
      this.get('minute'),
      this.get('second'),
      this.get('millisecond')
    ]
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Relative
  // ─────────────────────────────────────────────────────────────────────────

  fromNow(withoutSuffix = false): string {
    return _relativeTime(this.valueOf() - Clock.now(), this.getLocaleData().relativeTime, withoutSuffix)
  }

  from(other: DateInput, withoutSuffix = false): string {
    return _relativeTime(this.valueOf() - toDT(other).valueOf(), this.getLocaleData().relativeTime, withoutSuffix)
  }

  toNow(withoutSuffix = false): string {
    return _relativeTime(Clock.now() - this.valueOf(), this.getLocaleData().relativeTime, withoutSuffix)
  }

  to(other: DateInput, withoutSuffix = false): string {
    return _relativeTime(toDT(other).valueOf() - this.valueOf(), this.getLocaleData().relativeTime, withoutSuffix)
  }

  /** Carbon-style alias for `fromNow`. */
  diffForHumans(other?: DateInput): string {
    return other === undefined ? this.fromNow() : this.from(other)
  }

  calendar(reference?: DateInput): string {
    const ref = reference ? toDT(reference) : DateTime.now()
    const refStart = ref.startOf('day')
    const thisStart = this.startOf('day')
    const diffDays = (thisStart.valueOf() - refStart.valueOf()) / 86_400_000
    const loc = this.getLocaleData()
    return _calendarLabel(
      diffDays,
      this.format(loc.longDateFormat.LT ?? 'h:mm A'),
      this.format(loc.longDateFormat.L ?? 'MM/DD/YYYY'),
      this.format('dddd'),
      loc.calendar
    )
  }

  preciseDiff(other: DateInput): PreciseDiffResult {
    const o = toDT(other)
    const isAfter = this.valueOf() >= o.valueOf()
    const a = isAfter ? o : this
    const b = isAfter ? this : o
    const prevMonth = new DateTime(new Date(b.get('year'), b.get('month') - 2, 1))
    return _preciseDiff(
      {
        year: a.get('year'),
        month: a.get('month'),
        date: a.get('date'),
        hour: a.get('hour'),
        minute: a.get('minute'),
        second: a.get('second'),
        millisecond: a.get('millisecond')
      },
      {
        year: b.get('year'),
        month: b.get('month'),
        date: b.get('date'),
        hour: b.get('hour'),
        minute: b.get('minute'),
        second: b.get('second'),
        millisecond: b.get('millisecond')
      },
      prevMonth.daysInMonth()
    )
  }

  preciseFrom(other: DateInput, maxParts = 3): string {
    return this.preciseDiff(other).humanize(maxParts)
  }

  age(): AgeResult {
    return _age(DateTime.now().preciseDiff(this))
  }

  countdown(): CountdownResult {
    return _countdown(this.valueOf(), Clock.now())
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar grid
  // ─────────────────────────────────────────────────────────────────────────

  calendarGrid(opts: CalendarGridOptions = {}): CalendarCell<DateTime>[][] {
    const weekStartOffset =
      opts.weekStart === 'monday' ? 1 : opts.weekStart === 'saturday' ? 6 : 0
    const year = this.get('year')
    const month = this.get('month')
    const firstDay = new DateTime(new Date(year, month - 1, 1))
    const dim = this.daysInMonth()
    const today = DateTime.now().startOf('day')
    const startPad = (firstDay.get('day') - weekStartOffset + 7) % 7

    const cells: CalendarCell<DateTime>[] = []
    for (let i = startPad - 1; i >= 0; i--) {
      const d = firstDay.subtract(i + 1, 'day').startOf('day')
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.isSame(today, 'day'),
        isWeekend: d.isWeekend()
      })
    }
    for (let day = 1; day <= dim; day++) {
      const d = new DateTime(new Date(year, month - 1, day))
      cells.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.isSame(today, 'day'),
        isWeekend: d.isWeekend()
      })
    }
    let nextDay = 1
    while (cells.length < 42) {
      const d = new DateTime(new Date(year, month, nextDay++))
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.isSame(today, 'day'),
        isWeekend: d.isWeekend()
      })
    }

    const grid: CalendarCell<DateTime>[][] = []
    for (let i = 0; i < 42; i += 7) grid.push(cells.slice(i, i + 7))
    return grid
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fiscal year
  // ─────────────────────────────────────────────────────────────────────────

  fiscalYear(config: FiscalConfig = { startMonth: 1 }): number {
    if (config.startMonth === 1) return this.get('year')
    return this.get('month') >= config.startMonth ? this.get('year') + 1 : this.get('year')
  }

  fiscalQuarter(config: FiscalConfig = { startMonth: 1 }): number {
    const adjusted = ((this.get('month') - config.startMonth + 12) % 12) + 1
    return Math.ceil(adjusted / 3)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  private _mode(): Mode {
    return this._utc ? 'utc' : 'local'
  }

  private _components(): DateComponents {
    return {
      year: this.get('year'),
      month: this.get('month'),
      date: this.get('date'),
      hour: this.get('hour'),
      minute: this.get('minute'),
      second: this.get('second'),
      millisecond: this.get('millisecond'),
      day: this.get('day'),
      timestampMs: this.valueOf(),
      dayOfYear: this.dayOfYear(),
      isoWeek: this.isoWeek(),
      isoWeekYear: this.isoWeekYear(),
      quarter: this.quarter(),
      nativeDate: this._d,
      offsetMinutes: this._utc ? 0 : undefined
    }
  }

  /** Internal: build a DateTime from a JS Date with explicit utc flag. */
  private static _wrap(d: Date, utc: boolean, localeName: string | null): DateTime {
    const out = new DateTime(d, { utc })
    if (localeName) out._localeName = localeName
    return out
  }
}

// ── Module augmentation hook for plugins ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DateTime extends DateTimePluginMethods {}

export default DateTime
