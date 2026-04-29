import type { DateInput, GroupByUnit, SortOrder, UniqueUnit } from '../core/types'
import DateTime from '../core/DateTime'
import DateRange from './DateRange'

function toDT(input: DateInput): DateTime {
  return input instanceof DateTime ? input.clone() : new DateTime(input)
}

/**
 * Immutable collection of DateTime values with array-like + analytics helpers.
 *
 * Every transformation returns a new collection — instances are safe to share.
 */
export default class DateCollection implements Iterable<DateTime> {
  private readonly _dates: ReadonlyArray<DateTime>

  constructor(dates: DateInput[] = []) {
    this._dates = dates.map(toDT)
  }

  // ── Iterable ─────────────────────────────────────────────────────────────

  [Symbol.iterator](): Iterator<DateTime> {
    let i = 0
    const ds = this._dates
    return {
      next(): IteratorResult<DateTime> {
        if (i < ds.length) return { value: ds[i++].clone(), done: false }
        return { value: undefined as unknown as DateTime, done: true }
      }
    }
  }

  // ── Construction ─────────────────────────────────────────────────────────

  static from(input: Iterable<DateInput>): DateCollection {
    return new DateCollection([...input])
  }

  static empty(): DateCollection {
    return new DateCollection([])
  }

  // ── Basic shape ──────────────────────────────────────────────────────────

  count(): number {
    return this._dates.length
  }

  isEmpty(): boolean {
    return this._dates.length === 0
  }

  toArray(): DateTime[] {
    return this._dates.map((d) => d.clone())
  }

  toJSON(): string[] {
    return this._dates.map((d) => d.toISOString())
  }

  // ── Access ───────────────────────────────────────────────────────────────

  first(): DateTime {
    if (this.isEmpty()) throw new Error('first(): collection is empty')
    return this._dates[0].clone()
  }

  last(): DateTime {
    if (this.isEmpty()) throw new Error('last(): collection is empty')
    return this._dates[this._dates.length - 1].clone()
  }

  nth(n: number): DateTime {
    if (n < 0 || n >= this._dates.length) {
      throw new RangeError(`nth(${n}): out of bounds for size ${this._dates.length}`)
    }
    return this._dates[n].clone()
  }

  // ── Aggregation ──────────────────────────────────────────────────────────

  min(): DateTime {
    if (this.isEmpty()) throw new Error('min(): collection is empty')
    return this._dates.reduce((a, b) => (a.valueOf() <= b.valueOf() ? a : b)).clone()
  }

  max(): DateTime {
    if (this.isEmpty()) throw new Error('max(): collection is empty')
    return this._dates.reduce((a, b) => (a.valueOf() >= b.valueOf() ? a : b)).clone()
  }

  /** Mean of all timestamps. */
  average(): DateTime {
    if (this.isEmpty()) throw new Error('average(): collection is empty')
    const sum = this._dates.reduce((s, d) => s + d.valueOf(), 0)
    return new DateTime(sum / this._dates.length)
  }

  /** Median timestamp — interpolated for even-sized collections. */
  median(): DateTime {
    if (this.isEmpty()) throw new Error('median(): collection is empty')
    const sorted = [...this._dates].sort((a, b) => a.valueOf() - b.valueOf())
    const n = sorted.length
    if (n % 2 === 1) return sorted[(n - 1) / 2].clone()
    const a = sorted[n / 2 - 1].valueOf()
    const b = sorted[n / 2].valueOf()
    return new DateTime((a + b) / 2)
  }

  /** Range of (max - min) as a {@link DateRange}. */
  span(): DateRange {
    return new DateRange(this.min(), this.max())
  }

  // ── Transformation ───────────────────────────────────────────────────────

  sort(order: SortOrder = 'asc'): DateCollection {
    const sorted = [...this._dates].sort((a, b) => {
      const diff = a.valueOf() - b.valueOf()
      return order === 'asc' ? diff : -diff
    })
    return new DateCollection(sorted)
  }

  filter(fn: (d: DateTime, i: number) => boolean): DateCollection {
    return new DateCollection(this._dates.filter(fn))
  }

  reject(fn: (d: DateTime, i: number) => boolean): DateCollection {
    return new DateCollection(this._dates.filter((d, i) => !fn(d, i)))
  }

  /** Drop invalid (NaN) instances. */
  compact(): DateCollection {
    return new DateCollection(this._dates.filter((d) => d.isValid()))
  }

  /** Keep only dates within `[start, end]`. */
  between(start: DateInput, end: DateInput): DateCollection {
    const s = toDT(start).valueOf()
    const e = toDT(end).valueOf()
    return new DateCollection(this._dates.filter((d) => d.valueOf() >= s && d.valueOf() <= e))
  }

  unique(unit?: UniqueUnit): DateCollection {
    if (!unit) {
      const seen = new Set<number>()
      const out: DateTime[] = []
      for (const d of this._dates) {
        if (!seen.has(d.valueOf())) {
          seen.add(d.valueOf())
          out.push(d)
        }
      }
      return new DateCollection(out)
    }
    const seen = new Set<string>()
    const out: DateTime[] = []
    for (const d of this._dates) {
      const k = unitKey(d, unit)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(d)
      }
    }
    return new DateCollection(out)
  }

  merge(other: DateCollection): DateCollection {
    return new DateCollection([...this._dates, ...other._dates])
  }

  /** Equivalent of Lodash `_.partition` — first true items, then false. */
  partition(fn: (d: DateTime) => boolean): [DateCollection, DateCollection] {
    const yes: DateTime[] = []
    const no: DateTime[] = []
    for (const d of this._dates) (fn(d) ? yes : no).push(d)
    return [new DateCollection(yes), new DateCollection(no)]
  }

  /** Take items while `fn` is true; stop at the first false. */
  takeWhile(fn: (d: DateTime) => boolean): DateCollection {
    const out: DateTime[] = []
    for (const d of this._dates) {
      if (!fn(d)) break
      out.push(d)
    }
    return new DateCollection(out)
  }

  /** Drop items while `fn` is true; emit the rest. */
  skipWhile(fn: (d: DateTime) => boolean): DateCollection {
    let drop = true
    const out: DateTime[] = []
    for (const d of this._dates) {
      if (drop && fn(d)) continue
      drop = false
      out.push(d)
    }
    return new DateCollection(out)
  }

  take(n: number): DateCollection {
    return new DateCollection(this._dates.slice(0, n))
  }

  skip(n: number): DateCollection {
    return new DateCollection(this._dates.slice(n))
  }

  reverse(): DateCollection {
    return new DateCollection([...this._dates].reverse())
  }

  /** Split into chunks of size `n`. The last chunk may be shorter. */
  chunk(n: number): DateCollection[] {
    if (n <= 0) throw new RangeError('chunk(n): n must be > 0')
    const out: DateCollection[] = []
    for (let i = 0; i < this._dates.length; i += n) {
      out.push(new DateCollection(this._dates.slice(i, i + n)))
    }
    return out
  }

  // ── Grouping ─────────────────────────────────────────────────────────────

  groupBy(unit: GroupByUnit): Map<string, DateTime[]> {
    const map = new Map<string, DateTime[]>()
    for (const d of this._dates) {
      const key = groupKey(d, unit)
      const list = map.get(key)
      if (list) list.push(d.clone())
      else map.set(key, [d.clone()])
    }
    return map
  }

  /** Group by an arbitrary key extractor. */
  groupByKey<K>(keyFn: (d: DateTime) => K): Map<K, DateTime[]> {
    const map = new Map<K, DateTime[]>()
    for (const d of this._dates) {
      const k = keyFn(d)
      const list = map.get(k)
      if (list) list.push(d.clone())
      else map.set(k, [d.clone()])
    }
    return map
  }

  // ── Lookup ───────────────────────────────────────────────────────────────

  closest(target: DateInput): DateTime {
    if (this.isEmpty()) throw new Error('closest(): collection is empty')
    const t = toDT(target).valueOf()
    return this._dates
      .reduce((best, next) =>
        Math.abs(next.valueOf() - t) < Math.abs(best.valueOf() - t) ? next : best
      )
      .clone()
  }

  farthest(target: DateInput): DateTime {
    if (this.isEmpty()) throw new Error('farthest(): collection is empty')
    const t = toDT(target).valueOf()
    return this._dates
      .reduce((best, next) =>
        Math.abs(next.valueOf() - t) > Math.abs(best.valueOf() - t) ? next : best
      )
      .clone()
  }

  // ── Functional plumbing ──────────────────────────────────────────────────

  map<T>(fn: (d: DateTime, i: number) => T): T[] {
    return this._dates.map((d, i) => fn(d.clone(), i))
  }

  forEach(fn: (d: DateTime, i: number) => void): void {
    this._dates.forEach((d, i) => fn(d.clone(), i))
  }

  reduce<T>(fn: (acc: T, d: DateTime, i: number) => T, initial: T): T {
    return this._dates.reduce((acc, d, i) => fn(acc, d.clone(), i), initial)
  }

  some(fn: (d: DateTime) => boolean): boolean {
    return this._dates.some((d) => fn(d))
  }

  every(fn: (d: DateTime) => boolean): boolean {
    return this._dates.every((d) => fn(d))
  }

  find(fn: (d: DateTime) => boolean): DateTime | undefined {
    const found = this._dates.find((d) => fn(d))
    return found?.clone()
  }

  includes(d: DateInput): boolean {
    const t = toDT(d).valueOf()
    return this._dates.some((x) => x.valueOf() === t)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal key helpers
// ─────────────────────────────────────────────────────────────────────────────

function unitKey(d: DateTime, unit: UniqueUnit): string {
  switch (unit) {
    case 'year':
      return String(d.get('year'))
    case 'month':
      return `${d.get('year')}-${d.get('month')}`
    case 'week':
      return `${d.isoWeekYear()}-${d.isoWeek()}`
    case 'day':
      return `${d.get('year')}-${d.get('month')}-${d.get('date')}`
    case 'hour':
      return `${d.get('year')}-${d.get('month')}-${d.get('date')}-${d.get('hour')}`
    case 'minute':
      return (
        `${d.get('year')}-${d.get('month')}-${d.get('date')}-` +
        `${d.get('hour')}-${d.get('minute')}`
      )
    case 'second':
      return (
        `${d.get('year')}-${d.get('month')}-${d.get('date')}-` +
        `${d.get('hour')}-${d.get('minute')}-${d.get('second')}`
      )
  }
}

function groupKey(d: DateTime, unit: GroupByUnit): string {
  switch (unit) {
    case 'year':
      return String(d.get('year'))
    case 'quarter':
      return `${d.get('year')}-Q${d.quarter()}`
    case 'month':
      return `${d.get('year')}-${String(d.get('month')).padStart(2, '0')}`
    case 'week':
      return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
    case 'day':
      return d.format('YYYY-MM-DD')
    case 'hour':
      return `${d.format('YYYY-MM-DD')}T${String(d.get('hour')).padStart(2, '0')}`
  }
}
