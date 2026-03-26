import type {
  Unit,
  UnitInput,
  DateInput,
  LocaleData,
  PluginFn,
  PreciseDiffResult,
  AgeResult,
  CountdownResult,
  CalendarCell,
  CalendarGridOptions,
  FiscalConfig,
  DateObject,
  Inclusivity,
} from './type'
import { MS_PER_UNIT, PARSE_TOKEN_RE } from './constants'
import {
  resolveUnit,
  LOCAL_GETTERS,
  UTC_GETTERS,
  LOCAL_SETTERS,
  UTC_SETTERS,
} from './helpers'
import Duration from './Duration'

// Formatting (pure functions — no circular dependency)
import { formatDate, formatIntl, resolveLocale, type DateComponents } from './formatting'

// Serialization (pure functions)
import { toRFC2822 as _toRFC2822, toRFC3339 as _toRFC3339, toExcel as _toExcel } from './serializers'

// Relative time (pure functions)
import {
  relativeTime,
  calendarLabel,
  preciseDiff as _preciseDiff,
  age as _age,
  countdown as _countdown,
} from './relative'

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

function toDF(input: DateInput): DateFormat {
  return input instanceof DateFormat ? input : new DateFormat(input as string | number | Date)
}

// ─────────────────────────────────────────────────────────────────────────────
// DateFormat class — thin facade over pure-function modules
// ─────────────────────────────────────────────────────────────────────────────

export default class DateFormat {
  private static _plugins: PluginFn[] = []
  private static _locales: Record<string, LocaleData> = {}
  private static _currentLocale: string | null = null

  private readonly _d: Date
  private readonly _utc: boolean

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor(
    input: string | number | Date | DateFormat = Date.now(),
    opts: { utc?: boolean } = {}
  ) {
    let isUtc = opts.utc ?? false
    let adjustedInput: string | number | Date | DateFormat = input

    if (typeof input === 'string') {
      if (input.endsWith('Z')) {
        isUtc = true
        adjustedInput = input.slice(0, -1)
      } else if (ISO_DATETIME.test(input) || ISO_DATE.test(input)) {
        isUtc = true
        adjustedInput = input
      }
    }

    if (adjustedInput instanceof DateFormat) {
      this._d = new Date(adjustedInput.valueOf())
      this._utc = adjustedInput._utc
    } else if (adjustedInput instanceof Date) {
      this._d = new Date(adjustedInput.getTime())
      this._utc = isUtc
    } else if (typeof adjustedInput === 'number') {
      this._d = new Date(adjustedInput)
      this._utc = isUtc
    } else {
      const s = adjustedInput as string
      if (isUtc && !/[zZ]$/.test(s) && !/[+-]\d\d:?\d\d$/.test(s)) {
        this._d = new Date(s + 'Z')
      } else {
        this._d = new Date(s)
      }
      this._utc = isUtc
    }

    for (const p of DateFormat._plugins) {
      p(DateFormat, DateFormat)
    }
  }

  // ── Static API ──────────────────────────────────────────────────────────

  static parse(str = '', fmt = '', strict = false): DateFormat {
    if (!fmt) {
      return new DateFormat(str, { utc: str.endsWith('Z') })
    }

    const escapes: string[] = []
    const cleanFmt = fmt.replace(/\[([^\]]*)\]/g, (_, text) => {
      escapes.push(text)
      return `\x00${escapes.length - 1}\x00`
    })

    let pattern = cleanFmt
    for (const [tok, rx] of Object.entries(PARSE_TOKEN_RE)) {
      pattern = pattern.replace(new RegExp(tok, 'g'), rx)
    }
    pattern = pattern.replace(/\x00(\d+)\x00/g, (_, idx) => {
      return escapes[Number(idx)].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })

    const re = new RegExp(`^${pattern}$`)
    const m = re.exec(str)
    if (!m) return new DateFormat(NaN)

    const parts: Record<string, number | string> = {}
    const toks = cleanFmt.match(/YYYY|MM|DD|HH|hh|mm|ss|X|x|DDD|DDDD|Z/g) || []
    toks.forEach((t, i) => { parts[t] = m[i + 1] })

    if (strict) {
      const mm = parts.MM != null ? Number(parts.MM) : null
      if (mm !== null && (mm < 1 || mm > 12)) return new DateFormat(NaN)
      const dd = parts.DD != null ? Number(parts.DD) : null
      if (dd !== null) {
        const dim = new Date(Number(parts.YYYY || 1970), mm ?? 1, 0).getDate()
        if (dd < 1 || dd > dim) return new DateFormat(NaN)
      }
    }

    if (parts.x != null) return new DateFormat(Number(parts.x), { utc: true })
    if (parts.X != null) return new DateFormat(Number(parts.X) * 1000, { utc: true })

    const Y = Number(parts.YYYY || 1970)
    const Mo = Number(parts.MM || 1) - 1
    const D = Number(parts.DD || 1)
    const h = Number(parts.HH ?? parts.hh ?? 0)
    const mi = Number(parts.mm || 0)
    const s = Number(parts.ss || 0)

    const sawZ = parts.Z === 'Z'
    const sawOff = typeof parts.Z === 'string' && parts.Z !== 'Z' && parts.Z !== undefined

    const onlyDateTokens =
      !cleanFmt.includes('H') && !cleanFmt.includes('h') &&
      !cleanFmt.includes('m') && !cleanFmt.includes('s')
    if (strict && onlyDateTokens && !sawOff && !sawZ) {
      return new DateFormat(new Date(Y, Mo, D, 0, 0, 0), { utc: false })
    }

    const baseUtcMs = Date.UTC(Y, Mo, D, h, mi, s)
    const inst = new DateFormat(baseUtcMs, { utc: sawZ || sawOff })

    if (sawOff) {
      const ofs = (parts.Z as string).replace(':', '')
      const sign = ofs[0] === '+' ? 1 : -1
      const hh2 = Number(ofs.substring(1, 3))
      const mm2 = Number(ofs.substring(3, 5))
      const offset = sign * (hh2 * 60 + mm2) * 60_000
      return new DateFormat(inst.valueOf() - offset, { utc: false })
    }

    return inst
  }

  static fromObject(obj: DateObject, opts: { utc?: boolean } = {}): DateFormat {
    const { year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0 } = obj
    if (opts.utc) {
      return new DateFormat(Date.UTC(year, month - 1, day, hour, minute, second, millisecond), { utc: true })
    }
    return new DateFormat(new Date(year, month - 1, day, hour, minute, second, millisecond))
  }

  static use(plugin: PluginFn): typeof DateFormat {
    DateFormat._plugins.push(plugin)
    plugin(DateFormat, DateFormat)
    return DateFormat
  }

  static min(...args: DateInput[]): DateFormat {
    return args.map(toDF).reduce((a, b) => (a.isBefore(b) ? a : b))
  }

  static max(...args: DateInput[]): DateFormat {
    return args.map(toDF).reduce((a, b) => (a.isAfter(b) ? a : b))
  }

  static duration(n: number, unit: UnitInput): Duration {
    const canonical = resolveUnit(unit)
    const ms = MS_PER_UNIT[canonical]
    return new Duration(n * (isNaN(ms) ? 0 : ms))
  }

  static locale(name: string, data?: LocaleData): void {
    if (data) DateFormat._locales[name] = data
    DateFormat._currentLocale = name
  }

  // ── Core ────────────────────────────────────────────────────────────────

  valueOf(): number { return this._d.getTime() }
  unix(): number { return Math.floor(this.valueOf() / 1000) }
  isValid(): boolean { return !isNaN(this._d.getTime()) }
  isUtc(): boolean { return this._utc }
  isLocal(): boolean { return !this._utc }
  toDate(): Date { return new Date(this.valueOf()) }

  clone(): DateFormat {
    return new DateFormat(this, { utc: this._utc })
  }

  // ── Get / Set ───────────────────────────────────────────────────────────

  get(u: Unit | 'day'): number {
    const fn = (this._utc ? UTC_GETTERS : LOCAL_GETTERS)[u]
    if (!fn) throw new Error(`Unknown unit "${u}"`)
    return fn(this._d)
  }

  set(u: UnitInput, val: number): DateFormat {
    const canonical = resolveUnit(u)
    const inst = this.clone()
    const fn = (inst._utc ? UTC_SETTERS : LOCAL_SETTERS)[canonical]
    if (!fn) throw new Error(`Unknown unit "${canonical}"`)
    fn(inst._d, val)
    return inst
  }

  // ── Arithmetic ──────────────────────────────────────────────────────────

  add(n: number, unit: UnitInput): DateFormat {
    const canonical = resolveUnit(unit)
    if (canonical === 'month' || canonical === 'year') {
      return this.set(canonical, this.get(canonical) + n)
    }
    const ms = MS_PER_UNIT[canonical]
    if (isNaN(ms)) throw new Error(`Unknown unit "${canonical}"`)
    return new DateFormat(this.valueOf() + n * ms, { utc: this._utc })
  }

  subtract(n: number, unit: UnitInput): DateFormat {
    return this.add(-n, unit)
  }

  diff(other: DateInput, unit: UnitInput = 'millisecond', floating = false): number {
    const o = toDF(other)
    const ms = this.valueOf() - o.valueOf()
    const canonical = resolveUnit(unit)
    const per = MS_PER_UNIT[canonical] || 1
    const result = ms / per
    if (floating) return Math.round((result + Number.EPSILON) * 100) / 100
    return Math[result < 0 ? 'ceil' : 'floor'](result)
  }

  // ── Comparisons ─────────────────────────────────────────────────────────

  isBefore(o: DateInput): boolean { return this.valueOf() < toDF(o).valueOf() }
  isAfter(o: DateInput): boolean { return this.valueOf() > toDF(o).valueOf() }

  isSame(o: DateInput, unit?: UnitInput): boolean {
    if (!unit) return this.valueOf() === toDF(o).valueOf()
    const canonical = resolveUnit(unit)
    return this.startOf(canonical).valueOf() === toDF(o).startOf(canonical).valueOf()
  }

  isSameOrBefore(o: DateInput, unit?: UnitInput): boolean {
    return this.isSame(o, unit) || this.isBefore(o)
  }

  isSameOrAfter(o: DateInput, unit?: UnitInput): boolean {
    return this.isSame(o, unit) || this.isAfter(o)
  }

  isBetween(a: DateInput, b: DateInput, unit?: UnitInput, inclusivity: Inclusivity = '()'): boolean {
    const self = unit ? this.startOf(resolveUnit(unit)).valueOf() : this.valueOf()
    const A = unit ? toDF(a).startOf(resolveUnit(unit)).valueOf() : toDF(a).valueOf()
    const B = unit ? toDF(b).startOf(resolveUnit(unit)).valueOf() : toDF(b).valueOf()
    const leftOk = inclusivity[0] === '[' ? self >= A : self > A
    const rightOk = inclusivity[1] === ']' ? self <= B : self < B
    return leftOk && rightOk
  }

  // ── Validation queries ──────────────────────────────────────────────────

  isDST(): boolean {
    if (this._utc) return false
    const jan = new Date(this.get('year'), 0, 1).getTimezoneOffset()
    const jul = new Date(this.get('year'), 6, 1).getTimezoneOffset()
    return Math.min(jan, jul) === this._d.getTimezoneOffset()
  }

  isLeapYear(): boolean {
    const y = this.get('year')
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  }

  // ── Weekday queries ─────────────────────────────────────────────────────

  isWeekday(): boolean { const d = this.get('day'); return d !== 0 && d !== 6 }
  isWeekend(): boolean { return !this.isWeekday() }
  isSunday(): boolean { return this.get('day') === 0 }
  isMonday(): boolean { return this.get('day') === 1 }
  isTuesday(): boolean { return this.get('day') === 2 }
  isWednesday(): boolean { return this.get('day') === 3 }
  isThursday(): boolean { return this.get('day') === 4 }
  isFriday(): boolean { return this.get('day') === 5 }
  isSaturday(): boolean { return this.get('day') === 6 }

  // ── Temporal queries (DRY via private helpers) ──────────────────────────

  private _isSamePeriod(other: DateInput, unit: Unit | 'week' | 'quarter'): boolean {
    const o = toDF(other)
    switch (unit) {
      case 'year': return this.get('year') === o.get('year')
      case 'month': return this.get('year') === o.get('year') && this.get('month') === o.get('month')
      case 'week': return this.isoWeek() === o.isoWeek() && this.get('year') === o.get('year')
      case 'day': case 'date':
        return this.get('year') === o.get('year') && this.get('month') === o.get('month') && this.get('date') === o.get('date')
      case 'hour': return this._isSamePeriod(other, 'day') && this.get('hour') === o.get('hour')
      case 'minute': return this._isSamePeriod(other, 'hour') && this.get('minute') === o.get('minute')
      case 'second': return this._isSamePeriod(other, 'minute') && this.get('second') === o.get('second')
      case 'quarter': return this.get('year') === o.get('year') && this.quarter() === o.quarter()
      default: return this.valueOf() === o.valueOf()
    }
  }

  private _isRelativePeriod(offset: number, unit: Unit | 'week' | 'quarter'): boolean {
    const now = this._now()
    const target = offset === 0 ? now : (offset > 0 ? now.add(offset, unit as Unit) : now.subtract(-offset, unit as Unit))
    return this._isSamePeriod(target, unit)
  }

  private _isSameDivision(other: DateInput, divisor: number): boolean {
    return Math.floor(this.get('year') / divisor) === Math.floor(toDF(other).get('year') / divisor)
  }

  private _isRelativeDivision(offset: number, divisor: number): boolean {
    return Math.floor(this.get('year') / divisor) === Math.floor(this._now().get('year') / divisor) + offset
  }

  // Year
  isSameYear(other: DateInput): boolean { return this._isSamePeriod(other, 'year') }
  isCurrentYear(): boolean { return this._isRelativePeriod(0, 'year') }
  isNextYear(): boolean { return this._isRelativePeriod(1, 'year') }
  isLastYear(): boolean { return this._isRelativePeriod(-1, 'year') }

  // Month
  isSameMonth(other: DateInput): boolean { return this._isSamePeriod(other, 'month') }
  isCurrentMonth(): boolean { return this._isRelativePeriod(0, 'month') }
  isNextMonth(): boolean { return this._isRelativePeriod(1, 'month') }
  isLastMonth(): boolean { return this._isRelativePeriod(-1, 'month') }

  // Week
  isSameWeek(other: DateInput): boolean { return this._isSamePeriod(other, 'week') }
  isCurrentWeek(): boolean { return this._isRelativePeriod(0, 'week') }
  isNextWeek(): boolean { return this._isRelativePeriod(1, 'week') }
  isLastWeek(): boolean { return this._isRelativePeriod(-1, 'week') }

  // Day
  isSameDay(other: DateInput): boolean { return this._isSamePeriod(other, 'day') }
  isCurrentDay(): boolean { return this._isRelativePeriod(0, 'day') }
  isNextDay(): boolean { return this._isRelativePeriod(1, 'day') }
  isLastDay(): boolean { return this._isRelativePeriod(-1, 'day') }
  isToday(): boolean { return this.isCurrentDay() }
  isTomorrow(): boolean { return this.isNextDay() }
  isYesterday(): boolean { return this.isLastDay() }

  // Hour
  isSameHour(other: DateInput): boolean { return this._isSamePeriod(other, 'hour') }
  isCurrentHour(): boolean { return this._isRelativePeriod(0, 'hour') }
  isNextHour(): boolean { return this._isRelativePeriod(1, 'hour') }
  isLastHour(): boolean { return this._isRelativePeriod(-1, 'hour') }

  // Minute
  isSameMinute(other: DateInput): boolean { return this._isSamePeriod(other, 'minute') }
  isCurrentMinute(): boolean { return this._isRelativePeriod(0, 'minute') }
  isNextMinute(): boolean { return this._isRelativePeriod(1, 'minute') }
  isLastMinute(): boolean { return this._isRelativePeriod(-1, 'minute') }

  // Second
  isSameSecond(other: DateInput): boolean { return this._isSamePeriod(other, 'second') }
  isCurrentSecond(): boolean { return this._isRelativePeriod(0, 'second') }
  isNextSecond(): boolean { return this._isRelativePeriod(1, 'second') }
  isLastSecond(): boolean { return this._isRelativePeriod(-1, 'second') }

  // Millisecond
  isSameMillisecond(other: DateInput): boolean { return this.valueOf() === toDF(other).valueOf() }
  isCurrentMillisecond(): boolean { return this.valueOf() === this._now().valueOf() }
  isNextMillisecond(): boolean { return this.valueOf() === this._now().valueOf() + 1 }
  isLastMillisecond(): boolean { return this.valueOf() === this._now().valueOf() - 1 }

  // Microsecond aliases (JS Date has millisecond precision; these alias to millisecond)
  isSameMicro(other: DateInput): boolean { return this.isSameMillisecond(other) }
  isCurrentMicro(): boolean { return this.isCurrentMillisecond() }
  isNextMicro(): boolean { return this.isNextMillisecond() }
  isLastMicro(): boolean { return this.isLastMillisecond() }
  isSameMicrosecond(other: DateInput): boolean { return this.isSameMillisecond(other) }
  isCurrentMicrosecond(): boolean { return this.isCurrentMillisecond() }
  isNextMicrosecond(): boolean { return this.isNextMillisecond() }
  isLastMicrosecond(): boolean { return this.isLastMillisecond() }

  // Quarter
  isSameQuarter(other: DateInput): boolean { return this._isSamePeriod(other, 'quarter') }
  isCurrentQuarter(): boolean { return this._isRelativePeriod(0, 'quarter') }
  isNextQuarter(): boolean { return this._isRelativePeriod(3, 'month') && !this.isCurrentQuarter() }
  isLastQuarter(): boolean { return this._isRelativePeriod(-3, 'month') && !this.isCurrentQuarter() }

  // Decade / Century / Millennium
  isSameDecade(other: DateInput): boolean { return this._isSameDivision(other, 10) }
  isCurrentDecade(): boolean { return this._isRelativeDivision(0, 10) }
  isNextDecade(): boolean { return this._isRelativeDivision(1, 10) }
  isLastDecade(): boolean { return this._isRelativeDivision(-1, 10) }

  isSameCentury(other: DateInput): boolean { return this._isSameDivision(other, 100) }
  isCurrentCentury(): boolean { return this._isRelativeDivision(0, 100) }
  isNextCentury(): boolean { return this._isRelativeDivision(1, 100) }
  isLastCentury(): boolean { return this._isRelativeDivision(-1, 100) }

  isSameMillennium(other: DateInput): boolean { return this._isSameDivision(other, 1000) }
  isCurrentMillennium(): boolean { return this._isRelativeDivision(0, 1000) }
  isNextMillennium(): boolean { return this._isRelativeDivision(1, 1000) }
  isLastMillennium(): boolean { return this._isRelativeDivision(-1, 1000) }

  // ── UTC / Local conversion ──────────────────────────────────────────────

  utc(): DateFormat {
    const c = this.clone()
    Object.defineProperty(c, '_utc', { value: true, writable: false, enumerable: true, configurable: true })
    return c
  }

  local(): DateFormat {
    if (!this._utc) return this.clone()
    return new DateFormat(new Date(this.valueOf()))
  }

  // ── Calendar info ───────────────────────────────────────────────────────

  daysInMonth(): number { return new Date(this.get('year'), this.get('month'), 0).getDate() }

  dayOfYear(): number {
    const start = DateFormat.parse(`${this.get('year')}-01-01`, 'YYYY-MM-DD', true)
    return Math.floor((this.valueOf() - start.valueOf()) / 864e5) + 1
  }

  weekday(): number { return this.get('day') }

  isoWeek(): number {
    const d = new Date(this._utc ? this.valueOf() : this.local().valueOf())
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  isoWeekYear(): number {
    const d = new Date(this._utc ? this.valueOf() : this.local().valueOf())
    d.setDate(d.getDate() + 3 - (d.getDay() || 7))
    return d.getFullYear()
  }

  week(): number { return this.isoWeek() }

  weeksInYear(): number {
    const lastDay = new Date(this.get('year'), 11, 31)
    return new DateFormat(lastDay).isoWeek() === 1 ? 52 : 53
  }

  quarter(): number { return Math.ceil(this.get('month') / 3) }

  // ── Start / End of period ───────────────────────────────────────────────

  startOf(u: UnitInput | 'week' | 'quarter'): DateFormat {
    const d = this.clone()
    switch (u) {
      case 'year': case 'y': case 'years':
        return d.set('month', 1).set('date', 1).startOf('day')
      case 'month': case 'M': case 'months':
        return d.set('date', 1).startOf('day')
      case 'week': case 'w': case 'weeks':
        return d.subtract(d.get('day'), 'day').startOf('day')
      case 'quarter':
        return d.set('month', Math.floor((d.get('month') - 1) / 3) * 3 + 1).startOf('month')
      case 'day': case 'd': case 'days': case 'date':
        return d.set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)
      case 'hour': case 'h': case 'hours':
        return d.set('minute', 0).set('second', 0).set('millisecond', 0)
      case 'minute': case 'm': case 'minutes':
        return d.set('second', 0).set('millisecond', 0)
      case 'second': case 's': case 'seconds':
        return d.set('millisecond', 0)
      default: return d
    }
  }

  endOf(u: UnitInput | 'week' | 'quarter'): DateFormat {
    return this.startOf(u).add(1, u as Unit).subtract(1, 'millisecond')
  }

  // ── Formatting (delegates to formatting.ts) ─────────────────────────────

  private _locale() {
    const data = DateFormat._locales[DateFormat._currentLocale || 'en']
    return resolveLocale(data)
  }

  private _components(): DateComponents {
    return {
      year: this.get('year'),
      month: this.get('month'),
      date: this.get('date'),
      hour: this.get('hour'),
      minute: this.get('minute'),
      second: this.get('second'),
      day: this.get('day'),
      timestampMs: this.toDate().getTime(),
      dayOfYear: this.dayOfYear(),
      isoWeek: this.isoWeek(),
      isoWeekYear: this.isoWeekYear(),
      nativeDate: this._d,
    }
  }

  format(fmt = 'YYYY-MM-DD HH:mm:ss'): string {
    if (!this.isValid()) return 'Invalid Date'
    return formatDate(fmt, this._components(), this._locale())
  }

  formatIntl(opts: Intl.DateTimeFormatOptions = {}): string {
    return formatIntl(this.toDate(), this._utc, DateFormat._currentLocale || undefined, opts)
  }

  // ── Relative time (delegates to relative.ts) ───────────────────────────

  fromNow(): string {
    const diffMs = this.valueOf() - this._now().valueOf()
    return relativeTime(diffMs, this._locale().relativeTime)
  }

  calendar(): string {
    const loc = this._locale()
    return calendarLabel(
      this.valueOf(),
      this._now().startOf('day').valueOf(),
      this.format('hh:mm A'),
      this.format('YYYY-MM-DD'),
      loc.calendar,
    )
  }

  // ── Serialization (delegates to serializers.ts) ─────────────────────────

  toISOString(): string { return new Date(this.valueOf()).toISOString() }
  toJSON(): string { return this.toISOString() }
  toMillis(): number { return this.valueOf() }
  toRFC2822(): string { return _toRFC2822(this._d) }
  toRFC3339(): string { return _toRFC3339(this._d) }
  toExcel(): number { return _toExcel(this.valueOf()) }
  toSQL(): string { return this.format('YYYY-MM-DD HH:mm:ss') }
  toSQLDate(): string { return this.format('YYYY-MM-DD') }
  toSQLTime(): string { return this.format('HH:mm:ss') }

  toString(): string {
    return this.isValid() ? this.toISOString() : 'Invalid Date'
  }

  toObject() {
    return {
      year: this.get('year'), month: this.get('month'), date: this.get('date'),
      hour: this.get('hour'), minute: this.get('minute'), second: this.get('second'),
      millisecond: this.get('millisecond'),
    }
  }

  // ── Precise diff & age (delegates to relative.ts) ──────────────────────

  preciseDiff(other: DateInput): PreciseDiffResult {
    const otherDf = toDF(other)
    const isAfter = this.valueOf() >= otherDf.valueOf()
    const a = isAfter ? otherDf : this
    const b = isAfter ? this : otherDf
    const prevMonth = new DateFormat(new Date(b.get('year'), b.get('month') - 2, 1))

    return _preciseDiff(
      a.valueOf(), b.valueOf(),
      { year: a.get('year'), month: a.get('month'), date: a.get('date'), hour: a.get('hour'), minute: a.get('minute'), second: a.get('second'), millisecond: a.get('millisecond') },
      { year: b.get('year'), month: b.get('month'), date: b.get('date'), hour: b.get('hour'), minute: b.get('minute'), second: b.get('second'), millisecond: b.get('millisecond') },
      prevMonth.daysInMonth(),
    )
  }

  preciseFrom(other: DateInput): string {
    return this.preciseDiff(other).humanize()
  }

  age(): AgeResult {
    return _age(this._now().preciseDiff(this))
  }

  // ── Countdown (delegates to relative.ts) ────────────────────────────────

  countdown(): CountdownResult {
    return _countdown(this.valueOf(), Date.now())
  }

  // ── Calendar grid ───────────────────────────────────────────────────────

  calendarGrid(opts: CalendarGridOptions = {}): CalendarCell<DateFormat>[][] {
    const weekStartOffset = opts.weekStart === 'monday' ? 1 : 0
    const year = this.get('year')
    const month = this.get('month')
    const firstDay = new DateFormat(new Date(year, month - 1, 1))
    const dim = this.daysInMonth()
    const today = this._now().startOf('day')
    const startPad = (firstDay.get('day') - weekStartOffset + 7) % 7

    const cells: CalendarCell<DateFormat>[] = []

    for (let i = startPad - 1; i >= 0; i--) {
      const d = firstDay.subtract(i + 1, 'day').startOf('day')
      cells.push({ date: d, isCurrentMonth: false, isToday: d.isSameDay(today), isWeekend: d.isWeekend() })
    }
    for (let day = 1; day <= dim; day++) {
      const d = new DateFormat(new Date(year, month - 1, day))
      cells.push({ date: d, isCurrentMonth: true, isToday: d.isSameDay(today), isWeekend: d.isWeekend() })
    }
    let nextDay = 1
    while (cells.length < 42) {
      const d = new DateFormat(new Date(year, month, nextDay++))
      cells.push({ date: d, isCurrentMonth: false, isToday: d.isSameDay(today), isWeekend: d.isWeekend() })
    }

    const grid: CalendarCell<DateFormat>[][] = []
    for (let i = 0; i < 42; i += 7) grid.push(cells.slice(i, i + 7))
    return grid
  }

  // ── Fiscal year ─────────────────────────────────────────────────────────

  fiscalYear(config: FiscalConfig = { startMonth: 1 }): number {
    if (config.startMonth === 1) return this.get('year')
    return this.get('month') >= config.startMonth ? this.get('year') + 1 : this.get('year')
  }

  fiscalQuarter(config: FiscalConfig = { startMonth: 1 }): number {
    const adjustedMonth = ((this.get('month') - config.startMonth + 12) % 12) + 1
    return Math.ceil(adjustedMonth / 3)
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private _now(): DateFormat {
    return this._utc ? new DateFormat(Date.now(), { utc: true }) : new DateFormat()
  }
}
