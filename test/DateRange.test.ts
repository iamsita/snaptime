import { describe, test, expect } from '@jest/globals'
import DateRange from '../src/collections/DateRange'
import DateFormat from '../src/core/DateFormat'
import Duration from '../src/core/Duration'

// Use UTC timestamps to keep tests machine-independent
// Jan 1–31, 2026 UTC
const JAN_1 = Date.UTC(2026, 0, 1)
const JAN_2 = Date.UTC(2026, 0, 2)
const JAN_3 = Date.UTC(2026, 0, 3)
const JAN_15 = Date.UTC(2026, 0, 15)
const JAN_31 = Date.UTC(2026, 0, 31)
const FEB_1 = Date.UTC(2026, 1, 1)
const FEB_28 = Date.UTC(2026, 1, 28)
const MAR_1 = Date.UTC(2026, 2, 1)
const DEC_1_2025 = Date.UTC(2025, 11, 1)

describe('DateRange', () => {
  // ── Constructor ──────────────────────────────────────────────────────────────

  describe('constructor', () => {
    test('accepts DateFormat instances', () => {
      const r = new DateRange(new DateFormat(JAN_1), new DateFormat(JAN_31))
      expect(r.start.valueOf()).toBe(JAN_1)
      expect(r.end.valueOf()).toBe(JAN_31)
    })

    test('accepts string inputs', () => {
      const r = new DateRange('2026-01-01', '2026-01-31')
      expect(r.start.isValid()).toBe(true)
      expect(r.end.isValid()).toBe(true)
    })

    test('accepts Date objects', () => {
      const r = new DateRange(new Date(JAN_1), new Date(JAN_31))
      expect(r.start.valueOf()).toBe(JAN_1)
      expect(r.end.valueOf()).toBe(JAN_31)
    })

    test('accepts numbers (timestamps)', () => {
      const r = new DateRange(JAN_1, JAN_31)
      expect(r.start.valueOf()).toBe(JAN_1)
      expect(r.end.valueOf()).toBe(JAN_31)
    })
  })

  // ── isValid ──────────────────────────────────────────────────────────────────

  describe('isValid()', () => {
    test('both dates valid → true', () => {
      expect(new DateRange(JAN_1, JAN_31).isValid()).toBe(true)
    })

    test('NaN start → false', () => {
      expect(new DateRange(NaN, JAN_31).isValid()).toBe(false)
    })

    test('NaN end → false', () => {
      expect(new DateRange(JAN_1, NaN).isValid()).toBe(false)
    })
  })

  // ── isForward ────────────────────────────────────────────────────────────────

  describe('isForward()', () => {
    test('start < end → true', () => {
      expect(new DateRange(JAN_1, JAN_31).isForward()).toBe(true)
    })

    test('start > end → false', () => {
      expect(new DateRange(JAN_31, JAN_1).isForward()).toBe(false)
    })

    test('start === end → true', () => {
      expect(new DateRange(JAN_1, JAN_1).isForward()).toBe(true)
    })
  })

  // ── duration ─────────────────────────────────────────────────────────────────

  describe('duration()', () => {
    test('returns a Duration instance', () => {
      const d = new DateRange(JAN_1, JAN_31).duration()
      expect(d).toBeInstanceOf(Duration)
    })

    test('correct ms value for 30-day range', () => {
      const d = new DateRange(JAN_1, JAN_31).duration()
      expect(d.valueOf()).toBe(30 * 86400000)
    })

    test('always positive even for reversed range', () => {
      const d = new DateRange(JAN_31, JAN_1).duration()
      expect(d.valueOf()).toBe(30 * 86400000)
    })
  })

  // ── contains ─────────────────────────────────────────────────────────────────

  describe('contains(date, inclusive)', () => {
    const range = new DateRange(JAN_1, JAN_31)

    test('date inside → true', () => {
      expect(range.contains(JAN_15)).toBe(true)
    })

    test('date on start boundary, inclusive=true → true', () => {
      expect(range.contains(JAN_1, true)).toBe(true)
    })

    test('date on start boundary, inclusive=false → false', () => {
      expect(range.contains(JAN_1, false)).toBe(false)
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

    test('reversed range still works (uses min/max internally)', () => {
      const reversed = new DateRange(JAN_31, JAN_1)
      expect(reversed.contains(JAN_15)).toBe(true)
      expect(reversed.contains(DEC_1_2025)).toBe(false)
    })

    test('accepts string input', () => {
      const result = range.contains('2026-01-15')
      expect(result).toBe(true)
    })

    test('accepts Date object', () => {
      expect(range.contains(new Date(JAN_15))).toBe(true)
    })

    test('accepts DateFormat instance', () => {
      expect(range.contains(new DateFormat(JAN_15))).toBe(true)
    })
  })

  // ── overlaps ─────────────────────────────────────────────────────────────────

  describe('overlaps(other)', () => {
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

    test('partially overlapping → true', () => {
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
  })

  // ── intersect ────────────────────────────────────────────────────────────────

  describe('intersect(other)', () => {
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

    test('one contains the other → inner range', () => {
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
  })

  // ── merge ────────────────────────────────────────────────────────────────────

  describe('merge(other)', () => {
    const jan = new DateRange(JAN_1, JAN_31)

    test('no overlap → null', () => {
      const after = new DateRange(FEB_1 + 1, FEB_28)
      expect(jan.merge(after)).toBeNull()
    })

    test('overlapping → union range', () => {
      const partial = new DateRange(JAN_15, FEB_28)
      const result = jan.merge(partial)
      expect(result).not.toBeNull()
      expect(result!.start.valueOf()).toBe(JAN_1)
      expect(result!.end.valueOf()).toBe(FEB_28)
    })

    test('touching at boundary → union', () => {
      const next = new DateRange(JAN_31, FEB_28)
      const result = jan.merge(next)
      expect(result).not.toBeNull()
      expect(result!.start.valueOf()).toBe(JAN_1)
      expect(result!.end.valueOf()).toBe(FEB_28)
    })
  })

  // ── split ────────────────────────────────────────────────────────────────────

  describe('split(n, unit)', () => {
    test('3-day range split by 1 day → 3 chunks', () => {
      // Jan 1 to Jan 3 (exclusive end = Jan 4 not included, but hi = Jan 3)
      // cursor < hi means: Jan1 < Jan3, Jan2 < Jan3, Jan3 is NOT < Jan3 → 2 chunks
      // Actually Jan1→Jan2, Jan2→Jan3: 2 chunks
      const range = new DateRange(JAN_1, JAN_3)
      const chunks = range.split(1, 'day')
      expect(chunks.length).toBe(2)
      expect(chunks[0].start.valueOf()).toBe(JAN_1)
      expect(chunks[0].end.valueOf()).toBe(JAN_2)
      expect(chunks[1].start.valueOf()).toBe(JAN_2)
      expect(chunks[1].end.valueOf()).toBe(JAN_3)
    })

    test('30-day range split by 1 day → 30 chunks', () => {
      const range = new DateRange(JAN_1, JAN_31)
      const chunks = range.split(1, 'day')
      expect(chunks.length).toBe(30)
    })

    test('Jan–Feb range split by 1 month → 2 chunks', () => {
      const range = new DateRange(JAN_1, MAR_1)
      const chunks = range.split(1, 'month')
      expect(chunks.length).toBe(2)
    })

    test('last chunk capped at range end', () => {
      // 5-day range split by 3 days → 2 chunks, second capped
      const end = JAN_1 + 5 * 86400000
      const range = new DateRange(JAN_1, end)
      const chunks = range.split(3, 'day')
      expect(chunks.length).toBe(2)
      expect(chunks[1].end.valueOf()).toBe(end)
    })

    test('zero-length range (start === end) → 0 chunks', () => {
      const range = new DateRange(JAN_1, JAN_1)
      expect(range.split(1, 'day')).toHaveLength(0)
    })
  })

  // ── iterate ──────────────────────────────────────────────────────────────────

  describe('iterate(unit)', () => {
    test('3-day range yields 4 dates stepping by 1 day', () => {
      // Jan 1 to Jan 4: Jan1, Jan2, Jan3, Jan4 (cursor <= hi, 4 values)
      const end = JAN_1 + 3 * 86400000
      const range = new DateRange(JAN_1, end)
      const dates = [...range.iterate('day')]
      expect(dates).toHaveLength(4)
      expect(dates[0].valueOf()).toBe(JAN_1)
      expect(dates[3].valueOf()).toBe(end)
    })

    test('Jan1 to Jan3 yields 3 dates', () => {
      const range = new DateRange(JAN_1, JAN_3)
      const dates = [...range.iterate('day')]
      expect(dates).toHaveLength(3)
      expect(dates[0].valueOf()).toBe(JAN_1)
      expect(dates[2].valueOf()).toBe(JAN_3)
    })

    test('reversed range iterates from lo to hi', () => {
      const range = new DateRange(JAN_3, JAN_1)
      const dates = [...range.iterate('day')]
      expect(dates).toHaveLength(3)
      expect(dates[0].valueOf()).toBe(JAN_1)
    })

    test('all dates are DateFormat instances', () => {
      const range = new DateRange(JAN_1, JAN_3)
      for (const d of range.iterate('day')) {
        expect(d).toBeInstanceOf(DateFormat)
      }
    })
  })

  // ── toArray ──────────────────────────────────────────────────────────────────

  describe('toArray(unit)', () => {
    test('collects iterate() results into array', () => {
      const range = new DateRange(JAN_1, JAN_3)
      const arr = range.toArray('day')
      expect(Array.isArray(arr)).toBe(true)
      expect(arr).toHaveLength(3)
    })

    test('same length as manual iteration', () => {
      const range = new DateRange(JAN_1, JAN_31)
      const arr = range.toArray('day')
      const gen = [...range.iterate('day')]
      expect(arr.length).toBe(gen.length)
    })
  })

  // ── humanize ─────────────────────────────────────────────────────────────────

  describe('humanize()', () => {
    test('same year: "Jan 1 – Jan 31, 2026" style', () => {
      const range = new DateRange(
        new DateFormat(JAN_1, { utc: true }),
        new DateFormat(JAN_31, { utc: true })
      )
      const h = range.humanize()
      expect(h).toContain('Jan')
      expect(h).toContain('2026')
      expect(h).toContain('\u2013')
    })

    test('different years: "Dec 1, 2025 – Jan 31, 2026" style', () => {
      const range = new DateRange(
        new DateFormat(DEC_1_2025, { utc: true }),
        new DateFormat(JAN_31, { utc: true })
      )
      const h = range.humanize()
      expect(h).toContain('2025')
      expect(h).toContain('2026')
      expect(h).toContain('\u2013')
      // Both sides include year
      const parts = h.split('\u2013')
      expect(parts[0]).toContain('2025')
      expect(parts[1]).toContain('2026')
    })
  })

  // ── equals ───────────────────────────────────────────────────────────────────

  describe('equals(other)', () => {
    test('same start and end → true', () => {
      const a = new DateRange(JAN_1, JAN_31)
      const b = new DateRange(JAN_1, JAN_31)
      expect(a.equals(b)).toBe(true)
    })

    test('different start → false', () => {
      const a = new DateRange(JAN_1, JAN_31)
      const b = new DateRange(JAN_2, JAN_31)
      expect(a.equals(b)).toBe(false)
    })

    test('different end → false', () => {
      const a = new DateRange(JAN_1, JAN_31)
      const b = new DateRange(JAN_1, JAN_15)
      expect(a.equals(b)).toBe(false)
    })
  })

  // ── toString ─────────────────────────────────────────────────────────────────

  describe('toString()', () => {
    test('returns slash-separated date strings', () => {
      const range = new DateRange(
        new DateFormat(JAN_1, { utc: true }),
        new DateFormat(JAN_31, { utc: true })
      )
      const s = range.toString()
      expect(s).toContain(' / ')
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \/ \d{4}-\d{2}-\d{2}$/)
    })

    test('contains correct year and month info', () => {
      const range = new DateRange(
        new DateFormat(JAN_1, { utc: true }),
        new DateFormat(JAN_31, { utc: true })
      )
      expect(range.toString()).toBe('2026-01-01 / 2026-01-31')
    })
  })
})
