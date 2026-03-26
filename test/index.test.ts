import { describe, test, expect } from '@jest/globals'
import dateFormat, {
  DateFormat,
  Duration,
  DateRange,
  DateCollection,
  Timezone,
  Cron,
  parseNatural,
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays
} from '../src/index'

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------
describe('dateFormat factory function', () => {
  test('dateFormat("2026-01-15") → DateFormat instance', () => {
    const result = dateFormat('2026-01-15')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat() with no args → valid instance using current time', () => {
    const result = dateFormat()
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat(1234567890000) → valid instance from timestamp', () => {
    const result = dateFormat(1234567890000)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(1234567890000)
  })

  test('dateFormat(new Date()) → valid instance', () => {
    const now = new Date()
    const result = dateFormat(now)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat("2026-01-15", { utc: true }) → isUtc() true', () => {
    const result = dateFormat('2026-01-15', { utc: true })
    expect(result.isUtc()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Static method wrappers
// ---------------------------------------------------------------------------
describe('dateFormat static method wrappers', () => {
  test('dateFormat.parse("2026-01-15", "YYYY-MM-DD") → DateFormat', () => {
    const result = dateFormat.parse('2026-01-15', 'YYYY-MM-DD')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat.min("2026-01-01", "2026-06-01") → Jan 1', () => {
    const result = dateFormat.min('2026-01-01', '2026-06-01')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('dateFormat.max("2026-01-01", "2026-06-01") → Jun 1', () => {
    const result = dateFormat.max('2026-01-01', '2026-06-01')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-06-01')
  })

  test('dateFormat.duration(1, "day") → Duration instance', () => {
    const result = dateFormat.duration(1, 'day')
    expect(result).toBeInstanceOf(Duration)
  })

  test('dateFormat.locale("en") → does not throw', () => {
    expect(() => dateFormat.locale('en')).not.toThrow()
  })

  test('dateFormat.use(() => {}) → does not throw', () => {
    expect(() => dateFormat.use(() => {})).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Sub-namespace methods
// ---------------------------------------------------------------------------
describe('dateFormat sub-namespace methods', () => {
  test('dateFormat.range("2026-01-01", "2026-01-31") → DateRange instance', () => {
    const result = dateFormat.range('2026-01-01', '2026-01-31')
    expect(result).toBeInstanceOf(DateRange)
  })

  test('dateFormat.natural("tomorrow") → DateFormat instance', () => {
    const result = dateFormat.natural('tomorrow')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat.cron("* * * * *") → Cron instance', () => {
    const result = dateFormat.cron('* * * * *')
    expect(result).toBeInstanceOf(Cron)
  })

  test('dateFormat.collection(["2026-01-01"]) → DateCollection instance', () => {
    const result = dateFormat.collection(['2026-01-01'])
    expect(result).toBeInstanceOf(DateCollection)
    expect(result.count()).toBe(1)
  })

  test('dateFormat.tz("UTC") → Timezone instance', () => {
    const result = dateFormat.tz('UTC')
    expect(result).toBeInstanceOf(Timezone)
  })
})

// ---------------------------------------------------------------------------
// Business sub-namespace
// ---------------------------------------------------------------------------
describe('dateFormat.business namespace', () => {
  const thu = dateFormat('2026-01-15') // Thursday

  test('dateFormat.business.isBusinessDay(Thu) → true', () => {
    expect(dateFormat.business.isBusinessDay(thu)).toBe(true)
  })

  test('dateFormat.business.isBusinessDay(Sat) → false', () => {
    const sat = dateFormat('2026-01-17')
    expect(dateFormat.business.isBusinessDay(sat)).toBe(false)
  })

  test('dateFormat.business.addBusinessDays(Thu, 1) → DateFormat (Fri)', () => {
    const result = dateFormat.business.addBusinessDays(thu, 1)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('dateFormat.business.subtractBusinessDays(Thu, 1) → DateFormat (Wed)', () => {
    const result = dateFormat.business.subtractBusinessDays(thu, 1)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('dateFormat.business.nextBusinessDay(Thu) → DateFormat (Fri)', () => {
    const result = dateFormat.business.nextBusinessDay(thu)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('dateFormat.business.prevBusinessDay(Thu) → DateFormat (Wed)', () => {
    const result = dateFormat.business.prevBusinessDay(thu)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('dateFormat.business.businessDaysBetween(Mon, Fri) → 3', () => {
    // Jan 12 (Mon) to Jan 16 (Fri) exclusive = 3 business days
    const mon = dateFormat('2026-01-12')
    const fri = dateFormat('2026-01-16')
    const result = dateFormat.business.businessDaysBetween(mon, fri)
    expect(result).toBe(3)
  })

  test('dateFormat.business.getHolidays("US", 2026) → array of strings', () => {
    const holidays = dateFormat.business.getHolidays('US', 2026)
    expect(Array.isArray(holidays)).toBe(true)
    expect(holidays.length).toBeGreaterThan(0)
    expect(holidays).toContain('2026-01-01')
  })
})

// ---------------------------------------------------------------------------
// Named class exports
// ---------------------------------------------------------------------------
describe('named class exports', () => {
  test('DateFormat constructor works', () => {
    const df = new DateFormat('2026-01-15')
    expect(df).toBeInstanceOf(DateFormat)
    expect(df.isValid()).toBe(true)
  })

  test('Duration constructor works', () => {
    const dur = new Duration(86400000)
    expect(dur).toBeInstanceOf(Duration)
  })

  test('DateRange constructor works', () => {
    const range = new DateRange('2026-01-01', '2026-12-31')
    expect(range).toBeInstanceOf(DateRange)
  })

  test('DateCollection constructor works', () => {
    const col = new DateCollection(['2026-01-01', '2026-06-01'])
    expect(col).toBeInstanceOf(DateCollection)
    expect(col.count()).toBe(2)
  })

  test('Timezone.isValid("UTC") → true', () => {
    expect(Timezone.isValid('UTC')).toBe(true)
  })

  test('Timezone.isValid("Invalid/Tz") → false', () => {
    expect(Timezone.isValid('Invalid/Tz')).toBe(false)
  })

  test('Cron constructor works', () => {
    const cron = new Cron('0 9 * * 1-5')
    expect(cron).toBeInstanceOf(Cron)
    expect(cron.toString()).toBe('0 9 * * 1-5')
  })
})

// ---------------------------------------------------------------------------
// Named function exports
// ---------------------------------------------------------------------------
describe('named function exports', () => {
  test('parseNatural("today") → DateFormat', () => {
    const result = parseNatural('today')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('isBusinessDay(Thursday) → true', () => {
    const thu = new DateFormat('2026-01-15')
    expect(isBusinessDay(thu)).toBe(true)
  })

  test('isBusinessDay(Saturday) → false', () => {
    const sat = new DateFormat('2026-01-17')
    expect(isBusinessDay(sat)).toBe(false)
  })

  test('addBusinessDays(Mon, 1) → Tuesday', () => {
    const mon = new DateFormat('2026-01-12')
    const result = addBusinessDays(mon, 1)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('subtractBusinessDays(Mon, 1) → Friday', () => {
    const mon = new DateFormat('2026-01-12')
    const result = subtractBusinessDays(mon, 1)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('nextBusinessDay(Fri) → Monday', () => {
    const fri = new DateFormat('2026-01-16')
    const result = nextBusinessDay(fri)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('prevBusinessDay(Mon) → Friday', () => {
    const mon = new DateFormat('2026-01-12')
    const result = prevBusinessDay(mon)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('businessDaysBetween(Mon, Mon next week) → 4', () => {
    const mon1 = new DateFormat('2026-01-12')
    const mon2 = new DateFormat('2026-01-19')
    expect(businessDaysBetween(mon1, mon2)).toBe(4)
  })

  test('getHolidays("US", 2026) → includes New Year and Christmas', () => {
    const h = getHolidays('US', 2026)
    expect(h).toContain('2026-01-01')
    expect(h).toContain('2026-12-25')
  })
})

// ---------------------------------------------------------------------------
// Default export is the factory function
// ---------------------------------------------------------------------------
describe('default export', () => {
  test('default export is a function', () => {
    expect(typeof dateFormat).toBe('function')
  })

  test('calling it returns a DateFormat', () => {
    expect(dateFormat('2026-01-15')).toBeInstanceOf(DateFormat)
  })
})
