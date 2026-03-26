import { describe, test, expect } from '@jest/globals'
import parseNatural from '../src/ecosystem/NaturalLanguage'
import DateFormat from '../src/core/DateFormat'

// Thursday, January 15, 2026 at 12:00:00 local time
// We use local Date constructor to match the source implementation
const REF = new DateFormat(new Date(2026, 0, 15, 12, 0, 0))

/** Helper: assert wall-clock date components */
function expectDate(df: DateFormat, year: number, month: number, day: number) {
  expect(df.isValid()).toBe(true)
  expect(df.get('year')).toBe(year)
  expect(df.get('month')).toBe(month)
  expect(df.get('date')).toBe(day)
}

describe('parseNatural', () => {
  // ── Exact matches ────────────────────────────────────────────────────────────

  describe('exact matches', () => {
    test('"now" → same as ref', () => {
      expect(parseNatural('now', REF).valueOf()).toBe(REF.valueOf())
    })

    test('"today" → same as ref', () => {
      expect(parseNatural('today', REF).valueOf()).toBe(REF.valueOf())
    })

    test('"tomorrow" → ref + 1 day', () => {
      const result = parseNatural('tomorrow', REF)
      expectDate(result, 2026, 1, 16)
    })

    test('"yesterday" → ref - 1 day', () => {
      const result = parseNatural('yesterday', REF)
      expectDate(result, 2026, 1, 14)
    })

    test('case-insensitive: "NOW"', () => {
      expect(parseNatural('NOW', REF).valueOf()).toBe(REF.valueOf())
    })

    test('case-insensitive: "Today"', () => {
      expect(parseNatural('Today', REF).valueOf()).toBe(REF.valueOf())
    })

    test('case-insensitive: "TOMORROW"', () => {
      expectDate(parseNatural('TOMORROW', REF), 2026, 1, 16)
    })
  })

  // ── beginning of / end of ────────────────────────────────────────────────────

  describe('beginning of / end of', () => {
    test('"beginning of day"', () => {
      const result = parseNatural('beginning of day', REF)
      expect(result.valueOf()).toBe(REF.startOf('day').valueOf())
    })

    test('"beginning of week"', () => {
      const result = parseNatural('beginning of week', REF)
      expect(result.valueOf()).toBe(REF.startOf('week').valueOf())
    })

    test('"beginning of month"', () => {
      const result = parseNatural('beginning of month', REF)
      expect(result.valueOf()).toBe(REF.startOf('month').valueOf())
    })

    test('"beginning of year"', () => {
      const result = parseNatural('beginning of year', REF)
      expect(result.valueOf()).toBe(REF.startOf('year').valueOf())
    })

    test('"end of day"', () => {
      const result = parseNatural('end of day', REF)
      expect(result.valueOf()).toBe(REF.endOf('day').valueOf())
    })

    test('"end of week"', () => {
      const result = parseNatural('end of week', REF)
      expect(result.valueOf()).toBe(REF.endOf('week').valueOf())
    })

    test('"end of month"', () => {
      const result = parseNatural('end of month', REF)
      expect(result.valueOf()).toBe(REF.endOf('month').valueOf())
    })

    test('"end of year"', () => {
      const result = parseNatural('end of year', REF)
      expect(result.valueOf()).toBe(REF.endOf('year').valueOf())
    })
  })

  // ── next/last weekday ────────────────────────────────────────────────────────

  describe('next/last weekday', () => {
    // REF is Thursday Jan 15, 2026 (day=4)

    test('"next monday" → Jan 19', () => {
      // Mon=1, Thu=4, diff=(1-4+7)%7=4 → Jan15+4=Jan19
      expectDate(parseNatural('next monday', REF), 2026, 1, 19)
    })

    test('"next thursday" → Jan 22 (same weekday → +7)', () => {
      // diff=(4-4+7)%7=0 → 0 becomes 7 → Jan15+7=Jan22
      expectDate(parseNatural('next thursday', REF), 2026, 1, 22)
    })

    test('"next sunday" → Jan 18', () => {
      // Sun=0, diff=(0-4+7)%7=3 → Jan15+3=Jan18
      expectDate(parseNatural('next sunday', REF), 2026, 1, 18)
    })

    test('"next saturday" → Jan 17', () => {
      // Sat=6, diff=(6-4+7)%7=2 → Jan15+2=Jan17
      expectDate(parseNatural('next saturday', REF), 2026, 1, 17)
    })

    test('"next tuesday" → Jan 20', () => {
      // Tue=2, diff=(2-4+7)%7=5 → Jan15+5=Jan20
      expectDate(parseNatural('next tuesday', REF), 2026, 1, 20)
    })

    test('"next wednesday" → Jan 21', () => {
      // Wed=3, diff=(3-4+7)%7=6 → Jan15+6=Jan21
      expectDate(parseNatural('next wednesday', REF), 2026, 1, 21)
    })

    test('"next friday" → Jan 16', () => {
      // Fri=5, diff=(5-4+7)%7=1 → Jan15+1=Jan16
      expectDate(parseNatural('next friday', REF), 2026, 1, 16)
    })

    test('"last monday" → Jan 12', () => {
      // Mon=1, diff=(4-1+7)%7=3 → Jan15-3=Jan12
      expectDate(parseNatural('last monday', REF), 2026, 1, 12)
    })

    test('"last sunday" → Jan 11', () => {
      // Sun=0, diff=(4-0+7)%7=4 → Jan15-4=Jan11
      expectDate(parseNatural('last sunday', REF), 2026, 1, 11)
    })

    test('"last thursday" → Jan 8 (same weekday → -7)', () => {
      // diff=(4-4+7)%7=0 → 0 becomes 7 → Jan15-7=Jan8
      expectDate(parseNatural('last thursday', REF), 2026, 1, 8)
    })
  })

  // ── next/last period ─────────────────────────────────────────────────────────

  describe('next/last period', () => {
    test('"next week" → ref + 1 week', () => {
      expect(parseNatural('next week', REF).valueOf()).toBe(REF.add(1, 'week').valueOf())
    })

    test('"next month" → ref + 1 month', () => {
      expect(parseNatural('next month', REF).valueOf()).toBe(REF.add(1, 'month').valueOf())
    })

    test('"next year" → ref + 1 year', () => {
      expect(parseNatural('next year', REF).valueOf()).toBe(REF.add(1, 'year').valueOf())
    })

    test('"last week" → ref - 1 week', () => {
      expect(parseNatural('last week', REF).valueOf()).toBe(REF.subtract(1, 'week').valueOf())
    })

    test('"last month" → ref - 1 month', () => {
      expect(parseNatural('last month', REF).valueOf()).toBe(REF.subtract(1, 'month').valueOf())
    })

    test('"last year" → ref - 1 year', () => {
      expect(parseNatural('last year', REF).valueOf()).toBe(REF.subtract(1, 'year').valueOf())
    })
  })

  // ── N units ago ──────────────────────────────────────────────────────────────

  describe('N units ago', () => {
    test('"3 days ago"', () => {
      expectDate(parseNatural('3 days ago', REF), 2026, 1, 12)
    })

    test('"2 weeks ago"', () => {
      expect(parseNatural('2 weeks ago', REF).valueOf()).toBe(REF.subtract(2, 'week').valueOf())
    })

    test('"1 month ago"', () => {
      expect(parseNatural('1 month ago', REF).valueOf()).toBe(REF.subtract(1, 'month').valueOf())
    })

    test('"5 years ago"', () => {
      expect(parseNatural('5 years ago', REF).valueOf()).toBe(REF.subtract(5, 'year').valueOf())
    })

    test('"1 day ago" (singular)', () => {
      expectDate(parseNatural('1 day ago', REF), 2026, 1, 14)
    })

    test('"2 months ago" (plural)', () => {
      expect(parseNatural('2 months ago', REF).valueOf()).toBe(REF.subtract(2, 'month').valueOf())
    })
  })

  // ── in N units ───────────────────────────────────────────────────────────────

  describe('in N units', () => {
    test('"in 3 days"', () => {
      expectDate(parseNatural('in 3 days', REF), 2026, 1, 18)
    })

    test('"in 1 week"', () => {
      expect(parseNatural('in 1 week', REF).valueOf()).toBe(REF.add(1, 'week').valueOf())
    })

    test('"in 2 months"', () => {
      expect(parseNatural('in 2 months', REF).valueOf()).toBe(REF.add(2, 'month').valueOf())
    })

    test('"in 1 year"', () => {
      expect(parseNatural('in 1 year', REF).valueOf()).toBe(REF.add(1, 'year').valueOf())
    })
  })

  // ── N units from now ─────────────────────────────────────────────────────────

  describe('N units from now', () => {
    test('"3 days from now"', () => {
      expectDate(parseNatural('3 days from now', REF), 2026, 1, 18)
    })

    test('"1 week from now"', () => {
      expect(parseNatural('1 week from now', REF).valueOf()).toBe(REF.add(1, 'week').valueOf())
    })

    test('"2 months from now"', () => {
      expect(parseNatural('2 months from now', REF).valueOf()).toBe(REF.add(2, 'month').valueOf())
    })
  })

  // ── first/last day of month ──────────────────────────────────────────────────

  describe('first/last day of month', () => {
    test('"first day of january" → Jan 1 of ref year (2026)', () => {
      expectDate(parseNatural('first day of january', REF), 2026, 1, 1)
    })

    test('"first day of march 2027" → Mar 1, 2027', () => {
      expectDate(parseNatural('first day of march 2027', REF), 2027, 3, 1)
    })

    test('"last day of january" → Jan 31', () => {
      expectDate(parseNatural('last day of january', REF), 2026, 1, 31)
    })

    test('"last day of february 2024" → Feb 29 (leap year)', () => {
      expectDate(parseNatural('last day of february 2024', REF), 2024, 2, 29)
    })

    test('"last day of february 2025" → Feb 28 (non-leap)', () => {
      expectDate(parseNatural('last day of february 2025', REF), 2025, 2, 28)
    })

    test('"last day of december" → Dec 31 of ref year', () => {
      expectDate(parseNatural('last day of december', REF), 2026, 12, 31)
    })

    test('"first day of april 2026" → Apr 1, 2026', () => {
      expectDate(parseNatural('first day of april 2026', REF), 2026, 4, 1)
    })
  })

  // ── Nth weekday of month ─────────────────────────────────────────────────────

  describe('Nth weekday of month', () => {
    // Jan 2026: Jan 1 = Thursday (day 4)
    // First Monday: (1-4+7)%7=4 days from Jan1 → Jan 5
    test('"1st monday of january" → Jan 5, 2026', () => {
      expectDate(parseNatural('1st monday of january', REF), 2026, 1, 5)
    })

    // Second Monday: Jan 5 + 7 = Jan 12
    test('"2nd monday of january" → Jan 12, 2026', () => {
      expectDate(parseNatural('2nd monday of january', REF), 2026, 1, 12)
    })

    // Third Monday: Jan 5 + 14 = Jan 19
    test('"3rd monday of january 2026" → Jan 19, 2026', () => {
      expectDate(parseNatural('3rd monday of january 2026', REF), 2026, 1, 19)
    })

    // March 2026: Mar 1 = Sunday (day 0)
    // First Tuesday: (2-0+7)%7=2 days from Mar1 → Mar 3
    // Second Tuesday: Mar 3 + 7 = Mar 10
    test('"2nd tuesday of march 2026" → Mar 10, 2026', () => {
      expectDate(parseNatural('2nd tuesday of march 2026', REF), 2026, 3, 10)
    })

    // January 2026: First Friday: (5-4+7)%7=1 → Jan1+1=Jan2; Second → Jan9; Third → Jan16
    test('"3rd friday of january 2026" → Jan 16, 2026', () => {
      expectDate(parseNatural('3rd friday of january 2026', REF), 2026, 1, 16)
    })

    test('"1st sunday of january 2026" → Jan 4, 2026', () => {
      // Sun=0, first: (0-4+7)%7=3 → Jan1+3=Jan4
      expectDate(parseNatural('1st sunday of january 2026', REF), 2026, 1, 4)
    })

    test('"5th friday of january 2026" → invalid (goes past month end)', () => {
      // 5th friday: Jan2+28=Jan30 → still Jan, but 5th is Jan 30
      // Jan 2, 9, 16, 23, 30 → 5th Friday is Jan 30 (still in Jan)
      // Actually: first Fri Jan 2, so 5th = Jan 2 + 28 = Jan 30 → valid in Jan
      // Let's check 6th friday: Jan 30 + 7 = Feb 6 → invalid
      const result = parseNatural('5th friday of january 2026', REF)
      expectDate(result, 2026, 1, 30)
    })

    test('"6th friday of january 2026" → invalid (goes past month end)', () => {
      const result = parseNatural('6th friday of january 2026', REF)
      expect(result.isValid()).toBe(false)
    })

    test('"2nd wednesday of february 2026" → Feb 11', () => {
      // Feb 2026: Feb 1 = Sunday (day 0)
      // First Wednesday: (3-0+7)%7=3 → Feb1+3=Feb4
      // Second: Feb4+7=Feb11
      expectDate(parseNatural('2nd wednesday of february 2026', REF), 2026, 2, 11)
    })
  })

  // ── Invalid input ────────────────────────────────────────────────────────────

  describe('invalid input', () => {
    test('"some gibberish" → isValid() false', () => {
      expect(parseNatural('some gibberish', REF).isValid()).toBe(false)
    })

    test('"next blahday" → isValid() false', () => {
      expect(parseNatural('next blahday', REF).isValid()).toBe(false)
    })

    test('empty string → isValid() false', () => {
      expect(parseNatural('', REF).isValid()).toBe(false)
    })

    test('"foo bar baz" → isValid() false', () => {
      expect(parseNatural('foo bar baz', REF).isValid()).toBe(false)
    })
  })

  // ── Without ref (uses Date.now) ───────────────────────────────────────────────

  describe('without ref argument', () => {
    test('"today" without ref → isValid()', () => {
      expect(parseNatural('today').isValid()).toBe(true)
    })

    test('"now" without ref → isValid()', () => {
      expect(parseNatural('now').isValid()).toBe(true)
    })

    test('"tomorrow" without ref → isValid()', () => {
      expect(parseNatural('tomorrow').isValid()).toBe(true)
    })
  })
})
