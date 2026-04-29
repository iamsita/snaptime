import type { DateInput, RangeIterateUnit } from '../core/types'
import DateTime from '../core/DateTime'
import DateRange from './DateRange'

function toDT(input: DateInput): DateTime {
  return input instanceof DateTime ? input : new DateTime(input)
}

export interface DatePeriodOptions {
  start: DateInput
  /** Stop at this instant (inclusive). One of `end` or `count` is required. */
  end?: DateInput
  /** Exact number of occurrences. */
  count?: number
  /** Unit for the step. */
  unit: RangeIterateUnit
  /** Multiplier for the step (default 1). */
  step?: number
  /** Filter — only emit items for which `filter(d)` is true. */
  filter?: (d: DateTime) => boolean
  /** Skip these specific instants (matched by ms). */
  exclude?: DateInput[]
}

/**
 * A lazy, iterable, filterable schedule of dates.
 *
 * Mirrors PHP CarbonPeriod / Laravel's CarbonPeriod. A DatePeriod is purely
 * declarative — iterating it produces instances; nothing is allocated up
 * front. Filters/exclusions can be added fluently.
 *
 *   for (const d of new DatePeriod({
 *     start: '2026-01-01', end: '2026-12-31', unit: 'month',
 *   })) console.log(d.format('MMMM'))
 */
export default class DatePeriod implements Iterable<DateTime> {
  private readonly _opts: Readonly<DatePeriodOptions>

  constructor(opts: DatePeriodOptions) {
    if (opts.end == null && opts.count == null) {
      throw new RangeError('DatePeriod requires either `end` or `count`')
    }
    this._opts = { ...opts, step: opts.step ?? 1 }
  }

  static every(step: number, unit: RangeIterateUnit) {
    return {
      from(start: DateInput) {
        return {
          to(end: DateInput): DatePeriod {
            return new DatePeriod({ start, end, unit, step })
          },
          times(count: number): DatePeriod {
            return new DatePeriod({ start, count, unit, step })
          }
        }
      }
    }
  }

  // ── Fluent modifiers — return a new DatePeriod ───────────────────────────

  filter(fn: (d: DateTime) => boolean): DatePeriod {
    const existing = this._opts.filter
    return new DatePeriod({
      ...this._opts,
      filter: existing ? (d) => existing(d) && fn(d) : fn
    })
  }

  exclude(...dates: DateInput[]): DatePeriod {
    const existing = this._opts.exclude ?? []
    return new DatePeriod({ ...this._opts, exclude: [...existing, ...dates] })
  }

  /** Convenience: skip weekends. */
  excludeWeekends(): DatePeriod {
    return this.filter((d) => d.isWeekday())
  }

  // ── Iteration ────────────────────────────────────────────────────────────

  *[Symbol.iterator](): Generator<DateTime> {
    const { unit, step = 1, count, end, filter, exclude } = this._opts
    const start = toDT(this._opts.start)
    const endDt = end != null ? toDT(end) : null
    const excludeMs = new Set((exclude ?? []).map((e) => toDT(e).valueOf()))

    let emitted = 0
    let i = 0
    let cursor = start

    // Generous safety cap to avoid runaway infinite filters
    const MAX_ITER = 10_000_000

    while (i < MAX_ITER) {
      if (count != null && emitted >= count) return
      if (endDt && cursor.isAfter(endDt)) return

      let pass = true
      if (excludeMs.has(cursor.valueOf())) pass = false
      if (pass && filter && !filter(cursor)) pass = false

      if (pass) {
        emitted++
        yield cursor
      }
      cursor = start.add(step * ++i, unit)
    }
  }

  /** Eagerly collect into an array. */
  toArray(): DateTime[] {
    return [...this]
  }

  count(): number {
    let n = 0
    const it = this[Symbol.iterator]()
    while (!it.next().done) n++
    return n
  }

  /** Build a {@link DateRange} from start..last-emitted. */
  toRange(): DateRange {
    const items = this.toArray()
    if (items.length === 0) return new DateRange(this._opts.start, this._opts.start)
    return new DateRange(this._opts.start, items[items.length - 1])
  }
}
