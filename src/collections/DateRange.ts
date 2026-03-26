import type { RangeIterateUnit, Unit, DateInput } from '../core/types'
import DateFormat from '../core/DateFormat'
import Duration from '../core/Duration'

function toDF(input: DateInput): DateFormat {
  return input instanceof DateFormat ? input : new DateFormat(input as string | number | Date)
}

export default class DateRange {
  readonly start: DateFormat
  readonly end: DateFormat

  constructor(start: DateInput, end: DateInput) {
    this.start = toDF(start)
    this.end = toDF(end)
  }

  isValid(): boolean {
    return this.start.isValid() && this.end.isValid()
  }

  /** True when start <= end */
  isForward(): boolean {
    return this.start.valueOf() <= this.end.valueOf()
  }

  /** Absolute duration between start and end */
  duration(): Duration {
    return new Duration(Math.abs(this.end.valueOf() - this.start.valueOf()))
  }

  /** True if the given date falls within the range (inclusive by default) */
  contains(date: DateInput, inclusive = true): boolean {
    const t = toDF(date).valueOf()
    const lo = Math.min(this.start.valueOf(), this.end.valueOf())
    const hi = Math.max(this.start.valueOf(), this.end.valueOf())
    return inclusive ? t >= lo && t <= hi : t > lo && t < hi
  }

  /** True if this range temporally overlaps with another */
  overlaps(other: DateRange): boolean {
    const [aStart, aEnd] = this._normalized()
    const [bStart, bEnd] = other._normalized()
    return aStart <= bEnd && aEnd >= bStart
  }

  /** Intersection, or null if they don't overlap */
  intersect(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) return null
    const [aStart, aEnd] = this._normalized()
    const [bStart, bEnd] = other._normalized()
    return new DateRange(
      new DateFormat(Math.max(aStart, bStart)),
      new DateFormat(Math.min(aEnd, bEnd))
    )
  }

  /** Union of two overlapping/adjacent ranges, or null if they don't overlap */
  merge(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) return null
    const all = [
      this.start.valueOf(),
      this.end.valueOf(),
      other.start.valueOf(),
      other.end.valueOf()
    ]
    return new DateRange(new DateFormat(Math.min(...all)), new DateFormat(Math.max(...all)))
  }

  /** Split range into chunks of n units */
  split(n: number, unit: RangeIterateUnit): DateRange[] {
    const result: DateRange[] = []
    const lo = Math.min(this.start.valueOf(), this.end.valueOf())
    const hi = Math.max(this.start.valueOf(), this.end.valueOf())
    let cursor = new DateFormat(lo)

    while (cursor.valueOf() < hi) {
      const next = cursor.add(n, unit as Unit)
      const chunkEnd = next.valueOf() > hi ? new DateFormat(hi) : next
      result.push(new DateRange(cursor, chunkEnd))
      cursor = next
    }

    return result
  }

  /** Generator that yields each date stepping by 1 unit */
  *iterate(unit: RangeIterateUnit): Generator<DateFormat> {
    const lo = Math.min(this.start.valueOf(), this.end.valueOf())
    const hi = Math.max(this.start.valueOf(), this.end.valueOf())
    let cursor = new DateFormat(lo)

    while (cursor.valueOf() <= hi) {
      yield cursor
      cursor = cursor.add(1, unit as Unit)
    }
  }

  /** Collect all dates from iterate() into an array */
  toArray(unit: RangeIterateUnit): DateFormat[] {
    return [...this.iterate(unit)]
  }

  /** "Jan 1 - Mar 31, 2026" style label */
  humanize(): string {
    const startYear = this.start.get('year')
    const endYear = this.end.get('year')
    if (startYear === endYear) {
      return `${this.start.format('MMM D')} \u2013 ${this.end.format('MMM D, YYYY')}`
    }
    return `${this.start.format('MMM D, YYYY')} \u2013 ${this.end.format('MMM D, YYYY')}`
  }

  equals(other: DateRange): boolean {
    return (
      this.start.valueOf() === other.start.valueOf() && this.end.valueOf() === other.end.valueOf()
    )
  }

  toString(): string {
    return `${this.start.format('YYYY-MM-DD')} / ${this.end.format('YYYY-MM-DD')}`
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private _normalized(): [number, number] {
    const a = this.start.valueOf()
    const b = this.end.valueOf()
    return a <= b ? [a, b] : [b, a]
  }
}
