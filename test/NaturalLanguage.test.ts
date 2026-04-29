import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import parseNatural from '../src/ecosystem/NaturalLanguage'
import DateFormat from '../src/core/DateFormat'

// ─────────────────────────────────────────────────────────────────────────────
// Fixed reference: Thursday, January 15, 2026 at 12:00:00 local time.
// Using local Date constructor so get() uses local getters — matches source.
// ─────────────────────────────────────────────────────────────────────────────
const REF = new DateFormat(new Date(2026, 0, 15, 12, 0, 0))

// Fake system time used by tests that omit the `ref` argument.
// The fake instant matches REF so relative comparisons stay consistent.
const FAKE_NOW = new Date(2026, 0, 15, 12, 0, 0)

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(FAKE_NOW)
})

afterEach(() => {
  jest.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function expectDate(df: DateFormat, year: number, month: number, day: number): void {
  expect(df.isValid()).toBe(true)
  expect(df.get('year')).toBe(year)
  expect(df.get('month')).toBe(month)
  expect(df.get('date')).toBe(day)
}

function expectDateTime(
  df: DateFormat,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0
): void {
  expectDate(df, year, month, day)
  expect(df.get('hour')).toBe(hour)
  expect(df.get('minute')).toBe(minute)
  expect(df.get('second')).toBe(second)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Immediate references
// ─────────────────────────────────────────────────────────────────────────────

describe('"now" and "today"', () => {
  test('"now" → same valueOf as ref', () => {
    expect(parseNatural('now', REF).valueOf()).toBe(REF.valueOf())
  })

  test('"today" → same valueOf as ref', () => {
    expect(parseNatural('today', REF).valueOf()).toBe(REF.valueOf())
  })

  test('"now" without ref → uses Date.now() (fake timer)', () => {
    const result = parseNatural('now')
    expect(result.isValid()).toBe(true)
    // Should equal a DateFormat built from the faked Date.now()
    expect(result.valueOf()).toBe(new DateFormat().valueOf())
  })

  test('"today" without ref → uses Date.now() (fake timer)', () => {
    const result = parseNatural('today')
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(new DateFormat().valueOf())
  })

  test('"now" is case-insensitive: "NOW"', () => {
    expect(parseNatural('NOW', REF).valueOf()).toBe(REF.valueOf())
  })

  test('"today" is case-insensitive: "TODAY"', () => {
    expect(parseNatural('TODAY', REF).valueOf()).toBe(REF.valueOf())
  })

  test('"today" is case-insensitive: "Today"', () => {
    expect(parseNatural('Today', REF).valueOf()).toBe(REF.valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Day navigation: tomorrow / yesterday
// ─────────────────────────────────────────────────────────────────────────────

describe('"tomorrow" and "yesterday"', () => {
  test('"tomorrow" → Jan 16, 2026', () => {
    expectDate(parseNatural('tomorrow', REF), 2026, 1, 16)
  })

  test('"yesterday" → Jan 14, 2026', () => {
    expectDate(parseNatural('yesterday', REF), 2026, 1, 14)
  })

  test('"tomorrow" preserves the time of day from ref', () => {
    // add(1,'day') keeps the same time: 12:00:00
    const result = parseNatural('tomorrow', REF)
    expect(result.get('hour')).toBe(12)
    expect(result.get('minute')).toBe(0)
  })

  test('"yesterday" preserves the time of day from ref', () => {
    const result = parseNatural('yesterday', REF)
    expect(result.get('hour')).toBe(12)
    expect(result.get('minute')).toBe(0)
  })

  test('"TOMORROW" case-insensitive → Jan 16, 2026', () => {
    expectDate(parseNatural('TOMORROW', REF), 2026, 1, 16)
  })

  test('"Yesterday" mixed case → Jan 14, 2026', () => {
    expectDate(parseNatural('Yesterday', REF), 2026, 1, 14)
  })

  test('"tomorrow" without ref uses fake now', () => {
    const result = parseNatural('tomorrow')
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(new DateFormat().add(1, 'day').valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Time of day: noon / midnight
// ─────────────────────────────────────────────────────────────────────────────

describe('"noon" and "midnight"', () => {
  test('"noon" → ref date at 12:00:00', () => {
    const result = parseNatural('noon', REF)
    expect(result.get('year')).toBe(2026)
    expect(result.get('month')).toBe(1)
    expect(result.get('date')).toBe(15)
    expect(result.get('hour')).toBe(12)
    expect(result.get('minute')).toBe(0)
    expect(result.get('second')).toBe(0)
  })

  test('"midnight" → ref date at 00:00:00', () => {
    const result = parseNatural('midnight', REF)
    expect(result.get('year')).toBe(2026)
    expect(result.get('month')).toBe(1)
    expect(result.get('date')).toBe(15)
    expect(result.get('hour')).toBe(0)
    expect(result.get('minute')).toBe(0)
    expect(result.get('second')).toBe(0)
  })

  test('"NOON" case-insensitive', () => {
    expect(parseNatural('NOON', REF).get('hour')).toBe(12)
  })

  test('"MIDNIGHT" case-insensitive', () => {
    expect(parseNatural('MIDNIGHT', REF).get('hour')).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Period starts
// ─────────────────────────────────────────────────────────────────────────────

describe('"beginning of <period>"', () => {
  test('"beginning of day" → startOf(day)', () => {
    const result = parseNatural('beginning of day', REF)
    expect(result.valueOf()).toBe(REF.startOf('day').valueOf())
    expect(result.get('hour')).toBe(0)
    expect(result.get('minute')).toBe(0)
    expect(result.get('second')).toBe(0)
  })

  test('"beginning of week" → startOf(week) — Sunday of the week', () => {
    // REF = Thursday Jan 15; startOf('week') goes back to Sunday Jan 11
    const result = parseNatural('beginning of week', REF)
    expect(result.valueOf()).toBe(REF.startOf('week').valueOf())
    expectDate(result, 2026, 1, 11)
  })

  test('"beginning of month" → Jan 1, 2026', () => {
    const result = parseNatural('beginning of month', REF)
    expect(result.valueOf()).toBe(REF.startOf('month').valueOf())
    expectDate(result, 2026, 1, 1)
  })

  test('"beginning of year" → Jan 1, 2026', () => {
    const result = parseNatural('beginning of year', REF)
    expect(result.valueOf()).toBe(REF.startOf('year').valueOf())
    expectDate(result, 2026, 1, 1)
  })

  test('"BEGINNING OF DAY" case-insensitive', () => {
    expect(parseNatural('BEGINNING OF DAY', REF).valueOf()).toBe(REF.startOf('day').valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Period ends
// ─────────────────────────────────────────────────────────────────────────────

describe('"end of <period>"', () => {
  test('"end of day" → endOf(day)', () => {
    const result = parseNatural('end of day', REF)
    expect(result.valueOf()).toBe(REF.endOf('day').valueOf())
  })

  test('"end of day" has hour=23, minute=59, second=59', () => {
    const result = parseNatural('end of day', REF)
    expect(result.get('hour')).toBe(23)
    expect(result.get('minute')).toBe(59)
    expect(result.get('second')).toBe(59)
  })

  test('"end of week" → endOf(week)', () => {
    const result = parseNatural('end of week', REF)
    expect(result.valueOf()).toBe(REF.endOf('week').valueOf())
  })

  test('"end of month" → endOf(month) = last ms of Jan 31', () => {
    const result = parseNatural('end of month', REF)
    expect(result.valueOf()).toBe(REF.endOf('month').valueOf())
    expect(result.get('date')).toBe(31)
  })

  test('"end of year" → endOf(year) = last ms of Dec 31', () => {
    const result = parseNatural('end of year', REF)
    expect(result.valueOf()).toBe(REF.endOf('year').valueOf())
    expect(result.get('month')).toBe(12)
    expect(result.get('date')).toBe(31)
  })

  test('"END OF MONTH" case-insensitive', () => {
    expect(parseNatural('END OF MONTH', REF).valueOf()).toBe(REF.endOf('month').valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. "this week/month/year"
// ─────────────────────────────────────────────────────────────────────────────

describe('"this <period>"', () => {
  test('"this week" → startOf(week)', () => {
    const result = parseNatural('this week', REF)
    expect(result.valueOf()).toBe(REF.startOf('week').valueOf())
  })

  test('"this month" → startOf(month)', () => {
    const result = parseNatural('this month', REF)
    expect(result.valueOf()).toBe(REF.startOf('month').valueOf())
  })

  test('"this year" → startOf(year)', () => {
    const result = parseNatural('this year', REF)
    expect(result.valueOf()).toBe(REF.startOf('year').valueOf())
  })

  test('"THIS WEEK" case-insensitive', () => {
    expect(parseNatural('THIS WEEK', REF).valueOf()).toBe(REF.startOf('week').valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Day with time: "today/tomorrow/yesterday at <time>"
// ─────────────────────────────────────────────────────────────────────────────

describe('"<day> at <time>"', () => {
  test('"today at noon" → Jan 15 12:00:00', () => {
    expectDateTime(parseNatural('today at noon', REF), 2026, 1, 15, 12, 0, 0)
  })

  test('"today at midnight" → Jan 15 00:00:00', () => {
    expectDateTime(parseNatural('today at midnight', REF), 2026, 1, 15, 0, 0, 0)
  })

  test('"today at 3pm" → Jan 15 15:00:00', () => {
    expectDateTime(parseNatural('today at 3pm', REF), 2026, 1, 15, 15, 0, 0)
  })

  test('"today at 9am" → Jan 15 09:00:00', () => {
    expectDateTime(parseNatural('today at 9am', REF), 2026, 1, 15, 9, 0, 0)
  })

  test('"today at 9:30am" → Jan 15 09:30:00', () => {
    expectDateTime(parseNatural('today at 9:30am', REF), 2026, 1, 15, 9, 30, 0)
  })

  test('"today at 15:30" → Jan 15 15:30:00', () => {
    expectDateTime(parseNatural('today at 15:30', REF), 2026, 1, 15, 15, 30, 0)
  })

  test('"today at 3:30 pm" → Jan 15 15:30:00', () => {
    expectDateTime(parseNatural('today at 3:30 pm', REF), 2026, 1, 15, 15, 30, 0)
  })

  test('"tomorrow at 9am" → Jan 16 09:00:00', () => {
    expectDateTime(parseNatural('tomorrow at 9am', REF), 2026, 1, 16, 9, 0, 0)
  })

  test('"tomorrow at noon" → Jan 16 12:00:00', () => {
    expectDateTime(parseNatural('tomorrow at noon', REF), 2026, 1, 16, 12, 0, 0)
  })

  test('"yesterday at 5pm" → Jan 14 17:00:00', () => {
    expectDateTime(parseNatural('yesterday at 5pm', REF), 2026, 1, 14, 17, 0, 0)
  })

  test('"yesterday at midnight" → Jan 14 00:00:00', () => {
    expectDateTime(parseNatural('yesterday at midnight', REF), 2026, 1, 14, 0, 0, 0)
  })

  test('"tomorrow at 12pm" → Jan 16 12:00:00 (noon via 12pm)', () => {
    expectDateTime(parseNatural('tomorrow at 12pm', REF), 2026, 1, 16, 12, 0, 0)
  })

  test('"today at 12am" → Jan 15 00:00:00 (midnight via 12am)', () => {
    expectDateTime(parseNatural('today at 12am', REF), 2026, 1, 15, 0, 0, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. "N units ago"
// ─────────────────────────────────────────────────────────────────────────────

describe('"N <unit> ago"', () => {
  test('"1 second ago"', () => {
    const result = parseNatural('1 second ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'second').valueOf())
  })

  test('"30 seconds ago"', () => {
    const result = parseNatural('30 seconds ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(30, 'second').valueOf())
  })

  test('"5 minutes ago"', () => {
    const result = parseNatural('5 minutes ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(5, 'minute').valueOf())
  })

  test('"1 minute ago" (singular)', () => {
    const result = parseNatural('1 minute ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'minute').valueOf())
  })

  test('"2 hours ago"', () => {
    const result = parseNatural('2 hours ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(2, 'hour').valueOf())
  })

  test('"1 hour ago" (singular)', () => {
    const result = parseNatural('1 hour ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'hour').valueOf())
  })

  test('"3 days ago" → Jan 12, 2026', () => {
    expectDate(parseNatural('3 days ago', REF), 2026, 1, 12)
  })

  test('"1 day ago" (singular) → Jan 14, 2026', () => {
    expectDate(parseNatural('1 day ago', REF), 2026, 1, 14)
  })

  test('"2 weeks ago"', () => {
    const result = parseNatural('2 weeks ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(2, 'week').valueOf())
  })

  test('"1 week ago" (singular)', () => {
    const result = parseNatural('1 week ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'week').valueOf())
  })

  test('"1 month ago"', () => {
    const result = parseNatural('1 month ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'month').valueOf())
  })

  test('"2 months ago"', () => {
    const result = parseNatural('2 months ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(2, 'month').valueOf())
  })

  test('"5 years ago"', () => {
    const result = parseNatural('5 years ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(5, 'year').valueOf())
  })

  test('"1 year ago" (singular)', () => {
    const result = parseNatural('1 year ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'year').valueOf())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. "in N units"
// ─────────────────────────────────────────────────────────────────────────────

describe('"in N <unit>"', () => {
  test('"in 1 second"', () => {
    const result = parseNatural('in 1 second', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'second').valueOf())
  })

  test('"in 45 seconds"', () => {
    const result = parseNatural('in 45 seconds', REF)
    expect(result.valueOf()).toBe(REF.add(45, 'second').valueOf())
  })

  test('"in 10 minutes"', () => {
    const result = parseNatural('in 10 minutes', REF)
    expect(result.valueOf()).toBe(REF.add(10, 'minute').valueOf())
  })

  test('"in 1 minute" (singular)', () => {
    const result = parseNatural('in 1 minute', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'minute').valueOf())
  })

  test('"in 3 hours"', () => {
    const result = parseNatural('in 3 hours', REF)
    expect(result.valueOf()).toBe(REF.add(3, 'hour').valueOf())
  })

  test('"in 3 days" → Jan 18, 2026', () => {
    expectDate(parseNatural('in 3 days', REF), 2026, 1, 18)
  })

  test('"in 1 day" (singular)', () => {
    expectDate(parseNatural('in 1 day', REF), 2026, 1, 16)
  })

  test('"in 1 week"', () => {
    const result = parseNatural('in 1 week', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'week').valueOf())
  })

  test('"in 2 weeks"', () => {
    const result = parseNatural('in 2 weeks', REF)
    expect(result.valueOf()).toBe(REF.add(2, 'week').valueOf())
  })

  test('"in 2 months"', () => {
    const result = parseNatural('in 2 months', REF)
    expect(result.valueOf()).toBe(REF.add(2, 'month').valueOf())
  })

  test('"in 3 months" from Jan 15 → April 15', () => {
    const result = parseNatural('in 3 months', REF)
    expectDate(result, 2026, 4, 15)
  })

  test('"in 1 year"', () => {
    const result = parseNatural('in 1 year', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'year').valueOf())
    expect(result.get('year')).toBe(2027)
  })

  test('"in 6 months" from Jan 15 → July 15', () => {
    const result = parseNatural('in 6 months', REF)
    expectDate(result, 2026, 7, 15)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. "N units from now"
// ─────────────────────────────────────────────────────────────────────────────

describe('"N <unit> from now"', () => {
  test('"3 days from now" → Jan 18, 2026', () => {
    expectDate(parseNatural('3 days from now', REF), 2026, 1, 18)
  })

  test('"1 day from now" (singular)', () => {
    expectDate(parseNatural('1 day from now', REF), 2026, 1, 16)
  })

  test('"1 hour from now"', () => {
    const result = parseNatural('1 hour from now', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'hour').valueOf())
  })

  test('"2 hours from now"', () => {
    const result = parseNatural('2 hours from now', REF)
    expect(result.valueOf()).toBe(REF.add(2, 'hour').valueOf())
  })

  test('"1 week from now"', () => {
    const result = parseNatural('1 week from now', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'week').valueOf())
  })

  test('"3 weeks from now"', () => {
    const result = parseNatural('3 weeks from now', REF)
    expect(result.valueOf()).toBe(REF.add(3, 'week').valueOf())
  })

  test('"2 months from now"', () => {
    const result = parseNatural('2 months from now', REF)
    expect(result.valueOf()).toBe(REF.add(2, 'month').valueOf())
  })

  test('"1 year from now"', () => {
    const result = parseNatural('1 year from now', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'year').valueOf())
    expect(result.get('year')).toBe(2027)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. next/last weekday  (REF = Thursday Jan 15, 2026; day index = 4)
// ─────────────────────────────────────────────────────────────────────────────

describe('"next <weekday>"', () => {
  // next friday: (5-4+7)%7=1 → Jan 16
  test('"next friday" → Jan 16, 2026', () => {
    expectDate(parseNatural('next friday', REF), 2026, 1, 16)
  })

  // next saturday: (6-4+7)%7=2 → Jan 17
  test('"next saturday" → Jan 17, 2026', () => {
    expectDate(parseNatural('next saturday', REF), 2026, 1, 17)
  })

  // next sunday: (0-4+7)%7=3 → Jan 18
  test('"next sunday" → Jan 18, 2026', () => {
    expectDate(parseNatural('next sunday', REF), 2026, 1, 18)
  })

  // next monday: (1-4+7)%7=4 → Jan 19
  test('"next monday" → Jan 19, 2026', () => {
    expectDate(parseNatural('next monday', REF), 2026, 1, 19)
  })

  // next tuesday: (2-4+7)%7=5 → Jan 20
  test('"next tuesday" → Jan 20, 2026', () => {
    expectDate(parseNatural('next tuesday', REF), 2026, 1, 20)
  })

  // next wednesday: (3-4+7)%7=6 → Jan 21
  test('"next wednesday" → Jan 21, 2026', () => {
    expectDate(parseNatural('next wednesday', REF), 2026, 1, 21)
  })

  // next thursday: same weekday → diff=0 → 7 → Jan 22
  test('"next thursday" → Jan 22, 2026 (same weekday adds 7)', () => {
    expectDate(parseNatural('next thursday', REF), 2026, 1, 22)
  })

  test('"NEXT MONDAY" case-insensitive → Jan 19, 2026', () => {
    expectDate(parseNatural('NEXT MONDAY', REF), 2026, 1, 19)
  })
})

describe('"last <weekday>"', () => {
  // last thursday: same weekday → diff=0 → 7 → Jan 8
  test('"last thursday" → Jan 8, 2026 (same weekday subtracts 7)', () => {
    expectDate(parseNatural('last thursday', REF), 2026, 1, 8)
  })

  // last wednesday: (4-3+7)%7=1 → Jan 14
  test('"last wednesday" → Jan 14, 2026', () => {
    expectDate(parseNatural('last wednesday', REF), 2026, 1, 14)
  })

  // last tuesday: (4-2+7)%7=2 → Jan 13
  test('"last tuesday" → Jan 13, 2026', () => {
    expectDate(parseNatural('last tuesday', REF), 2026, 1, 13)
  })

  // last monday: (4-1+7)%7=3 → Jan 12
  test('"last monday" → Jan 12, 2026', () => {
    expectDate(parseNatural('last monday', REF), 2026, 1, 12)
  })

  // last sunday: (4-0+7)%7=4 → Jan 11
  test('"last sunday" → Jan 11, 2026', () => {
    expectDate(parseNatural('last sunday', REF), 2026, 1, 11)
  })

  // last saturday: (4-6+7)%7=5 → Jan 10
  test('"last saturday" → Jan 10, 2026', () => {
    expectDate(parseNatural('last saturday', REF), 2026, 1, 10)
  })

  // last friday: (4-5+7)%7=6 → Jan 9
  test('"last friday" → Jan 9, 2026', () => {
    expectDate(parseNatural('last friday', REF), 2026, 1, 9)
  })
})

describe('"next/last <weekday> at <time>"', () => {
  test('"next monday at 9am" → Jan 19, 2026 09:00', () => {
    expectDateTime(parseNatural('next monday at 9am', REF), 2026, 1, 19, 9, 0, 0)
  })

  test('"last friday at 5:30pm" → Jan 9, 2026 17:30', () => {
    expectDateTime(parseNatural('last friday at 5:30pm', REF), 2026, 1, 9, 17, 30, 0)
  })

  test('"next saturday at noon" → Jan 17, 2026 12:00', () => {
    expectDateTime(parseNatural('next saturday at noon', REF), 2026, 1, 17, 12, 0, 0)
  })

  test('"next wednesday at 15:30" → Jan 21, 2026 15:30', () => {
    expectDateTime(parseNatural('next wednesday at 15:30', REF), 2026, 1, 21, 15, 30, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. next/last period (week, month, year)
// ─────────────────────────────────────────────────────────────────────────────

describe('"next/last <period>"', () => {
  test('"next week" → ref + 1 week', () => {
    expect(parseNatural('next week', REF).valueOf()).toBe(REF.add(1, 'week').valueOf())
  })

  test('"next month" → ref + 1 month', () => {
    expect(parseNatural('next month', REF).valueOf()).toBe(REF.add(1, 'month').valueOf())
  })

  test('"next year" → Jan 2027', () => {
    const result = parseNatural('next year', REF)
    expect(result.valueOf()).toBe(REF.add(1, 'year').valueOf())
    expect(result.get('year')).toBe(2027)
  })

  test('"last week" → ref - 1 week', () => {
    expect(parseNatural('last week', REF).valueOf()).toBe(REF.subtract(1, 'week').valueOf())
  })

  test('"last month" → ref - 1 month → Dec 15, 2025', () => {
    const result = parseNatural('last month', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'month').valueOf())
    expect(result.get('year')).toBe(2025)
    expect(result.get('month')).toBe(12)
  })

  test('"last year" → Jan 2025', () => {
    const result = parseNatural('last year', REF)
    expect(result.valueOf()).toBe(REF.subtract(1, 'year').valueOf())
    expect(result.get('year')).toBe(2025)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. "first/last day of <month> [year]"
// ─────────────────────────────────────────────────────────────────────────────

describe('"first day of <month> [year]"', () => {
  test('"first day of january" → Jan 1, 2026 (ref year)', () => {
    expectDate(parseNatural('first day of january', REF), 2026, 1, 1)
  })

  test('"first day of january 2025" → Jan 1, 2025', () => {
    expectDate(parseNatural('first day of january 2025', REF), 2025, 1, 1)
  })

  test('"first day of march 2027" → Mar 1, 2027', () => {
    expectDate(parseNatural('first day of march 2027', REF), 2027, 3, 1)
  })

  test('"first day of april" → Apr 1, 2026', () => {
    expectDate(parseNatural('first day of april', REF), 2026, 4, 1)
  })

  test('"first day of december 2026" → Dec 1, 2026', () => {
    expectDate(parseNatural('first day of december 2026', REF), 2026, 12, 1)
  })

  test('"first day of february 2024" → Feb 1, 2024', () => {
    expectDate(parseNatural('first day of february 2024', REF), 2024, 2, 1)
  })
})

describe('"last day of <month> [year]"', () => {
  test('"last day of january" → Jan 31, 2026', () => {
    expectDate(parseNatural('last day of january', REF), 2026, 1, 31)
  })

  test('"last day of february 2024" → Feb 29, 2024 (leap year)', () => {
    expectDate(parseNatural('last day of february 2024', REF), 2024, 2, 29)
  })

  test('"last day of february 2025" → Feb 28, 2025 (non-leap)', () => {
    expectDate(parseNatural('last day of february 2025', REF), 2025, 2, 28)
  })

  test('"last day of april" → Apr 30, 2026', () => {
    expectDate(parseNatural('last day of april', REF), 2026, 4, 30)
  })

  test('"last day of june 2026" → Jun 30, 2026', () => {
    expectDate(parseNatural('last day of june 2026', REF), 2026, 6, 30)
  })

  test('"last day of december" → Dec 31, 2026', () => {
    expectDate(parseNatural('last day of december', REF), 2026, 12, 31)
  })

  test('"last day of march" → Mar 31, 2026', () => {
    expectDate(parseNatural('last day of march', REF), 2026, 3, 31)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 14. "Nth weekday of month [year]"
// ─────────────────────────────────────────────────────────────────────────────
// January 2026: Jan 1 = Thursday (day=4)
//   First Monday: offset=(1-4+7)%7=4 → Jan 5
//   First Friday: offset=(5-4+7)%7=1 → Jan 2
//   First Sunday: offset=(0-4+7)%7=3 → Jan 4
// February 2026: Feb 1 = Sunday (day=0)
//   First Wednesday: offset=(3-0+7)%7=3 → Feb 4  → 2nd=Feb 11
// March 2026: Mar 1 = Sunday (day=0)
//   First Tuesday: offset=(2-0+7)%7=2 → Mar 3  → 2nd=Mar 10

describe('"Nth <weekday> of <month> [year]"', () => {
  test('"1st monday of january 2026" → Jan 5, 2026', () => {
    expectDate(parseNatural('1st monday of january 2026', REF), 2026, 1, 5)
  })

  test('"2nd monday of january 2026" → Jan 12, 2026', () => {
    expectDate(parseNatural('2nd monday of january 2026', REF), 2026, 1, 12)
  })

  test('"3rd monday of january 2026" → Jan 19, 2026', () => {
    expectDate(parseNatural('3rd monday of january 2026', REF), 2026, 1, 19)
  })

  test('"4th monday of january 2026" → Jan 26, 2026', () => {
    expectDate(parseNatural('4th monday of january 2026', REF), 2026, 1, 26)
  })

  test('"1st friday of january 2026" → Jan 2, 2026', () => {
    expectDate(parseNatural('1st friday of january 2026', REF), 2026, 1, 2)
  })

  test('"3rd friday of january 2026" → Jan 16, 2026', () => {
    expectDate(parseNatural('3rd friday of january 2026', REF), 2026, 1, 16)
  })

  test('"5th friday of january 2026" → Jan 30, 2026 (valid — 5th Fri exists)', () => {
    expectDate(parseNatural('5th friday of january 2026', REF), 2026, 1, 30)
  })

  test('"6th friday of january 2026" → invalid (overflows month)', () => {
    expect(parseNatural('6th friday of january 2026', REF).isValid()).toBe(false)
  })

  test('"1st sunday of january 2026" → Jan 4, 2026', () => {
    // Sun=0: offset=(0-4+7)%7=3 → Jan 1+3=Jan 4
    expectDate(parseNatural('1st sunday of january 2026', REF), 2026, 1, 4)
  })

  test('"2nd wednesday of february 2026" → Feb 11, 2026', () => {
    // Feb 1=Sun(0): first Wed offset=(3-0+7)%7=3 → Feb 4 → 2nd=Feb 11
    expectDate(parseNatural('2nd wednesday of february 2026', REF), 2026, 2, 11)
  })

  test('"3rd tuesday of march 2026" → Mar 17, 2026', () => {
    // Mar 1=Sun(0): first Tue offset=(2-0+7)%7=2 → Mar 3 → 2nd=Mar 10 → 3rd=Mar 17
    expectDate(parseNatural('3rd tuesday of march 2026', REF), 2026, 3, 17)
  })

  test('"2nd tuesday of march 2026" → Mar 10, 2026', () => {
    expectDate(parseNatural('2nd tuesday of march 2026', REF), 2026, 3, 10)
  })

  test('"1st monday of january" → Jan 5, 2026 (no year → uses ref year)', () => {
    expectDate(parseNatural('1st monday of january', REF), 2026, 1, 5)
  })

  test('"1st monday of january 2025" → Jan 6, 2025', () => {
    // Jan 1 2025 = Wednesday (day=3): first Mon offset=(1-3+7)%7=5 → Jan 6
    expectDate(parseNatural('1st monday of january 2025', REF), 2025, 1, 6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 15. Invalid inputs
// ─────────────────────────────────────────────────────────────────────────────

describe('invalid inputs', () => {
  test('"invalid input" → isValid() false', () => {
    expect(parseNatural('invalid input', REF).isValid()).toBe(false)
  })

  test('empty string → isValid() false', () => {
    expect(parseNatural('', REF).isValid()).toBe(false)
  })

  test('"purple elephant" → isValid() false', () => {
    expect(parseNatural('purple elephant', REF).isValid()).toBe(false)
  })

  test('"next blahday" → isValid() false', () => {
    expect(parseNatural('next blahday', REF).isValid()).toBe(false)
  })

  test('"foo bar baz" → isValid() false', () => {
    expect(parseNatural('foo bar baz', REF).isValid()).toBe(false)
  })

  test('"123 zorps ago" → isValid() false (unknown unit)', () => {
    expect(parseNatural('123 zorps ago', REF).isValid()).toBe(false)
  })

  test('"last day of notamonth" → isValid() false', () => {
    expect(parseNatural('last day of notamonth', REF).isValid()).toBe(false)
  })

  test('does not throw on invalid input — returns DateFormat(NaN)', () => {
    expect(() => parseNatural('totally wrong', REF)).not.toThrow()
    expect(parseNatural('totally wrong', REF).isValid()).toBe(false)
  })

  test('whitespace-only input → isValid() false', () => {
    expect(parseNatural('   ', REF).isValid()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 16. Custom ref parameter
// ─────────────────────────────────────────────────────────────────────────────

describe('custom ref parameter', () => {
  test('"tomorrow" from Mar 1 2026 → Mar 2, 2026', () => {
    const ref = new DateFormat(new Date(2026, 2, 1, 10, 0, 0))
    expectDate(parseNatural('tomorrow', ref), 2026, 3, 2)
  })

  test('"in 7 days" from Dec 25 2026 → Jan 1, 2027 (cross-year)', () => {
    const ref = new DateFormat(new Date(2026, 11, 25, 0, 0, 0))
    const result = parseNatural('in 7 days', ref)
    expectDate(result, 2027, 1, 1)
  })

  test('"yesterday" from Jan 1 2026 → Dec 31, 2025 (cross-year)', () => {
    const ref = new DateFormat(new Date(2026, 0, 1, 0, 0, 0))
    expectDate(parseNatural('yesterday', ref), 2025, 12, 31)
  })

  test('"next month" from Jan 2026 → Feb 2026', () => {
    const ref = new DateFormat(new Date(2026, 0, 31, 0, 0, 0))
    const result = parseNatural('next month', ref)
    expect(result.get('month')).toBe(2)
  })

  test('"last day of february 2024" ignores ref entirely', () => {
    const ref = new DateFormat(new Date(2023, 5, 10, 0, 0, 0))
    expectDate(parseNatural('last day of february 2024', ref), 2024, 2, 29)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 17. Real-life scenario: reminder app
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: reminder app', () => {
  test('"in 3 days" schedules Jan 18', () => {
    expectDate(parseNatural('in 3 days', REF), 2026, 1, 18)
  })

  test('"next monday at 9am" schedules Jan 19 at 09:00', () => {
    expectDateTime(parseNatural('next monday at 9am', REF), 2026, 1, 19, 9, 0, 0)
  })

  test('"tomorrow at noon" schedules Jan 16 at 12:00', () => {
    expectDateTime(parseNatural('tomorrow at noon', REF), 2026, 1, 16, 12, 0, 0)
  })

  test('"end of day" sets deadline to tonight 23:59:59', () => {
    const result = parseNatural('end of day', REF)
    expect(result.get('hour')).toBe(23)
    expect(result.get('minute')).toBe(59)
    expect(result.get('second')).toBe(59)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 18. Real-life scenario: natural date input in forms
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: natural date input in forms', () => {
  test('"beginning of month" → Jan 1, 2026', () => {
    expectDate(parseNatural('beginning of month', REF), 2026, 1, 1)
  })

  test('"end of this year" is not a valid pattern → isValid() false', () => {
    // "end of this year" doesn't match either pattern
    expect(parseNatural('end of this year', REF).isValid()).toBe(false)
  })

  test('"this year" → startOf(year)', () => {
    expect(parseNatural('this year', REF).valueOf()).toBe(REF.startOf('year').valueOf())
  })

  test('"this month" → Jan 1, 2026', () => {
    expectDate(parseNatural('this month', REF), 2026, 1, 1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 19. Real-life scenario: scheduling assistant
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: scheduling assistant', () => {
  test('"3rd tuesday of march 2026" → Mar 17, 2026', () => {
    expectDate(parseNatural('3rd tuesday of march 2026', REF), 2026, 3, 17)
  })

  test('"last day of february 2024" → Feb 29, 2024 (leap year)', () => {
    expectDate(parseNatural('last day of february 2024', REF), 2024, 2, 29)
  })

  test('"1st monday of january 2026" → Jan 5, 2026', () => {
    expectDate(parseNatural('1st monday of january 2026', REF), 2026, 1, 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 20. Real-life scenario: relative time navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: relative time navigation', () => {
  test('"2 weeks ago"', () => {
    const result = parseNatural('2 weeks ago', REF)
    expect(result.valueOf()).toBe(REF.subtract(2, 'week').valueOf())
  })

  test('"in 6 months" → July 15, 2026', () => {
    expectDate(parseNatural('in 6 months', REF), 2026, 7, 15)
  })

  test('"yesterday at 5pm" → Jan 14 17:00', () => {
    expectDateTime(parseNatural('yesterday at 5pm', REF), 2026, 1, 14, 17, 0, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 21. Real-life scenario: cross-year calculations
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: cross-year calculations', () => {
  test('"in 3 months" from Jan 15 → April 15, 2026', () => {
    expectDate(parseNatural('in 3 months', REF), 2026, 4, 15)
  })

  test('"next year" → Jan 15, 2027', () => {
    const result = parseNatural('next year', REF)
    expect(result.get('year')).toBe(2027)
    expect(result.get('month')).toBe(1)
    expect(result.get('date')).toBe(15)
  })

  test('"in 7 days" from Dec 25 → Jan 1 2027', () => {
    const dec25 = new DateFormat(new Date(2026, 11, 25, 0, 0, 0))
    expectDate(parseNatural('in 7 days', dec25), 2027, 1, 1)
  })

  test('"last year" → Jan 15, 2025', () => {
    const result = parseNatural('last year', REF)
    expect(result.get('year')).toBe(2025)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 22. Real-life scenario: period boundaries
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: period boundaries', () => {
  test('"beginning of week" → Sunday Jan 11, 2026 (week starts Sunday)', () => {
    // startOf('week') uses d.subtract(d.get('day'), 'day').startOf('day')
    // REF: Thursday (day=4) → subtract 4 days → Jan 11 (Sunday)
    const result = parseNatural('beginning of week', REF)
    expectDate(result, 2026, 1, 11)
    expect(result.get('day')).toBe(0) // Sunday
  })

  test('"end of month" is last millisecond of Jan 31', () => {
    const result = parseNatural('end of month', REF)
    expect(result.get('date')).toBe(31)
    expect(result.get('hour')).toBe(23)
    expect(result.get('minute')).toBe(59)
    expect(result.get('second')).toBe(59)
  })

  test('"beginning of year" is first millisecond of Jan 1', () => {
    const result = parseNatural('beginning of year', REF)
    expectDate(result, 2026, 1, 1)
    expect(result.get('hour')).toBe(0)
    expect(result.get('minute')).toBe(0)
    expect(result.get('second')).toBe(0)
  })
})
