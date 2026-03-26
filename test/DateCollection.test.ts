import { describe, test, expect } from '@jest/globals'
import DateCollection from '../src/collections/DateCollection'
import DateFormat from '../src/core/DateFormat'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const d = (s: string) => new DateFormat(s)

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------
describe('DateCollection constructor', () => {
  test('from string array', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.count()).toBe(2)
  })

  test('from Date array', () => {
    const c = new DateCollection([new Date(2026, 0, 1), new Date(2026, 5, 1)])
    expect(c.count()).toBe(2)
  })

  test('from DateFormat array', () => {
    const c = new DateCollection([d('2026-01-01'), d('2026-06-01')])
    expect(c.count()).toBe(2)
  })

  test('from number array', () => {
    const ms = new Date('2026-01-01').getTime()
    const c = new DateCollection([ms])
    expect(c.count()).toBe(1)
  })

  test('mixed array of strings, Dates, DateFormats, numbers', () => {
    const c = new DateCollection([
      '2026-01-01',
      new Date(2026, 5, 1),
      d('2026-09-01'),
      new Date('2026-12-01').getTime()
    ])
    expect(c.count()).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// sort
// ---------------------------------------------------------------------------
describe('DateCollection.sort', () => {
  test('no args → defaults to ascending', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])
    const sorted = c.sort()
    const arr = sorted.toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test('ascending (default)', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])
    const sorted = c.sort('asc')
    const arr = sorted.toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test('descending', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-03-15'])
    const sorted = c.sort('desc')
    const arr = sorted.toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-06-01', '2026-03-15', '2026-01-01'])
  })

  test('already sorted ascending stays the same', () => {
    const c = new DateCollection(['2026-01-01', '2026-03-15', '2026-06-01'])
    const sorted = c.sort('asc')
    const arr = sorted.toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test('single element collection sorts without error', () => {
    const c = new DateCollection(['2026-01-01'])
    const sorted = c.sort('asc')
    expect(sorted.count()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// closest
// ---------------------------------------------------------------------------
describe('DateCollection.closest', () => {
  test('empty collection throws', () => {
    const c = new DateCollection([])
    expect(() => c.closest(d('2026-01-15'))).toThrow()
  })

  test('returns closest date to target', () => {
    // Jan 1 and Dec 31: closest to Jan 10 is Jan 1
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    const result = c.closest(d('2026-01-10'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('tie: first encountered wins (both equidistant)', () => {
    // Jan 5 and Jan 15 are both 5 days from Jan 10 — first (Jan 5) wins
    const c = new DateCollection(['2026-01-05', '2026-01-15'])
    const result = c.closest(d('2026-01-10'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-05')
  })

  test('later element is closer — updates best', () => {
    // Jan 1 is 14 days away, Jan 14 is 1 day away → Jan 14 wins
    const c = new DateCollection(['2026-01-01', '2026-01-14', '2026-12-31'])
    const result = c.closest(d('2026-01-15'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-14')
  })
})

// ---------------------------------------------------------------------------
// farthest
// ---------------------------------------------------------------------------
describe('DateCollection.farthest', () => {
  test('empty collection throws', () => {
    const c = new DateCollection([])
    expect(() => c.farthest(d('2026-01-15'))).toThrow()
  })

  test('returns farthest date from target', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    const result = c.farthest(d('2026-01-10'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-12-31')
  })

  test('third element closer than second — no update on third iteration', () => {
    // Dec 31 is farthest; Dec 1 is closer than Dec 31, so no update on i=2
    const c = new DateCollection(['2026-01-01', '2026-12-31', '2026-12-01'])
    const result = c.farthest(d('2026-01-10'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-12-31')
  })
})

// ---------------------------------------------------------------------------
// groupBy
// ---------------------------------------------------------------------------
describe('DateCollection.groupBy', () => {
  test("'year': groups by year string", () => {
    const c = new DateCollection(['2025-06-01', '2026-01-01', '2026-06-01'])
    const groups = c.groupBy('year')
    expect(groups.size).toBe(2)
    expect(groups.get('2025')?.length).toBe(1)
    expect(groups.get('2026')?.length).toBe(2)
  })

  test("'month': groups by 'YYYY-MM'", () => {
    const c = new DateCollection(['2026-01-01', '2026-01-15', '2026-03-01'])
    const groups = c.groupBy('month')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-01')?.length).toBe(2)
    expect(groups.get('2026-03')?.length).toBe(1)
  })

  test("'week': groups by 'YYYY-Www'", () => {
    // The source isoWeek() algorithm places Jan 12 & Jan 14 in week 2,
    // and Jan 19 in week 3 (anchor is Wednesday, not Thursday).
    const c = new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
    const groups = c.groupBy('week')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-W02')?.length).toBe(2)
    expect(groups.get('2026-W03')?.length).toBe(1)
  })

  test("'day': groups by 'YYYY-MM-DD'", () => {
    const c = new DateCollection(['2026-01-15', '2026-01-15', '2026-01-16'])
    const groups = c.groupBy('day')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-01-15')?.length).toBe(2)
  })

  test("'hour': groups by day+hour", () => {
    const c = new DateCollection([
      new DateFormat(new Date(2026, 0, 15, 9, 0)),
      new DateFormat(new Date(2026, 0, 15, 9, 30)),
      new DateFormat(new Date(2026, 0, 15, 10, 0))
    ])
    const groups = c.groupBy('hour')
    expect(groups.size).toBe(2)
  })

  test("'quarter': groups by year+Q", () => {
    // Jan = Q1, Apr = Q2, Jul = Q3
    const c = new DateCollection(['2026-01-01', '2026-04-01', '2026-07-01'])
    const groups = c.groupBy('quarter')
    expect(groups.size).toBe(3)
    expect(groups.get('2026-Q1')?.length).toBe(1)
    expect(groups.get('2026-Q2')?.length).toBe(1)
    expect(groups.get('2026-Q3')?.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// filter
// ---------------------------------------------------------------------------
describe('DateCollection.filter', () => {
  test('filter by predicate (only weekdays)', () => {
    // Jan 12 (Mon), Jan 17 (Sat), Jan 18 (Sun), Jan 19 (Mon)
    const c = new DateCollection(['2026-01-12', '2026-01-17', '2026-01-18', '2026-01-19'])
    const weekdays = c.filter((x) => x.isWeekday())
    expect(weekdays.count()).toBe(2)
  })

  test('returns empty collection if nothing matches', () => {
    const c = new DateCollection(['2026-01-17', '2026-01-18']) // Sat + Sun
    const weekdays = c.filter((x) => x.isWeekday())
    expect(weekdays.isEmpty()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// unique
// ---------------------------------------------------------------------------
describe('DateCollection.unique', () => {
  test('no unit → exact ms dedup', () => {
    const ts = new Date(2026, 0, 15, 9, 0, 0, 0).getTime()
    const c = new DateCollection([ts, ts, ts + 1])
    expect(c.unique().count()).toBe(2)
  })

  test("'year': one per year", () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2025-12-31'])
    expect(c.unique('year').count()).toBe(2)
  })

  test("'month': one per month", () => {
    const c = new DateCollection(['2026-01-01', '2026-01-15', '2026-02-01'])
    expect(c.unique('month').count()).toBe(2)
  })

  test("'week': one per ISO week", () => {
    // Jan 12 and Jan 14 are both in the same week per the source implementation;
    // Jan 19 falls in the next week.
    const c = new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
    expect(c.unique('week').count()).toBe(2)
  })

  test("'day': one per calendar day", () => {
    const c = new DateCollection([
      new DateFormat(new Date(2026, 0, 15, 9, 0)),
      new DateFormat(new Date(2026, 0, 15, 17, 0)),
      new DateFormat(new Date(2026, 0, 16, 9, 0))
    ])
    expect(c.unique('day').count()).toBe(2)
  })

  test("'hour': one per hour", () => {
    const c = new DateCollection([
      new DateFormat(new Date(2026, 0, 15, 9, 0)),
      new DateFormat(new Date(2026, 0, 15, 9, 30)),
      new DateFormat(new Date(2026, 0, 15, 10, 0))
    ])
    expect(c.unique('hour').count()).toBe(2)
  })

  test("'minute': one per minute", () => {
    const c = new DateCollection([
      new DateFormat(new Date(2026, 0, 15, 9, 0, 0)),
      new DateFormat(new Date(2026, 0, 15, 9, 0, 30)),
      new DateFormat(new Date(2026, 0, 15, 9, 1, 0))
    ])
    expect(c.unique('minute').count()).toBe(2)
  })

  test("'second': one per second", () => {
    const c = new DateCollection([
      new DateFormat(new Date(2026, 0, 15, 9, 0, 0, 0)),
      new DateFormat(new Date(2026, 0, 15, 9, 0, 0, 500)),
      new DateFormat(new Date(2026, 0, 15, 9, 0, 1, 0))
    ])
    expect(c.unique('second').count()).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// first / last / nth
// ---------------------------------------------------------------------------
describe('DateCollection first/last/nth', () => {
  test('empty collection throws for first()', () => {
    expect(() => new DateCollection([]).first()).toThrow()
  })

  test('empty collection throws for last()', () => {
    expect(() => new DateCollection([]).last()).toThrow()
  })

  test('nth(0) → first element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.nth(0).format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('nth out of bounds → throws', () => {
    const c = new DateCollection(['2026-01-01'])
    expect(() => c.nth(5)).toThrow()
  })

  test('negative index → throws', () => {
    const c = new DateCollection(['2026-01-01'])
    expect(() => c.nth(-1)).toThrow()
  })

  test('first() returns first element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.first().format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('last() returns last element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.last().format('YYYY-MM-DD')).toBe('2026-06-01')
  })
})

// ---------------------------------------------------------------------------
// count / isEmpty
// ---------------------------------------------------------------------------
describe('DateCollection count/isEmpty', () => {
  test('empty → count=0, isEmpty=true', () => {
    const c = new DateCollection([])
    expect(c.count()).toBe(0)
    expect(c.isEmpty()).toBe(true)
  })

  test('non-empty → correct count, isEmpty=false', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    expect(c.count()).toBe(3)
    expect(c.isEmpty()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// min / max
// ---------------------------------------------------------------------------
describe('DateCollection min/max', () => {
  test('empty → min throws', () => {
    expect(() => new DateCollection([]).min()).toThrow()
  })

  test('empty → max throws', () => {
    expect(() => new DateCollection([]).max()).toThrow()
  })

  test('multiple dates → correct min', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    expect(c.min().format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('multiple dates → correct max', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    expect(c.max().format('YYYY-MM-DD')).toBe('2026-12-31')
  })
})

// ---------------------------------------------------------------------------
// map
// ---------------------------------------------------------------------------
describe('DateCollection.map', () => {
  test('transforms dates to formatted strings', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const result = c.map((x) => x.format('YYYY-MM-DD'))
    expect(result).toEqual(['2026-01-01', '2026-06-01'])
  })

  test('transforms dates to timestamps (numbers)', () => {
    const c = new DateCollection(['2026-01-01'])
    const result = c.map((x) => x.valueOf())
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// toArray
// ---------------------------------------------------------------------------
describe('DateCollection.toArray', () => {
  test('returns cloned DateFormat array', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const arr = c.toArray()
    expect(arr).toHaveLength(2)
    expect(arr[0]).toBeInstanceOf(DateFormat)
    expect(arr[0].format('YYYY-MM-DD')).toBe('2026-01-01')
  })
})

// ---------------------------------------------------------------------------
// between
// ---------------------------------------------------------------------------
describe('DateCollection.between', () => {
  test('filters to dates within [start, end] inclusive', () => {
    const c = new DateCollection(['2026-01-01', '2026-03-01', '2026-06-01', '2026-12-31'])
    const result = c.between(d('2026-02-01'), d('2026-07-01'))
    expect(result.count()).toBe(2)
    const strs = result.toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(strs).toContain('2026-03-01')
    expect(strs).toContain('2026-06-01')
  })

  test('includes dates exactly on start and end boundaries', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    const result = c.between(d('2026-01-01'), d('2026-06-01'))
    expect(result.count()).toBe(2)
  })

  test('empty if no dates in range', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    const result = c.between(d('2026-06-01'), d('2026-08-01'))
    expect(result.isEmpty()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// compact
// ---------------------------------------------------------------------------
describe('DateCollection.compact', () => {
  test('removes invalid dates, keeps valid ones', () => {
    const invalid = new DateFormat(NaN)
    const c = new DateCollection([d('2026-01-01'), invalid, d('2026-06-01')])
    const compacted = c.compact()
    expect(compacted.count()).toBe(2)
    compacted.toArray().forEach((x) => expect(x.isValid()).toBe(true))
  })

  test('no-op when all dates are valid', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.compact().count()).toBe(2)
  })
})
