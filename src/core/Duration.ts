// ─────────────────────────────────────────────────────────────────────────────
// Duration — an immutable span of time.
//
// Stored as a single signed millisecond count. Calendar-relative operations
// (like "what date is 2 months from now") live on DateTime — Duration only
// represents quantities of time independent of any anchor.
// ─────────────────────────────────────────────────────────────────────────────

import type { UnitInput } from './types'
import { resolveUnit, msPerUnit } from './units'
import { pad, pluralize } from './helpers'

export default class Duration {
  private readonly _ms: number

  constructor(ms = 0) {
    this._ms = ms
  }

  // ── Static factories ─────────────────────────────────────────────────────

  /** Build from a number + unit. */
  static of(n: number, unit: UnitInput): Duration {
    return new Duration(n * msPerUnit(resolveUnit(unit)))
  }

  /**
   * Parse a compact human duration: "2h30m", "1d", "500ms", "1.5h".
   * Falls back to zero on completely unparseable input.
   */
  static parse(input: string): Duration {
    const re = /(\d+(?:\.\d+)?)\s*(ms|us|ns|[YyMwdhms])/g
    let total = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(input)) !== null) {
      const v = parseFloat(m[1])
      switch (m[2]) {
        case 'Y':
        case 'y':
          total += v * msPerUnit('year')
          break
        case 'M':
          total += v * msPerUnit('month')
          break
        case 'w':
          total += v * msPerUnit('week')
          break
        case 'd':
          total += v * msPerUnit('day')
          break
        case 'h':
          total += v * msPerUnit('hour')
          break
        case 'm':
          total += v * msPerUnit('minute')
          break
        case 's':
          total += v * msPerUnit('second')
          break
        case 'ms':
          total += v
          break
        case 'us':
          total += v / 1000
          break
        case 'ns':
          total += v / 1_000_000
          break
      }
    }
    return new Duration(total)
  }

  /** Parse an ISO 8601 duration: P1Y2M3DT4H5M6S, PT30M, P2W. */
  static fromISO(input: string): Duration {
    const re =
      /^(-)?P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
    const m = re.exec(input)
    if (!m) throw new RangeError(`Invalid ISO 8601 duration: "${input}"`)

    let total = 0
    if (m[2]) total += parseFloat(m[2]) * msPerUnit('year')
    if (m[3]) total += parseFloat(m[3]) * msPerUnit('month')
    if (m[4]) total += parseFloat(m[4]) * msPerUnit('week')
    if (m[5]) total += parseFloat(m[5]) * msPerUnit('day')
    if (m[6]) total += parseFloat(m[6]) * msPerUnit('hour')
    if (m[7]) total += parseFloat(m[7]) * msPerUnit('minute')
    if (m[8]) total += parseFloat(m[8]) * msPerUnit('second')
    if (m[1] === '-') total = -total
    return new Duration(total)
  }

  /** |b - a| as a Duration. */
  static between(a: number | Date, b: number | Date): Duration {
    const ma = typeof a === 'number' ? a : a.getTime()
    const mb = typeof b === 'number' ? b : b.getTime()
    return new Duration(Math.abs(mb - ma))
  }

  /** Build from a partial object (any unit). */
  static fromObject(obj: Partial<Record<UnitInput, number>>): Duration {
    let total = 0
    for (const [unit, n] of Object.entries(obj)) {
      if (typeof n === 'number') total += n * msPerUnit(resolveUnit(unit as UnitInput))
    }
    return new Duration(total)
  }

  // ── Arithmetic ───────────────────────────────────────────────────────────

  add(other: number, unit: UnitInput): Duration
  add(other: Duration): Duration
  add(other: Duration | number, unit?: UnitInput): Duration {
    if (other instanceof Duration) return new Duration(this._ms + other._ms)
    return new Duration(this._ms + other * msPerUnit(resolveUnit(unit as UnitInput)))
  }

  subtract(other: number, unit: UnitInput): Duration
  subtract(other: Duration): Duration
  subtract(other: Duration | number, unit?: UnitInput): Duration {
    if (other instanceof Duration) return new Duration(this._ms - other._ms)
    return new Duration(this._ms - other * msPerUnit(resolveUnit(unit as UnitInput)))
  }

  multiply(factor: number): Duration {
    return new Duration(this._ms * factor)
  }

  divide(divisor: number): Duration {
    if (divisor === 0) throw new RangeError('Cannot divide by zero')
    return new Duration(this._ms / divisor)
  }

  // ── Conversion ───────────────────────────────────────────────────────────

  /** Convert to fractional units. */
  as(unit: UnitInput): number {
    return this._ms / msPerUnit(resolveUnit(unit))
  }

  toMilliseconds(): number {
    return this._ms
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

  // ── Inspection ───────────────────────────────────────────────────────────

  valueOf(): number {
    return this._ms
  }
  isZero(): boolean {
    return this._ms === 0
  }
  isPositive(): boolean {
    return this._ms > 0
  }
  isNegative(): boolean {
    return this._ms < 0
  }
  abs(): Duration {
    return new Duration(Math.abs(this._ms))
  }
  negate(): Duration {
    return new Duration(-this._ms)
  }

  // ── Comparison ───────────────────────────────────────────────────────────

  equals(other: Duration): boolean {
    return this._ms === other._ms
  }
  lessThan(other: Duration): boolean {
    return this._ms < other._ms
  }
  greaterThan(other: Duration): boolean {
    return this._ms > other._ms
  }
  lessThanOrEqual(other: Duration): boolean {
    return this._ms <= other._ms
  }
  greaterThanOrEqual(other: Duration): boolean {
    return this._ms >= other._ms
  }

  // ── Serialization ────────────────────────────────────────────────────────

  /**
   * ISO 8601 string. Components are emitted only when nonzero. Zero duration
   * is "PT0S" by convention.
   */
  toISO(): string {
    if (this._ms === 0) return 'PT0S'
    const sign = this._ms < 0 ? '-' : ''
    const abs = Math.abs(this._ms)
    const days = Math.floor(abs / msPerUnit('day'))
    const remainder = abs - days * msPerUnit('day')
    const hours = Math.floor(remainder / msPerUnit('hour'))
    const minutes = Math.floor((remainder % msPerUnit('hour')) / msPerUnit('minute'))
    const seconds = Math.floor((remainder % msPerUnit('minute')) / 1000)
    const ms = remainder % 1000

    const parts: string[] = []
    if (days) parts.push(`${days}D`)
    const time: string[] = []
    if (hours) time.push(`${hours}H`)
    if (minutes) time.push(`${minutes}M`)
    if (seconds || ms) {
      const secStr = ms ? (seconds + ms / 1000).toString() : String(seconds)
      time.push(`${secStr}S`)
    }
    let result = sign + 'P'
    result += parts.join('')
    if (time.length) result += 'T' + time.join('')
    if (parts.length === 0 && time.length === 0) result += 'T0S'
    return result
  }

  toJSON(): string {
    return this.toISO()
  }

  /**
   * Compact short humanize: "3d", "2h", "45m", "30s".
   */
  toShortString(): string {
    const ms = Math.abs(this._ms)
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

  /**
   * Long humanize: "2 days, 3 hours, 15 minutes".
   */
  humanize(short = false): string {
    if (short) return this.toShortString()
    const ms = Math.abs(this._ms)
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

  /** Token-based formatter — `HH:mm:ss.SSS`, `H[h]m[m]`, etc. */
  format(fmt: string): string {
    const ms = this._ms
    const H = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    const s = Math.floor((ms % 60_000) / 1000)
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
