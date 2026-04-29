import { describe, test, expect } from '@jest/globals'
import DateRange from '../src/collections/DateRange'
import DateFormat from '../src/core/DateFormat'
import Duration from '../src/core/Duration'

// ---------------------------------------------------------------------------
// Fixed UTC timestamps — deterministic across all timezones
// ---------------------------------------------------------------------------
const JAN_1 = Date.UTC(2026, 0, 1)   // 2026-01-01T00:00:00Z
const JAN_2 = Date.UTC(2026, 0, 2)
const JAN_3 = Date.UTC(2026, 0, 3)
const JAN_5 = Date.UTC(2026, 0, 5)
const JAN_10 = Date.UTC(2026, 0, 10)
const JAN_12 = Date.UTC(2026, 0, 12)
const JAN_13 = Date.UTC(2026, 0, 13)
const JAN_15 = Date.UTC(2026, 0, 15)
const JAN_18 = Date.UTC(2026, 0, 18)
const JAN_31 = Date.UTC(2026, 0, 31)
const FEB_1 = Date.UTC(2026, 1, 1)
const FEB_28 = Date.UTC(2026, 1, 28)
const MAR_1 = Date.UTC(2026, 2, 1)
const MAR_31 = Date.UTC(2026, 2, 31)
const DEC_31_2025 = Date.UTC(2025, 11, 31)
const DEC_1_2025 = Date.UTC(2025, 11, 1)

/** Build a UTC-pinned DateFormat so format() outputs the correct calendar date */
const utc = (ms: number) => new DateFormat(ms, { utc: true })

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------
describe('DateRange constructor', () => {
  test('accepts DateFormat instances — start and end are DateFormat', () => {
    const r = new DateRange(utc(JAN_1), utc(JAN_31))
    expect(r.start).toBeInstanceOf(DateFormat)
    expect(r.end).toBeInstanceOf(DateFormat)
    expect(r.start.valueOf()).toBe(JAN_1)
    expect(r.end.valueOf()).toBe(JAN_31)
  })

  test('accepts numeric timestamps', () => {
    const r = new DateRange(JAN_1, JAN_31)
    expect(r.start.valueOf()).toBe(JAN_1)
    expect(r.end.valueOf()).toBe(JAN_31)
  })

  test('accepts native Date objects', () => {
    const r = new DateRange(new Date(JAN_1), new Date(JAN_31))
    expect(r.start.valueOf()).toBe(JAN_1)
    expect(r.end.valueOf()).toBe(JAN_31)
  })

  test('accepts ISO date strings', () => {
    const r = new DateRange('2026-01-01', '2026-01-31')
    expect(r.start.isValid()).toBe(true)
    expect(r.end.isValid()).toBe(true)
  })

  test('start and end are readonly — direct properties exist', () => {
    const r = new DateRange(JAN_1, JAN_31)
    expect(Object.prototype.hasOwnProperty.call(r, 'start')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(r, 'end')).toBe(true)
  })

  test('same start and end is allowed', () => {
    const r = new DateRange(JAN_1, JAN_1)
    expect(r.start.valueOf()).toBe(r.end.valueOf())
  })

  test('backward range (end < start) is allowed', () => {
    const r = new DateRange(JAN_31, JAN_1)
    expect(r.start.valueOf()).toBe(JAN_31)
    expect(r.end.valueOf()).toBe(JAN_1)
  })
})

// ---------------------------------------------------------------------------
// isValid()
// ---------------------------------------------------------------------------
describe('DateRange.isValid()', () => {
  test('both dates valid → true', () => {
    expect(new DateRange(JAN_1, JAN_31).isValid()).toBe(true)
  })

  test('NaN start → false', () => {
    expect(new DateRange(NaN, JAN_31).isValid()).toBe(false)
  })

  test('NaN end → false', () => {
    expect(new DateRange(JAN_1, NaN).isValid()).toBe(false)
  })

  test('both NaN → false', () => {
    expect(new DateRange(NaN, NaN).isValid()).toBe(false)
  })

  test('string dates resolve to valid', () => {
    expect(new DateRange('2026-01-01', '2026-12-31').isValid()).toBe(true)
  })

  test('invalid string → false', () => {
    expect(new DateRange('not-a-date', '2026-01-31').isValid()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isForward()
// ---------------------------------------------------------------------------
describe('DateRange.isForward()', () => {
  test('start < end → true', () => {
    expect(new DateRange(JAN_1, JAN_31).isForward()).toBe(true)
  })

  test('start > end (backward range) → false', () => {
    expect(new DateRange(JAN_31, JAN_1).isForward()).toBe(false)
  })

  test('start === end → true', () => {
    expect(new DateRange(JAN_1, JAN_1).isForward()).toBe(true)
  })

  test('scenario: employee shift backward booking → not forward', () => {
    // Shift accidentally entered end before start
    const shift = new DateRange(
      new DateFormat(new Date(2026, 0, 15, 17, 0)),  // 5pm
      new DateFormat(new Date(2026, 0, 15, 9, 0))    // 9am
    )
    expect(shift.isForward()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// duration()
// ---------------------------------------------------------------------------
describe('DateRange.duration()', () => {
  test('returns a Duration instance', () => {
    expect(new DateRange(JAN_1, JAN_31).duration()).toBeInstanceOf(Duration)
  })

  test('correct millisecond value for a 30-day range', () => {
    const d = new DateRange(JAN_1, JAN_31).duration()
    expect(d.valueOf()).toBe(30 * 86_400_000)
  })

  test('always positive even for reversed range', () => {
    const d = new DateRange(JAN_31, JAN_1).duration()
    expect(d.valueOf()).toBe(30 * 86_400_000)
  })

  test('zero duration for identical start/end', () => {
    expect(new DateRange(JAN_1, JAN_1).duration().valueOf()).toBe(0)
  })

  test('2-day range has 2-day duration', () => {
    const d = new DateRange(JAN_1, JAN_3).duration()
    expect(d.valueOf()).toBe(2 * 86_400_000)
  })

  test('scenario: subscription billing — monthly range duration is ~30 days', () => {
    const billing = new DateRange(JAN_1, FEB_1)
    const days = billing.duration().toDays()
    expect(days).toBe(31)
  })

  test('scenario: employee shift — 8-hour shift duration', () => {
    const shiftStart = new DateFormat(new Date(2026, 0, 15, 9, 0, 0))
    const shiftEnd = new DateFormat(new Date(2026, 0, 15, 17, 0, 0))
    const shift = new DateRange(shiftStart, shiftEnd)
    expect(shift.duration().toHours()).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// contains()
// ---------------------------------------------------------------------------
describe('DateRange.contains()', () => {
  const range = new DateRange(JAN_10, JAN_31)

  test('date inside range → true (inclusive default)', () => {
    expect(range.contains(JAN_15)).toBe(true)
  })

  test('date on start boundary, inclusive=true → true', () => {
    expect(range.contains(JAN_10, true)).toBe(true)
  })

  test('date on start boundary, inclusive=false → false', () => {
    expect(range.contains(JAN_10, false)).toBe(false)
  })

  test('date on end boundary, inclusive=true → true', () => {
    expect(range.contains(JAN_31, true)).toBe(true)
  })

  test('date on end boundary, inclusive=false → false', () => {
    expect(range.contains(JAN_31, false)).toBe(false)
  })

  test('date before start → false', () => {
    expect(range.contains(DEC_1_2025)).toBe(false)
  })

  test('date after end → false', () => {
    expect(range.contains(FEB_28)).toBe(false)
  })

  test('1ms before start → false (inclusive)', () => {
    expect(range.contains(JAN_10 - 1)).toBe(false)
  })

  test('1ms after start → true (exclusive)', () => {
    expect(range.contains(JAN_10 + 1, false)).toBe(true)
  })

  test('reversed range: uses min/max internally → contains midpoint', () => {
    const reversed = new DateRange(JAN_31, JAN_1)
    expect(reversed.contains(JAN_15)).toBe(true)
    expect(reversed.contains(DEC_1_2025)).toBe(false)
  })

  test('accepts string input', () => {
    const r = new DateRange('2026-01-01', '2026-01-31')
    expect(r.contains('2026-01-15')).toBe(true)
  })

  test('accepts native Date object', () => {
    expect(range.contains(new Date(JAN_15))).toBe(true)
  })

  test('accepts DateFormat instance', () => {
    expect(range.contains(utc(JAN_15))).toBe(true)
  })

  test('scenario: hotel booking Jan 10-15, Jan 12 is occupied', () => {
    const booking = new DateRange(utc(JAN_10), utc(JAN_15))
    expect(booking.contains(utc(JAN_12))).toBe(true)
    expect(booking.contains(utc(JAN_5))).toBe(false)
  })

  test('scenario: employee shift 9am-5pm, a 10am meeting is within shift', () => {
    const shift = new DateRange(
      new DateFormat(new Date(2026, 0, 15, 9, 0, 0)),
      new DateFormat(new Date(2026, 0, 15, 17, 0, 0))
    )
    const meeting = new DateFormat(new Date(2026, 0, 15, 10, 0, 0))
    expect(shift.contains(meeting)).toBe(true)
  })

  test('scenario: employee shift — 8pm meeting is outside shift', () => {
    const shift = new DateRange(
      new DateFormat(new Date(2026, 0, 15, 9, 0, 0)),
      new DateFormat(new Date(2026, 0, 15, 17, 0, 0))
    )
    const lateEvening = new DateFormat(new Date(2026, 0, 15, 20, 0, 0))
    expect(shift.contains(lateEvening)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// overlaps()
// ---------------------------------------------------------------------------
describe('DateRange.overlaps()', () => {
  const jan = new DateRange(JAN_1, JAN_31)

  test('completely before → false', () => {
    const before = new DateRange(DEC_1_2025, JAN_1 - 1)
    expect(jan.overlaps(before)).toBe(false)
  })

  test('completely after → false', () => {
    const after = new DateRange(FEB_1, FEB_28)
    expect(jan.overlaps(after)).toBe(false)
  })

  test('touching at end boundary → true', () => {
    const touching = new DateRange(JAN_31, FEB_28)
    expect(jan.overlaps(touching)).toBe(true)
  })

  test('touching at start boundary → true', () => {
    const touching = new DateRange(DEC_1_2025, JAN_1)
    expect(jan.overlaps(touching)).toBe(true)
  })

  test('partially overlapping — starts inside → true', () => {
    const partial = new DateRange(JAN_15, FEB_28)
    expect(jan.overlaps(partial)).toBe(true)
  })

  test('one contains the other → true', () => {
    const inner = new DateRange(JAN_2, JAN_15)
    expect(jan.overlaps(inner)).toBe(true)
  })

  test('identical ranges → true', () => {
    const same = new DateRange(JAN_1, JAN_31)
    expect(jan.overlaps(same)).toBe(true)
  })

  test('scenario: hotel booking conflict Jan 10-15 vs Jan 13-18 → overlaps', () => {
    const booking1 = new DateRange(utc(JAN_10), utc(JAN_15))
    const booking2 = new DateRange(utc(JAN_13), utc(JAN_18))
    expect(booking1.overlaps(booking2)).toBe(true)
  })

  test('scenario: event conflict Jan 10-12 vs Jan 13-15 (gap) → no overlap', () => {
    const event1 = new DateRange(utc(JAN_10), utc(JAN_12))
    const event2 = new DateRange(utc(JAN_13), utc(JAN_15))
    expect(event1.overlaps(event2)).toBe(false)
  })

  test('scenario: two employee shifts that overlap', () => {
    const shift1 = new DateRange(
      new DateFormat(new Date(2026, 0, 15, 9, 0)),
      new DateFormat(new Date(2026, 0, 15, 17, 0))
    )
    const shift2 = new DateRange(
      new DateFormat(new Date(2026, 0, 15, 14, 0)),
      new DateFormat(new Date(2026, 0, 15, 22, 0))
    )
    expect(shift1.overlaps(shift2)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// intersect()
// ---------------------------------------------------------------------------
describe('DateRange.intersect()', () => {
  const jan = new DateRange(JAN_1, JAN_31)

  test('no overlap → null', () => {
    const after = new DateRange(FEB_1, FEB_28)
    expect(jan.intersect(after)).toBeNull()
  })

  test('partial overlap → correct start/end', () => {
    const partial = new DateRange(JAN_15, FEB_28)
    const result = jan.intersect(partial)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_15)
    expect(result!.end.valueOf()).toBe(JAN_31)
  })

  test('one contains the other → inner range returned', () => {
    const inner = new DateRange(JAN_2, JAN_15)
    const result = jan.intersect(inner)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_2)
    expect(result!.end.valueOf()).toBe(JAN_15)
  })

  test('identical ranges → same range', () => {
    const same = new DateRange(JAN_1, JAN_31)
    const result = jan.intersect(same)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_1)
    expect(result!.end.valueOf()).toBe(JAN_31)
  })

  test('touching at single point → single-point range', () => {
    const touching = new DateRange(JAN_31, FEB_28)
    const result = jan.intersect(touching)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_31)
    expect(result!.end.valueOf()).toBe(JAN_31)
  })

  test('result is a DateRange instance', () => {
    const result = jan.intersect(new DateRange(JAN_15, FEB_28))
    expect(result).toBeInstanceOf(DateRange)
  })

  test('scenario: hotel booking Jan 10-15 intersects Jan 13-18 → Jan 13-15', () => {
    const booking1 = new DateRange(utc(JAN_10), utc(JAN_15))
    const booking2 = new DateRange(utc(JAN_13), utc(JAN_18))
    const shared = booking1.intersect(booking2)
    expect(shared).not.toBeNull()
    expect(shared!.start.valueOf()).toBe(JAN_13)
    expect(shared!.end.valueOf()).toBe(JAN_15)
  })

  test('scenario: event conflict detection returns shared time window', () => {
    const conferenceA = new DateRange(utc(JAN_1), utc(JAN_15))
    const conferenceB = new DateRange(utc(JAN_10), utc(JAN_31))
    const overlap = conferenceA.intersect(conferenceB)
    expect(overlap).not.toBeNull()
    expect(overlap!.start.valueOf()).toBe(JAN_10)
    expect(overlap!.end.valueOf()).toBe(JAN_15)
  })
})

// ---------------------------------------------------------------------------
// merge()
// ---------------------------------------------------------------------------
describe('DateRange.merge()', () => {
  const jan = new DateRange(JAN_1, JAN_31)

  test('no overlap (with gap) → null', () => {
    const after = new DateRange(FEB_1 + 1, FEB_28)
    expect(jan.merge(after)).toBeNull()
  })

  test('overlapping → union range spans both', () => {
    const partial = new DateRange(JAN_15, FEB_28)
    const result = jan.merge(partial)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_1)
    expect(result!.end.valueOf()).toBe(FEB_28)
  })

  test('touching at boundary → merged range', () => {
    const next = new DateRange(JAN_31, FEB_28)
    const result = jan.merge(next)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_1)
    expect(result!.end.valueOf()).toBe(FEB_28)
  })

  test('one contains the other → outer range', () => {
    const inner = new DateRange(JAN_5, JAN_15)
    const result = jan.merge(inner)
    expect(result).not.toBeNull()
    expect(result!.start.valueOf()).toBe(JAN_1)
    expect(result!.end.valueOf()).toBe(JAN_31)
  })

  test('result is a DateRange instance', () => {
    const result = jan.merge(new DateRange(JAN_15, FEB_28))
    expect(result).toBeInstanceOf(DateRange)
  })

  test('scenario: merge two overlapping bookings into one block', () => {
    const booking1 = new DateRange(utc(JAN_10), utc(JAN_15))
    const booking2 = new DateRange(utc(JAN_13), utc(JAN_18))
    const merged = booking1.merge(booking2)
    expect(merged).not.toBeNull()
    expect(merged!.start.valueOf()).toBe(JAN_10)
    expect(merged!.end.valueOf()).toBe(JAN_18)
  })
})

// ---------------------------------------------------------------------------
// split()
// ---------------------------------------------------------------------------
describe('DateRange.split()', () => {
  test('Jan 1–3 split by 1 day → 2 chunks (cursor < hi logic)', () => {
    const range = new DateRange(JAN_1, JAN_3)
    const chunks = range.split(1, 'day')
    expect(chunks).toHaveLength(2)
    expect(chunks[0].start.valueOf()).toBe(JAN_1)
    expect(chunks[0].end.valueOf()).toBe(JAN_2)
    expect(chunks[1].start.valueOf()).toBe(JAN_2)
    expect(chunks[1].end.valueOf()).toBe(JAN_3)
  })

  test('30-day range split by 1 day → 30 chunks', () => {
    const range = new DateRange(JAN_1, JAN_31)
    expect(range.split(1, 'day')).toHaveLength(30)
  })

  test('Jan–Mar split by 1 month → 2 chunks', () => {
    const range = new DateRange(JAN_1, MAR_1)
    expect(range.split(1, 'month')).toHaveLength(2)
  })

  test('last chunk is capped at range end when uneven', () => {
    const end = JAN_1 + 5 * 86_400_000  // Jan 1 + 5 days
    const range = new DateRange(JAN_1, end)
    const chunks = range.split(3, 'day')
    expect(chunks).toHaveLength(2)
    expect(chunks[1].end.valueOf()).toBe(end)
  })

  test('zero-length range (start === end) → empty array', () => {
    expect(new DateRange(JAN_1, JAN_1).split(1, 'day')).toHaveLength(0)
  })

  test('each chunk is a DateRange instance', () => {
    const range = new DateRange(JAN_1, JAN_3)
    for (const chunk of range.split(1, 'day')) {
      expect(chunk).toBeInstanceOf(DateRange)
    }
  })

  test('split by hour — 3-hour range gives 3 chunks', () => {
    const startMs = new Date(2026, 0, 15, 9, 0, 0).getTime()
    const endMs = new Date(2026, 0, 15, 12, 0, 0).getTime()
    const range = new DateRange(startMs, endMs)
    expect(range.split(1, 'hour')).toHaveLength(3)
  })

  test('scenario: subscription billing — split monthly range into weeks', () => {
    // Jan 1 to Jan 29 (28 days = 4 complete weeks)
    const billingStart = JAN_1
    const billingEnd = JAN_1 + 28 * 86_400_000
    const range = new DateRange(billingStart, billingEnd)
    const weeks = range.split(1, 'week')
    expect(weeks).toHaveLength(4)
    expect(weeks.every((w) => w instanceof DateRange)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// iterate()
// ---------------------------------------------------------------------------
describe('DateRange.iterate()', () => {
  test('Jan 1–3 by day yields 3 values (inclusive both ends)', () => {
    const dates = [...new DateRange(JAN_1, JAN_3).iterate('day')]
    expect(dates).toHaveLength(3)
    expect(dates[0].valueOf()).toBe(JAN_1)
    expect(dates[2].valueOf()).toBe(JAN_3)
  })

  test('Jan 1 + 3 days by day yields 4 values', () => {
    const end = JAN_1 + 3 * 86_400_000
    const dates = [...new DateRange(JAN_1, end).iterate('day')]
    expect(dates).toHaveLength(4)
    expect(dates[3].valueOf()).toBe(end)
  })

  test('reversed range iterates from lo to hi', () => {
    const dates = [...new DateRange(JAN_3, JAN_1).iterate('day')]
    expect(dates).toHaveLength(3)
    expect(dates[0].valueOf()).toBe(JAN_1)
    expect(dates[2].valueOf()).toBe(JAN_3)
  })

  test('all yielded values are DateFormat instances', () => {
    for (const d of new DateRange(JAN_1, JAN_3).iterate('day')) {
      expect(d).toBeInstanceOf(DateFormat)
    }
  })

  test('iterate by hour — 2-hour range yields 3 values', () => {
    const startMs = new Date(2026, 0, 15, 9, 0, 0).getTime()
    const endMs = new Date(2026, 0, 15, 11, 0, 0).getTime()
    const dates = [...new DateRange(startMs, endMs).iterate('hour')]
    expect(dates).toHaveLength(3)
  })

  test('iterate by week — 2-week range (inclusive both ends)', () => {
    const endMs = JAN_1 + 14 * 86_400_000
    const dates = [...new DateRange(JAN_1, endMs).iterate('week')]
    expect(dates).toHaveLength(3)
  })

  test('iterate by month — Jan to Mar inclusive', () => {
    const dates = [...new DateRange(JAN_1, MAR_1).iterate('month')]
    expect(dates.length).toBeGreaterThanOrEqual(2)
  })

  test('iterate by year — 2026 to 2028 inclusive', () => {
    const start = Date.UTC(2026, 0, 1)
    const end = Date.UTC(2028, 0, 1)
    const dates = [...new DateRange(start, end).iterate('year')]
    expect(dates).toHaveLength(3)
  })

  test('iterate by millisecond — 3ms range yields 4 values', () => {
    const dates = [...new DateRange(JAN_1, JAN_1 + 3).iterate('millisecond')]
    expect(dates).toHaveLength(4)
  })

  test('iterate by minute — 3-minute range yields 4 values', () => {
    const startMs = new Date(2026, 0, 15, 9, 0, 0).getTime()
    const endMs = new Date(2026, 0, 15, 9, 3, 0).getTime()
    const dates = [...new DateRange(startMs, endMs).iterate('minute')]
    expect(dates).toHaveLength(4)
  })

  test('iterate by second — 3-second range yields 4 values', () => {
    const startMs = new Date(2026, 0, 15, 9, 0, 0).getTime()
    const endMs = new Date(2026, 0, 15, 9, 0, 3).getTime()
    const dates = [...new DateRange(startMs, endMs).iterate('second')]
    expect(dates).toHaveLength(4)
  })

  test('scenario: conference schedule — iterate by day for 3-day event', () => {
    const confStart = utc(JAN_10)
    const confEnd = utc(JAN_12)
    const days = [...new DateRange(confStart, confEnd).iterate('day')]
    expect(days).toHaveLength(3)
    expect(days.every((d) => d instanceof DateFormat)).toBe(true)
  })

  test('scenario: Q1 report — iterate by month yields Jan, Feb, Mar', () => {
    const q1 = new DateRange(JAN_1, MAR_1)
    const months = [...q1.iterate('month')]
    expect(months.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// toArray()
// ---------------------------------------------------------------------------
describe('DateRange.toArray()', () => {
  test('returns a plain array', () => {
    expect(Array.isArray(new DateRange(JAN_1, JAN_3).toArray('day'))).toBe(true)
  })

  test('length matches spread of iterate()', () => {
    const range = new DateRange(JAN_1, JAN_31)
    const arr = range.toArray('day')
    const gen = [...range.iterate('day')]
    expect(arr.length).toBe(gen.length)
  })

  test('each element is a DateFormat', () => {
    for (const d of new DateRange(JAN_1, JAN_3).toArray('day')) {
      expect(d).toBeInstanceOf(DateFormat)
    }
  })

  test('first element equals range start (normalised lo)', () => {
    const range = new DateRange(JAN_1, JAN_3)
    expect(range.toArray('day')[0].valueOf()).toBe(JAN_1)
  })

  test('scenario: report generation — Q1 toArray by month', () => {
    const q1 = new DateRange(JAN_1, MAR_1)
    const months = q1.toArray('month')
    expect(months).toBeInstanceOf(Array)
    expect(months.every((m) => m instanceof DateFormat)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// humanize()
// ---------------------------------------------------------------------------
describe('DateRange.humanize()', () => {
  test('same-year range contains both short month names and a single year', () => {
    const range = new DateRange(utc(JAN_1), utc(JAN_31))
    const h = range.humanize()
    expect(h).toContain('Jan')
    expect(h).toContain('2026')
    expect(h).toContain('–')
  })

  test('same-year range: year appears only once (at the end)', () => {
    const range = new DateRange(utc(JAN_1), utc(JAN_31))
    const h = range.humanize()
    // "Jan 1 – Jan 31, 2026" — year only on the right side
    const parts = h.split('–')
    expect(parts[0]).not.toMatch(/\d{4}/)
    expect(parts[1]).toContain('2026')
  })

  test('cross-year range includes both years', () => {
    const range = new DateRange(utc(DEC_31_2025), utc(JAN_1))
    const h = range.humanize()
    expect(h).toContain('2025')
    expect(h).toContain('2026')
    expect(h).toContain('–')
  })

  test('cross-year range: each side has its own year', () => {
    const range = new DateRange(utc(DEC_31_2025), utc(JAN_1))
    const parts = range.humanize().split('–')
    expect(parts[0]).toContain('2025')
    expect(parts[1]).toContain('2026')
  })

  test('scenario: conference schedule humanize for calendar UI display', () => {
    const conf = new DateRange(utc(JAN_10), utc(JAN_12))
    const label = conf.humanize()
    expect(label).toContain('Jan')
    expect(label).toContain('2026')
  })
})

// ---------------------------------------------------------------------------
// equals()
// ---------------------------------------------------------------------------
describe('DateRange.equals()', () => {
  test('same start and end → true', () => {
    const a = new DateRange(JAN_1, JAN_31)
    const b = new DateRange(JAN_1, JAN_31)
    expect(a.equals(b)).toBe(true)
  })

  test('different start → false', () => {
    expect(new DateRange(JAN_1, JAN_31).equals(new DateRange(JAN_2, JAN_31))).toBe(false)
  })

  test('different end → false', () => {
    expect(new DateRange(JAN_1, JAN_31).equals(new DateRange(JAN_1, JAN_15))).toBe(false)
  })

  test('both different → false', () => {
    expect(new DateRange(JAN_1, JAN_15).equals(new DateRange(JAN_2, JAN_31))).toBe(false)
  })

  test('range equals itself', () => {
    const r = new DateRange(JAN_1, JAN_31)
    expect(r.equals(r)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// toString()
// ---------------------------------------------------------------------------
describe('DateRange.toString()', () => {
  test('returns "YYYY-MM-DD / YYYY-MM-DD" format', () => {
    const range = new DateRange(utc(JAN_1), utc(JAN_31))
    expect(range.toString()).toMatch(/^\d{4}-\d{2}-\d{2} \/ \d{4}-\d{2}-\d{2}$/)
  })

  test('correct calendar dates for UTC-anchored range', () => {
    const range = new DateRange(utc(JAN_1), utc(JAN_31))
    expect(range.toString()).toBe('2026-01-01 / 2026-01-31')
  })

  test('contains the slash separator', () => {
    expect(new DateRange(JAN_1, JAN_31).toString()).toContain(' / ')
  })
})

// ---------------------------------------------------------------------------
// Real-life scenario: Time range validation
// ---------------------------------------------------------------------------
describe('Real-life: time range validation', () => {
  test('backward range is not forward', () => {
    const backward = new DateRange(JAN_31, JAN_1)
    expect(backward.isForward()).toBe(false)
    expect(backward.isValid()).toBe(true)
  })

  test('backward range duration is still positive', () => {
    expect(new DateRange(JAN_31, JAN_1).duration().valueOf()).toBeGreaterThan(0)
  })

  test('backward range contains() still works via internal min/max', () => {
    expect(new DateRange(JAN_31, JAN_1).contains(JAN_15)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Real-life scenario: Hotel booking
// ---------------------------------------------------------------------------
describe('Real-life: hotel booking', () => {
  const booking = new DateRange(utc(JAN_10), utc(JAN_15))

  test('booking is valid and forward', () => {
    expect(booking.isValid()).toBe(true)
    expect(booking.isForward()).toBe(true)
  })

  test('Jan 12 is occupied (contains)', () => {
    expect(booking.contains(utc(JAN_12))).toBe(true)
  })

  test('Jan 5 is not occupied', () => {
    expect(booking.contains(utc(JAN_5))).toBe(false)
  })

  test('second booking Jan 13-18 overlaps', () => {
    const booking2 = new DateRange(utc(JAN_13), utc(JAN_18))
    expect(booking.overlaps(booking2)).toBe(true)
  })

  test('intersection of bookings is Jan 13-15', () => {
    const booking2 = new DateRange(utc(JAN_13), utc(JAN_18))
    const shared = booking.intersect(booking2)
    expect(shared).not.toBeNull()
    expect(shared!.start.valueOf()).toBe(JAN_13)
    expect(shared!.end.valueOf()).toBe(JAN_15)
  })
})
