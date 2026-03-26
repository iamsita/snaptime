import { describe, test, expect } from '@jest/globals'
import Duration from '../src/core/Duration'
import type { Unit } from '../src/core/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const MS = 1
const SEC = 1_000
const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const WEEK = 604_800_000
const MONTH = 2_592_000_000 // 30 days
const YEAR = 31_536_000_000 // 365 days

// ─── parse() ─────────────────────────────────────────────────────────────────
describe('Duration.parse()', () => {
  test('empty string → 0ms', () => {
    expect(Duration.parse('').valueOf()).toBe(0)
  })

  test('1Y → 365 days in ms', () => {
    expect(Duration.parse('1Y').valueOf()).toBe(365 * DAY)
  })

  test('1y → same as 1Y', () => {
    expect(Duration.parse('1y').valueOf()).toBe(Duration.parse('1Y').valueOf())
  })

  test('1M → 30 days in ms', () => {
    expect(Duration.parse('1M').valueOf()).toBe(30 * DAY)
  })

  test('1w → 7 days in ms', () => {
    expect(Duration.parse('1w').valueOf()).toBe(7 * DAY)
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

  test('combined: 1d2h30m', () => {
    const expected = DAY + 2 * HOUR + 30 * MIN
    expect(Duration.parse('1d2h30m').valueOf()).toBe(expected)
  })

  test('decimal: 1.5h → 1.5 hours in ms', () => {
    expect(Duration.parse('1.5h').valueOf()).toBe(1.5 * HOUR)
  })

  test('multiple units combined: 2Y3M1w4d5h6m7s8ms', () => {
    const expected =
      2 * 365 * DAY + 3 * 30 * DAY + 1 * WEEK + 4 * DAY + 5 * HOUR + 6 * MIN + 7 * SEC + 8 * MS
    expect(Duration.parse('2Y3M1w4d5h6m7s8ms').valueOf()).toBe(expected)
  })
})

// ─── as() ────────────────────────────────────────────────────────────────────
describe('Duration.as()', () => {
  const d = new Duration(YEAR)

  test('millisecond', () => {
    expect(d.as('millisecond')).toBe(YEAR)
  })

  test('second', () => {
    expect(d.as('second')).toBe(YEAR / SEC)
  })

  test('minute', () => {
    expect(d.as('minute')).toBe(YEAR / MIN)
  })

  test('hour', () => {
    expect(d.as('hour')).toBe(YEAR / HOUR)
  })

  test('day', () => {
    expect(d.as('day')).toBe(YEAR / DAY)
  })

  test('date (same as day)', () => {
    expect(d.as('date')).toBe(YEAR / DAY)
  })

  test('week', () => {
    expect(new Duration(WEEK).as('week')).toBeCloseTo(1, 5)
  })

  test('month', () => {
    expect(new Duration(MONTH).as('month')).toBeCloseTo(1, 5)
  })

  test('year', () => {
    expect(new Duration(YEAR).as('year')).toBeCloseTo(1, 5)
  })

  test('fortnight', () => {
    const fortnight = 1_209_600_000
    expect(new Duration(fortnight).as('fortnight')).toBeCloseTo(1, 5)
  })

  test('unknown → NaN', () => {
    expect(new Duration(1000).as('unknown')).toBeNaN()
  })

  test('completely undefined unit falls back to dividing by 1 (returns ms value)', () => {
    expect(new Duration(1000).as('nonexistent' as unknown as never)).toBe(1000)
  })
})

// ─── add() / subtract() ──────────────────────────────────────────────────────
describe('Duration add() and subtract()', () => {
  test('add positive milliseconds', () => {
    const d = new Duration(0).add(500, 'millisecond')
    expect(d.valueOf()).toBe(500)
  })

  test('add negative milliseconds', () => {
    const d = new Duration(1000).add(-500, 'millisecond')
    expect(d.valueOf()).toBe(500)
  })

  test('subtract is inverse of add', () => {
    const base = new Duration(10_000)
    expect(base.subtract(5, 'second').valueOf()).toBe(base.add(-5, 'second').valueOf())
  })

  test('add(1, month) gives ~30 days of ms', () => {
    const d = new Duration(0).add(1, 'month')
    expect(d.valueOf()).toBe(MONTH)
  })

  test('add(1, millisecond) → +1ms (not 60s)', () => {
    const d = new Duration(0).add(1, 'millisecond')
    expect(d.valueOf()).toBe(1)
  })

  test('add(1, minute) → +60000ms', () => {
    const d = new Duration(0).add(1, 'minute')
    expect(d.valueOf()).toBe(MIN)
  })

  test('add(1, second)', () => {
    expect(new Duration(0).add(1, 'second').valueOf()).toBe(SEC)
  })

  test('add(1, hour)', () => {
    expect(new Duration(0).add(1, 'hour').valueOf()).toBe(HOUR)
  })

  test('add(1, day)', () => {
    expect(new Duration(0).add(1, 'day').valueOf()).toBe(DAY)
  })

  test('add(1, date) same as day', () => {
    expect(new Duration(0).add(1, 'date').valueOf()).toBe(DAY)
  })

  test('add(1, week)', () => {
    expect(new Duration(0).add(1, 'week').valueOf()).toBe(WEEK)
  })

  test('add(1, year)', () => {
    expect(new Duration(0).add(1, 'year').valueOf()).toBe(YEAR)
  })

  test('add(1, fortnight)', () => {
    expect(new Duration(0).add(1, 'fortnight').valueOf()).toBe(1_209_600_000)
  })

  test('add unknown unit → throws', () => {
    expect(() => new Duration(0).add(1, 'unknown' as Unit)).toThrow(
      'Cannot add/subtract unit "unknown"'
    )
  })

  test('subtract positive is same as add negative', () => {
    const d = new Duration(DAY)
    expect(d.subtract(1, 'hour').valueOf()).toBe(DAY - HOUR)
  })
})

// ─── Aliases ─────────────────────────────────────────────────────────────────
describe('Duration convenience aliases', () => {
  const d = new Duration(2 * HOUR + 3 * MIN + 4 * SEC + 5)

  test('toMilliseconds() = as(millisecond)', () => {
    expect(d.toMilliseconds()).toBe(d.as('millisecond'))
  })

  test('toSeconds() = as(second)', () => {
    expect(d.toSeconds()).toBe(d.as('second'))
  })

  test('toMinutes() = as(minute)', () => {
    expect(d.toMinutes()).toBe(d.as('minute'))
  })

  test('toHours() = as(hour)', () => {
    expect(d.toHours()).toBe(d.as('hour'))
  })

  test('toDays() = as(day)', () => {
    expect(d.toDays()).toBe(d.as('day'))
  })
})

// ─── valueOf() ────────────────────────────────────────────────────────────────
describe('Duration.valueOf()', () => {
  test('returns the internal ms value', () => {
    expect(new Duration(12345).valueOf()).toBe(12345)
  })

  test('zero duration', () => {
    expect(new Duration().valueOf()).toBe(0)
  })

  test('negative duration', () => {
    expect(new Duration(-500).valueOf()).toBe(-500)
  })
})

// ─── isZero() ────────────────────────────────────────────────────────────────
describe('Duration.isZero()', () => {
  test('0ms → true', () => {
    expect(new Duration(0).isZero()).toBe(true)
  })

  test('100ms → false', () => {
    expect(new Duration(100).isZero()).toBe(false)
  })

  test('negative → false', () => {
    expect(new Duration(-1).isZero()).toBe(false)
  })
})

// ─── isNegative() ─────────────────────────────────────────────────────────────
describe('Duration.isNegative()', () => {
  test('negative ms → true', () => {
    expect(new Duration(-500).isNegative()).toBe(true)
  })

  test('0ms → false', () => {
    expect(new Duration(0).isNegative()).toBe(false)
  })

  test('positive → false', () => {
    expect(new Duration(1).isNegative()).toBe(false)
  })
})

// ─── abs() ────────────────────────────────────────────────────────────────────
describe('Duration.abs()', () => {
  test('negative → positive', () => {
    expect(new Duration(-HOUR).abs().valueOf()).toBe(HOUR)
  })

  test('already positive → same value', () => {
    expect(new Duration(HOUR).abs().valueOf()).toBe(HOUR)
  })

  test('zero → zero', () => {
    expect(new Duration(0).abs().valueOf()).toBe(0)
  })
})

// ─── humanize(true) — short form ─────────────────────────────────────────────
describe('Duration.humanize(true) — short form', () => {
  test('< 1000ms → e.g. "500ms"', () => {
    expect(new Duration(500).humanize(true)).toBe('500ms')
  })

  test('0ms → "0ms"', () => {
    expect(new Duration(0).humanize(true)).toBe('0ms')
  })

  test('999ms → "999ms"', () => {
    expect(new Duration(999).humanize(true)).toBe('999ms')
  })

  test('< 60s → e.g. "30s"', () => {
    expect(new Duration(30 * SEC).humanize(true)).toBe('30s')
  })

  test('exactly 1s', () => {
    expect(new Duration(SEC).humanize(true)).toBe('1s')
  })

  test('< 60m → e.g. "5m"', () => {
    expect(new Duration(5 * MIN).humanize(true)).toBe('5m')
  })

  test('< 24h → e.g. "3h"', () => {
    expect(new Duration(3 * HOUR).humanize(true)).toBe('3h')
  })

  test('>= 24h → e.g. "2d"', () => {
    expect(new Duration(2 * DAY).humanize(true)).toBe('2d')
  })

  test('negative duration uses abs value', () => {
    expect(new Duration(-2 * DAY).humanize(true)).toBe('2d')
  })
})

// ─── humanize(false) — long form ─────────────────────────────────────────────
describe('Duration.humanize(false) — long form', () => {
  test('multi-unit: 2d3h15m includes days, hours, minutes', () => {
    const d = Duration.parse('2d3h15m')
    const result = d.humanize(false)
    expect(result).toContain('2 days')
    expect(result).toContain('3 hours')
    expect(result).toContain('15 minutes')
  })

  test('only ms component (< 1s) → "500 milliseconds"', () => {
    expect(new Duration(500).humanize(false)).toBe('500 milliseconds')
  })

  test('exact 0 → "0 milliseconds"', () => {
    expect(new Duration(0).humanize(false)).toBe('0 milliseconds')
  })

  test('singular: 1 day → "1 day"', () => {
    const result = new Duration(DAY).humanize(false)
    expect(result).toBe('1 day')
  })

  test('singular: 1 hour → "1 hour"', () => {
    const result = new Duration(HOUR).humanize(false)
    expect(result).toBe('1 hour')
  })

  test('singular: 1 minute → "1 minute"', () => {
    const result = new Duration(MIN).humanize(false)
    expect(result).toBe('1 minute')
  })

  test('singular: 1 second → "1 second"', () => {
    const result = new Duration(SEC).humanize(false)
    expect(result).toBe('1 second')
  })

  test('plural: 30 seconds → "30 seconds"', () => {
    const result = new Duration(30 * SEC).humanize(false)
    expect(result).toBe('30 seconds')
  })

  test('singular: 1 millisecond → "1 millisecond"', () => {
    const result = new Duration(1).humanize(false)
    expect(result).toBe('1 millisecond')
  })

  test('plural: 2 days', () => {
    expect(new Duration(2 * DAY).humanize(false)).toBe('2 days')
  })

  test('days + hours combination', () => {
    const result = new Duration(DAY + HOUR).humanize(false)
    expect(result).toBe('1 day, 1 hour')
  })

  test('ms not shown when there are larger components', () => {
    const result = new Duration(DAY + 500).humanize(false)
    expect(result).toBe('1 day')
  })

  test('negative duration uses abs for long form', () => {
    const result = new Duration(-DAY).humanize(false)
    expect(result).toBe('1 day')
  })
})

// ─── toString() ───────────────────────────────────────────────────────────────
describe('Duration.toString()', () => {
  test('same as humanize() with default short=true', () => {
    const d = new Duration(3 * HOUR)
    expect(d.toString()).toBe(d.humanize())
  })

  test('toString for small duration', () => {
    const d = new Duration(500)
    expect(d.toString()).toBe('500ms')
  })
})

// ─── format() ────────────────────────────────────────────────────────────────
describe('Duration.format()', () => {
  // 2h 5m 3s 50ms
  const d = new Duration(2 * HOUR + 5 * MIN + 3 * SEC + 50)

  test('HH:mm:ss.SSS → zero-padded', () => {
    expect(d.format('HH:mm:ss.SSS')).toBe('02:05:03.050')
  })

  test('H:m:s → no padding', () => {
    expect(d.format('H:m:s')).toBe('2:5:3')
  })

  test('single H token', () => {
    expect(d.format('H')).toBe('2')
  })

  test('single m token', () => {
    expect(d.format('m')).toBe('5')
  })

  test('single s token', () => {
    expect(d.format('s')).toBe('3')
  })

  test('HH zero-pads hours < 10', () => {
    expect(new Duration(5 * MIN).format('HH:mm:ss')).toBe('00:05:00')
  })

  test('SSS pads milliseconds to 3 digits', () => {
    expect(new Duration(7).format('SSS')).toBe('007')
  })

  test('large hours not padded in H', () => {
    expect(new Duration(100 * HOUR).format('H')).toBe('100')
  })

  test('zero duration formats as 00:00:00.000', () => {
    expect(new Duration(0).format('HH:mm:ss.SSS')).toBe('00:00:00.000')
  })
})
