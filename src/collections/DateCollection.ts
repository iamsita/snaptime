import DateFormat from '../core/DateFormat'
import DateRange from './DateRange'
import type { DateInput, GroupByUnit, UniqueUnit } from '../core/types'

function toDF(input: DateInput): DateFormat {
  return input instanceof DateFormat
    ? input.clone()
    : new DateFormat(input as string | number | Date)
}

export default class DateCollection {
  private readonly _dates: DateFormat[]

  constructor(dates: DateInput[]) {
    this._dates = dates.map(toDF)
  }

  // ── Iterable protocol ───────────────────────────────────────────────────

  [Symbol.iterator](): Iterator<DateFormat> {
    let index = 0
    const dates = this._dates
    return {
      next(): IteratorResult<DateFormat> {
        if (index < dates.length) {
          return { value: dates[index++].clone(), done: false }
        }
        return { value: undefined as unknown as DateFormat, done: true }
      }
    }
  }

  // ── Transform ───────────────────────────────────────────────────────────

  sort(order: 'asc' | 'desc' = 'asc'): DateCollection {
    const sorted = [...this._dates].sort((a, b) => {
      const diff = a.valueOf() - b.valueOf()
      return order === 'asc' ? diff : -diff
    })
    return new DateCollection(sorted)
  }

  filter(fn: (d: DateFormat) => boolean): DateCollection {
    return new DateCollection(this._dates.filter(fn))
  }

  unique(unit?: UniqueUnit): DateCollection {
    if (!unit) {
      const seen = new Set<number>()
      const result: DateFormat[] = []
      for (const d of this._dates) {
        const v = d.valueOf()
        if (!seen.has(v)) {
          seen.add(v)
          result.push(d)
        }
      }
      return new DateCollection(result)
    }

    const seen = new Set<string>()
    const result: DateFormat[] = []
    for (const d of this._dates) {
      const key = this._unitKey(d, unit)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(d)
      }
    }
    return new DateCollection(result)
  }

  compact(): DateCollection {
    return new DateCollection(this._dates.filter((d) => d.isValid()))
  }

  between(start: DateInput, end: DateInput): DateCollection {
    const s =
      start instanceof DateFormat
        ? start.valueOf()
        : new DateFormat(start as string | number | Date).valueOf()
    const e =
      end instanceof DateFormat
        ? end.valueOf()
        : new DateFormat(end as string | number | Date).valueOf()
    return new DateCollection(this._dates.filter((d) => d.valueOf() >= s && d.valueOf() <= e))
  }

  /** Merge another collection into this one (returns new collection). */
  merge(other: DateCollection): DateCollection {
    return new DateCollection([...this._dates, ...other.toArray()])
  }

  // ── Grouping ────────────────────────────────────────────────────────────

  groupBy(unit: GroupByUnit): Map<string, DateFormat[]> {
    const groups = new Map<string, DateFormat[]>()
    for (const d of this._dates) {
      let key: string
      switch (unit) {
        case 'year':
          key = String(d.get('year'))
          break
        case 'month':
          key = `${d.get('year')}-${String(d.get('month')).padStart(2, '0')}`
          break
        case 'week':
          key = `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
          break
        case 'day':
          key = d.format('YYYY-MM-DD')
          break
        case 'hour':
          key = `${d.format('YYYY-MM-DD')}T${String(d.get('hour')).padStart(2, '0')}`
          break
        case 'quarter':
          key = `${d.get('year')}-Q${d.quarter()}`
          break
      }
      const arr = groups.get(key)
      if (arr) {
        arr.push(d.clone())
      } else {
        groups.set(key, [d.clone()])
      }
    }
    return groups
  }

  // ── Lookup ──────────────────────────────────────────────────────────────

  closest(target: DateInput): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot find closest in an empty collection')
    const t =
      target instanceof DateFormat ? target : new DateFormat(target as string | number | Date)
    let best = this._dates[0]
    let bestDiff = Math.abs(best.valueOf() - t.valueOf())
    for (let i = 1; i < this._dates.length; i++) {
      const diff = Math.abs(this._dates[i].valueOf() - t.valueOf())
      if (diff < bestDiff) {
        best = this._dates[i]
        bestDiff = diff
      }
    }
    return best.clone()
  }

  farthest(target: DateInput): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot find farthest in an empty collection')
    const t =
      target instanceof DateFormat ? target : new DateFormat(target as string | number | Date)
    let best = this._dates[0]
    let bestDiff = Math.abs(best.valueOf() - t.valueOf())
    for (let i = 1; i < this._dates.length; i++) {
      const diff = Math.abs(this._dates[i].valueOf() - t.valueOf())
      if (diff > bestDiff) {
        best = this._dates[i]
        bestDiff = diff
      }
    }
    return best.clone()
  }

  // ── Access ──────────────────────────────────────────────────────────────

  first(): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot get first from an empty collection')
    return this._dates[0].clone()
  }

  last(): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot get last from an empty collection')
    return this._dates[this._dates.length - 1].clone()
  }

  nth(n: number): DateFormat {
    if (n < 0 || n >= this._dates.length) {
      throw new Error(`Index ${n} out of bounds for collection of size ${this._dates.length}`)
    }
    return this._dates[n].clone()
  }

  // ── Aggregation ─────────────────────────────────────────────────────────

  min(): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot get min from an empty collection')
    return this._dates.reduce((a, b) => (a.valueOf() <= b.valueOf() ? a : b)).clone()
  }

  max(): DateFormat {
    if (this._dates.length === 0) throw new Error('Cannot get max from an empty collection')
    return this._dates.reduce((a, b) => (a.valueOf() >= b.valueOf() ? a : b)).clone()
  }

  count(): number {
    return this._dates.length
  }

  isEmpty(): boolean {
    return this._dates.length === 0
  }

  /** Get the range from min to max. */
  span(): DateRange {
    return new DateRange(this.min(), this.max())
  }

  // ── Functional iteration ────────────────────────────────────────────────

  map<T>(fn: (d: DateFormat, index: number) => T): T[] {
    return this._dates.map((d, i) => fn(d, i))
  }

  forEach(fn: (d: DateFormat, index: number) => void): void {
    this._dates.forEach((d, i) => fn(d, i))
  }

  reduce<T>(fn: (acc: T, d: DateFormat, index: number) => T, initial: T): T {
    return this._dates.reduce((acc, d, i) => fn(acc, d, i), initial)
  }

  some(fn: (d: DateFormat) => boolean): boolean {
    return this._dates.some(fn)
  }

  every(fn: (d: DateFormat) => boolean): boolean {
    return this._dates.every(fn)
  }

  find(fn: (d: DateFormat) => boolean): DateFormat | undefined {
    const found = this._dates.find(fn)
    return found?.clone()
  }

  // ── Conversion ──────────────────────────────────────────────────────────

  toArray(): DateFormat[] {
    return this._dates.map((d) => d.clone())
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private _unitKey(d: DateFormat, unit: UniqueUnit): string {
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
        return `${d.get('year')}-${d.get('month')}-${d.get('date')}-${d.get('hour')}-${d.get('minute')}`
      case 'second':
        return `${d.get('year')}-${d.get('month')}-${d.get('date')}-${d.get('hour')}-${d.get('minute')}-${d.get('second')}`
    }
  }
}
