/**
 * second.test.ts — Focused test suite for temporal granularity methods:
 * millisecond / microsecond (alias) / second / minute / hour
 *
 * Fake clock: 2026-01-15 12:00:00.000 UTC (Thursday)
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import dateFormat, { DateFormat } from '../src/index'

const FAKE_NOW = '2026-01-15T12:00:00.000Z'
const FAKE_MS = new Date(FAKE_NOW).getTime()

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(FAKE_NOW))
})
afterEach(() => {
  jest.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// Millisecond methods
// ─────────────────────────────────────────────────────────────────────────────
describe('Millisecond methods', () => {
  test('isSameMillisecond: same instant → true', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS, { utc: true })
    expect(a.isSameMillisecond(b)).toBe(true)
  })

  test('isSameMillisecond: 1ms apart → false', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(a.isSameMillisecond(b)).toBe(false)
  })

  test('isSameMillisecond: 1ms before → false', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS - 1, { utc: true })
    expect(a.isSameMillisecond(b)).toBe(false)
  })

  test('isCurrentMillisecond: fake now instant → true', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isCurrentMillisecond()).toBe(true)
  })

  test('isCurrentMillisecond: 1ms later → false', () => {
    const d = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(d.isCurrentMillisecond()).toBe(false)
  })

  test('isCurrentMillisecond: 1ms earlier → false', () => {
    const d = new DateFormat(FAKE_MS - 1, { utc: true })
    expect(d.isCurrentMillisecond()).toBe(false)
  })

  test('isNextMillisecond: FAKE_MS + 1 → true', () => {
    const d = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(d.isNextMillisecond()).toBe(true)
  })

  test('isNextMillisecond: FAKE_MS + 2 → false', () => {
    const d = new DateFormat(FAKE_MS + 2, { utc: true })
    expect(d.isNextMillisecond()).toBe(false)
  })

  test('isNextMillisecond: FAKE_MS (not +1) → false', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isNextMillisecond()).toBe(false)
  })

  test('isLastMillisecond: FAKE_MS - 1 → true', () => {
    const d = new DateFormat(FAKE_MS - 1, { utc: true })
    expect(d.isLastMillisecond()).toBe(true)
  })

  test('isLastMillisecond: FAKE_MS - 2 → false', () => {
    const d = new DateFormat(FAKE_MS - 2, { utc: true })
    expect(d.isLastMillisecond()).toBe(false)
  })

  test('isLastMillisecond: FAKE_MS (current) → false', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isLastMillisecond()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Microsecond alias methods (aliases millisecond behaviour exactly)
// ─────────────────────────────────────────────────────────────────────────────
describe('Microsecond alias methods (isSameMicro / isCurrentMicro etc.)', () => {
  test('isSameMicro: same instant → true (aliases isSameMillisecond)', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS, { utc: true })
    expect(a.isSameMicro(b)).toBe(true)
  })

  test('isSameMicro: different instant → false', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(a.isSameMicro(b)).toBe(false)
  })

  test('isCurrentMicro: fake now → true', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isCurrentMicro()).toBe(true)
  })

  test('isCurrentMicro: 1ms off → false', () => {
    const d = new DateFormat(FAKE_MS + 5, { utc: true })
    expect(d.isCurrentMicro()).toBe(false)
  })

  test('isNextMicro: FAKE_MS + 1 → true', () => {
    const d = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(d.isNextMicro()).toBe(true)
  })

  test('isNextMicro: FAKE_MS + 2 → false', () => {
    const d = new DateFormat(FAKE_MS + 2, { utc: true })
    expect(d.isNextMicro()).toBe(false)
  })

  test('isLastMicro: FAKE_MS - 1 → true', () => {
    const d = new DateFormat(FAKE_MS - 1, { utc: true })
    expect(d.isLastMicro()).toBe(true)
  })

  test('isLastMicro: FAKE_MS - 2 → false', () => {
    const d = new DateFormat(FAKE_MS - 2, { utc: true })
    expect(d.isLastMicro()).toBe(false)
  })
})

describe('Microsecond alias methods (isSameMicrosecond / isCurrentMicrosecond etc.)', () => {
  test('isSameMicrosecond: same instant → true', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS, { utc: true })
    expect(a.isSameMicrosecond(b)).toBe(true)
  })

  test('isSameMicrosecond: different instant → false', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS + 10, { utc: true })
    expect(a.isSameMicrosecond(b)).toBe(false)
  })

  test('isCurrentMicrosecond: fake now → true', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isCurrentMicrosecond()).toBe(true)
  })

  test('isCurrentMicrosecond: different time → false', () => {
    const d = new DateFormat(FAKE_MS + 100, { utc: true })
    expect(d.isCurrentMicrosecond()).toBe(false)
  })

  test('isNextMicrosecond: FAKE_MS + 1 → true', () => {
    const d = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(d.isNextMicrosecond()).toBe(true)
  })

  test('isNextMicrosecond: FAKE_MS + 2 → false', () => {
    const d = new DateFormat(FAKE_MS + 2, { utc: true })
    expect(d.isNextMicrosecond()).toBe(false)
  })

  test('isLastMicrosecond: FAKE_MS - 1 → true', () => {
    const d = new DateFormat(FAKE_MS - 1, { utc: true })
    expect(d.isLastMicrosecond()).toBe(true)
  })

  test('isLastMicrosecond: FAKE_MS - 2 → false', () => {
    const d = new DateFormat(FAKE_MS - 2, { utc: true })
    expect(d.isLastMicrosecond()).toBe(false)
  })

  test('microsecond aliases match millisecond: isSameMicrosecond === isSameMillisecond', () => {
    const a = new DateFormat(FAKE_MS, { utc: true })
    const b = new DateFormat(FAKE_MS + 1, { utc: true })
    expect(a.isSameMicrosecond(b)).toBe(a.isSameMillisecond(b))
    expect(a.isSameMicrosecond(a)).toBe(a.isSameMillisecond(a))
  })

  test('isCurrentMicrosecond === isCurrentMillisecond for same instance', () => {
    const d = new DateFormat(FAKE_MS, { utc: true })
    expect(d.isCurrentMicrosecond()).toBe(d.isCurrentMillisecond())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Second methods
// ─────────────────────────────────────────────────────────────────────────────
describe('Second methods', () => {
  // Fake now: 2026-01-15T12:00:00.000Z
  const nowSec = new DateFormat('2026-01-15T12:00:00.000Z') // utc, second=0
  const sameSec = new DateFormat('2026-01-15T12:00:00.500Z') // utc, same second, 500ms in
  const nextSec = new DateFormat('2026-01-15T12:00:01.000Z') // utc, next second
  const lastSec = new DateFormat('2026-01-15T11:59:59.000Z') // utc, previous second

  test('isSameSecond: same second, different ms → true', () => {
    expect(nowSec.isSameSecond(sameSec)).toBe(true)
  })

  test('isSameSecond: next second → false', () => {
    expect(nowSec.isSameSecond(nextSec)).toBe(false)
  })

  test('isSameSecond: previous second → false', () => {
    expect(nowSec.isSameSecond(lastSec)).toBe(false)
  })

  test('isCurrentSecond: fake now → true', () => {
    expect(nowSec.isCurrentSecond()).toBe(true)
  })

  test('isCurrentSecond: within same second (500ms in) → true', () => {
    expect(sameSec.isCurrentSecond()).toBe(true)
  })

  test('isCurrentSecond: next second → false', () => {
    expect(nextSec.isCurrentSecond()).toBe(false)
  })

  test('isNextSecond: 1 second after fake now → true', () => {
    expect(nextSec.isNextSecond()).toBe(true)
  })

  test('isNextSecond: 2 seconds after fake now → false', () => {
    const twoAhead = new DateFormat('2026-01-15T12:00:02.000Z')
    expect(twoAhead.isNextSecond()).toBe(false)
  })

  test('isLastSecond: 1 second before fake now → true', () => {
    expect(lastSec.isLastSecond()).toBe(true)
  })

  test('isLastSecond: current second → false', () => {
    expect(nowSec.isLastSecond()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Minute methods
// ─────────────────────────────────────────────────────────────────────────────
describe('Minute methods', () => {
  // Fake now: 2026-01-15T12:00:00.000Z — minute=0
  const nowMin = new DateFormat('2026-01-15T12:00:00.000Z')
  const sameMin = new DateFormat('2026-01-15T12:00:45.000Z') // same minute, 45s in
  const nextMin = new DateFormat('2026-01-15T12:01:00.000Z')
  const lastMin = new DateFormat('2026-01-15T11:59:00.000Z')

  test('isSameMinute: same minute, different seconds → true', () => {
    expect(nowMin.isSameMinute(sameMin)).toBe(true)
  })

  test('isSameMinute: next minute → false', () => {
    expect(nowMin.isSameMinute(nextMin)).toBe(false)
  })

  test('isSameMinute: previous minute → false', () => {
    expect(nowMin.isSameMinute(lastMin)).toBe(false)
  })

  test('isCurrentMinute: fake now → true', () => {
    expect(nowMin.isCurrentMinute()).toBe(true)
  })

  test('isCurrentMinute: same minute 45s in → true', () => {
    expect(sameMin.isCurrentMinute()).toBe(true)
  })

  test('isCurrentMinute: next minute → false', () => {
    expect(nextMin.isCurrentMinute()).toBe(false)
  })

  test('isNextMinute: 1 minute after → true', () => {
    expect(nextMin.isNextMinute()).toBe(true)
  })

  test('isNextMinute: 2 minutes after → false', () => {
    const twoAhead = new DateFormat('2026-01-15T12:02:00.000Z')
    expect(twoAhead.isNextMinute()).toBe(false)
  })

  test('isLastMinute: 1 minute before → true', () => {
    expect(lastMin.isLastMinute()).toBe(true)
  })

  test('isLastMinute: current minute → false', () => {
    expect(nowMin.isLastMinute()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Hour methods
// ─────────────────────────────────────────────────────────────────────────────
describe('Hour methods', () => {
  // Fake now: 2026-01-15T12:00:00.000Z — hour=12 UTC
  const nowHour = new DateFormat('2026-01-15T12:00:00.000Z')
  const sameHour = new DateFormat('2026-01-15T12:45:00.000Z') // same hour, 45m in
  const nextHour = new DateFormat('2026-01-15T13:00:00.000Z')
  const lastHour = new DateFormat('2026-01-15T11:00:00.000Z')

  test('isSameHour: same hour, different minutes → true', () => {
    expect(nowHour.isSameHour(sameHour)).toBe(true)
  })

  test('isSameHour: next hour → false', () => {
    expect(nowHour.isSameHour(nextHour)).toBe(false)
  })

  test('isSameHour: previous hour → false', () => {
    expect(nowHour.isSameHour(lastHour)).toBe(false)
  })

  test('isCurrentHour: fake now → true', () => {
    expect(nowHour.isCurrentHour()).toBe(true)
  })

  test('isCurrentHour: same hour 45m in → true', () => {
    expect(sameHour.isCurrentHour()).toBe(true)
  })

  test('isCurrentHour: next hour → false', () => {
    expect(nextHour.isCurrentHour()).toBe(false)
  })

  test('isNextHour: 1 hour after fake now → true', () => {
    expect(nextHour.isNextHour()).toBe(true)
  })

  test('isNextHour: 2 hours after → false', () => {
    const twoAhead = new DateFormat('2026-01-15T14:00:00.000Z')
    expect(twoAhead.isNextHour()).toBe(false)
  })

  test('isLastHour: 1 hour before fake now → true', () => {
    expect(lastHour.isLastHour()).toBe(true)
  })

  test('isLastHour: current hour → false', () => {
    expect(nowHour.isLastHour()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Chaining and immutability
// ─────────────────────────────────────────────────────────────────────────────
describe('Chaining and immutability', () => {
  test('add(1, "second").add(1, "second") → 2 seconds added', () => {
    const base = new DateFormat('2026-01-15T12:00:00.000Z')
    const result = base.add(1, 'second').add(1, 'second')
    expect(result.get('second')).toBe(2)
  })

  test('original is unchanged after chained add', () => {
    const base = new DateFormat('2026-01-15T12:00:00.000Z')
    base.add(1, 'second').add(1, 'second')
    expect(base.get('second')).toBe(0)
  })

  test('set("second", 30).get("second") === 30', () => {
    const base = dateFormat('2026-01-15T12:00:00.000Z')
    const result = base.set('second', 30)
    expect(result.get('second')).toBe(30)
  })

  test('original unchanged after set', () => {
    const base = dateFormat('2026-01-15T12:00:00.000Z')
    base.set('second', 30)
    expect(base.get('second')).toBe(0)
  })

  test('set("millisecond", 500) preserves other fields', () => {
    const base = new DateFormat('2026-01-15T12:34:56.000Z')
    const result = base.set('millisecond', 500)
    expect(result.get('hour')).toBe(12)
    expect(result.get('minute')).toBe(34)
    expect(result.get('second')).toBe(56)
  })

  test('subtract then add same amount restores original ms', () => {
    const base = new DateFormat(FAKE_MS, { utc: true })
    const roundtrip = base.add(1000, 'millisecond').subtract(1000, 'millisecond')
    expect(roundtrip.valueOf()).toBe(FAKE_MS)
  })

  test('clone() preserves all field values', () => {
    const orig = new DateFormat('2026-01-15T12:34:56.789Z')
    const cloned = orig.clone()
    expect(cloned.get('year')).toBe(orig.get('year'))
    expect(cloned.get('month')).toBe(orig.get('month'))
    expect(cloned.get('date')).toBe(orig.get('date'))
    expect(cloned.get('hour')).toBe(orig.get('hour'))
    expect(cloned.get('minute')).toBe(orig.get('minute'))
    expect(cloned.get('second')).toBe(orig.get('second'))
    expect(cloned.valueOf()).toBe(orig.valueOf())
  })

  test('clone() is a distinct object', () => {
    const orig = new DateFormat('2026-01-15T12:00:00.000Z')
    const cloned = orig.clone()
    expect(cloned).not.toBe(orig)
  })

  test('chained set operations are deterministic', () => {
    const base = new DateFormat('2026-01-15T12:00:00.000Z')
    const a = base.set('hour', 8).set('minute', 30).set('second', 15)
    const b = base.set('hour', 8).set('minute', 30).set('second', 15)
    expect(a.valueOf()).toBe(b.valueOf())
  })

  test('add millisecond precision maintained', () => {
    const base = new DateFormat(FAKE_MS, { utc: true })
    const result = base.add(999, 'millisecond')
    expect(result.valueOf()).toBe(FAKE_MS + 999)
  })
})
