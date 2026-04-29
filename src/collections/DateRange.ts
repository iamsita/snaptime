import type { DateInput, RangeIterateUnit, UnitInput } from '../core/types'
import DateTime from '../core/DateTime'
import Duration from '../core/Duration'

function toDT(input: DateInput): DateTime {
  return input instanceof DateTime ? input : new DateTime(input)
}

/**
 * An immutable, closed time range [start, end].
 *
 * Distinct from {@link DatePeriod}, which adds a step. A DateRange is just
 * "the span of time between two instants" with set-algebra operations.
 */
export default class DateRange {
  readonly start: DateTime
  readonly end: DateTime

  constructor(start: DateInput, end: DateInput) {
    this.start = toDT(start)
    this.end = toDT(end)
  }

  // ── Static factories ─────────────────────────────────────────────────────

  /** A one-millisecond range from the same start to itself. */
  static point(at: DateInput): DateRange {
    return new DateRange(at, at)
  }

  static fromDuration(start: DateInput, duration: Duration): DateRange {
    const s = toDT(start)
    return new DateRange(s, new DateTime(s.valueOf() + duration.toMilliseconds()))
  }

  // ── Inspection ───────────────────────────────────────────────────────────

  isValid(): boolean {
    return this.start.isValid() && this.end.isValid()
  }

  /** True when start <= end. */
  isForward(): boolean {
    return this.start.valueOf() <= this.end.valueOf()
  }

  isEmpty(): boolean {
    return this.start.valueOf() === this.end.valueOf()
  }

  duration(): Duration {
    return new Duration(Math.abs(this.end.valueOf() - this.start.valueOf()))
  }

  /** Length in `unit` (fractional). */
  length(unit: UnitInput = 'millisecond'): number {
    return this.duration().as(unit)
  }

  // ── Set-algebra ──────────────────────────────────────────────────────────

  contains(date: DateInput, inclusive = true): boolean {
    const t = toDT(date).valueOf()
    const [lo, hi] = this._normalized()
    return inclusive ? t >= lo && t <= hi : t > lo && t < hi
  }

  /** True if the two ranges share any instant. */
  overlaps(other: DateRange): boolean {
    const [as, ae] = this._normalized()
    const [bs, be] = other._normalized()
    return as <= be && ae >= bs
  }

  intersect(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) return null
    const [as, ae] = this._normalized()
    const [bs, be] = other._normalized()
    return new DateRange(new DateTime(Math.max(as, bs)), new DateTime(Math.min(ae, be)))
  }

  /** Union of overlapping/touching ranges, otherwise null. */
  merge(other: DateRange): DateRange | null {
    if (!this.overlaps(other)) return null
    const all = [
      this.start.valueOf(),
      this.end.valueOf(),
      other.start.valueOf(),
      other.end.valueOf()
    ]
    return new DateRange(new DateTime(Math.min(...all)), new DateTime(Math.max(...all)))
  }

  /** Subtract `other` from `this`. Returns 0/1/2 ranges. */
  subtract(other: DateRange): DateRange[] {
    const [as, ae] = this._normalized()
    const [bs, be] = other._normalized()
    if (be <= as || bs >= ae) return [new DateRange(new DateTime(as), new DateTime(ae))]
    const out: DateRange[] = []
    if (bs > as) out.push(new DateRange(new DateTime(as), new DateTime(bs)))
    if (be < ae) out.push(new DateRange(new DateTime(be), new DateTime(ae)))
    return out
  }

  /** Symmetric difference: parts that belong to exactly one range. */
  difference(other: DateRange): DateRange[] {
    return [...this.subtract(other), ...other.subtract(this)]
  }

  // ── Iteration / splitting ────────────────────────────────────────────────

  /** Split into N equal sub-ranges by `unit` step. */
  split(n: number, unit: RangeIterateUnit): DateRange[] {
    const out: DateRange[] = []
    const [lo, hi] = this._normalized()
    let cursor = new DateTime(lo)
    const hiDT = new DateTime(hi)
    while (cursor.valueOf() < hi) {
      const next = cursor.add(n, unit)
      const chunkEnd = next.valueOf() > hi ? hiDT : next
      out.push(new DateRange(cursor, chunkEnd))
      cursor = next
    }
    return out
  }

  /** Yield each step. */
  *iterate(unit: RangeIterateUnit, step = 1): Generator<DateTime> {
    const [lo, hi] = this._normalized()
    let cursor = new DateTime(lo)
    while (cursor.valueOf() <= hi) {
      yield cursor
      cursor = cursor.add(step, unit)
    }
  }

  toArray(unit: RangeIterateUnit, step = 1): DateTime[] {
    return [...this.iterate(unit, step)]
  }

  // ── Display ──────────────────────────────────────────────────────────────

  humanize(): string {
    if (this.start.get('year') === this.end.get('year')) {
      return `${this.start.format('MMM D')} – ${this.end.format('MMM D, YYYY')}`
    }
    return `${this.start.format('MMM D, YYYY')} – ${this.end.format('MMM D, YYYY')}`
  }

  equals(other: DateRange): boolean {
    return this.start.eq(other.start) && this.end.eq(other.end)
  }

  toString(): string {
    return `${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`
  }

  toJSON(): { start: string; end: string } {
    return { start: this.start.toISOString(), end: this.end.toISOString() }
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _normalized(): [number, number] {
    const a = this.start.valueOf()
    const b = this.end.valueOf()
    return a <= b ? [a, b] : [b, a]
  }
}
