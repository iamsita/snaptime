import { describe, test, expect } from '@jest/globals'
import Cron from '../src/ecosystem/Cron'
import DateFormat from '../src/core/DateFormat'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a DateFormat from local Date constructor so we can control
// hour/minute without UTC confusion.
const local = (year: number, month: number, day: number, hour = 0, min = 0) =>
  new DateFormat(new Date(year, month - 1, day, hour, min, 0, 0))

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------
describe('Cron constructor', () => {
  test('valid 5-field expression creates Cron', () => {
    expect(() => new Cron('* * * * *')).not.toThrow()
  })

  test('less than 5 fields → throws', () => {
    expect(() => new Cron('* * * *')).toThrow()
  })

  test('more than 5 fields → throws', () => {
    expect(() => new Cron('* * * * * *')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// matches – via parseField internals
// ---------------------------------------------------------------------------
describe('Cron.matches', () => {
  test('all-wildcard "* * * * *" matches any date', () => {
    const cron = new Cron('* * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 30))).toBe(true)
    expect(cron.matches(local(2026, 7, 4, 23, 59))).toBe(true)
  })

  test('specific minute "5 * * * *" matches only minute 5', () => {
    const cron = new Cron('5 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 5))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 6))).toBe(false)
  })

  test('range "1-5 * * * *" matches minutes 1 through 5', () => {
    const cron = new Cron('1-5 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 1))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 3))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 5))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(false)
    expect(cron.matches(local(2026, 1, 15, 9, 6))).toBe(false)
  })

  test('step "*/15 * * * *" matches 0, 15, 30, 45', () => {
    const cron = new Cron('*/15 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 15))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 30))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 45))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 1))).toBe(false)
    expect(cron.matches(local(2026, 1, 15, 9, 14))).toBe(false)
  })

  test('step from single value "5/15 * * * *" → 5, 20, 35, 50', () => {
    const cron = new Cron('5/15 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 5))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 20))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 35))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 50))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(false)
    expect(cron.matches(local(2026, 1, 15, 9, 6))).toBe(false)
  })

  test('list "0,30 * * * *" matches 0 and 30', () => {
    const cron = new Cron('0,30 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 30))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 9, 15))).toBe(false)
  })

  test('DOW abbreviation "* * * * MON" matches Monday', () => {
    const cron = new Cron('* * * * MON')
    // Jan 12, 2026 = Monday
    expect(cron.matches(local(2026, 1, 12, 10, 0))).toBe(true)
    // Jan 13, 2026 = Tuesday
    expect(cron.matches(local(2026, 1, 13, 10, 0))).toBe(false)
  })

  test('DOW 7 is treated as Sunday (0)', () => {
    const cron = new Cron('* * * * 7')
    // Jan 18, 2026 = Sunday
    expect(cron.matches(local(2026, 1, 18, 12, 0))).toBe(true)
    // Jan 12, 2026 = Monday
    expect(cron.matches(local(2026, 1, 12, 12, 0))).toBe(false)
  })

  test('DOW 0 and 7 both match Sunday', () => {
    const cron0 = new Cron('* * * * 0')
    const cron7 = new Cron('* * * * 7')
    const sunday = local(2026, 1, 18, 8, 0)
    expect(cron0.matches(sunday)).toBe(true)
    expect(cron7.matches(sunday)).toBe(true)
  })

  test('step with range "1-10/2 * * * *" matches 1,3,5,7,9', () => {
    const cron = new Cron('1-10/2 * * * *')
    for (const m of [1, 3, 5, 7, 9]) {
      expect(cron.matches(local(2026, 1, 15, 9, m))).toBe(true)
    }
    for (const m of [0, 2, 4, 6, 8, 10]) {
      expect(cron.matches(local(2026, 1, 15, 9, m))).toBe(false)
    }
  })

  test('DOW-only constraint "* * * * 1" matches only Mondays', () => {
    const cron = new Cron('* * * * 1')
    expect(cron.matches(local(2026, 1, 12, 15, 30))).toBe(true) // Monday
    expect(cron.matches(local(2026, 1, 13, 15, 30))).toBe(false) // Tuesday
  })

  test('DOM-only "0 0 15 * *" matches day 15 at midnight only', () => {
    const cron = new Cron('0 0 15 * *')
    expect(cron.matches(local(2026, 1, 15, 0, 0))).toBe(true)
    expect(cron.matches(local(2026, 1, 15, 0, 1))).toBe(false)
    expect(cron.matches(local(2026, 1, 14, 0, 0))).toBe(false)
  })

  test('both DOM and DOW non-wildcard → OR behavior (vixie cron)', () => {
    // "0 0 15 * 1": matches day 15 OR Monday
    const cron = new Cron('0 0 15 * 1')
    // Jan 15, 2026 (Thu) at midnight — matches because day=15
    expect(cron.matches(local(2026, 1, 15, 0, 0))).toBe(true)
    // Jan 12, 2026 (Mon) at midnight — matches because DOW=Mon
    expect(cron.matches(local(2026, 1, 12, 0, 0))).toBe(true)
    // Jan 13, 2026 (Tue) — neither day 15 nor Monday → false
    expect(cron.matches(local(2026, 1, 13, 0, 0))).toBe(false)
  })

  test('month constraint "0 0 * 3 *" matches only March', () => {
    const cron = new Cron('0 0 * 3 *')
    expect(cron.matches(local(2026, 3, 1, 0, 0))).toBe(true)
    expect(cron.matches(local(2026, 2, 1, 0, 0))).toBe(false)
    expect(cron.matches(local(2026, 4, 1, 0, 0))).toBe(false)
  })

  test('"30 9 * * 1-5" matches 9:30 Monday through Friday only', () => {
    const cron = new Cron('30 9 * * 1-5')
    // Jan 12 (Mon), Jan 13 (Tue), Jan 16 (Fri) at 9:30 → match
    expect(cron.matches(local(2026, 1, 12, 9, 30))).toBe(true)
    expect(cron.matches(local(2026, 1, 13, 9, 30))).toBe(true)
    expect(cron.matches(local(2026, 1, 16, 9, 30))).toBe(true)
    // Wrong minute
    expect(cron.matches(local(2026, 1, 12, 9, 0))).toBe(false)
    // Weekend
    expect(cron.matches(local(2026, 1, 17, 9, 30))).toBe(false) // Sat
    expect(cron.matches(local(2026, 1, 18, 9, 30))).toBe(false) // Sun
  })
})

// ---------------------------------------------------------------------------
// next
// ---------------------------------------------------------------------------
describe('Cron.next', () => {
  test('next() without args uses current time', () => {
    // Every-minute cron → next call always finds a match quickly
    const cron = new Cron('* * * * *')
    const next = cron.next()
    expect(next.isValid()).toBe(true)
    // Result should be in the future (at least now + 1 min)
    expect(next.valueOf()).toBeGreaterThan(Date.now())
  })

  test('"*/5 * * * *" from a known time → 5 minutes later', () => {
    const cron = new Cron('*/5 * * * *')
    // local(2026, 1, 15, 9, 0): minute=0, which is matched by */5
    // next() adds 1 minute first → 9:01, then finds 9:05
    const from = local(2026, 1, 15, 9, 0)
    const next = cron.next(from)
    expect(next.get('hour')).toBe(9)
    expect(next.get('minute')).toBe(5)
  })

  test('"0 9 * * 1" (Monday 9am) from Thursday → next Monday at 9am', () => {
    const cron = new Cron('0 9 * * 1')
    // Jan 15, 2026 = Thursday
    const from = local(2026, 1, 15, 9, 0)
    const next = cron.next(from)
    // Jan 19, 2026 = Monday
    expect(next.get('year')).toBe(2026)
    expect(next.get('month')).toBe(1)
    expect(next.get('date')).toBe(19)
    expect(next.get('hour')).toBe(9)
    expect(next.get('minute')).toBe(0)
  })

  test('"0 9 * * 1" prev from Thursday → previous Monday at 9am', () => {
    const cron = new Cron('0 9 * * 1')
    // Jan 15, 2026 = Thursday
    const from = local(2026, 1, 15, 9, 0)
    const prev = cron.prev(from)
    // Jan 12, 2026 = Monday
    expect(prev.get('date')).toBe(12)
    expect(prev.get('hour')).toBe(9)
    expect(prev.get('minute')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// prev
// ---------------------------------------------------------------------------
describe('Cron.prev', () => {
  test('prev() without args uses current time', () => {
    const cron = new Cron('* * * * *')
    const prev = cron.prev()
    expect(prev.isValid()).toBe(true)
    expect(prev.valueOf()).toBeLessThan(Date.now())
  })

  test('"*/5 * * * *" from a known time → 5 minutes earlier', () => {
    const cron = new Cron('*/5 * * * *')
    // From 9:05 → prev() subtracts 1 min → 9:04, iterates back to 9:00
    const from = local(2026, 1, 15, 9, 5)
    const prev = cron.prev(from)
    expect(prev.get('hour')).toBe(9)
    expect(prev.get('minute')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// between
// ---------------------------------------------------------------------------
describe('Cron.between', () => {
  test('hourly cron over 3-hour range returns 4 matches', () => {
    // "0 * * * *" from 09:00 to 12:00 inclusive
    const cron = new Cron('0 * * * *')
    const start = local(2026, 1, 15, 9, 0)
    const end = local(2026, 1, 15, 12, 0)
    const results = cron.between(start, end)
    // 09:00, 10:00, 11:00, 12:00
    expect(results).toHaveLength(4)
    expect(results[0].get('hour')).toBe(9)
    expect(results[3].get('hour')).toBe(12)
  })

  test('with limit=2 → only 2 results', () => {
    const cron = new Cron('0 * * * *')
    const start = local(2026, 1, 15, 9, 0)
    const end = local(2026, 1, 15, 12, 0)
    const results = cron.between(start, end, 2)
    expect(results).toHaveLength(2)
    expect(results[0].get('hour')).toBe(9)
    expect(results[1].get('hour')).toBe(10)
  })

  test('end before any matches → empty array', () => {
    // "0 9 * * *" but range is only 08:00–08:59
    const cron = new Cron('0 9 * * *')
    const start = local(2026, 1, 15, 8, 0)
    const end = local(2026, 1, 15, 8, 59)
    const results = cron.between(start, end)
    expect(results).toHaveLength(0)
  })

  test('impossible cron over large range → empty array', () => {
    // "0 0 32 * *" is impossible (no 32nd day)
    const cron = new Cron('0 0 32 * *')
    const start = local(2026, 1, 1, 0, 0)
    const end = local(2026, 12, 31, 23, 59)
    const results = cron.between(start, end)
    expect(results).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------
describe('Cron error cases', () => {
  test('prev() throws when no match found within 366 days', () => {
    // "0 0 32 * *" is impossible
    const cron = new Cron('0 0 32 * *')
    const from = local(2026, 1, 15, 12, 0)
    expect(() => cron.prev(from)).toThrow('No matching date found within 366 days')
  })

  test('next() throws when no match found within 366 days', () => {
    // "0 0 32 * *" is impossible
    const cron = new Cron('0 0 32 * *')
    const from = local(2026, 1, 15, 12, 0)
    expect(() => cron.next(from)).toThrow('No matching date found within 366 days')
  })
})

// ---------------------------------------------------------------------------
// humanize
// ---------------------------------------------------------------------------
describe('Cron.humanize', () => {
  test('"* * * * *" → "Every minute"', () => {
    expect(new Cron('* * * * *').humanize()).toBe('Every minute')
  })

  test('"30 * * * *" → "At minute 30 past every hour"', () => {
    expect(new Cron('30 * * * *').humanize()).toBe('At minute 30 past every hour')
  })

  test('"0 9 * * *" → "At 09:00"', () => {
    expect(new Cron('0 9 * * *').humanize()).toBe('At 09:00')
  })

  test('"0 9 * * 1-5" → includes "Monday through Friday"', () => {
    const result = new Cron('0 9 * * 1-5').humanize()
    expect(result).toContain('Monday through Friday')
    expect(result).toContain('09:00')
  })

  test('"0 9 1 * *" → mentions "day 1"', () => {
    const result = new Cron('0 9 1 * *').humanize()
    expect(result).toContain('day 1')
  })

  test('"0 9 * 3 *" → mentions "March"', () => {
    const result = new Cron('0 9 * 3 *').humanize()
    expect(result).toContain('March')
  })

  test('"0 9,17 * * *" → includes both 09:00 and 17:00', () => {
    const result = new Cron('0 9,17 * * *').humanize()
    expect(result).toContain('09:00')
    expect(result).toContain('17:00')
  })

  test('"0-59 * 15 * *" — all-minute-values fieldDescription returns "every minute"', () => {
    // 0-59 on minute with wildcard hour + dom constraint → fieldDescription(minute) hits all-values path
    const result = new Cron('0-59 * 15 * *').humanize()
    expect(result).toContain('every minute')
  })
})

// ---------------------------------------------------------------------------
// DOW wraparound range (lo > hi)
// ---------------------------------------------------------------------------
describe('Cron DOW wraparound range', () => {
  test('"* * * * 5-1" matches Friday, Saturday, Sunday, Monday', () => {
    const cron = new Cron('* * * * 5-1')
    // Jan 2026: Mon=12, Fri=16, Sat=17, Sun=18
    expect(cron.matches(local(2026, 1, 12, 9, 0))).toBe(true) // Monday
    expect(cron.matches(local(2026, 1, 16, 9, 0))).toBe(true) // Friday
    expect(cron.matches(local(2026, 1, 17, 9, 0))).toBe(true) // Saturday
    expect(cron.matches(local(2026, 1, 18, 9, 0))).toBe(true) // Sunday
    expect(cron.matches(local(2026, 1, 13, 9, 0))).toBe(false) // Tuesday
    expect(cron.matches(local(2026, 1, 14, 9, 0))).toBe(false) // Wednesday
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(false) // Thursday
  })
})

// ---------------------------------------------------------------------------
// humanize – minute-only and hour-only branches (with other constraints)
// ---------------------------------------------------------------------------
describe('Cron.humanize additional branches', () => {
  test('"30 * 15 * *" minute-only branch (non-wildcard minute with wildcard hour + dom constraint)', () => {
    const result = new Cron('30 * 15 * *').humanize()
    expect(result).toContain('minute')
    expect(result).toContain('30')
  })

  test('"* 9 * * 1" hour-only branch (wildcard minute, specific hour + dow constraint)', () => {
    const result = new Cron('* 9 * * 1').humanize()
    expect(result).toContain('hour')
    expect(result).toContain('9')
  })

  test('"* * * * 1,3" non-consecutive DOW → joined list', () => {
    const result = new Cron('* * * * 1,3').humanize()
    expect(result).toContain('Monday')
    expect(result).toContain('Wednesday')
  })
})

// ---------------------------------------------------------------------------
// Non-DOW inverted range (lo > hi, isDow=false) – false branch of else if (isDow)
// ---------------------------------------------------------------------------
describe('Cron non-DOW inverted range', () => {
  test('"59-0 * * * *" inverted minute range → empty set, matches nothing', () => {
    // lo=59, hi=0, isDow=false → false branch of else if (isDow) → empty values set
    const cron = new Cron('59-0 * * * *')
    expect(cron.matches(local(2026, 1, 15, 9, 59))).toBe(false)
    expect(cron.matches(local(2026, 1, 15, 9, 0))).toBe(false)
    expect(cron.matches(local(2026, 1, 15, 9, 30))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// humanize – multi-value fields to invoke sort comparators
// ---------------------------------------------------------------------------
describe('Cron.humanize multi-value sort coverage', () => {
  test('"30,45 * * * *" → early-return minute path with sort comparator', () => {
    const result = new Cron('30,45 * * * *').humanize()
    expect(result).toContain('30')
    expect(result).toContain('45')
  })

  test('"0,15 9 * * *" → both-specific path, mins sort comparator called', () => {
    const result = new Cron('0,15 9 * * *').humanize()
    expect(result).toContain('09:00')
    expect(result).toContain('09:15')
  })

  test('"0 9 1,15 * *" → dom sort comparator called', () => {
    const result = new Cron('0 9 1,15 * *').humanize()
    expect(result).toContain('day')
    expect(result).toContain('1')
    expect(result).toContain('15')
  })

  test('"0 9 * 3,6 *" → month sort comparator called', () => {
    const result = new Cron('0 9 * 3,6 *').humanize()
    expect(result).toContain('March')
    expect(result).toContain('June')
  })
})

// ---------------------------------------------------------------------------
// toString
// ---------------------------------------------------------------------------
describe('Cron.toString', () => {
  test('returns the original expression string', () => {
    const expr = '30 9 * * 1-5'
    expect(new Cron(expr).toString()).toBe(expr)
  })

  test('returns trimmed expression', () => {
    const cron = new Cron('  0 0 * * *  ')
    expect(cron.toString()).toBe('0 0 * * *')
  })
})
