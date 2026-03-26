import { describe, test, expect } from '@jest/globals'
import DateFormat from '../src/core/DateFormat'
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays
} from '../src/ecosystem/BusinessDay'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const d = (s: string) => new DateFormat(s)

// ---------------------------------------------------------------------------
// isBusinessDay
// ---------------------------------------------------------------------------
describe('isBusinessDay', () => {
  test('Monday → true', () => {
    // Jan 12, 2026 is a Monday
    expect(isBusinessDay(d('2026-01-12'))).toBe(true)
  })

  test('Wednesday → true', () => {
    // Jan 14, 2026 is a Wednesday
    expect(isBusinessDay(d('2026-01-14'))).toBe(true)
  })

  test('Friday → true', () => {
    // Jan 16, 2026 is a Friday
    expect(isBusinessDay(d('2026-01-16'))).toBe(true)
  })

  test('Saturday → false', () => {
    // Jan 17, 2026 is a Saturday
    expect(isBusinessDay(d('2026-01-17'))).toBe(false)
  })

  test('Sunday → false', () => {
    // Jan 18, 2026 is a Sunday
    expect(isBusinessDay(d('2026-01-18'))).toBe(false)
  })

  test('business day that is also a US holiday → false when holiday list passed', () => {
    // Jan 1, 2026 is a Thursday (business day) but it is New Year's Day
    const usHolidays = getHolidays('US', 2026)
    expect(isBusinessDay(d('2026-01-01'), usHolidays)).toBe(false)
  })

  test('business day NOT in holidays array → true', () => {
    // Jan 15, 2026 is a Thursday; not a US holiday in 2026
    const usHolidays = getHolidays('US', 2026)
    expect(isBusinessDay(d('2026-01-15'), usHolidays)).toBe(true)
  })

  test('holidays array is undefined → no holiday check performed', () => {
    // Jan 1 is a weekday in 2026 (Thursday); without holidays it returns true
    expect(isBusinessDay(d('2026-01-01'), undefined)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// addBusinessDays
// ---------------------------------------------------------------------------
describe('addBusinessDays', () => {
  test('n=0 → same date returned', () => {
    const date = d('2026-01-15')
    expect(addBusinessDays(date, 0).format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('n=1 from Monday → Tuesday', () => {
    // Jan 12 (Mon) + 1 → Jan 13 (Tue)
    expect(addBusinessDays(d('2026-01-12'), 1).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('n=5 from Monday → next Monday (skips weekend)', () => {
    // Jan 12 (Mon) + 5 → Jan 19 (Mon)
    expect(addBusinessDays(d('2026-01-12'), 5).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('n=-1 from Monday → previous Friday', () => {
    // Jan 12 (Mon) - 1 → Jan 9 (Fri)
    expect(addBusinessDays(d('2026-01-12'), -1).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('n=-5 → 5 business days back', () => {
    // Jan 12 (Mon) - 5 → Jan 5 (Mon)
    expect(addBusinessDays(d('2026-01-12'), -5).format('YYYY-MM-DD')).toBe('2026-01-05')
  })

  test('n=2 from Thursday → next Monday (skips weekend)', () => {
    // Jan 15 (Thu) + 2 → Jan 16 (Fri) → Jan 19 (Mon)
    expect(addBusinessDays(d('2026-01-15'), 2).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('add from Friday + 1 → Monday (skip weekend)', () => {
    // Jan 16 (Fri) + 1 → Jan 19 (Mon)
    expect(addBusinessDays(d('2026-01-16'), 1).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('skips over holidays', () => {
    // Jan 16 (Fri) + 1, with Jan 19 (Mon) as holiday → Jan 20 (Tue)
    const holidays = ['2026-01-19']
    expect(addBusinessDays(d('2026-01-16'), 1, holidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })
})

// ---------------------------------------------------------------------------
// subtractBusinessDays
// ---------------------------------------------------------------------------
describe('subtractBusinessDays', () => {
  test('subtractBusinessDays(date, 1) equals addBusinessDays(date, -1)', () => {
    const date = d('2026-01-12')
    const result1 = subtractBusinessDays(date, 1).format('YYYY-MM-DD')
    const result2 = addBusinessDays(date, -1).format('YYYY-MM-DD')
    expect(result1).toBe(result2)
  })

  test('subtract 3 business days from Wednesday', () => {
    // Jan 14 (Wed) - 3 → Jan 9 (Fri)
    expect(subtractBusinessDays(d('2026-01-14'), 3).format('YYYY-MM-DD')).toBe('2026-01-09')
  })
})

// ---------------------------------------------------------------------------
// nextBusinessDay
// ---------------------------------------------------------------------------
describe('nextBusinessDay', () => {
  test('from Friday → Monday', () => {
    // Jan 16 (Fri) → Jan 19 (Mon)
    expect(nextBusinessDay(d('2026-01-16')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('from Saturday → Monday', () => {
    // Jan 17 (Sat) → Jan 19 (Mon)
    expect(nextBusinessDay(d('2026-01-17')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('from Sunday → Monday', () => {
    // Jan 18 (Sun) → Jan 19 (Mon)
    expect(nextBusinessDay(d('2026-01-18')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('skips holiday on Monday → Tuesday', () => {
    // Jan 18 (Sun) → nextBusinessDay with Jan19 (Mon) as holiday → Jan 20 (Tue)
    const holidays = ['2026-01-19']
    expect(nextBusinessDay(d('2026-01-18'), holidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })
})

// ---------------------------------------------------------------------------
// prevBusinessDay
// ---------------------------------------------------------------------------
describe('prevBusinessDay', () => {
  test('from Monday → Friday', () => {
    // Jan 12 (Mon) → Jan 9 (Fri)
    expect(prevBusinessDay(d('2026-01-12')).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('from Saturday → Friday', () => {
    // Jan 17 (Sat) → Jan 16 (Fri)
    expect(prevBusinessDay(d('2026-01-17')).format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('from Sunday → Friday', () => {
    // Jan 18 (Sun) → Jan 16 (Fri)
    expect(prevBusinessDay(d('2026-01-18')).format('YYYY-MM-DD')).toBe('2026-01-16')
  })
})

// ---------------------------------------------------------------------------
// businessDaysBetween
// ---------------------------------------------------------------------------
describe('businessDaysBetween', () => {
  test('same date → 0', () => {
    const date = d('2026-01-15')
    expect(businessDaysBetween(date, date)).toBe(0)
  })

  test('Mon to Fri same week → 3 (exclusive of both endpoints)', () => {
    // Jan 12 (Mon) to Jan 16 (Fri): Tue, Wed, Thu = 3
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-16'))).toBe(3)
  })

  test('Mon to Mon next week → 4 (exclusive of both endpoints)', () => {
    // Jan 12 (Mon) to Jan 19 (Mon): Tue-Fri (4) + skip Sat/Sun = 4
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-19'))).toBe(4)
  })

  test('end < start → negative count', () => {
    // Jan 16 (Fri) to Jan 12 (Mon): -3
    expect(businessDaysBetween(d('2026-01-16'), d('2026-01-12'))).toBe(-3)
  })

  test('with holidays that reduce count', () => {
    // Jan 12 (Mon) to Jan 16 (Fri) with Jan 14 (Wed) as holiday → 2 (Tue, Thu)
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-16'), ['2026-01-14'])).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// getHolidays
// ---------------------------------------------------------------------------
describe('getHolidays', () => {
  test('US 2026 → array of YYYY-MM-DD strings', () => {
    const h = getHolidays('US', 2026)
    expect(Array.isArray(h)).toBe(true)
    expect(h.length).toBeGreaterThan(0)
    h.forEach((s) => {
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  test('US includes New Year Day, Independence Day, Christmas', () => {
    const h = getHolidays('US', 2026)
    expect(h).toContain('2026-01-01')
    expect(h).toContain('2026-07-04')
    expect(h).toContain('2026-12-25')
  })

  test('US includes MLK Day (3rd Mon Jan)', () => {
    // 3rd Monday in Jan 2026 = Jan 19
    const h = getHolidays('US', 2026)
    expect(h).toContain('2026-01-19')
  })

  test('US includes Thanksgiving (4th Thu Nov)', () => {
    // 4th Thursday in Nov 2026 = Nov 26
    const h = getHolidays('US', 2026)
    expect(h).toContain('2026-11-26')
  })

  test('UK includes Good Friday and Boxing Day', () => {
    const h = getHolidays('UK', 2026)
    expect(h).toContain('2026-04-03') // Good Friday 2026
    expect(h).toContain('2026-12-26') // Boxing Day
  })

  test('UK includes Easter Monday', () => {
    const h = getHolidays('UK', 2026)
    expect(h).toContain('2026-04-06') // Easter Monday 2026
  })

  test('IN includes Republic Day (Jan 26)', () => {
    const h = getHolidays('IN', 2026)
    expect(h).toContain('2026-01-26')
  })

  test('DE includes German Unity Day (Oct 3)', () => {
    const h = getHolidays('DE', 2026)
    expect(h).toContain('2026-10-03')
  })

  test('DE includes Easter-related holidays', () => {
    const h = getHolidays('DE', 2026)
    expect(h).toContain('2026-04-03') // Good Friday
    expect(h).toContain('2026-04-05') // Easter Sunday
    expect(h).toContain('2026-04-06') // Easter Monday
  })

  test('FR includes Bastille Day (Jul 14)', () => {
    const h = getHolidays('FR', 2026)
    expect(h).toContain('2026-07-14')
  })

  test('FR includes Easter Monday', () => {
    const h = getHolidays('FR', 2026)
    expect(h).toContain('2026-04-06') // Easter Monday
  })

  test('CA includes Canada Day (Jul 1)', () => {
    const h = getHolidays('CA', 2026)
    expect(h).toContain('2026-07-01')
  })

  test('AU includes Australia Day (Jan 26)', () => {
    const h = getHolidays('AU', 2026)
    expect(h).toContain('2026-01-26')
  })

  test('AU includes Easter-related holidays', () => {
    const h = getHolidays('AU', 2026)
    expect(h).toContain('2026-04-03') // Good Friday
    expect(h).toContain('2026-04-04') // Easter Saturday
    expect(h).toContain('2026-04-05') // Easter Sunday
    expect(h).toContain('2026-04-06') // Easter Monday
  })

  test('unknown country → empty array', () => {
    expect(getHolidays('ZZ', 2026)).toEqual([])
  })

  test('lowercase "us" → works (toUpperCase internally)', () => {
    const h = getHolidays('us', 2026)
    expect(h).toContain('2026-01-01')
    expect(h.length).toBeGreaterThan(0)
  })

  test('year 2026 produces correct Easter-based dates', () => {
    // Easter Sunday 2026 = April 5
    const ukH = getHolidays('UK', 2026)
    expect(ukH).toContain('2026-04-03') // Good Friday = Easter - 2
    expect(ukH).toContain('2026-04-06') // Easter Monday = Easter + 1
  })
})
