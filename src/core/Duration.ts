import type { UnitInput } from './types'
import { MS_PER_UNIT } from './constants'
import { resolveUnit, pad, pluralize } from './helpers'

export default class Duration {
  private _ms: number

  constructor(ms: number = 0) {
    this._ms = ms
  }

  // ── Static constructors ─────────────────────────────────────────────────

  /**
   * Parse a human-friendly duration string.
   * Supports: "2h30m", "1d", "3w", "500ms", "1.5h"
   */
  static parse(input: string): Duration {
    const re = /(\d+(?:\.\d+)?)(ms|[YyMwdhms])/g
    let total = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(input))) {
      const v = parseFloat(m[1])
      switch (m[2]) {
        case 'Y':
        case 'y':
          total += v * MS_PER_UNIT.year
          break
        case 'M':
          total += v * MS_PER_UNIT.month
          break
        case 'w':
          total += v * MS_PER_UNIT.week
          break
        case 'd':
          total += v * MS_PER_UNIT.day
          break
        case 'h':
          total += v * MS_PER_UNIT.hour
          break
        case 'm':
          total += v * MS_PER_UNIT.minute
          break
        case 's':
          total += v * MS_PER_UNIT.second
          break
        case 'ms':
          total += v
          break
      }
    }
    return new Duration(total)
  }

  /**
   * Parse an ISO 8601 duration string.
   * Format: P[nY][nM][nW][nD][T[nH][nM][nS]]
   * @example Duration.fromISO('P1Y2M3DT4H5M6S')
   * @example Duration.fromISO('PT30M')
   * @example Duration.fromISO('P2W')
   */
  static fromISO(input: string): Duration {
    const re =
      /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
    const m = re.exec(input)
    if (!m) throw new Error(`Invalid ISO 8601 duration: "${input}"`)

    let total = 0
    if (m[1]) total += parseFloat(m[1]) * MS_PER_UNIT.year
    if (m[2]) total += parseFloat(m[2]) * MS_PER_UNIT.month
    if (m[3]) total += parseFloat(m[3]) * MS_PER_UNIT.week
    if (m[4]) total += parseFloat(m[4]) * MS_PER_UNIT.day
    if (m[5]) total += parseFloat(m[5]) * MS_PER_UNIT.hour
    if (m[6]) total += parseFloat(m[6]) * MS_PER_UNIT.minute
    if (m[7]) total += parseFloat(m[7]) * MS_PER_UNIT.second

    return new Duration(total)
  }

  /**
   * Create a Duration between two timestamps (absolute difference).
   */
  static between(a: number | Date, b: number | Date): Duration {
    const msA = typeof a === 'number' ? a : a.getTime()
    const msB = typeof b === 'number' ? b : b.getTime()
    return new Duration(Math.abs(msB - msA))
  }

  // ── Core ────────────────────────────────────────────────────────────────

  /** Convert the duration to a specific unit (fractional). */
  as(unit: UnitInput): number {
    const canonical = resolveUnit(unit)
    const divisor = MS_PER_UNIT[canonical]
    if (canonical === 'unknown') {
      // Explicit 'unknown' unit → NaN; unrecognized strings fall back to dividing by 1
      return (unit as string) === 'unknown' ? NaN : this._ms
    }
    return this._ms / (divisor ?? 1)
  }

  add(n: number, unit: UnitInput): Duration {
    const canonical = resolveUnit(unit)
    if (canonical === 'unknown') throw new Error(`Cannot add/subtract unit "${unit}"`)
    const ms = MS_PER_UNIT[canonical]
    if (ms === undefined || isNaN(ms)) throw new Error(`Cannot add/subtract unit "${unit}"`)
    return new Duration(this._ms + n * ms)
  }

  subtract(n: number, unit: UnitInput): Duration {
    return this.add(-n, unit)
  }

  // ── Convenience getters ─────────────────────────────────────────────────

  toMilliseconds(): number {
    return this.as('millisecond')
  }
  toSeconds(): number {
    return this.as('second')
  }
  toMinutes(): number {
    return this.as('minute')
  }
  toHours(): number {
    return this.as('hour')
  }
  toDays(): number {
    return this.as('day')
  }
  toWeeks(): number {
    return this.as('week')
  }
  toMonths(): number {
    return this.as('month')
  }
  toYears(): number {
    return this.as('year')
  }

  // ── Value / inspection ──────────────────────────────────────────────────

  valueOf(): number {
    return this._ms
  }

  isZero(): boolean {
    return this._ms === 0
  }

  isNegative(): boolean {
    return this._ms < 0
  }

  isPositive(): boolean {
    return this._ms > 0
  }

  abs(): Duration {
    return new Duration(Math.abs(this._ms))
  }

  negate(): Duration {
    return new Duration(-this._ms)
  }

  // ── Comparison ──────────────────────────────────────────────────────────

  equals(other: Duration): boolean {
    return this._ms === other.valueOf()
  }

  lessThan(other: Duration): boolean {
    return this._ms < other.valueOf()
  }

  greaterThan(other: Duration): boolean {
    return this._ms > other.valueOf()
  }

  lessThanOrEqual(other: Duration): boolean {
    return this._ms <= other.valueOf()
  }

  greaterThanOrEqual(other: Duration): boolean {
    return this._ms >= other.valueOf()
  }

  // ── ISO 8601 serialization ──────────────────────────────────────────────

  /**
   * Serialize as ISO 8601 duration string.
   * @example new Duration(90_061_000).toISO() // "PT25H1M1S"
   */
  toISO(): string {
    const ms = Math.abs(this._ms)
    const hours = Math.floor(ms / MS_PER_UNIT.hour)
    const minutes = Math.floor((ms % MS_PER_UNIT.hour) / MS_PER_UNIT.minute)
    const seconds = Math.floor((ms % MS_PER_UNIT.minute) / MS_PER_UNIT.second)
    const parts: string[] = ['P']
    if (hours || minutes || seconds) {
      parts.push('T')
      if (hours) parts.push(`${hours}H`)
      if (minutes) parts.push(`${minutes}M`)
      if (seconds) parts.push(`${seconds}S`)
    } else {
      parts.push('T0S')
    }
    return (this._ms < 0 ? '-' : '') + parts.join('')
  }

  // ── Humanize / format ───────────────────────────────────────────────────

  /**
   * Human-readable representation.
   * - `short=true` (default): compact, e.g. "3d"
   * - `short=false`: multi-unit long form, e.g. "2 days, 3 hours, 15 minutes"
   */
  humanize(short = true): string {
    const ms = Math.abs(this._ms)

    if (short) {
      if (ms < 1000) return `${Math.round(ms)}ms`
      const s = ms / 1000
      if (s < 60) return `${Math.round(s)}s`
      const m = s / 60
      if (m < 60) return `${Math.round(m)}m`
      const h = m / 60
      if (h < 24) return `${Math.round(h)}h`
      const d = h / 24
      return `${Math.round(d)}d`
    }

    const totalSec = Math.floor(ms / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    const milliseconds = Math.floor(ms % 1000)

    const parts: string[] = []
    if (days > 0) parts.push(pluralize(days, 'day'))
    if (hours > 0) parts.push(pluralize(hours, 'hour'))
    if (minutes > 0) parts.push(pluralize(minutes, 'minute'))
    if (seconds > 0) parts.push(pluralize(seconds, 'second'))
    if (milliseconds > 0 && parts.length === 0) parts.push(pluralize(milliseconds, 'millisecond'))

    return parts.join(', ') || '0 milliseconds'
  }

  toString(): string {
    return this.humanize()
  }

  format(fmt: string): string {
    const ms = this._ms
    const H = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    const S = Math.floor(ms % 1000)

    return fmt
      .replace(/HH/g, pad(H))
      .replace(/H(?!H)/g, String(H))
      .replace(/mm/g, pad(m))
      .replace(/m(?!m)/g, String(m))
      .replace(/ss/g, pad(s))
      .replace(/s(?!s)/g, String(s))
      .replace(/SSS/g, pad(S, 3))
  }
}
