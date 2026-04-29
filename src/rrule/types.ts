// RFC 5545 RRULE — public types.

export type Freq = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY'

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

/** A weekday with optional occurrence index. e.g. `{ day: 'MO', n: 2 }` = 2nd Monday. */
export interface WeekdayWithN {
  day: Weekday
  /** 1..53, -1..-53. Omitted for "every Monday" semantics. */
  n?: number
}

export interface RRuleOptions {
  freq: Freq
  /** Stride. Default 1. */
  interval?: number
  /** Maximum number of occurrences. Mutually exclusive with `until`. */
  count?: number
  /** Stop instant (inclusive). Mutually exclusive with `count`. */
  until?: Date | number | string
  /** Anchor instant — defaults to "now" if not specified. */
  dtstart?: Date | number | string

  // BY* filters
  byweekday?: (Weekday | WeekdayWithN)[]
  bymonth?: number[]
  bymonthday?: number[]
  byyearday?: number[]
  byweekno?: number[]
  byhour?: number[]
  byminute?: number[]
  bysecond?: number[]
  bysetpos?: number[]

  /** Week start. Default 'MO'. */
  wkst?: Weekday
}
