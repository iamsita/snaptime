// ─────────────────────────────────────────────────────────────────────────────
// RangeSet — set algebra over a collection of DateRanges.
//
// Useful for availability/booking apps:
//   const open = new RangeSet([businessHours]).subtract(holidays).subtract(bookings)
//   for (const slot of open.iterate('hour')) { ... }
// ─────────────────────────────────────────────────────────────────────────────

import type { DateInput, RangeIterateUnit } from '../core/types'
import DateTime from '../core/DateTime'
import DateRange from './DateRange'
import Duration from '../core/Duration'

function toDR(input: DateRange | [DateInput, DateInput]): DateRange {
  return input instanceof DateRange ? input : new DateRange(input[0], input[1])
}

export default class RangeSet implements Iterable<DateRange> {
  private readonly _ranges: ReadonlyArray<DateRange>

  constructor(ranges: (DateRange | [DateInput, DateInput])[] = []) {
    this._ranges = ranges.map(toDR)
  }

  [Symbol.iterator](): Iterator<DateRange> {
    let i = 0
    const rs = this._ranges
    return {
      next(): IteratorResult<DateRange> {
        if (i < rs.length) return { value: rs[i++], done: false }
        return { value: undefined as unknown as DateRange, done: true }
      }
    }
  }

  count(): number {
    return this._ranges.length
  }

  isEmpty(): boolean {
    return this._ranges.length === 0
  }

  toArray(): DateRange[] {
    return [...this._ranges]
  }

  /** Total non-overlapping duration covered by this set. */
  totalDuration(): Duration {
    const merged = this.merge()
    let ms = 0
    for (const r of merged._ranges) ms += r.duration().toMilliseconds()
    return new Duration(ms)
  }

  // ── Set algebra ──────────────────────────────────────────────────────────

  /**
   * Coalesce overlapping or touching ranges. Result is sorted, normalized,
   * and minimal.
   */
  merge(): RangeSet {
    if (this._ranges.length < 2) return this
    const sorted = [...this._ranges]
      .map((r) => (r.isForward() ? r : new DateRange(r.end, r.start)))
      .sort((a, b) => a.start.valueOf() - b.start.valueOf())

    const out: DateRange[] = []
    let cur = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      const r = sorted[i]
      if (r.start.valueOf() <= cur.end.valueOf()) {
        cur = new DateRange(cur.start, new DateTime(Math.max(cur.end.valueOf(), r.end.valueOf())))
      } else {
        out.push(cur)
        cur = r
      }
    }
    out.push(cur)
    return new RangeSet(out)
  }

  /** Union with another set (then merge). */
  union(other: RangeSet): RangeSet {
    return new RangeSet([...this._ranges, ...other._ranges]).merge()
  }

  /** Intersection of two range sets. */
  intersect(other: RangeSet): RangeSet {
    const out: DateRange[] = []
    for (const a of this.merge()._ranges) {
      for (const b of other.merge()._ranges) {
        const xs = a.intersect(b)
        if (xs) out.push(xs)
      }
    }
    return new RangeSet(out)
  }

  /** Subtract another set's ranges from this one. */
  subtract(other: RangeSet | DateRange | [DateInput, DateInput]): RangeSet {
    const otherSet =
      other instanceof RangeSet
        ? other.merge()
        : new RangeSet([toDR(other as DateRange | [DateInput, DateInput])]).merge()

    let working: DateRange[] = this.merge()._ranges.slice()
    for (const sub of otherSet._ranges) {
      const next: DateRange[] = []
      for (const r of working) next.push(...r.subtract(sub))
      working = next
    }
    return new RangeSet(working)
  }

  /** Gaps between merged ranges, optionally bounded by `[lo, hi]`. */
  gaps(lo?: DateInput, hi?: DateInput): RangeSet {
    const merged = this.merge()._ranges
    if (merged.length === 0) {
      if (lo == null || hi == null) return new RangeSet()
      return new RangeSet([[lo, hi]])
    }

    const out: DateRange[] = []
    if (lo != null && new DateTime(lo).isBefore(merged[0].start)) {
      out.push(new DateRange(lo, merged[0].start))
    }
    for (let i = 1; i < merged.length; i++) {
      out.push(new DateRange(merged[i - 1].end, merged[i].start))
    }
    if (hi != null && new DateTime(hi).isAfter(merged[merged.length - 1].end)) {
      out.push(new DateRange(merged[merged.length - 1].end, hi))
    }
    return new RangeSet(out)
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  contains(instant: DateInput): boolean {
    const t = new DateTime(instant).valueOf()
    return this._ranges.some(
      (r) =>
        t >= Math.min(r.start.valueOf(), r.end.valueOf()) &&
        t <= Math.max(r.start.valueOf(), r.end.valueOf())
    )
  }

  /** True if any range overlaps another set. */
  overlaps(other: RangeSet): boolean {
    for (const a of this._ranges) {
      for (const b of other._ranges) if (a.overlaps(b)) return true
    }
    return false
  }

  // ── Iteration / sampling ─────────────────────────────────────────────────

  /** Lazy iteration of every step inside the merged set. */
  *iterate(unit: RangeIterateUnit, step = 1): Generator<DateTime> {
    for (const r of this.merge()._ranges) {
      yield* r.iterate(unit, step)
    }
  }

  /** Stable, sortable serialization. */
  toJSON(): { start: string; end: string }[] {
    return this._ranges.map((r) => r.toJSON())
  }

  toString(): string {
    return this._ranges.map((r) => r.toString()).join(' ∪ ')
  }
}
