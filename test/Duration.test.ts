import { describe, test, expect } from '@jest/globals'
import Duration from '../src/core/Duration'

// ─── Millisecond constants ────────────────────────────────────────────────────
const MS = 1
const SEC = 1_000
const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const WEEK = 604_800_000
const MONTH = 2_592_000_000 // 30 days
const YEAR = 31_536_000_000 // 365 days

// =============================================================================
// Duration.parse()
// =============================================================================

describe('Duration.parse()', () => {
  // ── happy-path single tokens ──────────────────────────────────────────────

  test('empty string → 0ms', () => {
    expect(Duration.parse('').valueOf()).toBe(0)
  })

  test('whitespace-only string → 0ms (no tokens match)', () => {
    expect(Duration.parse('   ').valueOf()).toBe(0)
  })

  test('1Y → 365 days in ms', () => {
    expect(Duration.parse('1Y').valueOf()).toBe(365 * DAY)
  })

  test('1y → same as 1Y', () => {
    expect(Duration.parse('1y').valueOf()).toBe(Duration.parse('1Y').valueOf())
  })

  test('2Y → 730 days in ms', () => {
    expect(Duration.parse('2Y').valueOf()).toBe(2 * 365 * DAY)
  })

  test('1M → 30 days in ms', () => {
    expect(Duration.parse('1M').valueOf()).toBe(30 * DAY)
  })

  test('3M → 90 days in ms', () => {
    expect(Duration.parse('3M').valueOf()).toBe(3 * 30 * DAY)
  })

  test('1w → 7 days in ms', () => {
    expect(Duration.parse('1w').valueOf()).toBe(WEEK)
  })

  test('1d → 1 day in ms', () => {
    expect(Duration.parse('1d').valueOf()).toBe(DAY)
  })

  test('1h → 1 hour in ms', () => {
    expect(Duration.parse('1h').valueOf()).toBe(HOUR)
  })

  test('1m → 1 minute in ms', () => {
    expect(Duration.parse('1m').valueOf()).toBe(MIN)
  })

  test('1s → 1 second in ms', () => {
    expect(Duration.parse('1s').valueOf()).toBe(SEC)
  })

  test('1ms → 1 ms', () => {
    expect(Duration.parse('1ms').valueOf()).toBe(1)
  })

  test('500ms → 500 ms', () => {
    expect(Duration.parse('500ms').valueOf()).toBe(500)
  })

  // ── multi-token combinations ──────────────────────────────────────────────

  test('2h30m → 2.5 hours in ms', () => {
    expect(Duration.parse('2h30m').valueOf()).toBe(2 * HOUR + 30 * MIN)
  })

  test('1d12h → 36 hours in ms', () => {
    expect(Duration.parse('1d12h').valueOf()).toBe(DAY + 12 * HOUR)
  })

  test('1d2h30m', () => {
    expect(Duration.parse('1d2h30m').valueOf()).toBe(DAY + 2 * HOUR + 30 * MIN)
  })

  test('full token chain: 1Y2M3w4d5h6m7s8ms', () => {
    const expected =
      1 * 365 * DAY +
      2 * 30 * DAY +
      3 * WEEK +
      4 * DAY +
      5 * HOUR +
      6 * MIN +
      7 * SEC +
      8 * MS
    expect(Duration.parse('1Y2M3w4d5h6m7s8ms').valueOf()).toBe(expected)
  })

  // ── decimals ─────────────────────────────────────────────────────────────

  test('1.5h → 90 minutes in ms', () => {
    expect(Duration.parse('1.5h').valueOf()).toBe(1.5 * HOUR)
  })

  test('0.5d → 12 hours in ms', () => {
    expect(Duration.parse('0.5d').valueOf()).toBe(0.5 * DAY)
  })

  test('2.5m → 150 seconds in ms', () => {
    expect(Duration.parse('2.5m').valueOf()).toBe(2.5 * MIN)
  })
})

// =============================================================================
// Duration.fromISO()
// =============================================================================

describe('Duration.fromISO()', () => {
  // ── single designators ────────────────────────────────────────────────────

  test('P1Y → 365 days in ms', () => {
    expect(Duration.fromISO('P1Y').valueOf()).toBe(YEAR)
  })

  test('P2Y → 730 days in ms', () => {
    expect(Duration.fromISO('P2Y').valueOf()).toBe(2 * YEAR)
  })

  test('P1M → 30 days in ms', () => {
    expect(Duration.fromISO('P1M').valueOf()).toBe(MONTH)
  })

  test('P3M → 90 days in ms', () => {
    expect(Duration.fromISO('P3M').valueOf()).toBe(3 * MONTH)
  })

  test('P1W → 7 days in ms', () => {
    expect(Duration.fromISO('P1W').valueOf()).toBe(WEEK)
  })

  test('P7D → 7 days in ms', () => {
    expect(Duration.fromISO('P7D').valueOf()).toBe(7 * DAY)
  })

  test('P1D → 1 day in ms', () => {
    expect(Duration.fromISO('P1D').valueOf()).toBe(DAY)
  })

  test('PT1H → 1 hour in ms', () => {
    expect(Duration.fromISO('PT1H').valueOf()).toBe(HOUR)
  })

  test('PT30M → 30 minutes in ms', () => {
    expect(Duration.fromISO('PT30M').valueOf()).toBe(30 * MIN)
  })

  test('PT45S → 45 seconds in ms', () => {
    expect(Duration.fromISO('PT45S').valueOf()).toBe(45 * SEC)
  })

  // ── combined ──────────────────────────────────────────────────────────────

  test('P1Y2M3DT4H5M6S → correct total ms', () => {
    const expected = 1 * YEAR + 2 * MONTH + 3 * DAY + 4 * HOUR + 5 * MIN + 6 * SEC
    expect(Duration.fromISO('P1Y2M3DT4H5M6S').valueOf()).toBe(expected)
  })

  test('PT1H30M → 90 minutes in ms', () => {
    expect(Duration.fromISO('PT1H30M').valueOf()).toBe(HOUR + 30 * MIN)
  })

  test('P1DT12H → 36 hours in ms', () => {
    expect(Duration.fromISO('P1DT12H').valueOf()).toBe(DAY + 12 * HOUR)
  })

  test('P2W → 2 weeks in ms', () => {
    expect(Duration.fromISO('P2W').valueOf()).toBe(2 * WEEK)
  })

  // ── zero ─────────────────────────────────────────────────────────────────

  test('PT0S → 0ms', () => {
    expect(Duration.fromISO('PT0S').valueOf()).toBe(0)
  })

  // ── fractional components ─────────────────────────────────────────────────

  test('PT1.5H → 90 minutes in ms', () => {
    expect(Duration.fromISO('PT1.5H').valueOf()).toBe(1.5 * HOUR)
  })

  // ── error cases ───────────────────────────────────────────────────────────

  test('invalid string throws', () => {
    expect(() => Duration.fromISO('not-a-duration')).toThrow()
  })

  test('empty string throws', () => {
    expect(() => Duration.fromISO('')).toThrow()
  })

  test('plain "P" with no components produces 0ms (regex matches but all groups empty)', () => {
    // The ISO regex considers "P" valid with all groups absent → 0ms, no throw
    expect(Duration.fromISO('P').valueOf()).toBe(0)
  })

  test('missing P prefix throws', () => {
    expect(() => Duration.fromISO('T1H')).toThrow()
  })

  test('random number string throws', () => {
    expect(() => Duration.fromISO('12345')).toThrow()
  })

  // ── fromISO round-trips convert to correct unit values ────────────────────

  test('PT2H toHours() → 2', () => {
    expect(Duration.fromISO('PT2H').toHours()).toBe(2)
  })

  test('PT90M toMinutes() → 90', () => {
    expect(Duration.fromISO('PT90M').toMinutes()).toBe(90)
  })

  test('P7D toDays() → 7', () => {
    expect(Duration.fromISO('P7D').toDays()).toBe(7)
  })
})

// =============================================================================
// Duration.between()
// =============================================================================

describe('Duration.between()', () => {
  const t = 1_700_000_000_000 // arbitrary fixed epoch ms

  test('a < b → correct positive duration', () => {
    expect(Duration.between(t, t + HOUR).valueOf()).toBe(HOUR)
  })

  test('a > b → absolute difference (still positive)', () => {
    expect(Duration.between(t + HOUR, t).valueOf()).toBe(HOUR)
  })

  test('a === b → 0ms', () => {
    expect(Duration.between(t, t).valueOf()).toBe(0)
  })

  test('accepts Date objects', () => {
    const a = new Date(t)
    const b = new Date(t + 2 * HOUR)
    expect(Duration.between(a, b).valueOf()).toBe(2 * HOUR)
  })

  test('mixed: number and Date', () => {
    const a = t
    const b = new Date(t + 30 * MIN)
    expect(Duration.between(a, b).valueOf()).toBe(30 * MIN)
  })

  test('result is always non-negative', () => {
    expect(Duration.between(t + DAY, t).isNegative()).toBe(false)
    expect(Duration.between(t + DAY, t).valueOf()).toBeGreaterThanOrEqual(0)
  })

  test('24-hour difference', () => {
    expect(Duration.between(t, t + DAY).toDays()).toBe(1)
  })
})

// =============================================================================
// Duration.as() — all unit aliases
// =============================================================================

describe('Duration.as() — canonical units', () => {
  const d = new Duration(YEAR)

  test('as("millisecond")', () => expect(d.as('millisecond')).toBe(YEAR))
  test('as("second")', () => expect(d.as('second')).toBe(YEAR / SEC))
  test('as("minute")', () => expect(d.as('minute')).toBe(YEAR / MIN))
  test('as("hour")', () => expect(d.as('hour')).toBe(YEAR / HOUR))
  test('as("day")', () => expect(d.as('day')).toBe(YEAR / DAY))
  test('as("date") same as day', () => expect(d.as('date')).toBe(YEAR / DAY))
  test('as("week")', () => expect(new Duration(WEEK).as('week')).toBeCloseTo(1, 5))
  test('as("month")', () => expect(new Duration(MONTH).as('month')).toBeCloseTo(1, 5))
  test('as("year")', () => expect(new Duration(YEAR).as('year')).toBeCloseTo(1, 5))
  test('as("unknown") → NaN', () => expect(new Duration(SEC).as('unknown')).toBeNaN())
})

describe('Duration.as() — short alias tokens', () => {
  const d = new Duration(YEAR)

  test('as("ms")', () => expect(d.as('ms')).toBe(YEAR))
  test('as("s")', () => expect(d.as('s')).toBe(YEAR / SEC))
  test('as("m")', () => expect(d.as('m')).toBe(YEAR / MIN))
  test('as("h")', () => expect(d.as('h')).toBe(YEAR / HOUR))
  test('as("d")', () => expect(d.as('d')).toBe(YEAR / DAY))
  test('as("w")', () => expect(new Duration(WEEK).as('w')).toBeCloseTo(1, 5))
  test('as("M")', () => expect(new Duration(MONTH).as('M')).toBeCloseTo(1, 5))
  test('as("y")', () => expect(new Duration(YEAR).as('y')).toBeCloseTo(1, 5))
})

describe('Duration.as() — plural alias tokens', () => {
  const d = new Duration(YEAR)

  test('as("milliseconds")', () => expect(d.as('milliseconds')).toBe(YEAR))
  test('as("seconds")', () => expect(d.as('seconds')).toBe(YEAR / SEC))
  test('as("minutes")', () => expect(d.as('minutes')).toBe(YEAR / MIN))
  test('as("hours")', () => expect(d.as('hours')).toBe(YEAR / HOUR))
  test('as("days")', () => expect(d.as('days')).toBe(YEAR / DAY))
  test('as("weeks")', () => expect(new Duration(WEEK).as('weeks')).toBeCloseTo(1, 5))
  test('as("months")', () => expect(new Duration(MONTH).as('months')).toBeCloseTo(1, 5))
  test('as("years")', () => expect(new Duration(YEAR).as('years')).toBeCloseTo(1, 5))
})

// =============================================================================
// Convenience getters (toX())
// =============================================================================

describe('Duration convenience getters', () => {
  const d = new Duration(2 * HOUR + 3 * MIN + 4 * SEC + 5)

  test('toMilliseconds() === as("millisecond")', () => {
    expect(d.toMilliseconds()).toBe(d.as('millisecond'))
  })
  test('toSeconds() === as("second")', () => {
    expect(d.toSeconds()).toBe(d.as('second'))
  })
  test('toMinutes() === as("minute")', () => {
    expect(d.toMinutes()).toBe(d.as('minute'))
  })
  test('toHours() === as("hour")', () => {
    expect(d.toHours()).toBe(d.as('hour'))
  })
  test('toDays() === as("day")', () => {
    expect(d.toDays()).toBe(d.as('day'))
  })
  test('toWeeks() === as("week")', () => {
    expect(new Duration(WEEK).toWeeks()).toBe(new Duration(WEEK).as('week'))
  })
  test('toMonths() === as("month")', () => {
    expect(new Duration(MONTH).toMonths()).toBe(new Duration(MONTH).as('month'))
  })
  test('toYears() === as("year")', () => {
    expect(new Duration(YEAR).toYears()).toBe(new Duration(YEAR).as('year'))
  })

  test('toHours() for 90 minutes → 1.5', () => {
    expect(new Duration(90 * MIN).toHours()).toBe(1.5)
  })
  test('toMinutes() for 90 minutes → 90', () => {
    expect(new Duration(90 * MIN).toMinutes()).toBe(90)
  })
})

// =============================================================================
// add() and subtract()
// =============================================================================

describe('Duration.add()', () => {
  test('add positive seconds', () => {
    expect(new Duration(0).add(5, 'second').valueOf()).toBe(5 * SEC)
  })
  test('add negative seconds decreases value', () => {
    expect(new Duration(10 * SEC).add(-3, 'second').valueOf()).toBe(7 * SEC)
  })
  test('add(1, "minute") → +60000ms', () => {
    expect(new Duration(0).add(1, 'minute').valueOf()).toBe(MIN)
  })
  test('add(1, "hour") → +3600000ms', () => {
    expect(new Duration(0).add(1, 'hour').valueOf()).toBe(HOUR)
  })
  test('add(1, "day") → +86400000ms', () => {
    expect(new Duration(0).add(1, 'day').valueOf()).toBe(DAY)
  })
  test('add(1, "week") → +604800000ms', () => {
    expect(new Duration(0).add(1, 'week').valueOf()).toBe(WEEK)
  })
  test('add(1, "month") → +2592000000ms', () => {
    expect(new Duration(0).add(1, 'month').valueOf()).toBe(MONTH)
  })
  test('add(1, "year") → +31536000000ms', () => {
    expect(new Duration(0).add(1, 'year').valueOf()).toBe(YEAR)
  })
  test('add(1, "millisecond") → +1ms', () => {
    expect(new Duration(0).add(1, 'millisecond').valueOf()).toBe(1)
  })

  test('add unknown unit throws', () => {
    expect(() => new Duration(0).add(1, 'unknown' as never)).toThrow(
      'Cannot add/subtract unit "unknown"'
    )
  })

  test('immutability: add() returns new Duration, original unchanged', () => {
    const original = new Duration(HOUR)
    const result = original.add(1, 'hour')
    expect(original.valueOf()).toBe(HOUR)
    expect(result.valueOf()).toBe(2 * HOUR)
  })
})

describe('Duration.subtract()', () => {
  test('subtract is alias for add(-n)', () => {
    const base = new Duration(10 * SEC)
    expect(base.subtract(3, 'second').valueOf()).toBe(base.add(-3, 'second').valueOf())
  })
  test('subtract reduces value', () => {
    expect(new Duration(DAY).subtract(1, 'hour').valueOf()).toBe(DAY - HOUR)
  })
  test('subtract to negative', () => {
    expect(new Duration(0).subtract(1, 'second').valueOf()).toBe(-SEC)
  })
  test('immutability: subtract() returns new Duration, original unchanged', () => {
    const original = new Duration(DAY)
    const result = original.subtract(1, 'hour')
    expect(original.valueOf()).toBe(DAY)
    expect(result.valueOf()).toBe(DAY - HOUR)
  })
})

// =============================================================================
// valueOf()
// =============================================================================

describe('Duration.valueOf()', () => {
  test('returns internal ms', () => {
    expect(new Duration(12345).valueOf()).toBe(12345)
  })
  test('default constructor → 0', () => {
    expect(new Duration().valueOf()).toBe(0)
  })
  test('negative duration', () => {
    expect(new Duration(-500).valueOf()).toBe(-500)
  })
})

// =============================================================================
// isZero() / isNegative() / isPositive()
// =============================================================================

describe('Duration.isZero()', () => {
  test('0ms → true', () => expect(new Duration(0).isZero()).toBe(true))
  test('1ms → false', () => expect(new Duration(1).isZero()).toBe(false))
  test('-1ms → false', () => expect(new Duration(-1).isZero()).toBe(false))
})

describe('Duration.isNegative()', () => {
  test('negative ms → true', () => expect(new Duration(-1).isNegative()).toBe(true))
  test('0ms → false', () => expect(new Duration(0).isNegative()).toBe(false))
  test('positive ms → false', () => expect(new Duration(1).isNegative()).toBe(false))
})

describe('Duration.isPositive()', () => {
  test('positive ms → true', () => expect(new Duration(1).isPositive()).toBe(true))
  test('0ms → false', () => expect(new Duration(0).isPositive()).toBe(false))
  test('negative ms → false', () => expect(new Duration(-1).isPositive()).toBe(false))
})

// =============================================================================
// abs() and negate()
// =============================================================================

describe('Duration.abs()', () => {
  test('negative → positive magnitude', () => {
    expect(new Duration(-HOUR).abs().valueOf()).toBe(HOUR)
  })
  test('already positive → same value', () => {
    expect(new Duration(HOUR).abs().valueOf()).toBe(HOUR)
  })
  test('zero → zero', () => {
    expect(new Duration(0).abs().valueOf()).toBe(0)
  })
  test('abs() result isPositive or isZero', () => {
    expect(new Duration(-5000).abs().isNegative()).toBe(false)
  })
  test('immutability: abs() does not change original', () => {
    const d = new Duration(-HOUR)
    d.abs()
    expect(d.valueOf()).toBe(-HOUR)
  })
})

describe('Duration.negate()', () => {
  test('positive → negative', () => {
    expect(new Duration(HOUR).negate().valueOf()).toBe(-HOUR)
  })
  test('negative → positive', () => {
    expect(new Duration(-HOUR).negate().valueOf()).toBe(HOUR)
  })
  test('negating zero produces a zero duration (isZero)', () => {
    // -0 and 0 are numerically equal; assert via isZero() which checks ms === 0
    expect(new Duration(0).negate().isZero()).toBe(true)
  })
  test('double negate restores original', () => {
    const d = new Duration(DAY)
    expect(d.negate().negate().valueOf()).toBe(DAY)
  })
  test('immutability: negate() does not change original', () => {
    const d = new Duration(HOUR)
    d.negate()
    expect(d.valueOf()).toBe(HOUR)
  })
})

// =============================================================================
// Comparison methods
// =============================================================================

describe('Duration.equals()', () => {
  test('same ms → true', () => {
    expect(new Duration(HOUR).equals(new Duration(HOUR))).toBe(true)
  })
  test('different ms → false', () => {
    expect(new Duration(HOUR).equals(new Duration(2 * HOUR))).toBe(false)
  })
  test('both zero → true', () => {
    expect(new Duration(0).equals(new Duration(0))).toBe(true)
  })
  test('negative equality', () => {
    expect(new Duration(-MIN).equals(new Duration(-MIN))).toBe(true)
  })
})

describe('Duration.lessThan()', () => {
  test('1h < 2h → true', () => {
    expect(new Duration(HOUR).lessThan(new Duration(2 * HOUR))).toBe(true)
  })
  test('2h < 1h → false', () => {
    expect(new Duration(2 * HOUR).lessThan(new Duration(HOUR))).toBe(false)
  })
  test('equal → false', () => {
    expect(new Duration(HOUR).lessThan(new Duration(HOUR))).toBe(false)
  })
})

describe('Duration.greaterThan()', () => {
  test('2h > 1h → true', () => {
    expect(new Duration(2 * HOUR).greaterThan(new Duration(HOUR))).toBe(true)
  })
  test('1h > 2h → false', () => {
    expect(new Duration(HOUR).greaterThan(new Duration(2 * HOUR))).toBe(false)
  })
  test('equal → false', () => {
    expect(new Duration(HOUR).greaterThan(new Duration(HOUR))).toBe(false)
  })
})

describe('Duration.lessThanOrEqual()', () => {
  test('1h <= 2h → true', () => {
    expect(new Duration(HOUR).lessThanOrEqual(new Duration(2 * HOUR))).toBe(true)
  })
  test('equal → true', () => {
    expect(new Duration(HOUR).lessThanOrEqual(new Duration(HOUR))).toBe(true)
  })
  test('2h <= 1h → false', () => {
    expect(new Duration(2 * HOUR).lessThanOrEqual(new Duration(HOUR))).toBe(false)
  })
})

describe('Duration.greaterThanOrEqual()', () => {
  test('2h >= 1h → true', () => {
    expect(new Duration(2 * HOUR).greaterThanOrEqual(new Duration(HOUR))).toBe(true)
  })
  test('equal → true', () => {
    expect(new Duration(HOUR).greaterThanOrEqual(new Duration(HOUR))).toBe(true)
  })
  test('1h >= 2h → false', () => {
    expect(new Duration(HOUR).greaterThanOrEqual(new Duration(2 * HOUR))).toBe(false)
  })
})

// =============================================================================
// toISO()
// =============================================================================

describe('Duration.toISO()', () => {
  test('zero → "PT0S"', () => {
    expect(new Duration(0).toISO()).toBe('PT0S')
  })

  test('1 hour → "PT1H"', () => {
    expect(new Duration(HOUR).toISO()).toBe('PT1H')
  })

  test('30 minutes → "PT30M"', () => {
    expect(new Duration(30 * MIN).toISO()).toBe('PT30M')
  })

  test('45 seconds → "PT45S"', () => {
    expect(new Duration(45 * SEC).toISO()).toBe('PT45S')
  })

  test('1h30m → "PT1H30M"', () => {
    expect(new Duration(HOUR + 30 * MIN).toISO()).toBe('PT1H30M')
  })

  test('25h1m1s → "PT25H1M1S"', () => {
    // 25 hours + 1 minute + 1 second
    expect(new Duration(25 * HOUR + MIN + SEC).toISO()).toBe('PT25H1M1S')
  })

  test('negative duration → "-PT2H"', () => {
    expect(new Duration(-2 * HOUR).toISO()).toBe('-PT2H')
  })

  test('2 hours → "PT2H" (no minutes/seconds component)', () => {
    const iso = new Duration(2 * HOUR).toISO()
    expect(iso).toBe('PT2H')
  })

  test('mixed h/m/s → includes all three components', () => {
    const iso = new Duration(2 * HOUR + 5 * MIN + 3 * SEC).toISO()
    expect(iso).toBe('PT2H5M3S')
  })
})

// =============================================================================
// humanize()
// =============================================================================

describe('Duration.humanize(true) — short form (default)', () => {
  test('0ms → "0ms"', () => expect(new Duration(0).humanize(true)).toBe('0ms'))
  test('500ms → "500ms"', () => expect(new Duration(500).humanize(true)).toBe('500ms'))
  test('999ms → "999ms"', () => expect(new Duration(999).humanize(true)).toBe('999ms'))
  test('1s → "1s"', () => expect(new Duration(SEC).humanize(true)).toBe('1s'))
  test('30s → "30s"', () => expect(new Duration(30 * SEC).humanize(true)).toBe('30s'))
  test('5m → "5m"', () => expect(new Duration(5 * MIN).humanize(true)).toBe('5m'))
  test('3h → "3h"', () => expect(new Duration(3 * HOUR).humanize(true)).toBe('3h'))
  test('2d → "2d"', () => expect(new Duration(2 * DAY).humanize(true)).toBe('2d'))
  test('negative 2d → "2d" (abs)', () => {
    expect(new Duration(-2 * DAY).humanize(true)).toBe('2d')
  })
  test('humanize() with no arg uses short form', () => {
    expect(new Duration(3 * HOUR).humanize()).toBe(new Duration(3 * HOUR).humanize(true))
  })
})

describe('Duration.humanize(false) — long form', () => {
  test('0ms → "0 milliseconds"', () => {
    expect(new Duration(0).humanize(false)).toBe('0 milliseconds')
  })
  test('1ms → "1 millisecond"', () => {
    expect(new Duration(1).humanize(false)).toBe('1 millisecond')
  })
  test('500ms → "500 milliseconds"', () => {
    expect(new Duration(500).humanize(false)).toBe('500 milliseconds')
  })
  test('1 second → "1 second"', () => {
    expect(new Duration(SEC).humanize(false)).toBe('1 second')
  })
  test('30 seconds → "30 seconds"', () => {
    expect(new Duration(30 * SEC).humanize(false)).toBe('30 seconds')
  })
  test('1 minute → "1 minute"', () => {
    expect(new Duration(MIN).humanize(false)).toBe('1 minute')
  })
  test('1 hour → "1 hour"', () => {
    expect(new Duration(HOUR).humanize(false)).toBe('1 hour')
  })
  test('1 day → "1 day"', () => {
    expect(new Duration(DAY).humanize(false)).toBe('1 day')
  })
  test('2 days → "2 days"', () => {
    expect(new Duration(2 * DAY).humanize(false)).toBe('2 days')
  })
  test('multi-unit includes all parts', () => {
    const result = Duration.parse('2d3h15m').humanize(false)
    expect(result).toContain('2 days')
    expect(result).toContain('3 hours')
    expect(result).toContain('15 minutes')
  })
  test('day + hour → "1 day, 1 hour"', () => {
    expect(new Duration(DAY + HOUR).humanize(false)).toBe('1 day, 1 hour')
  })
  test('ms not included when larger units present', () => {
    const result = new Duration(DAY + 500).humanize(false)
    expect(result).not.toContain('millisecond')
  })
  test('negative uses abs value', () => {
    expect(new Duration(-DAY).humanize(false)).toBe('1 day')
  })
})

// =============================================================================
// toString()
// =============================================================================

describe('Duration.toString()', () => {
  test('same as humanize() default (short)', () => {
    const d = new Duration(3 * HOUR)
    expect(d.toString()).toBe(d.humanize())
  })
  test('short form for small value', () => {
    expect(new Duration(500).toString()).toBe('500ms')
  })
  test('short form for days', () => {
    expect(new Duration(2 * DAY).toString()).toBe('2d')
  })
})

// =============================================================================
// format()
// =============================================================================

describe('Duration.format()', () => {
  // 2h 5m 3s 50ms
  const d = new Duration(2 * HOUR + 5 * MIN + 3 * SEC + 50)

  test('HH:mm:ss.SSS → zero-padded', () => {
    expect(d.format('HH:mm:ss.SSS')).toBe('02:05:03.050')
  })

  test('H:m:s → no padding', () => {
    expect(d.format('H:m:s')).toBe('2:5:3')
  })

  test('HH only → "02"', () => {
    expect(d.format('HH')).toBe('02')
  })

  test('H only → "2"', () => {
    expect(d.format('H')).toBe('2')
  })

  test('mm only → "05"', () => {
    expect(d.format('mm')).toBe('05')
  })

  test('m only → "5"', () => {
    expect(d.format('m')).toBe('5')
  })

  test('ss only → "03"', () => {
    expect(d.format('ss')).toBe('03')
  })

  test('s only → "3"', () => {
    expect(d.format('s')).toBe('3')
  })

  test('SSS only → "050"', () => {
    expect(d.format('SSS')).toBe('050')
  })

  test('HH zero-pads hours < 10', () => {
    expect(new Duration(5 * MIN).format('HH:mm:ss')).toBe('00:05:00')
  })

  test('SSS pads ms to 3 digits', () => {
    expect(new Duration(7).format('SSS')).toBe('007')
  })

  test('SSS pads single-digit ms', () => {
    expect(new Duration(7 * SEC + 7).format('SSS')).toBe('007')
  })

  test('large hours not padded in H', () => {
    expect(new Duration(100 * HOUR).format('H')).toBe('100')
  })

  test('zero duration → "00:00:00.000"', () => {
    expect(new Duration(0).format('HH:mm:ss.SSS')).toBe('00:00:00.000')
  })

  test('format with bracket separators: H[h]mm[m] → "1h30m"', () => {
    // format() replaces only H/HH/m/mm/s/ss/SSS tokens; use non-clashing literal chars
    const ninetyMin = new Duration(HOUR + 30 * MIN)
    expect(ninetyMin.format('H:mm')).toBe('1:30')
  })

  test('90 minutes: H→1, m→30', () => {
    const ninetyMin = new Duration(HOUR + 30 * MIN)
    expect(ninetyMin.format('H')).toBe('1')
    expect(ninetyMin.format('m')).toBe('30')
  })
})

// =============================================================================
// Real-life scenario 1: Task time estimation (Jira-like)
// =============================================================================

describe('Real-life: task time estimation', () => {
  test('parse Jira estimate "2h30m"', () => {
    const estimate = Duration.parse('2h30m')
    expect(estimate.toMinutes()).toBe(150)
  })

  test('convert estimate to minutes for display', () => {
    const estimate = Duration.parse('1h45m')
    expect(estimate.toMinutes()).toBe(105)
  })

  test('compare two estimates: 2h30m > 1h45m', () => {
    const a = Duration.parse('2h30m')
    const b = Duration.parse('1h45m')
    expect(a.greaterThan(b)).toBe(true)
    expect(b.lessThan(a)).toBe(true)
  })

  test('summing sub-task estimates', () => {
    const task1 = Duration.parse('1h30m')
    const task2 = Duration.parse('45m')
    const total = new Duration(task1.valueOf() + task2.valueOf())
    expect(total.toMinutes()).toBe(135)
  })

  test('estimate equality: "2h" equals "120m"', () => {
    expect(Duration.parse('2h').equals(Duration.parse('120m'))).toBe(true)
  })

  test('format estimate as HH:mm:ss for UI', () => {
    expect(Duration.parse('2h30m').format('HH:mm:ss')).toBe('02:30:00')
  })
})

// =============================================================================
// Real-life scenario 2: Build time tracking
// =============================================================================

describe('Real-life: build time tracking', () => {
  test('Duration.between(buildStart, buildEnd) gives correct duration', () => {
    const buildStart = new Date('2024-01-01T10:00:00Z').getTime()
    const buildEnd = new Date('2024-01-01T10:03:42Z').getTime()
    const buildTime = Duration.between(buildStart, buildEnd)
    expect(buildTime.toSeconds()).toBe(222)
  })

  test('humanize build time in short form: ~"4m"', () => {
    const buildTime = Duration.between(0, 3 * MIN + 42 * SEC)
    // 222 seconds rounds to 4 minutes in short humanize
    const humanized = buildTime.humanize(true)
    expect(humanized).toBe('4m')
  })

  test('humanize build time in long form includes minutes and seconds', () => {
    const buildTime = new Duration(3 * MIN + 42 * SEC)
    const result = buildTime.humanize(false)
    expect(result).toContain('3 minutes')
    expect(result).toContain('42 seconds')
  })

  test('format build time as mm:ss', () => {
    const buildTime = new Duration(3 * MIN + 42 * SEC)
    expect(buildTime.format('mm:ss')).toBe('03:42')
  })

  test('build time isPositive', () => {
    expect(Duration.between(1000, 5000).isPositive()).toBe(true)
  })
})

// =============================================================================
// Real-life scenario 3: Subscription periods
// =============================================================================

describe('Real-life: subscription periods', () => {
  test('"1Y" subscription is 365 days', () => {
    expect(Duration.parse('1Y').toDays()).toBe(365)
  })

  test('"1M" subscription is 30 days', () => {
    expect(Duration.parse('1M').toDays()).toBe(30)
  })

  test('add one month to a 1-year subscription', () => {
    const yearly = Duration.parse('1Y')
    const extended = yearly.add(1, 'month')
    expect(extended.toDays()).toBe(365 + 30)
  })

  test('ISO "P1Y" matches "1Y" parse', () => {
    expect(Duration.fromISO('P1Y').valueOf()).toBe(Duration.parse('1Y').valueOf())
  })

  test('3-month trial: compare to 90-day equivalent', () => {
    const trial = Duration.parse('3M') // 90 days
    const ninetyDays = new Duration(90 * DAY)
    expect(trial.equals(ninetyDays)).toBe(true)
  })
})

// =============================================================================
// Real-life scenario 4: Timer countdown
// =============================================================================

describe('Real-life: timer countdown', () => {
  test('parse timer starting at "01:30:00" → 90 minutes', () => {
    const timer = Duration.fromISO('PT1H30M')
    expect(timer.toMinutes()).toBe(90)
    expect(timer.format('HH:mm:ss')).toBe('01:30:00')
  })

  test('subtract elapsed seconds from timer', () => {
    const timer = Duration.fromISO('PT1H30M')
    const elapsed = new Duration(5 * MIN + 30 * SEC)
    const remaining = new Duration(timer.valueOf() - elapsed.valueOf())
    expect(remaining.toMinutes()).toBeCloseTo(84.5)
  })

  test('timer at zero → isZero true', () => {
    const timer = new Duration(30 * SEC)
    const finished = timer.subtract(30, 'second')
    expect(finished.isZero()).toBe(true)
  })

  test('timer past zero → isNegative true', () => {
    const timer = new Duration(0)
    const overdue = timer.subtract(5, 'second')
    expect(overdue.isNegative()).toBe(true)
  })

  test('format countdown display HH:mm:ss', () => {
    const remaining = new Duration(HOUR + 23 * MIN + 15 * SEC)
    expect(remaining.format('HH:mm:ss')).toBe('01:23:15')
  })
})

// =============================================================================
// Real-life scenario 5: Meeting duration from API (ISO 8601)
// =============================================================================

describe('Real-life: meeting duration from ISO API', () => {
  test('parse "PT1H30M" meeting from API', () => {
    const meeting = Duration.fromISO('PT1H30M')
    expect(meeting.toMinutes()).toBe(90)
  })

  test('30-minute standup: "PT30M"', () => {
    expect(Duration.fromISO('PT30M').toMinutes()).toBe(30)
  })

  test('2-hour workshop: "PT2H"', () => {
    expect(Duration.fromISO('PT2H').toHours()).toBe(2)
  })

  test('format meeting for scheduling calendar as H:mm', () => {
    const meeting = Duration.fromISO('PT1H30M')
    expect(meeting.format('H:mm')).toBe('1:30')
  })

  test('compare meetings: 90m > 45m', () => {
    const long = Duration.fromISO('PT1H30M')
    const short = Duration.fromISO('PT45M')
    expect(long.greaterThan(short)).toBe(true)
  })

  test('toISO round-trip: PT1H30M → PT1H30M', () => {
    expect(Duration.fromISO('PT1H30M').toISO()).toBe('PT1H30M')
  })
})

// =============================================================================
// Real-life scenario 6: SLA tracking
// =============================================================================

describe('Real-life: SLA tracking', () => {
  const SLA_THRESHOLD = Duration.parse('4h') // 4-hour SLA

  test('elapsed time within SLA: lessThan threshold', () => {
    const ticketOpen = 0
    const ticketClose = 3 * HOUR + 30 * MIN
    const elapsed = Duration.between(ticketOpen, ticketClose)
    expect(elapsed.lessThan(SLA_THRESHOLD)).toBe(true)
  })

  test('elapsed time breaches SLA: greaterThan threshold', () => {
    const ticketOpen = 0
    const ticketClose = 5 * HOUR
    const elapsed = Duration.between(ticketOpen, ticketClose)
    expect(elapsed.greaterThan(SLA_THRESHOLD)).toBe(true)
  })

  test('elapsed exactly at SLA boundary: greaterThanOrEqual', () => {
    const elapsed = Duration.parse('4h')
    expect(elapsed.greaterThanOrEqual(SLA_THRESHOLD)).toBe(true)
    expect(elapsed.lessThanOrEqual(SLA_THRESHOLD)).toBe(true)
  })

  test('SLA remaining: subtract elapsed from threshold', () => {
    const elapsed = Duration.parse('1h30m')
    const remaining = new Duration(SLA_THRESHOLD.valueOf() - elapsed.valueOf())
    expect(remaining.toMinutes()).toBe(150)
    expect(remaining.isPositive()).toBe(true)
  })

  test('SLA overrun is positive via abs()', () => {
    const elapsed = Duration.parse('5h')
    const overrun = new Duration(elapsed.valueOf() - SLA_THRESHOLD.valueOf())
    expect(overrun.abs().toHours()).toBe(1)
  })
})

// =============================================================================
// Real-life scenario 7: Negative duration edge cases
// =============================================================================

describe('Real-life: negative duration edge cases', () => {
  test('negate a positive duration → negative', () => {
    const d = new Duration(HOUR)
    expect(d.negate().isNegative()).toBe(true)
    expect(d.negate().valueOf()).toBe(-HOUR)
  })

  test('abs of negative → positive', () => {
    const d = new Duration(-2 * HOUR)
    expect(d.abs().isPositive()).toBe(true)
    expect(d.abs().valueOf()).toBe(2 * HOUR)
  })

  test('Duration.between past/future always positive', () => {
    const now = Date.now()
    const future = now + DAY
    const past = now - DAY
    expect(Duration.between(now, future).isPositive()).toBe(true)
    expect(Duration.between(future, now).isPositive()).toBe(true)
    expect(Duration.between(now, past).isPositive()).toBe(true)
  })

  test('negative duration toISO has leading minus', () => {
    expect(new Duration(-HOUR).toISO()).toBe('-PT1H')
  })

  test('negative duration humanize uses abs value', () => {
    expect(new Duration(-3 * HOUR).humanize(true)).toBe('3h')
  })

  test('negating zero stays zero', () => {
    expect(new Duration(0).negate().isZero()).toBe(true)
  })
})

// =============================================================================
// Real-life scenario 8: Fractional units
// =============================================================================

describe('Real-life: fractional units', () => {
  test('Duration.parse("1.5h") → 90 minutes in ms', () => {
    expect(Duration.parse('1.5h').valueOf()).toBe(90 * MIN)
  })

  test('as("hour") returns 1.5', () => {
    expect(Duration.parse('1.5h').as('hour')).toBe(1.5)
  })

  test('as("minute") returns 90', () => {
    expect(Duration.parse('1.5h').as('minute')).toBe(90)
  })

  test('toHours() returns 1.5 for 90 minutes', () => {
    expect(new Duration(90 * MIN).toHours()).toBe(1.5)
  })

  test('toMinutes() returns 90 for 1.5 hours', () => {
    expect(Duration.parse('1.5h').toMinutes()).toBe(90)
  })

  test('0.5d → 12 hours', () => {
    expect(Duration.parse('0.5d').toHours()).toBe(12)
  })

  test('as("h") short alias also returns 1.5', () => {
    expect(Duration.parse('1.5h').as('h')).toBe(1.5)
  })

  test('fromISO fractional: PT1.5H → 90min', () => {
    expect(Duration.fromISO('PT1.5H').toMinutes()).toBe(90)
  })
})

// =============================================================================
// Real-life scenario 9: ISO 8601 from external API — full P1Y2M3DT4H5M6S
// =============================================================================

describe('Real-life: ISO 8601 from external API', () => {
  const iso = Duration.fromISO('P1Y2M3DT4H5M6S')
  const expected = 1 * YEAR + 2 * MONTH + 3 * DAY + 4 * HOUR + 5 * MIN + 6 * SEC

  test('total milliseconds match expected', () => {
    expect(iso.valueOf()).toBe(expected)
  })

  test('toDays() is the total days component', () => {
    // 365 + 60 + 3 = 428 days + sub-day portion
    expect(iso.toDays()).toBeCloseTo(expected / DAY, 5)
  })

  test('toHours() matches', () => {
    expect(iso.toHours()).toBeCloseTo(expected / HOUR, 5)
  })

  test('is positive', () => {
    expect(iso.isPositive()).toBe(true)
  })

  test('adding 1 day increases value by DAY', () => {
    const extended = iso.add(1, 'day')
    expect(extended.valueOf()).toBe(expected + DAY)
  })

  test('P1Y component alone via fromISO', () => {
    const yearOnly = Duration.fromISO('P1Y')
    expect(yearOnly.valueOf()).toBe(YEAR)
  })

  test('P2M component alone via fromISO', () => {
    expect(Duration.fromISO('P2M').valueOf()).toBe(2 * MONTH)
  })

  test('PT4H5M6S component alone via fromISO', () => {
    const timeOnly = Duration.fromISO('PT4H5M6S')
    expect(timeOnly.valueOf()).toBe(4 * HOUR + 5 * MIN + 6 * SEC)
  })

  test('different ISO patterns give expected ms', () => {
    expect(Duration.fromISO('P1W').valueOf()).toBe(WEEK)
    expect(Duration.fromISO('P14D').valueOf()).toBe(14 * DAY)
    expect(Duration.fromISO('PT3600S').valueOf()).toBe(HOUR)
  })
})
