// ─────────────────────────────────────────────────────────────────────────────
// RFC 5545 RRULE engine.
//
// Implements the practical subset:
//   FREQ, INTERVAL, COUNT, UNTIL, DTSTART
//   BYMONTH, BYMONTHDAY, BYYEARDAY, BYWEEKNO, BYDAY (with N prefix),
//   BYHOUR, BYMINUTE, BYSECOND, BYSETPOS, WKST
//
// Strategy: for each "interval window" (e.g. one month for FREQ=MONTHLY),
// expand the BY* rules into a set of candidate instants, optionally filter
// by BYSETPOS, then yield in time order. This matches the dateutil.rrule
// reference implementation's approach.
// ─────────────────────────────────────────────────────────────────────────────

import DateTime from '../core/DateTime'
import { parseRRule, stringifyRRule } from './parser'
import type { RRuleOptions, Weekday, WeekdayWithN } from './types'

const WEEKDAY_TO_NUM: Record<Weekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6
}

function toDate(input: Date | number | string | undefined): Date | null {
  if (input == null) return null
  if (input instanceof Date) return new Date(input.getTime())
  if (typeof input === 'number') return new Date(input)
  return new Date(input)
}

function clone(d: Date): Date {
  return new Date(d.getTime())
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const here = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.floor((here - start) / 86_400_000) + 1
}

function isoWeekNumber(d: Date): number {
  const target = new Date(d.getTime())
  target.setUTCHours(0, 0, 0, 0)
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1)
  return Math.ceil(((target.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

// Iteration cap to prevent runaway loops
const MAX_ITER = 50_000

export class RRule implements Iterable<DateTime> {
  readonly options: RRuleOptions

  constructor(options: RRuleOptions) {
    if (options.count != null && options.until != null) {
      throw new RangeError('RRULE: COUNT and UNTIL are mutually exclusive')
    }
    this.options = { interval: 1, wkst: 'MO', ...options }
  }

  static parse(input: string): RRule {
    return new RRule(parseRRule(input))
  }

  toString(): string {
    return stringifyRRule(this.options)
  }

  // ─────────────────────────────────────────────────────────────────────────

  *[Symbol.iterator](): Generator<DateTime> {
    yield* this._iter(0)
  }

  /** All occurrences inside [start, end]. */
  between(start: Date | number | string, end: Date | number | string, limit?: number): DateTime[] {
    const sMs = toDate(start)!.getTime()
    const eMs = toDate(end)!.getTime()
    const out: DateTime[] = []
    for (const d of this) {
      const t = d.valueOf()
      if (t < sMs) continue
      if (t > eMs) break
      out.push(d)
      if (limit != null && out.length >= limit) break
    }
    return out
  }

  /** First N occurrences, optionally starting from `from`. */
  take(n: number, from?: Date | number | string): DateTime[] {
    const fromMs = from != null ? toDate(from)!.getTime() : -Infinity
    const out: DateTime[] = []
    for (const d of this) {
      if (d.valueOf() < fromMs) continue
      out.push(d)
      if (out.length >= n) break
    }
    return out
  }

  /** Next occurrence at or after `from`. */
  next(from?: Date | number | string): DateTime | null {
    const fromMs = from != null ? toDate(from)!.getTime() : Date.now()
    for (const d of this) {
      if (d.valueOf() >= fromMs) return d
    }
    return null
  }

  /** True when `instant` is one of the rule's occurrences. */
  matches(instant: Date | number | string): boolean {
    const t = toDate(instant)!.getTime()
    for (const d of this) {
      if (d.valueOf() === t) return true
      if (d.valueOf() > t) return false
    }
    return false
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Iteration
  // ─────────────────────────────────────────────────────────────────────────

  private *_iter(skipMs: number): Generator<DateTime> {
    const o = this.options
    const dtstart = toDate(o.dtstart) ?? new Date()
    const untilMs = toDate(o.until)?.getTime() ?? Infinity

    let count = 0
    let windowStart = clone(dtstart)
    let iter = 0

    while (iter++ < MAX_ITER) {
      const candidates = this._expandWindow(windowStart, dtstart)
      // Apply BYSETPOS to the in-window candidates
      const filtered = this._applySetPos(candidates)

      for (const d of filtered) {
        const t = d.getTime()
        if (t < dtstart.getTime()) continue
        if (t > untilMs) return
        if (t < skipMs) continue
        yield new DateTime(t, { utc: false })
        count++
        if (o.count != null && count >= o.count) return
      }

      windowStart = this._nextWindow(windowStart)
      if (windowStart.getTime() > untilMs && o.count == null) return
      if (windowStart.getTime() - dtstart.getTime() > 366 * 100 * 86_400_000) return
    }
  }

  /** Move the window forward one INTERVAL of FREQ. */
  private _nextWindow(d: Date): Date {
    const o = this.options
    const next = clone(d)
    const k = o.interval ?? 1
    switch (o.freq) {
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + k)
        break
      case 'MONTHLY':
        next.setMonth(next.getMonth() + k)
        break
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * k)
        break
      case 'DAILY':
        next.setDate(next.getDate() + k)
        break
      case 'HOURLY':
        next.setHours(next.getHours() + k)
        break
      case 'MINUTELY':
        next.setMinutes(next.getMinutes() + k)
        break
      case 'SECONDLY':
        next.setSeconds(next.getSeconds() + k)
        break
    }
    return next
  }

  /**
   * Compute the set of candidate Dates inside the window starting at
   * `windowStart`. For sub-daily FREQs the "window" is just that single point
   * with optional BYHOUR/BYMINUTE/BYSECOND fan-out.
   */
  private _expandWindow(windowStart: Date, dtstart: Date): Date[] {
    const o = this.options
    let candidates: Date[]

    switch (o.freq) {
      case 'YEARLY':
        candidates = this._yearlyCandidates(windowStart.getFullYear(), dtstart)
        break
      case 'MONTHLY':
        candidates = this._monthlyCandidates(windowStart.getFullYear(), windowStart.getMonth(), dtstart)
        break
      case 'WEEKLY':
        candidates = this._weeklyCandidates(windowStart, dtstart)
        break
      case 'DAILY':
        candidates = this._dailyCandidates(windowStart, dtstart)
        break
      default:
        candidates = [clone(windowStart)]
        break
    }

    // Sub-daily fan-out
    candidates = this._fanOutTime(candidates, dtstart)

    // BY filters that always apply post-expansion
    candidates = candidates.filter((d) => this._matchesByFilters(d, dtstart))
    candidates.sort((a, b) => a.getTime() - b.getTime())
    return candidates
  }

  private _yearlyCandidates(year: number, dtstart: Date): Date[] {
    const o = this.options
    const out: Date[] = []
    const months = o.bymonth ?? [dtstart.getMonth() + 1]
    for (const m of months) {
      out.push(...this._monthlyCandidates(year, m - 1, dtstart))
    }
    return out
  }

  private _monthlyCandidates(year: number, month0: number, dtstart: Date): Date[] {
    const o = this.options
    const out: Date[] = []
    const dim = lastDayOfMonth(year, month0)

    if (o.bymonthday && o.bymonthday.length) {
      for (const md of o.bymonthday) {
        const day = md > 0 ? md : dim + md + 1
        if (day >= 1 && day <= dim) {
          out.push(new Date(year, month0, day, dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds()))
        }
      }
    } else if (o.byweekday && o.byweekday.length) {
      // For each weekday spec, find all matching dates in the month
      for (const w of o.byweekday) {
        const spec = typeof w === 'string' ? ({ day: w } as WeekdayWithN) : w
        const targetDow = WEEKDAY_TO_NUM[spec.day]
        const matches: number[] = []
        for (let day = 1; day <= dim; day++) {
          if (new Date(year, month0, day).getDay() === targetDow) matches.push(day)
        }
        if (spec.n != null) {
          const idx = spec.n > 0 ? spec.n - 1 : matches.length + spec.n
          const day = matches[idx]
          if (day != null) {
            out.push(new Date(year, month0, day, dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds()))
          }
        } else {
          for (const day of matches) {
            out.push(new Date(year, month0, day, dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds()))
          }
        }
      }
    } else {
      // Anchored to dtstart's day-of-month
      const day = Math.min(dtstart.getDate(), dim)
      out.push(new Date(year, month0, day, dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds()))
    }

    return out
  }

  private _weeklyCandidates(windowStart: Date, dtstart: Date): Date[] {
    const o = this.options
    const out: Date[] = []
    const wkst = WEEKDAY_TO_NUM[o.wkst ?? 'MO']
    // Find the start of the week containing windowStart
    const dow = windowStart.getDay()
    const offset = (dow - wkst + 7) % 7
    const weekStart = clone(windowStart)
    weekStart.setDate(weekStart.getDate() - offset)

    const weekdays = o.byweekday?.map((w) => (typeof w === 'string' ? w : w.day)) ?? [
      indexToWeekday(dtstart.getDay())
    ]
    for (const wd of weekdays) {
      const target = WEEKDAY_TO_NUM[wd]
      const off = (target - wkst + 7) % 7
      const d = clone(weekStart)
      d.setDate(d.getDate() + off)
      d.setHours(dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds(), 0)
      out.push(d)
    }
    return out
  }

  private _dailyCandidates(windowStart: Date, dtstart: Date): Date[] {
    const d = clone(windowStart)
    d.setHours(dtstart.getHours(), dtstart.getMinutes(), dtstart.getSeconds(), 0)
    return [d]
  }

  /** Apply BYHOUR/BYMINUTE/BYSECOND fan-out (combinatorial). */
  private _fanOutTime(input: Date[], dtstart: Date): Date[] {
    const o = this.options
    const hours = o.byhour ?? [dtstart.getHours()]
    const minutes = o.byminute ?? [dtstart.getMinutes()]
    const seconds = o.bysecond ?? [dtstart.getSeconds()]
    const noFanOut = !o.byhour && !o.byminute && !o.bysecond
    if (noFanOut) return input
    const out: Date[] = []
    for (const base of input) {
      for (const h of hours) {
        for (const mi of minutes) {
          for (const s of seconds) {
            const d = clone(base)
            d.setHours(h, mi, s, 0)
            out.push(d)
          }
        }
      }
    }
    return out
  }

  private _matchesByFilters(d: Date, _dtstart: Date): boolean {
    const o = this.options
    if (o.bymonth && !o.bymonth.includes(d.getMonth() + 1)) return false
    if (o.byyearday) {
      const dy = dayOfYear(d)
      const yearLen = (d.getFullYear() % 4 === 0 && (d.getFullYear() % 100 !== 0 || d.getFullYear() % 400 === 0)) ? 366 : 365
      const ok = o.byyearday.some((n) => (n > 0 ? n === dy : yearLen + n + 1 === dy))
      if (!ok) return false
    }
    if (o.byweekno) {
      const w = isoWeekNumber(d)
      if (!o.byweekno.includes(w)) return false
    }
    return true
  }

  private _applySetPos(candidates: Date[]): Date[] {
    const o = this.options
    if (!o.bysetpos || candidates.length === 0) return candidates
    const sorted = [...candidates].sort((a, b) => a.getTime() - b.getTime())
    const out: Date[] = []
    for (const pos of o.bysetpos) {
      const idx = pos > 0 ? pos - 1 : sorted.length + pos
      if (idx >= 0 && idx < sorted.length) out.push(sorted[idx])
    }
    return out
  }
}

function indexToWeekday(i: number): Weekday {
  return (['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as Weekday[])[i]
}

export default RRule
