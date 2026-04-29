import { describe, test, expect } from '@jest/globals'
import DateCollection from '../src/collections/DateCollection'
import DateFormat from '../src/core/DateFormat'
import DateRange from '../src/collections/DateRange'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const d = (s: string) => new DateFormat(s)
const df = (date: Date) => new DateFormat(date)

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------
describe('DateCollection constructor', () => {
  test('accepts string array', () => {
    expect(new DateCollection(['2026-01-01', '2026-06-01']).count()).toBe(2)
  })

  test('accepts native Date array', () => {
    expect(new DateCollection([new Date(2026, 0, 1), new Date(2026, 5, 1)]).count()).toBe(2)
  })

  test('accepts DateFormat array', () => {
    expect(new DateCollection([d('2026-01-01'), d('2026-06-01')]).count()).toBe(2)
  })

  test('accepts number (timestamp) array', () => {
    const ms = new Date('2026-01-01').getTime()
    expect(new DateCollection([ms]).count()).toBe(1)
  })

  test('accepts mixed array of strings, Dates, DateFormats, numbers', () => {
    const c = new DateCollection([
      '2026-01-01',
      new Date(2026, 5, 1),
      d('2026-09-01'),
      new Date('2026-12-01').getTime()
    ])
    expect(c.count()).toBe(4)
  })

  test('empty array is valid', () => {
    const c = new DateCollection([])
    expect(c.count()).toBe(0)
    expect(c.isEmpty()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// [Symbol.iterator] — iterable protocol
// ---------------------------------------------------------------------------
describe('DateCollection [Symbol.iterator]', () => {
  test('for...of iterates all elements', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    const collected: string[] = []
    for (const item of c) {
      collected.push(item.format('YYYY-MM-DD'))
    }
    expect(collected).toEqual(['2026-01-01', '2026-06-01', '2026-12-31'])
  })

  test('spread operator works on collection', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const arr = [...c]
    expect(arr).toHaveLength(2)
    expect(arr[0]).toBeInstanceOf(DateFormat)
  })

  test('empty collection iterates zero times', () => {
    let count = 0
    for (const _item of new DateCollection([])) {
      count++
    }
    expect(count).toBe(0)
  })

  test('each item yielded is a DateFormat instance', () => {
    for (const item of new DateCollection(['2026-01-01', '2026-06-01'])) {
      expect(item).toBeInstanceOf(DateFormat)
    }
  })

  test('scenario: iterator protocol used to build summary report', () => {
    const visits = new DateCollection([
      '2026-01-05',
      '2026-01-06',
      '2026-01-07'
    ])
    const years = new Set<number>()
    for (const v of visits) {
      years.add(v.get('year'))
    }
    expect(years.size).toBe(1)
    expect(years.has(2026)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// sort()
// ---------------------------------------------------------------------------
describe('DateCollection.sort()', () => {
  test('no arg → defaults to ascending', () => {
    const arr = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])
      .sort()
      .toArray()
      .map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test("explicit 'asc'", () => {
    const arr = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])
      .sort('asc')
      .toArray()
      .map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test("explicit 'desc'", () => {
    const arr = new DateCollection(['2026-01-01', '2026-06-01', '2026-03-15'])
      .sort('desc')
      .toArray()
      .map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-06-01', '2026-03-15', '2026-01-01'])
  })

  test('already sorted ascending stays same', () => {
    const arr = new DateCollection(['2026-01-01', '2026-03-15', '2026-06-01'])
      .sort('asc')
      .toArray()
      .map((x) => x.format('YYYY-MM-DD'))
    expect(arr).toEqual(['2026-01-01', '2026-03-15', '2026-06-01'])
  })

  test('single element sorts without error', () => {
    expect(new DateCollection(['2026-01-01']).sort('asc').count()).toBe(1)
  })

  test('returns a new DateCollection (immutable)', () => {
    const original = new DateCollection(['2026-06-01', '2026-01-01'])
    const sorted = original.sort('asc')
    // Original order unchanged
    expect(original.first().format('YYYY-MM-DD')).toBe('2026-06-01')
    expect(sorted.first().format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('scenario: analytics dashboard — sort page visits ascending', () => {
    const visits = new DateCollection([
      '2026-01-15',
      '2026-01-10',
      '2026-01-20'
    ])
    const sorted = visits.sort('asc').toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(sorted[0]).toBe('2026-01-10')
    expect(sorted[2]).toBe('2026-01-20')
  })
})

// ---------------------------------------------------------------------------
// filter()
// ---------------------------------------------------------------------------
describe('DateCollection.filter()', () => {
  test('filter by predicate keeps matching items', () => {
    // Jan 12 (Mon) and Jan 19 (Mon) are weekdays; Jan 17 (Sat) and Jan 18 (Sun) are not
    const c = new DateCollection(['2026-01-12', '2026-01-17', '2026-01-18', '2026-01-19'])
    expect(c.filter((x) => x.isWeekday()).count()).toBe(2)
  })

  test('returns empty collection if nothing matches', () => {
    const c = new DateCollection(['2026-01-17', '2026-01-18']) // Sat + Sun
    expect(c.filter((x) => x.isWeekday()).isEmpty()).toBe(true)
  })

  test('filter keeps all when all match', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-13'])  // Mon + Tue
    expect(c.filter((x) => x.isWeekday()).count()).toBe(2)
  })

  test('returns a new DateCollection', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const filtered = c.filter((x) => x.get('month') === 1)
    expect(filtered).toBeInstanceOf(DateCollection)
  })

  test('scenario: event calendar — filter to future dates only (after 2026-06-01)', () => {
    const events = new DateCollection([
      '2026-01-01', '2026-06-01', '2026-07-01', '2026-12-31'
    ])
    const cutoff = d('2026-06-01').valueOf()
    const future = events.filter((x) => x.valueOf() > cutoff)
    expect(future.count()).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// unique()
// ---------------------------------------------------------------------------
describe('DateCollection.unique()', () => {
  test('no unit → exact millisecond dedup', () => {
    const ts = new Date(2026, 0, 15, 9, 0, 0, 0).getTime()
    const c = new DateCollection([ts, ts, ts + 1])
    expect(c.unique().count()).toBe(2)
  })

  test("'year' — one per year", () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2025-12-31'])
    expect(c.unique('year').count()).toBe(2)
  })

  test("'month' — one per month", () => {
    const c = new DateCollection(['2026-01-01', '2026-01-15', '2026-02-01'])
    expect(c.unique('month').count()).toBe(2)
  })

  test("'week' — one per ISO week", () => {
    // Jan 12 and Jan 14 land in the same ISO week; Jan 19 is in the next
    const c = new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
    expect(c.unique('week').count()).toBe(2)
  })

  test("'day' — one per calendar day", () => {
    const c = new DateCollection([
      df(new Date(2026, 0, 15, 9, 0)),
      df(new Date(2026, 0, 15, 17, 0)),
      df(new Date(2026, 0, 16, 9, 0))
    ])
    expect(c.unique('day').count()).toBe(2)
  })

  test("'hour' — one per hour", () => {
    const c = new DateCollection([
      df(new Date(2026, 0, 15, 9, 0)),
      df(new Date(2026, 0, 15, 9, 30)),
      df(new Date(2026, 0, 15, 10, 0))
    ])
    expect(c.unique('hour').count()).toBe(2)
  })

  test("'minute' — one per minute", () => {
    const c = new DateCollection([
      df(new Date(2026, 0, 15, 9, 0, 0)),
      df(new Date(2026, 0, 15, 9, 0, 30)),
      df(new Date(2026, 0, 15, 9, 1, 0))
    ])
    expect(c.unique('minute').count()).toBe(2)
  })

  test("'second' — one per second", () => {
    const c = new DateCollection([
      df(new Date(2026, 0, 15, 9, 0, 0, 0)),
      df(new Date(2026, 0, 15, 9, 0, 0, 500)),
      df(new Date(2026, 0, 15, 9, 0, 1, 0))
    ])
    expect(c.unique('second').count()).toBe(2)
  })

  test('unique on empty collection returns empty', () => {
    expect(new DateCollection([]).unique().isEmpty()).toBe(true)
  })

  test('scenario: unique daily visitors — deduplicate by day', () => {
    // Three visits on Jan 15, two on Jan 16, one on Jan 17
    const visits = new DateCollection([
      df(new Date(2026, 0, 15, 8, 0)),
      df(new Date(2026, 0, 15, 12, 0)),
      df(new Date(2026, 0, 15, 20, 0)),
      df(new Date(2026, 0, 16, 9, 0)),
      df(new Date(2026, 0, 16, 15, 0)),
      df(new Date(2026, 0, 17, 11, 0))
    ])
    expect(visits.unique('day').count()).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// compact()
// ---------------------------------------------------------------------------
describe('DateCollection.compact()', () => {
  test('removes invalid dates, keeps valid ones', () => {
    const invalid = new DateFormat(NaN)
    const c = new DateCollection([d('2026-01-01'), invalid, d('2026-06-01')])
    const result = c.compact()
    expect(result.count()).toBe(2)
    result.toArray().forEach((x) => expect(x.isValid()).toBe(true))
  })

  test('no-op when all dates are valid', () => {
    expect(new DateCollection(['2026-01-01', '2026-06-01']).compact().count()).toBe(2)
  })

  test('all invalid → empty collection', () => {
    const c = new DateCollection([new DateFormat(NaN), new DateFormat(NaN)])
    expect(c.compact().isEmpty()).toBe(true)
  })

  test('returns a new DateCollection', () => {
    expect(
      new DateCollection([d('2026-01-01')]).compact()
    ).toBeInstanceOf(DateCollection)
  })

  test('scenario: data cleanup removes NaN entries from import', () => {
    const imported = new DateCollection([
      d('2026-01-01'),
      new DateFormat(NaN),
      d('2026-03-01'),
      new DateFormat(NaN),
      d('2026-12-31')
    ])
    const clean = imported.compact()
    expect(clean.count()).toBe(3)
    expect(clean.toArray().every((x) => x.isValid())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// between()
// ---------------------------------------------------------------------------
describe('DateCollection.between()', () => {
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
    expect(c.between(d('2026-01-01'), d('2026-06-01')).count()).toBe(2)
  })

  test('empty result if no dates in range', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    expect(c.between(d('2026-06-01'), d('2026-08-01')).isEmpty()).toBe(true)
  })

  test('accepts timestamps as boundaries', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const s = new Date('2026-01-01').getTime()
    const e = new Date('2026-06-01').getTime()
    expect(c.between(s, e).count()).toBe(2)
  })

  test('scenario: data cleanup — filter to reporting period Q1 2026', () => {
    const events = new DateCollection([
      '2025-12-31', '2026-01-15', '2026-02-20', '2026-03-31', '2026-04-01'
    ])
    const q1 = events.between(d('2026-01-01'), d('2026-03-31'))
    expect(q1.count()).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// merge() — DateCollection.merge
// ---------------------------------------------------------------------------
describe('DateCollection.merge()', () => {
  test('concatenates two collections', () => {
    const a = new DateCollection(['2026-01-01', '2026-06-01'])
    const b = new DateCollection(['2026-09-01', '2026-12-31'])
    expect(a.merge(b).count()).toBe(4)
  })

  test('merging with empty collection returns same count', () => {
    const a = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(a.merge(new DateCollection([])).count()).toBe(2)
  })

  test('two empty collections → empty', () => {
    expect(new DateCollection([]).merge(new DateCollection([])).isEmpty()).toBe(true)
  })

  test('returns a new DateCollection', () => {
    const a = new DateCollection(['2026-01-01'])
    const b = new DateCollection(['2026-06-01'])
    expect(a.merge(b)).toBeInstanceOf(DateCollection)
  })

  test('merged collection preserves order (a then b)', () => {
    const a = new DateCollection(['2026-01-01'])
    const b = new DateCollection(['2026-12-31'])
    const merged = a.merge(b).toArray().map((x) => x.format('YYYY-MM-DD'))
    expect(merged[0]).toBe('2026-01-01')
    expect(merged[1]).toBe('2026-12-31')
  })
})

// ---------------------------------------------------------------------------
// groupBy()
// ---------------------------------------------------------------------------
describe('DateCollection.groupBy()', () => {
  test("'year' — groups by year string", () => {
    const c = new DateCollection(['2025-06-01', '2026-01-01', '2026-06-01'])
    const groups = c.groupBy('year')
    expect(groups.size).toBe(2)
    expect(groups.get('2025')?.length).toBe(1)
    expect(groups.get('2026')?.length).toBe(2)
  })

  test("'month' — groups by 'YYYY-MM'", () => {
    const c = new DateCollection(['2026-01-01', '2026-01-15', '2026-03-01'])
    const groups = c.groupBy('month')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-01')?.length).toBe(2)
    expect(groups.get('2026-03')?.length).toBe(1)
  })

  test("'week' — groups by 'YYYY-Www'", () => {
    const c = new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
    const groups = c.groupBy('week')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-W02')?.length).toBe(2)
    expect(groups.get('2026-W03')?.length).toBe(1)
  })

  test("'day' — groups by 'YYYY-MM-DD'", () => {
    const c = new DateCollection(['2026-01-15', '2026-01-15', '2026-01-16'])
    const groups = c.groupBy('day')
    expect(groups.size).toBe(2)
    expect(groups.get('2026-01-15')?.length).toBe(2)
    expect(groups.get('2026-01-16')?.length).toBe(1)
  })

  test("'hour' — groups by day+hour", () => {
    const c = new DateCollection([
      df(new Date(2026, 0, 15, 9, 0)),
      df(new Date(2026, 0, 15, 9, 30)),
      df(new Date(2026, 0, 15, 10, 0))
    ])
    const groups = c.groupBy('hour')
    expect(groups.size).toBe(2)
  })

  test("'quarter' — groups by 'YYYY-Q#'", () => {
    const c = new DateCollection(['2026-01-01', '2026-04-01', '2026-07-01', '2026-10-01'])
    const groups = c.groupBy('quarter')
    expect(groups.size).toBe(4)
    expect(groups.get('2026-Q1')?.length).toBe(1)
    expect(groups.get('2026-Q2')?.length).toBe(1)
    expect(groups.get('2026-Q3')?.length).toBe(1)
    expect(groups.get('2026-Q4')?.length).toBe(1)
  })

  test("'quarter' — multiple events in same quarter", () => {
    const c = new DateCollection(['2026-01-01', '2026-02-14', '2026-03-31', '2026-07-04'])
    const groups = c.groupBy('quarter')
    expect(groups.get('2026-Q1')?.length).toBe(3)
    expect(groups.get('2026-Q3')?.length).toBe(1)
  })

  test('groupBy returns a Map', () => {
    expect(new DateCollection(['2026-01-01']).groupBy('year')).toBeInstanceOf(Map)
  })

  test('each group value is an array of DateFormat', () => {
    const groups = new DateCollection(['2026-01-01', '2026-01-15']).groupBy('day')
    for (const [, arr] of groups) {
      expect(Array.isArray(arr)).toBe(true)
      arr.forEach((item) => expect(item).toBeInstanceOf(DateFormat))
    }
  })

  test('scenario: analytics dashboard — groupBy day gives daily visit counts', () => {
    const visits = new DateCollection([
      '2026-01-10', '2026-01-10',
      '2026-01-11',
      '2026-01-12', '2026-01-12', '2026-01-12'
    ])
    const daily = visits.groupBy('day')
    expect(daily.get('2026-01-10')?.length).toBe(2)
    expect(daily.get('2026-01-11')?.length).toBe(1)
    expect(daily.get('2026-01-12')?.length).toBe(3)
  })

  test('scenario: multi-month report — groupBy month', () => {
    const events = new DateCollection([
      '2026-01-05', '2026-01-20',
      '2026-02-10',
      '2026-03-01', '2026-03-15', '2026-03-30'
    ])
    const monthly = events.groupBy('month')
    expect(monthly.get('2026-01')?.length).toBe(2)
    expect(monthly.get('2026-02')?.length).toBe(1)
    expect(monthly.get('2026-03')?.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// closest() and farthest()
// ---------------------------------------------------------------------------
describe('DateCollection.closest()', () => {
  test('empty collection throws', () => {
    expect(() => new DateCollection([]).closest(d('2026-01-15'))).toThrow()
  })

  test('returns the closest date to target', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    expect(c.closest(d('2026-01-10')).format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('tie: first encountered wins', () => {
    // Jan 5 and Jan 15 are equidistant from Jan 10 — first wins
    const c = new DateCollection(['2026-01-05', '2026-01-15'])
    expect(c.closest(d('2026-01-10')).format('YYYY-MM-DD')).toBe('2026-01-05')
  })

  test('later element closer — updates best', () => {
    const c = new DateCollection(['2026-01-01', '2026-01-14', '2026-12-31'])
    expect(c.closest(d('2026-01-15')).format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('returns a DateFormat', () => {
    expect(new DateCollection(['2026-01-01']).closest(d('2026-01-01'))).toBeInstanceOf(DateFormat)
  })

  test('scenario: event calendar — closest event to today', () => {
    const events = new DateCollection([
      '2026-01-10', '2026-04-15', '2026-09-01'
    ])
    const today = d('2026-04-20')
    const next = events.closest(today)
    expect(next.format('YYYY-MM-DD')).toBe('2026-04-15')
  })
})

describe('DateCollection.farthest()', () => {
  test('empty collection throws', () => {
    expect(() => new DateCollection([]).farthest(d('2026-01-15'))).toThrow()
  })

  test('returns the farthest date from target', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    expect(c.farthest(d('2026-01-10')).format('YYYY-MM-DD')).toBe('2026-12-31')
  })

  test('closer element later does not override farthest', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31', '2026-12-01'])
    expect(c.farthest(d('2026-01-10')).format('YYYY-MM-DD')).toBe('2026-12-31')
  })

  test('returns a DateFormat', () => {
    expect(new DateCollection(['2026-01-01']).farthest(d('2026-01-01'))).toBeInstanceOf(DateFormat)
  })

  test('scenario: event calendar — farthest future event', () => {
    const events = new DateCollection([
      '2026-01-10', '2026-04-15', '2026-09-01'
    ])
    const today = d('2026-01-01')
    const farthest = events.farthest(today)
    expect(farthest.format('YYYY-MM-DD')).toBe('2026-09-01')
  })
})

// ---------------------------------------------------------------------------
// first() / last() / nth()
// ---------------------------------------------------------------------------
describe('DateCollection first/last/nth', () => {
  test('first() on empty → throws', () => {
    expect(() => new DateCollection([]).first()).toThrow()
  })

  test('last() on empty → throws', () => {
    expect(() => new DateCollection([]).last()).toThrow()
  })

  test('first() returns first element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.first().format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('last() returns last element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.last().format('YYYY-MM-DD')).toBe('2026-06-01')
  })

  test('nth(0) → first element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.nth(0).format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('nth(1) → second element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(c.nth(1).format('YYYY-MM-DD')).toBe('2026-06-01')
  })

  test('nth out of bounds → throws', () => {
    expect(() => new DateCollection(['2026-01-01']).nth(5)).toThrow()
  })

  test('nth negative index → throws', () => {
    expect(() => new DateCollection(['2026-01-01']).nth(-1)).toThrow()
  })

  test('first() returns a DateFormat', () => {
    expect(new DateCollection(['2026-01-01']).first()).toBeInstanceOf(DateFormat)
  })

  test('last() returns a DateFormat', () => {
    expect(new DateCollection(['2026-01-01']).last()).toBeInstanceOf(DateFormat)
  })

  test('single element: first() === last()', () => {
    const c = new DateCollection(['2026-06-15'])
    expect(c.first().valueOf()).toBe(c.last().valueOf())
  })
})

// ---------------------------------------------------------------------------
// min() / max()
// ---------------------------------------------------------------------------
describe('DateCollection min/max', () => {
  test('min() on empty → throws', () => {
    expect(() => new DateCollection([]).min()).toThrow()
  })

  test('max() on empty → throws', () => {
    expect(() => new DateCollection([]).max()).toThrow()
  })

  test('min() returns earliest date', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    expect(c.min().format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('max() returns latest date', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    expect(c.max().format('YYYY-MM-DD')).toBe('2026-12-31')
  })

  test('single element: min() === max()', () => {
    const c = new DateCollection(['2026-06-15'])
    expect(c.min().valueOf()).toBe(c.max().valueOf())
  })

  test('returns DateFormat instances', () => {
    const c = new DateCollection(['2026-01-01', '2026-12-31'])
    expect(c.min()).toBeInstanceOf(DateFormat)
    expect(c.max()).toBeInstanceOf(DateFormat)
  })

  test('scenario: analytics — find busiest day (max is last if sorted asc)', () => {
    const visits = new DateCollection(['2026-01-10', '2026-03-01', '2026-12-25'])
    expect(visits.max().format('YYYY-MM-DD')).toBe('2026-12-25')
    expect(visits.min().format('YYYY-MM-DD')).toBe('2026-01-10')
  })
})

// ---------------------------------------------------------------------------
// count() / isEmpty()
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

  test('count matches array length after filter', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-17', '2026-01-19'])
    const weekdays = c.filter((x) => x.isWeekday())
    expect(weekdays.count()).toBe(weekdays.toArray().length)
  })
})

// ---------------------------------------------------------------------------
// span()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.span()', () => {
  test('returns a DateRange instance', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    expect(c.span()).toBeInstanceOf(DateRange)
  })

  test('span start equals min()', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    const range = c.span()
    expect(range.start.valueOf()).toBe(c.min().valueOf())
  })

  test('span end equals max()', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    const range = c.span()
    expect(range.end.valueOf()).toBe(c.max().valueOf())
  })

  test('single element: span is zero-length range', () => {
    const c = new DateCollection(['2026-06-15'])
    const range = c.span()
    expect(range.start.valueOf()).toBe(range.end.valueOf())
  })

  test('empty collection → span throws (delegates to min/max)', () => {
    expect(() => new DateCollection([]).span()).toThrow()
  })

  test('span duration is correct', () => {
    // Jan 1 to Jan 31 = 30 days
    const c = new DateCollection(['2026-01-01', '2026-01-31'])
    const dur = c.span().duration()
    expect(dur.toDays()).toBe(30)
  })

  test('scenario: span calculation across year boundary', () => {
    const c = new DateCollection([
      '2026-01-15', '2025-12-01', '2026-11-30'
    ])
    const range = c.span()
    expect(range.start.format('YYYY-MM-DD')).toBe('2025-12-01')
    expect(range.end.format('YYYY-MM-DD')).toBe('2026-11-30')
  })

  test('scenario: analytics dashboard — span of all visits', () => {
    const visits = new DateCollection([
      '2026-01-10', '2026-02-20', '2026-03-05', '2026-04-01'
    ])
    const range = visits.span()
    expect(range.isValid()).toBe(true)
    expect(range.isForward()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// map()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.map()', () => {
  test('transforms dates to formatted strings', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const result = c.map((x) => x.format('YYYY-MM-DD'))
    expect(result).toEqual(['2026-01-01', '2026-06-01'])
  })

  test('transforms to timestamps (numbers)', () => {
    const ts = new Date('2026-01-01').getTime()
    const c = new DateCollection([ts])
    const result = c.map((x) => x.valueOf())
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe('number')
  })

  test('index is passed correctly', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    const indices = c.map((_x, i) => i)
    expect(indices).toEqual([0, 1, 2])
  })

  test('returns a plain array (not a DateCollection)', () => {
    const c = new DateCollection(['2026-01-01'])
    const result = c.map((x) => x.format('YYYY'))
    expect(Array.isArray(result)).toBe(true)
    expect(result).not.toBeInstanceOf(DateCollection)
  })

  test('empty collection maps to empty array', () => {
    expect(new DateCollection([]).map((x) => x.valueOf())).toEqual([])
  })

  test('scenario: analytics — map visit dates to ISO strings', () => {
    const visits = new DateCollection(['2026-01-05', '2026-01-10'])
    const iso = visits.map((x) => x.format('YYYY-MM-DD'))
    expect(iso).toHaveLength(2)
    iso.forEach((s) => expect(typeof s).toBe('string'))
  })
})

// ---------------------------------------------------------------------------
// forEach()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.forEach()', () => {
  test('calls callback for each element', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    let count = 0
    c.forEach(() => { count++ })
    expect(count).toBe(3)
  })

  test('receives DateFormat and index', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const indices: number[] = []
    const dates: string[] = []
    c.forEach((x, i) => {
      dates.push(x.format('YYYY-MM-DD'))
      indices.push(i)
    })
    expect(indices).toEqual([0, 1])
    expect(dates).toEqual(['2026-01-01', '2026-06-01'])
  })

  test('empty collection — callback never called', () => {
    let called = false
    new DateCollection([]).forEach(() => { called = true })
    expect(called).toBe(false)
  })

  test('returns void (undefined)', () => {
    const result = new DateCollection(['2026-01-01']).forEach(() => {})
    expect(result).toBeUndefined()
  })

  test('scenario: build summary strings from visit collection', () => {
    const visits = new DateCollection(['2026-01-05', '2026-01-06'])
    const summaries: string[] = []
    visits.forEach((x) => {
      summaries.push(`Visit on ${x.format('YYYY-MM-DD')}`)
    })
    expect(summaries).toEqual([
      'Visit on 2026-01-05',
      'Visit on 2026-01-06'
    ])
  })
})

// ---------------------------------------------------------------------------
// reduce()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.reduce()', () => {
  test('sum of years', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const sum = c.reduce((acc, x) => acc + x.get('year'), 0)
    expect(sum).toBe(2026 + 2026)
  })

  test('collect formatted strings', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const result = c.reduce<string[]>((acc, x) => {
      acc.push(x.format('YYYY-MM-DD'))
      return acc
    }, [])
    expect(result).toEqual(['2026-01-01', '2026-06-01'])
  })

  test('index is passed correctly', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    const indices: number[] = []
    c.reduce<null>((acc, _x, i) => { indices.push(i); return acc }, null)
    expect(indices).toEqual([0, 1, 2])
  })

  test('empty collection returns initial value', () => {
    const result = new DateCollection([]).reduce((acc, _x) => acc + 1, 0)
    expect(result).toBe(0)
  })

  test('scenario: count how many dates fall in 2026', () => {
    const c = new DateCollection(['2025-12-31', '2026-01-01', '2026-06-01'])
    const count2026 = c.reduce((acc, x) => acc + (x.get('year') === 2026 ? 1 : 0), 0)
    expect(count2026).toBe(2)
  })

  test('scenario: find earliest via reduce (without using min())', () => {
    const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])
    const earliest = c.reduce((best, x) => (x.isBefore(best) ? x : best), c.first())
    expect(earliest.format('YYYY-MM-DD')).toBe('2026-01-01')
  })
})

// ---------------------------------------------------------------------------
// some()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.some()', () => {
  test('returns true when at least one date matches', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-17'])  // Mon, Sat
    expect(c.some((x) => x.isWeekend())).toBe(true)
  })

  test('returns false when no date matches', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-13'])  // Mon, Tue
    expect(c.some((x) => x.isWeekend())).toBe(false)
  })

  test('empty collection → false', () => {
    expect(new DateCollection([]).some(() => true)).toBe(false)
  })

  test('scenario: "are any events on a weekend?" → true', () => {
    const events = new DateCollection(['2026-01-12', '2026-01-17'])
    expect(events.some((x) => x.isWeekend())).toBe(true)
  })

  test('scenario: check if any date is in the past relative to 2026-06-01', () => {
    const c = new DateCollection(['2026-01-01', '2026-07-01'])
    const cutoff = d('2026-06-01').valueOf()
    expect(c.some((x) => x.valueOf() < cutoff)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// every()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.every()', () => {
  test('returns true when all dates match', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-13', '2026-01-14'])  // Mon–Wed
    expect(c.every((x) => x.isWeekday())).toBe(true)
  })

  test('returns false when at least one does not match', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-17'])  // Mon, Sat
    expect(c.every((x) => x.isWeekday())).toBe(false)
  })

  test('empty collection → true (vacuous truth)', () => {
    expect(new DateCollection([]).every(() => false)).toBe(true)
  })

  test('scenario: "are all dates in 2026?"', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    expect(c.every((x) => x.get('year') === 2026)).toBe(true)
  })

  test('scenario: "are all dates in 2026?" — false when one is 2025', () => {
    const c = new DateCollection(['2025-12-31', '2026-01-01'])
    expect(c.every((x) => x.get('year') === 2026)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// find()  [previously untested]
// ---------------------------------------------------------------------------
describe('DateCollection.find()', () => {
  test('returns first matching DateFormat', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-17', '2026-01-18'])  // Mon, Sat, Sun
    const result = c.find((x) => x.isWeekend())
    expect(result).toBeInstanceOf(DateFormat)
    expect(result!.format('YYYY-MM-DD')).toBe('2026-01-17')
  })

  test('returns undefined when no match', () => {
    const c = new DateCollection(['2026-01-12', '2026-01-13'])  // Mon, Tue
    expect(c.find((x) => x.isWeekend())).toBeUndefined()
  })

  test('empty collection → undefined', () => {
    expect(new DateCollection([]).find(() => true)).toBeUndefined()
  })

  test('scenario: find first weekend date in event list', () => {
    const events = new DateCollection([
      '2026-01-12', '2026-01-13', '2026-01-17', '2026-01-20'
    ])
    const weekend = events.find((x) => x.isWeekend())
    expect(weekend).toBeDefined()
    expect(weekend!.format('YYYY-MM-DD')).toBe('2026-01-17')
  })

  test('scenario: find first date in Q2', () => {
    const c = new DateCollection(['2026-01-01', '2026-04-01', '2026-07-01'])
    const q2 = c.find((x) => x.quarter() === 2)
    expect(q2).toBeDefined()
    expect(q2!.format('YYYY-MM-DD')).toBe('2026-04-01')
  })
})

// ---------------------------------------------------------------------------
// toArray()
// ---------------------------------------------------------------------------
describe('DateCollection.toArray()', () => {
  test('returns array of DateFormat clones', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01'])
    const arr = c.toArray()
    expect(arr).toHaveLength(2)
    expect(arr[0]).toBeInstanceOf(DateFormat)
    expect(arr[0].format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('empty collection → empty array', () => {
    expect(new DateCollection([]).toArray()).toEqual([])
  })

  test('length matches count()', () => {
    const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-12-31'])
    expect(c.toArray().length).toBe(c.count())
  })
})

// ---------------------------------------------------------------------------
// Real-life scenario: Analytics dashboard
// ---------------------------------------------------------------------------
describe('Real-life: analytics dashboard', () => {
  const visits = new DateCollection([
    df(new Date(2026, 0, 10, 8, 30)),
    df(new Date(2026, 0, 10, 14, 0)),
    df(new Date(2026, 0, 11, 9, 0)),
    df(new Date(2026, 0, 12, 10, 0)),
    df(new Date(2026, 0, 12, 11, 0)),
    df(new Date(2026, 0, 12, 16, 0))
  ])

  test('groupBy day gives correct counts', () => {
    const daily = visits.groupBy('day')
    expect(daily.get('2026-01-10')?.length).toBe(2)
    expect(daily.get('2026-01-11')?.length).toBe(1)
    expect(daily.get('2026-01-12')?.length).toBe(3)
  })

  test('sort ascending gives earliest first', () => {
    const sorted = visits.sort('asc')
    expect(sorted.first().format('YYYY-MM-DD')).toBe('2026-01-10')
    expect(sorted.last().format('YYYY-MM-DD')).toBe('2026-01-12')
  })

  test('span covers Jan 10 to Jan 12', () => {
    const range = visits.span()
    expect(range.start.format('YYYY-MM-DD')).toBe('2026-01-10')
    expect(range.end.format('YYYY-MM-DD')).toBe('2026-01-12')
  })

  test('some visits on Jan 12', () => {
    expect(visits.some((x) => x.format('YYYY-MM-DD') === '2026-01-12')).toBe(true)
  })

  test('every visit is in 2026', () => {
    expect(visits.every((x) => x.get('year') === 2026)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Real-life scenario: Collection operations (some/every/find/reduce)
// ---------------------------------------------------------------------------
describe('Real-life: collection operations', () => {
  const dates = new DateCollection([
    '2026-01-05',   // Mon
    '2026-01-10',   // Sat
    '2026-01-12',   // Mon
    '2026-01-17',   // Sat
    '2026-06-01',   // Mon
    '2026-12-25'    // Fri
  ])

  test('some: at least one weekend date', () => {
    expect(dates.some((x) => x.isWeekend())).toBe(true)
  })

  test('every: not all dates are weekdays', () => {
    expect(dates.every((x) => x.isWeekday())).toBe(false)
  })

  test('find: first Saturday in collection', () => {
    const sat = dates.find((x) => x.isSaturday())
    expect(sat).toBeDefined()
    expect(sat!.format('YYYY-MM-DD')).toBe('2026-01-10')
  })

  test('reduce: count weekday events', () => {
    const weekdayCount = dates.reduce((acc, x) => acc + (x.isWeekday() ? 1 : 0), 0)
    expect(weekdayCount).toBe(4)
  })

  test('map: extract months only', () => {
    const months = dates.map((x) => x.get('month'))
    expect(months).toContain(1)
    expect(months).toContain(6)
    expect(months).toContain(12)
  })

  test('filter + every: filtered weekdays are all weekdays', () => {
    const weekdays = dates.filter((x) => x.isWeekday())
    expect(weekdays.every((x) => x.isWeekday())).toBe(true)
  })
})
