import DateTime from '../core/DateTime'
import type { DateInput } from '../core/types'
import { formatOffset } from '../core/helpers'

function toDT(input: DateInput): DateTime {
  return input instanceof DateTime ? input : new DateTime(input)
}

/**
 * IANA-timezone helper. Computes offsets and renders wall-clock formatting in
 * a target zone using `Intl.DateTimeFormat` — no historic-rules data table.
 */
export default class Timezone {
  readonly tz: string

  constructor(tz: string) {
    if (!Timezone.isValid(tz)) {
      throw new RangeError(`Invalid IANA timezone: "${tz}"`)
    }
    this.tz = tz
  }

  /** Best-effort guess of the host's local zone via Intl. */
  static guess(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  static isValid(tz: string): boolean {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: tz })
      return true
    } catch {
      return false
    }
  }

  /** UTC offset in minutes for this zone at a given instant. */
  offsetMinutes(date: DateInput = new DateTime()): number {
    const d = toDT(date)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).formatToParts(new Date(d.valueOf()))

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    const h = get('hour') % 24
    const tzMs = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      h,
      get('minute'),
      get('second')
    )
    return Math.round((tzMs - d.valueOf()) / 60_000)
  }

  /** "+05:30" / "-08:00". */
  offsetString(date: DateInput = new DateTime()): string {
    return formatOffset(this.offsetMinutes(date), ':')
  }

  /**
   * Format a DateInput as if its wall-clock were set to this timezone.
   *   tz.format('2026-04-29T00:00:00Z', 'YYYY-MM-DD HH:mm')
   */
  format(date: DateInput, fmt: string): string {
    return this.toLocalDate(date).format(fmt)
  }

  /** Whether this zone is observing DST at `date`. */
  isDST(date: DateInput = new DateTime()): boolean {
    const d = toDT(date)
    const year = d.get('year')
    const jan = this.offsetMinutes(new DateTime(Date.UTC(year, 0, 1)))
    const jul = this.offsetMinutes(new DateTime(Date.UTC(year, 6, 1)))
    const current = this.offsetMinutes(d)
    return current !== Math.min(jan, jul)
  }

  /**
   * A DateTime whose numeric components express the wall-clock time of
   * `date` in this zone (held in UTC mode for stable formatting).
   */
  toLocalDate(date: DateInput): DateTime {
    const d = toDT(date)
    return new DateTime(d.valueOf() + this.offsetMinutes(d) * 60_000, { utc: true })
  }

  toString(): string {
    return this.tz
  }
}
