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

/** Create a DateFormat from a YYYY-MM-DD string (parsed in UTC). */
const d = (s: string) => new DateFormat(s)

// ---------------------------------------------------------------------------
// Calendar reference for January 2026
// Mon Jan 12, Tue Jan 13, Wed Jan 14, Thu Jan 15, Fri Jan 16, Sat Jan 17, Sun Jan 18
// Mon Jan 19, Tue Jan 20, Wed Jan 21, Thu Jan 22, Fri Jan 23
// Mon Jan 26, Thu Jan 29, Fri Jan 30
// ---------------------------------------------------------------------------

// ===========================================================================
// isBusinessDay
// ===========================================================================

describe('isBusinessDay – weekday detection', () => {
  test('Monday Jan 12 2026 → true', () => {
    expect(isBusinessDay(d('2026-01-12'))).toBe(true)
  })

  test('Tuesday Jan 13 2026 → true', () => {
    expect(isBusinessDay(d('2026-01-13'))).toBe(true)
  })

  test('Wednesday Jan 14 2026 → true', () => {
    expect(isBusinessDay(d('2026-01-14'))).toBe(true)
  })

  test('Thursday Jan 15 2026 → true', () => {
    expect(isBusinessDay(d('2026-01-15'))).toBe(true)
  })

  test('Friday Jan 16 2026 → true', () => {
    expect(isBusinessDay(d('2026-01-16'))).toBe(true)
  })

  test('Saturday Jan 17 2026 → false', () => {
    expect(isBusinessDay(d('2026-01-17'))).toBe(false)
  })

  test('Sunday Jan 18 2026 → false', () => {
    expect(isBusinessDay(d('2026-01-18'))).toBe(false)
  })

  test('another Saturday (Jan 24 2026) → false', () => {
    expect(isBusinessDay(d('2026-01-24'))).toBe(false)
  })

  test('another Sunday (Jan 25 2026) → false', () => {
    expect(isBusinessDay(d('2026-01-25'))).toBe(false)
  })
})

describe('isBusinessDay – holiday handling', () => {
  test('weekday that matches a holiday string → false', () => {
    // Jan 1 2026 is Thursday – a business day by day-of-week
    expect(isBusinessDay(d('2026-01-01'), ['2026-01-01'])).toBe(false)
  })

  test('weekday NOT in holiday list → true', () => {
    expect(isBusinessDay(d('2026-01-15'), ['2026-01-01'])).toBe(true)
  })

  test('weekday with empty holiday list → true', () => {
    expect(isBusinessDay(d('2026-01-15'), [])).toBe(true)
  })

  test('weekend with holidays does not change result (still false)', () => {
    expect(isBusinessDay(d('2026-01-17'), ['2026-01-17'])).toBe(false)
  })

  test('holidays = undefined → no holiday check performed', () => {
    // Jan 1 is Thursday; without a holidays array it is a business day
    expect(isBusinessDay(d('2026-01-01'), undefined)).toBe(true)
  })

  test('US New Year Jan 1 2026 with US holiday list → false', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(isBusinessDay(d('2026-01-01'), usHolidays)).toBe(false)
  })

  test('regular weekday with US holiday list → true', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(isBusinessDay(d('2026-01-15'), usHolidays)).toBe(true)
  })

  test('MLK Day Jan 19 2026 (Monday) with US holiday list → false', () => {
    const usHolidays = getHolidays('US', 2026)
    // Jan 19 is Monday (normally a business day) but is MLK Day
    expect(isBusinessDay(d('2026-01-19'), usHolidays)).toBe(false)
  })

  test('multiple holidays in list – all correctly excluded', () => {
    const holidays = ['2026-01-14', '2026-01-15', '2026-01-16']
    expect(isBusinessDay(d('2026-01-14'), holidays)).toBe(false)
    expect(isBusinessDay(d('2026-01-15'), holidays)).toBe(false)
    expect(isBusinessDay(d('2026-01-16'), holidays)).toBe(false)
    // day before/after the range still passes
    expect(isBusinessDay(d('2026-01-13'), holidays)).toBe(true)
    expect(isBusinessDay(d('2026-01-20'), holidays)).toBe(true)
  })
})

// ===========================================================================
// addBusinessDays
// ===========================================================================

describe('addBusinessDays – zero and identity', () => {
  test('n=0 returns the same DateFormat object', () => {
    const date = d('2026-01-15')
    expect(addBusinessDays(date, 0)).toBe(date)
  })

  test('n=0 from a Friday still returns same date', () => {
    const date = d('2026-01-16')
    expect(addBusinessDays(date, 0).format('YYYY-MM-DD')).toBe('2026-01-16')
  })
})

describe('addBusinessDays – positive values (forward)', () => {
  test('Thu Jan 15 + 1 = Fri Jan 16', () => {
    expect(addBusinessDays(d('2026-01-15'), 1).format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('Fri Jan 16 + 1 = Mon Jan 19 (skips weekend)', () => {
    expect(addBusinessDays(d('2026-01-16'), 1).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('Thu Jan 15 + 3 = Tue Jan 20 (skips weekend)', () => {
    // +1 Fri, +2 Mon, +3 Tue → Jan 20
    expect(addBusinessDays(d('2026-01-15'), 3).format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('Mon Jan 12 + 1 = Tue Jan 13', () => {
    expect(addBusinessDays(d('2026-01-12'), 1).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('Mon Jan 12 + 5 = Mon Jan 19 (one full work week)', () => {
    expect(addBusinessDays(d('2026-01-12'), 5).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('Fri Jan 16 + 3 = Wed Jan 21 (delivery estimate scenario)', () => {
    // +1 Mon, +2 Tue, +3 Wed → Jan 21
    expect(addBusinessDays(d('2026-01-16'), 3).format('YYYY-MM-DD')).toBe('2026-01-21')
  })

  test('Mon Jan 12 + 2 = Wed Jan 14 (within same week)', () => {
    expect(addBusinessDays(d('2026-01-12'), 2).format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('Thu Jan 15 + 30 = Thu Feb 26 (net-30 invoice due date)', () => {
    expect(addBusinessDays(d('2026-01-15'), 30).format('YYYY-MM-DD')).toBe('2026-02-26')
  })

  test('Mon Jan 12 + 20 = Mon Feb 9 (4 business weeks)', () => {
    expect(addBusinessDays(d('2026-01-12'), 20).format('YYYY-MM-DD')).toBe('2026-02-09')
  })
})

describe('addBusinessDays – negative values (backward)', () => {
  test('Thu Jan 15 - 1 = Wed Jan 14', () => {
    expect(addBusinessDays(d('2026-01-15'), -1).format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('Mon Jan 12 - 1 = Fri Jan 9 (skips weekend backward)', () => {
    expect(addBusinessDays(d('2026-01-12'), -1).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('Mon Jan 12 - 5 = Mon Jan 5 (one full work week back)', () => {
    expect(addBusinessDays(d('2026-01-12'), -5).format('YYYY-MM-DD')).toBe('2026-01-05')
  })

  test('Fri Jan 16 - 2 = Wed Jan 14', () => {
    expect(addBusinessDays(d('2026-01-16'), -2).format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('Thu Jan 30 - 5 = Thu Jan 23 (past due date → start date)', () => {
    expect(addBusinessDays(d('2026-01-30'), -5).format('YYYY-MM-DD')).toBe('2026-01-23')
  })
})

describe('addBusinessDays – holiday-aware', () => {
  test('Fri Jan 16 + 1, with MLK Jan 19 holiday → Tue Jan 20', () => {
    expect(addBusinessDays(d('2026-01-16'), 1, ['2026-01-19']).format('YYYY-MM-DD')).toBe(
      '2026-01-20'
    )
  })

  test('Fri Jan 16 + 5, with Mon/Tue/Wed Jan 19-21 holidays → Wed Jan 28', () => {
    const holidays = ['2026-01-19', '2026-01-20', '2026-01-21']
    expect(addBusinessDays(d('2026-01-16'), 5, holidays).format('YYYY-MM-DD')).toBe('2026-01-28')
  })

  test('US holiday-aware: Fri Jan 16 + 1 skips MLK Day → Tue Jan 20', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(addBusinessDays(d('2026-01-16'), 1, usHolidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('Net-30 with US holidays (skips MLK + Presidents Day) → Mon Mar 2', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(addBusinessDays(d('2026-01-15'), 30, usHolidays).format('YYYY-MM-DD')).toBe('2026-03-02')
  })

  test('Legal filing Dec 30 2025 + 10, skipping US New Year Jan 1 → Wed Jan 14 2026', () => {
    expect(addBusinessDays(d('2025-12-30'), 10, ['2026-01-01']).format('YYYY-MM-DD')).toBe(
      '2026-01-14'
    )
  })

  test('Juneteenth (Fri Jun 19) holiday: Thu Jun 18 + 1 → Mon Jun 22', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(addBusinessDays(d('2026-06-18'), 1, usHolidays).format('YYYY-MM-DD')).toBe('2026-06-22')
  })
})

// ===========================================================================
// subtractBusinessDays
// ===========================================================================

describe('subtractBusinessDays', () => {
  test('is an alias for addBusinessDays(date, -n)', () => {
    const date = d('2026-01-15')
    expect(subtractBusinessDays(date, 3).format('YYYY-MM-DD')).toBe(
      addBusinessDays(date, -3).format('YYYY-MM-DD')
    )
  })

  test('Wed Jan 14 - 1 = Tue Jan 13', () => {
    expect(subtractBusinessDays(d('2026-01-14'), 1).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('Mon Jan 12 - 1 = Fri Jan 9 (crosses weekend)', () => {
    expect(subtractBusinessDays(d('2026-01-12'), 1).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('Wed Jan 14 - 3 = Fri Jan 9', () => {
    expect(subtractBusinessDays(d('2026-01-14'), 3).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('Fri Jan 30 - 1 = Thu Jan 29 (payroll: day before last BD of month)', () => {
    expect(subtractBusinessDays(d('2026-01-30'), 1).format('YYYY-MM-DD')).toBe('2026-01-29')
  })

  test('subtractBusinessDays n=0 returns same date', () => {
    const date = d('2026-01-15')
    expect(subtractBusinessDays(date, 0)).toBe(date)
  })

  test('with holidays: Mon Jan 19 - 1 (with Jan 19 holiday) = Fri Jan 16', () => {
    // prevBusinessDay from Jan 19; holiday check doesn't affect going backward from Jan 19 itself
    // subtractBusinessDays(Jan21, 1) with Jan20 holiday → Jan 16
    expect(subtractBusinessDays(d('2026-01-21'), 1, ['2026-01-20']).format('YYYY-MM-DD')).toBe(
      '2026-01-16'
    )
  })

  test('subtractBusinessDays(Feb1, 1) = last BD of Jan = Fri Jan 30', () => {
    expect(subtractBusinessDays(d('2026-02-01'), 1).format('YYYY-MM-DD')).toBe('2026-01-30')
  })
})

// ===========================================================================
// nextBusinessDay
// ===========================================================================

describe('nextBusinessDay', () => {
  test('from Monday → Tuesday', () => {
    expect(nextBusinessDay(d('2026-01-12')).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('from Wednesday → Thursday', () => {
    expect(nextBusinessDay(d('2026-01-14')).format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('from Thursday → Friday', () => {
    expect(nextBusinessDay(d('2026-01-15')).format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('from Friday → Monday (crosses weekend)', () => {
    expect(nextBusinessDay(d('2026-01-16')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('from Saturday → Monday', () => {
    expect(nextBusinessDay(d('2026-01-17')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('from Sunday → Monday', () => {
    expect(nextBusinessDay(d('2026-01-18')).format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('SLA scenario: ticket opened Mon Jan 12, next BD = Tue Jan 13', () => {
    expect(nextBusinessDay(d('2026-01-12')).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('from Friday with holiday on Monday → Tuesday', () => {
    const holidays = ['2026-01-19'] // MLK Day
    expect(nextBusinessDay(d('2026-01-16'), holidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('from Saturday with holiday on Monday → Tuesday', () => {
    const holidays = ['2026-01-19']
    expect(nextBusinessDay(d('2026-01-17'), holidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('from Sunday with holiday on Monday → Tuesday', () => {
    const holidays = ['2026-01-19']
    expect(nextBusinessDay(d('2026-01-18'), holidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('with US holidays: next BD from Sun Jan 18 skips MLK → Tue Jan 20', () => {
    const usHolidays = getHolidays('US', 2026)
    expect(nextBusinessDay(d('2026-01-18'), usHolidays).format('YYYY-MM-DD')).toBe('2026-01-20')
  })
})

// ===========================================================================
// prevBusinessDay
// ===========================================================================

describe('prevBusinessDay', () => {
  test('from Tuesday → Monday', () => {
    expect(prevBusinessDay(d('2026-01-13')).format('YYYY-MM-DD')).toBe('2026-01-12')
  })

  test('from Wednesday → Tuesday', () => {
    expect(prevBusinessDay(d('2026-01-14')).format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('from Thursday → Wednesday', () => {
    expect(prevBusinessDay(d('2026-01-15')).format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('from Monday → Friday (crosses weekend)', () => {
    expect(prevBusinessDay(d('2026-01-12')).format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('from Saturday → Friday', () => {
    expect(prevBusinessDay(d('2026-01-17')).format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('from Sunday → Friday', () => {
    expect(prevBusinessDay(d('2026-01-18')).format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('prevBusinessDay of payroll day Jan 30 Fri = Thu Jan 29', () => {
    expect(prevBusinessDay(d('2026-01-30')).format('YYYY-MM-DD')).toBe('2026-01-29')
  })

  test('with holiday on Friday: prev from Sat with Fri holiday → Thu', () => {
    const holidays = ['2026-01-16'] // holiday on Fri Jan 16
    expect(prevBusinessDay(d('2026-01-17'), holidays).format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('with US holidays: prev from Tue Jan 20 (day after MLK) = Fri Jan 16', () => {
    const usHolidays = getHolidays('US', 2026)
    // Jan 20 Tue, prev skips Jan 19 MLK holiday → Jan 16 Fri
    expect(prevBusinessDay(d('2026-01-20'), usHolidays).format('YYYY-MM-DD')).toBe('2026-01-16')
  })
})

// ===========================================================================
// businessDaysBetween
// ===========================================================================

describe('businessDaysBetween – same date and adjacent dates', () => {
  test('same date → 0', () => {
    const date = d('2026-01-15')
    expect(businessDaysBetween(date, date)).toBe(0)
  })

  test('consecutive business days → 0 (endpoints excluded)', () => {
    // Jan 12 Mon → Jan 13 Tue: nothing strictly between them
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-13'))).toBe(0)
  })

  test('Fri → Mon (weekend between) → 0 (no business days in between)', () => {
    expect(businessDaysBetween(d('2026-01-16'), d('2026-01-19'))).toBe(0)
  })

  test('Thu → Mon → 1 (only Friday counts)', () => {
    expect(businessDaysBetween(d('2026-01-15'), d('2026-01-19'))).toBe(1)
  })
})

describe('businessDaysBetween – positive forward counts', () => {
  test('Mon Jan 12 to Fri Jan 16 → 3 (Tue, Wed, Thu)', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-16'))).toBe(3)
  })

  test('Mon Jan 12 to Mon Jan 19 → 4 (Tue-Fri, skip weekend)', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-19'))).toBe(4)
  })

  test('Mon Jan 12 to Mon Jan 26 → 9 (sprint: 2 full weeks exclusive)', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-26'))).toBe(9)
  })

  test('Jan 1 to Feb 1 → 21 business days in January', () => {
    // Jan 1 Thu to Feb 1 Sun, exclusive: Jan 2 Fri + Jan 5-9 (5) + Jan 12-16 (5) + Jan 19-23 (5) + Jan 26-30 (5) = 1+5+5+5+5 = 21
    expect(businessDaysBetween(d('2026-01-01'), d('2026-02-01'))).toBe(21)
  })

  test('Mon Jan 12 to Fri Jan 30 → 13 business days between', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-30'))).toBe(13)
  })
})

describe('businessDaysBetween – negative (end < start)', () => {
  test('end < start → negative count', () => {
    // Fri Jan 16 to Mon Jan 12: reverse of Mon→Fri = -3
    expect(businessDaysBetween(d('2026-01-16'), d('2026-01-12'))).toBe(-3)
  })

  test('Mon Jan 19 to Mon Jan 12 → -4 (reverse 4-day span)', () => {
    expect(businessDaysBetween(d('2026-01-19'), d('2026-01-12'))).toBe(-4)
  })
})

describe('businessDaysBetween – holiday-aware', () => {
  test('Mon Jan 12 to Fri Jan 16 with Wed Jan 14 holiday → 2 (Tue, Thu)', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-16'), ['2026-01-14'])).toBe(2)
  })

  test('Mon Jan 12 to Wed Jan 21 with MLK Jan 19 holiday → 5', () => {
    // Without holiday: Tue-Fri (4) + Mon = 6; with Jan 19 holiday → 5
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-21'), ['2026-01-19'])).toBe(5)
  })

  test('without holiday same range → 6', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-21'))).toBe(6)
  })

  test('sprint with US holidays (MLK in range) → reduces count', () => {
    const usHolidays = getHolidays('US', 2026)
    const withHolidays = businessDaysBetween(d('2026-01-12'), d('2026-01-26'), usHolidays)
    const withoutHolidays = businessDaysBetween(d('2026-01-12'), d('2026-01-26'))
    // MLK Jan 19 is in range [Jan 12, Jan 26] exclusive → reduces by 1
    expect(withHolidays).toBe(withoutHolidays - 1)
  })
})

// ===========================================================================
// Real-life scenarios
// ===========================================================================

describe('Real-life scenario: Invoice net-30 payment terms', () => {
  test('Invoice issued Thu Jan 15 2026, due in 30 business days = Thu Feb 26', () => {
    const issued = d('2026-01-15')
    const due = addBusinessDays(issued, 30)
    expect(due.format('YYYY-MM-DD')).toBe('2026-02-26')
  })

  test('Due date is a valid DateFormat', () => {
    const due = addBusinessDays(d('2026-01-15'), 30)
    expect(due.isValid()).toBe(true)
  })

  test('Formatted due date for display', () => {
    const due = addBusinessDays(d('2026-01-15'), 30)
    expect(due.format('YYYY-MM-DD')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('Net-30 with US holidays skips MLK + Presidents Day → Mon Mar 2', () => {
    const usHolidays = getHolidays('US', 2026)
    const due = addBusinessDays(d('2026-01-15'), 30, usHolidays)
    expect(due.format('YYYY-MM-DD')).toBe('2026-03-02')
  })
})

describe('Real-life scenario: SLA response tracking', () => {
  test('Ticket opened Mon Jan 12, SLA is 5 BD → deadline Mon Jan 19', () => {
    const opened = d('2026-01-12')
    const deadline = addBusinessDays(opened, 5)
    expect(deadline.format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('Business days elapsed from Jan 12 to Jan 16 = 3 (Tue, Wed, Thu in between)', () => {
    const elapsed = businessDaysBetween(d('2026-01-12'), d('2026-01-16'))
    expect(elapsed).toBe(3)
  })

  test('SLA not yet breached: 3 days elapsed < 5 day SLA', () => {
    const elapsed = businessDaysBetween(d('2026-01-12'), d('2026-01-16'))
    expect(elapsed).toBeLessThan(5)
  })

  test('SLA breached check: days between Jan 12 and Jan 21 = 6 > 5 SLA', () => {
    const elapsed = businessDaysBetween(d('2026-01-12'), d('2026-01-21'))
    expect(elapsed).toBeGreaterThan(5)
  })
})

describe('Real-life scenario: Delivery estimation', () => {
  test('Order placed Fri Jan 16, ships in 3 BD → arrives Wed Jan 21', () => {
    const ordered = d('2026-01-16')
    const arrival = addBusinessDays(ordered, 3)
    expect(arrival.format('YYYY-MM-DD')).toBe('2026-01-21')
  })

  test('Arrival date is a Wednesday', () => {
    const arrival = addBusinessDays(d('2026-01-16'), 3)
    expect(arrival.get('day')).toBe(3) // 3 = Wednesday
  })
})

describe('Real-life scenario: Payroll cut-off', () => {
  test('Last business day of January 2026 = Fri Jan 30 (Jan 31 is Sat)', () => {
    // Feb 1 - 1 BD
    const lastBD = subtractBusinessDays(d('2026-02-01'), 1)
    expect(lastBD.format('YYYY-MM-DD')).toBe('2026-01-30')
  })

  test('Jan 30 2026 is a Friday', () => {
    expect(d('2026-01-30').get('day')).toBe(5) // 5 = Friday
  })

  test('Jan 31 2026 is a Saturday (not a business day)', () => {
    expect(isBusinessDay(d('2026-01-31'))).toBe(false)
  })
})

describe('Real-life scenario: Holiday-aware scheduling (US)', () => {
  test('US 2026 holidays is a non-empty array', () => {
    const holidays = getHolidays('US', 2026)
    expect(holidays.length).toBeGreaterThan(0)
  })

  test('addBusinessDays skips US holidays', () => {
    const usHolidays = getHolidays('US', 2026)
    // Without holidays: Fri Jan 16 + 1 = Mon Jan 19
    // With US holidays (MLK on Jan 19): result = Tue Jan 20
    const withHolidays = addBusinessDays(d('2026-01-16'), 1, usHolidays)
    const withoutHolidays = addBusinessDays(d('2026-01-16'), 1)
    expect(withoutHolidays.format('YYYY-MM-DD')).toBe('2026-01-19')
    expect(withHolidays.format('YYYY-MM-DD')).toBe('2026-01-20')
  })
})

describe('Real-life scenario: Multi-country holiday support', () => {
  const countries = ['US', 'UK', 'IN', 'DE', 'FR', 'CA', 'AU']

  test.each(countries)('getHolidays(%s, 2026) returns a non-empty array', (country) => {
    const holidays = getHolidays(country, 2026)
    expect(Array.isArray(holidays)).toBe(true)
    expect(holidays.length).toBeGreaterThan(0)
  })

  test.each(countries)(
    'getHolidays(%s, 2026) returns valid YYYY-MM-DD strings',
    (country) => {
      const holidays = getHolidays(country, 2026)
      holidays.forEach((h) => expect(h).toMatch(/^\d{4}-\d{2}-\d{2}$/))
    }
  )
})

describe('Real-life scenario: Legal filing deadline', () => {
  test('Case filed Dec 30 2025 (Tue), response due in 10 BD skipping New Year → Wed Jan 14 2026', () => {
    // Without any holiday: Dec 30 + 10 = Jan 13 (see verification)
    // With Jan 1 holiday: + 1 extra = Jan 14
    const filed = d('2025-12-30')
    const due = addBusinessDays(filed, 10, ['2026-01-01'])
    expect(due.format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('Without holiday: Dec 30 + 10 BD = Tue Jan 13 2026', () => {
    expect(addBusinessDays(d('2025-12-30'), 10).format('YYYY-MM-DD')).toBe('2026-01-13')
  })
})

describe('Real-life scenario: businessDaysBetween for project tracking', () => {
  test('2-week sprint Mon Jan 12 to Mon Jan 26 (exclusive both) = 9 business days', () => {
    expect(businessDaysBetween(d('2026-01-12'), d('2026-01-26'))).toBe(9)
  })

  test('Sprint includes 2 weekends (4 weekend days excluded)', () => {
    // Jan 17-18 and Jan 24-25 are weekends, excluded
    const total = businessDaysBetween(d('2026-01-12'), d('2026-01-26'))
    expect(total).toBe(9)
  })
})

describe('Real-life scenario: Negative business days (past)', () => {
  test('Task due Jan 30 with 5 BD lead time started Jan 23 (Thu)', () => {
    const due = d('2026-01-30')
    const started = subtractBusinessDays(due, 5)
    expect(started.format('YYYY-MM-DD')).toBe('2026-01-23')
  })

  test('businessDaysBetween negative: going backward from Jan 16 to Jan 12 = -3', () => {
    expect(businessDaysBetween(d('2026-01-16'), d('2026-01-12'))).toBe(-3)
  })
})

describe('Real-life scenario: Cross-weekend / cross-holiday calculation', () => {
  test('Add 5 BD from Fri Jan 16, spanning 3-day holiday (Mon/Tue/Wed) → Wed Jan 28', () => {
    const holidays = ['2026-01-19', '2026-01-20', '2026-01-21'] // Mon/Tue/Wed holiday
    const result = addBusinessDays(d('2026-01-16'), 5, holidays)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-28')
  })

  test('Without holidays the same +5 from Jan 16 = Fri Jan 23', () => {
    expect(addBusinessDays(d('2026-01-16'), 5).format('YYYY-MM-DD')).toBe('2026-01-23')
  })
})

// ===========================================================================
// getHolidays
// ===========================================================================

describe('getHolidays – format and structure', () => {
  test('returns an array', () => {
    expect(Array.isArray(getHolidays('US', 2026))).toBe(true)
  })

  test('all entries are YYYY-MM-DD strings', () => {
    getHolidays('US', 2026).forEach((h) => {
      expect(h).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  test('unknown country returns empty array', () => {
    expect(getHolidays('ZZ', 2026)).toEqual([])
  })

  test('case-insensitive: lowercase "us" works', () => {
    const lower = getHolidays('us', 2026)
    const upper = getHolidays('US', 2026)
    expect(lower).toEqual(upper)
  })

  test('case-insensitive: lowercase "uk" works', () => {
    const lower = getHolidays('uk', 2026)
    const upper = getHolidays('UK', 2026)
    expect(lower).toEqual(upper)
  })
})

describe('getHolidays – US 2026', () => {
  const h = getHolidays('US', 2026)

  test('US 2026 includes New Year Day Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('US 2026 includes MLK Day (3rd Mon Jan) = Jan 19', () => {
    expect(h).toContain('2026-01-19')
  })

  test('US 2026 includes Presidents Day (3rd Mon Feb) = Feb 16', () => {
    expect(h).toContain('2026-02-16')
  })

  test('US 2026 includes Memorial Day (last Mon May) = May 25', () => {
    expect(h).toContain('2026-05-25')
  })

  test('US 2026 includes Juneteenth Jun 19', () => {
    expect(h).toContain('2026-06-19')
  })

  test('US 2026 includes Independence Day Jul 4', () => {
    expect(h).toContain('2026-07-04')
  })

  test('US 2026 includes Labor Day (1st Mon Sep) = Sep 7', () => {
    expect(h).toContain('2026-09-07')
  })

  test('US 2026 includes Veterans Day Nov 11', () => {
    expect(h).toContain('2026-11-11')
  })

  test('US 2026 includes Thanksgiving (4th Thu Nov) = Nov 26', () => {
    expect(h).toContain('2026-11-26')
  })

  test('US 2026 includes Christmas Dec 25', () => {
    expect(h).toContain('2026-12-25')
  })

  test('US 2026 has 11 holidays', () => {
    expect(h).toHaveLength(11)
  })
})

describe('getHolidays – UK 2026', () => {
  const h = getHolidays('UK', 2026)

  test('UK 2026 includes New Year Day Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('UK 2026 includes Good Friday Apr 3', () => {
    expect(h).toContain('2026-04-03')
  })

  test('UK 2026 includes Easter Monday Apr 6', () => {
    expect(h).toContain('2026-04-06')
  })

  test('UK 2026 includes Christmas Dec 25', () => {
    expect(h).toContain('2026-12-25')
  })

  test('UK 2026 includes Boxing Day Dec 26', () => {
    expect(h).toContain('2026-12-26')
  })
})

describe('getHolidays – IN 2026', () => {
  const h = getHolidays('IN', 2026)

  test('IN 2026 includes Republic Day Jan 26', () => {
    expect(h).toContain('2026-01-26')
  })

  test('IN 2026 includes Independence Day Aug 15', () => {
    expect(h).toContain('2026-08-15')
  })

  test('IN 2026 includes Good Friday', () => {
    expect(h).toContain('2026-04-03')
  })

  test('IN 2026 includes Gandhi Jayanti Oct 2', () => {
    expect(h).toContain('2026-10-02')
  })

  test('IN 2026 includes Christmas Dec 25', () => {
    expect(h).toContain('2026-12-25')
  })
})

describe('getHolidays – DE 2026', () => {
  const h = getHolidays('DE', 2026)

  test('DE 2026 includes Neujahr Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('DE 2026 includes Heilige Drei Könige Jan 6', () => {
    expect(h).toContain('2026-01-06')
  })

  test('DE 2026 includes Good Friday Apr 3', () => {
    expect(h).toContain('2026-04-03')
  })

  test('DE 2026 includes Easter Sunday Apr 5', () => {
    expect(h).toContain('2026-04-05')
  })

  test('DE 2026 includes Easter Monday Apr 6', () => {
    expect(h).toContain('2026-04-06')
  })

  test('DE 2026 includes German Unity Day Oct 3', () => {
    expect(h).toContain('2026-10-03')
  })

  test('DE 2026 includes Christmas Dec 25 and Dec 26', () => {
    expect(h).toContain('2026-12-25')
    expect(h).toContain('2026-12-26')
  })
})

describe('getHolidays – FR 2026', () => {
  const h = getHolidays('FR', 2026)

  test('FR 2026 includes Jour de l\'an Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('FR 2026 includes Easter Monday (Lundi de Pâques) Apr 6', () => {
    expect(h).toContain('2026-04-06')
  })

  test('FR 2026 includes Bastille Day Jul 14', () => {
    expect(h).toContain('2026-07-14')
  })

  test('FR 2026 includes Armistice Nov 11', () => {
    expect(h).toContain('2026-11-11')
  })

  test('FR 2026 includes Christmas Dec 25', () => {
    expect(h).toContain('2026-12-25')
  })

  test('FR 2026 includes Ascension (Easter+39) May 14', () => {
    expect(h).toContain('2026-05-14')
  })
})

describe('getHolidays – CA 2026', () => {
  const h = getHolidays('CA', 2026)

  test('CA 2026 includes New Year Day Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('CA 2026 includes Good Friday Apr 3', () => {
    expect(h).toContain('2026-04-03')
  })

  test('CA 2026 includes Canada Day Jul 1', () => {
    expect(h).toContain('2026-07-01')
  })

  test('CA 2026 includes Remembrance Day Nov 11', () => {
    expect(h).toContain('2026-11-11')
  })

  test('CA 2026 includes Christmas Dec 25 and Boxing Day Dec 26', () => {
    expect(h).toContain('2026-12-25')
    expect(h).toContain('2026-12-26')
  })

  test('CA 2026 includes Thanksgiving (2nd Mon Oct) Oct 12', () => {
    expect(h).toContain('2026-10-12')
  })

  test('CA 2026 includes Labour Day (1st Mon Sep) Sep 7', () => {
    expect(h).toContain('2026-09-07')
  })
})

describe('getHolidays – AU 2026', () => {
  const h = getHolidays('AU', 2026)

  test('AU 2026 includes New Year Day Jan 1', () => {
    expect(h).toContain('2026-01-01')
  })

  test('AU 2026 includes Australia Day Jan 26', () => {
    expect(h).toContain('2026-01-26')
  })

  test('AU 2026 includes Good Friday Apr 3', () => {
    expect(h).toContain('2026-04-03')
  })

  test('AU 2026 includes Easter Saturday Apr 4', () => {
    expect(h).toContain('2026-04-04')
  })

  test('AU 2026 includes Easter Sunday Apr 5', () => {
    expect(h).toContain('2026-04-05')
  })

  test('AU 2026 includes Easter Monday Apr 6', () => {
    expect(h).toContain('2026-04-06')
  })

  test('AU 2026 includes ANZAC Day Apr 25', () => {
    expect(h).toContain('2026-04-25')
  })

  test('AU 2026 includes Christmas Dec 25 and Boxing Day Dec 26', () => {
    expect(h).toContain('2026-12-25')
    expect(h).toContain('2026-12-26')
  })
})

describe('getHolidays – Easter-based date consistency', () => {
  test('Easter 2026 is April 5 (verified by multiple countries)', () => {
    // DE includes Easter Sunday; AU includes Easter Sunday
    expect(getHolidays('DE', 2026)).toContain('2026-04-05')
    expect(getHolidays('AU', 2026)).toContain('2026-04-05')
  })

  test('Good Friday (Easter-2) = Apr 3 consistent across UK, IN, DE, CA, AU', () => {
    const countries = ['UK', 'IN', 'DE', 'CA', 'AU']
    countries.forEach((c) => {
      expect(getHolidays(c, 2026)).toContain('2026-04-03')
    })
  })

  test('Easter Monday (Easter+1) = Apr 6 consistent across UK, DE, FR', () => {
    expect(getHolidays('UK', 2026)).toContain('2026-04-06')
    expect(getHolidays('DE', 2026)).toContain('2026-04-06')
    expect(getHolidays('FR', 2026)).toContain('2026-04-06')
  })
})
