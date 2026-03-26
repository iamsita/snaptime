import DateFormat from '../core/DateFormat'
import type { DateInput } from '../core/types'

function toDF(input: DateInput): DateFormat {
  return input instanceof DateFormat ? input : new DateFormat(input as string | number | Date)
}

export default class Timezone {
  readonly tz: string

  constructor(tz: string) {
    if (!Timezone.isValid(tz)) {
      throw new RangeError(`Invalid IANA timezone: "${tz}"`)
    }
    this.tz = tz
  }

  /** Guess the host runtime's local timezone */
  static guess(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  /** Check if an IANA timezone string is valid */
  static isValid(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz })
      return true
    } catch {
      return false
    }
  }

  /** UTC offset in minutes for this timezone at a given instant */
  offsetMinutes(date: DateInput = new DateFormat()): number {
    const d = toDF(date)
    const utcDate = new Date(d.valueOf())
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).formatToParts(utcDate)

    const get = (type: string) => {
      const val = parts.find((p) => p.type === type)?.value ?? '0'
      return parseInt(val, 10)
    }
    const h = get('hour') % 24
    const tzMs = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      h,
      get('minute'),
      get('second')
    )
    return Math.round((tzMs - d.valueOf()) / 60000)
  }

  /** UTC offset as "+05:30" or "-08:00" */
  offsetString(date: DateInput = new DateFormat()): string {
    const mins = this.offsetMinutes(date)
    const sign = mins >= 0 ? '+' : '-'
    const abs = Math.abs(mins)
    const hh = String(Math.floor(abs / 60)).padStart(2, '0')
    const mm = String(abs % 60).padStart(2, '0')
    return `${sign}${hh}:${mm}`
  }

  /**
   * Format a DateFormat instance as if the local clock were set to this timezone.
   * Internally shifts the UTC timestamp by the offset, then formats in UTC mode.
   */
  format(date: DateInput, fmt: string): string {
    return this.toLocalDate(date).format(fmt)
  }

  /** True if this timezone is currently observing DST at the given date */
  isDST(date: DateInput = new DateFormat()): boolean {
    const d = toDF(date)
    const year = new DateFormat(d.valueOf()).get('year')
    const jan = this.offsetMinutes(new DateFormat(Date.UTC(year, 0, 1)))
    const jul = this.offsetMinutes(new DateFormat(Date.UTC(year, 6, 1)))
    const current = this.offsetMinutes(d)
    return current !== Math.min(jan, jul)
  }

  /**
   * Returns a new DateFormat whose numeric components (year/month/day/hour/min/sec)
   * represent the wall-clock time in this timezone.
   */
  toLocalDate(date: DateInput): DateFormat {
    const d = toDF(date)
    const offsetMs = this.offsetMinutes(d) * 60000
    return new DateFormat(d.valueOf() + offsetMs, { utc: true })
  }

  toString(): string {
    return this.tz
  }
}
