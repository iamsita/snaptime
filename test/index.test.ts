import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import dateFormat, {
  DateFormat,
  Duration,
  DateRange,
  DateCollection,
  Timezone,
  parseNatural,
  Cron,
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  nextBusinessDay,
  prevBusinessDay,
  businessDaysBetween,
  getHolidays
} from '../src/index'

const FAKE_NOW = '2026-01-15T12:00:00.000Z'
const FAKE_MS = new Date(FAKE_NOW).getTime()

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(FAKE_NOW))
})
afterEach(() => {
  jest.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// Factory basics
// ─────────────────────────────────────────────────────────────────────────────
describe('factory basics', () => {
  test('dateFormat() with no args returns DateFormat for fake now', () => {
    const result = dateFormat()
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(FAKE_MS)
  })

  test('dateFormat("2026-01-15") returns valid DateFormat in UTC mode', () => {
    const result = dateFormat('2026-01-15')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.isUtc()).toBe(true)
  })

  test('dateFormat(FAKE_MS) from numeric timestamp is valid', () => {
    const result = dateFormat(FAKE_MS)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(FAKE_MS)
  })

  test('dateFormat(new Date(FAKE_MS)) from Date object is valid', () => {
    const result = dateFormat(new Date(FAKE_MS))
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.valueOf()).toBe(FAKE_MS)
  })

  test('dateFormat(NaN) returns invalid DateFormat', () => {
    const result = dateFormat(NaN)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(false)
    expect(result.format()).toBe('Invalid Date')
  })

  test('dateFormat("not a real date") returns invalid DateFormat', () => {
    const result = dateFormat('not a real date')
    expect(result.isValid()).toBe(false)
  })

  test('dateFormat("2026-01-15", { utc: true }) sets utc mode', () => {
    const result = dateFormat('2026-01-15', { utc: true })
    expect(result.isUtc()).toBe(true)
    expect(result.isLocal()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Static methods on factory
// ─────────────────────────────────────────────────────────────────────────────
describe('static methods on factory', () => {
  test('dateFormat.parse("2026-01-15", "YYYY-MM-DD") returns valid DateFormat', () => {
    const result = dateFormat.parse('2026-01-15', 'YYYY-MM-DD')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('dateFormat.fromObject({ year: 2026, month: 1, day: 15 }) returns valid DateFormat', () => {
    const result = dateFormat.fromObject({ year: 2026, month: 1, day: 15 })
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    expect(result.get('year')).toBe(2026)
    expect(result.get('month')).toBe(1)
  })

  test('dateFormat.min(...) returns earliest date', () => {
    const result = dateFormat.min('2026-01-01', '2026-06-15', '2025-12-31')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2025-12-31')
  })

  test('dateFormat.max(...) returns latest date', () => {
    const result = dateFormat.max('2026-01-01', '2026-06-15', '2025-12-31')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-06-15')
  })

  test('dateFormat.min with two equal dates returns that date', () => {
    const result = dateFormat.min('2026-03-01', '2026-03-01')
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-01')
  })

  test('dateFormat.duration(2, "hour") returns Duration of 2 hours', () => {
    const result = dateFormat.duration(2, 'hour')
    expect(result).toBeInstanceOf(Duration)
    expect(result.as('hour')).toBe(2)
    expect(result.toMilliseconds()).toBe(2 * 3600000)
  })

  test('dateFormat.duration(0, "day") returns zero Duration', () => {
    const result = dateFormat.duration(0, 'day')
    expect(result.isZero()).toBe(true)
  })

  test('dateFormat.locale("en", {}) does not throw', () => {
    expect(() => dateFormat.locale('en', {})).not.toThrow()
  })

  test('dateFormat.use(plugin) calls plugin with DateFormat class', () => {
    const receivedArgs: unknown[] = []
    const plugin = (DF: unknown) => {
      receivedArgs.push(DF)
    }
    dateFormat.use(plugin)
    expect(receivedArgs.length).toBeGreaterThan(0)
  })

  test('all static method keys are functions', () => {
    expect(typeof dateFormat.parse).toBe('function')
    expect(typeof dateFormat.fromObject).toBe('function')
    expect(typeof dateFormat.min).toBe('function')
    expect(typeof dateFormat.max).toBe('function')
    expect(typeof dateFormat.duration).toBe('function')
    expect(typeof dateFormat.locale).toBe('function')
    expect(typeof dateFormat.use).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sub-namespace methods
// ─────────────────────────────────────────────────────────────────────────────
describe('sub-namespace methods', () => {
  test('dateFormat.range("2026-01-01", "2026-01-31") returns DateRange', () => {
    const result = dateFormat.range('2026-01-01', '2026-01-31')
    expect(result).toBeInstanceOf(DateRange)
    expect(result.isValid()).toBe(true)
  })

  test('dateFormat.range start and end are accessible', () => {
    const r = dateFormat.range('2026-01-01', '2026-01-31')
    expect(r.start.format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(r.end.format('YYYY-MM-DD')).toBe('2026-01-31')
  })

  test('dateFormat.natural("tomorrow") returns DateFormat for next day', () => {
    const result = dateFormat.natural('tomorrow')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
    // tomorrow from Jan 15 = Jan 16
    expect(result.isAfter(dateFormat())).toBe(true)
  })

  test('dateFormat.natural("yesterday") returns DateFormat for prior day', () => {
    const result = dateFormat.natural('yesterday')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isBefore(dateFormat())).toBe(true)
  })

  test('dateFormat.cron("* * * * *") returns Cron instance', () => {
    const result = dateFormat.cron('* * * * *')
    expect(result).toBeInstanceOf(Cron)
    expect(result.toString()).toBe('* * * * *')
  })

  test('dateFormat.cron humanize works', () => {
    const result = dateFormat.cron('* * * * *')
    expect(typeof result.humanize()).toBe('string')
    expect(result.humanize()).toBe('Every minute')
  })

  test('dateFormat.collection(["2026-01-01", "2026-01-15", "2026-02-01"]) returns DateCollection', () => {
    const result = dateFormat.collection(['2026-01-01', '2026-01-15', '2026-02-01'])
    expect(result).toBeInstanceOf(DateCollection)
    expect(result.count()).toBe(3)
  })

  test('dateFormat.collection is iterable', () => {
    const col = dateFormat.collection(['2026-01-01', '2026-01-15'])
    const dates: DateFormat[] = []
    for (const d of col) dates.push(d)
    expect(dates).toHaveLength(2)
  })

  test('dateFormat.tz("UTC") returns Timezone instance', () => {
    const result = dateFormat.tz('UTC')
    expect(result).toBeInstanceOf(Timezone)
    expect(result.tz).toBe('UTC')
  })

  test('dateFormat.tz("America/New_York") returns Timezone instance', () => {
    const result = dateFormat.tz('America/New_York')
    expect(result).toBeInstanceOf(Timezone)
  })

  test('dateFormat.tz("Invalid/Timezone") throws RangeError', () => {
    expect(() => dateFormat.tz('Invalid/Timezone')).toThrow(RangeError)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Business namespace
// ─────────────────────────────────────────────────────────────────────────────
describe('dateFormat.business namespace', () => {
  const thu = dateFormat('2026-01-15') // Thursday
  const sat = dateFormat('2026-01-17') // Saturday
  const sun = dateFormat('2026-01-18') // Sunday

  test('isBusinessDay(Thursday) → true', () => {
    expect(dateFormat.business.isBusinessDay(thu)).toBe(true)
  })

  test('isBusinessDay(Saturday) → false', () => {
    expect(dateFormat.business.isBusinessDay(sat)).toBe(false)
  })

  test('isBusinessDay(Sunday) → false', () => {
    expect(dateFormat.business.isBusinessDay(sun)).toBe(false)
  })

  test('addBusinessDays(Thu Jan 15, 3) → Tue Jan 20', () => {
    const result = dateFormat.business.addBusinessDays(thu, 3)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-20')
  })

  test('addBusinessDays(Thu Jan 15, 0) → same date', () => {
    const result = dateFormat.business.addBusinessDays(thu, 0)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('addBusinessDays skips weekend correctly (Fri +1 = Mon)', () => {
    const fri = dateFormat('2026-01-16')
    const result = dateFormat.business.addBusinessDays(fri, 1)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('subtractBusinessDays(Thu Jan 15, 1) → Wed Jan 14', () => {
    const result = dateFormat.business.subtractBusinessDays(thu, 1)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('nextBusinessDay(Fri Jan 16) → Mon Jan 19', () => {
    const fri = dateFormat('2026-01-16')
    const result = dateFormat.business.nextBusinessDay(fri)
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('nextBusinessDay(Thursday) → Friday', () => {
    const result = dateFormat.business.nextBusinessDay(thu)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-16')
  })

  test('prevBusinessDay(Mon Jan 12) → Fri Jan 9', () => {
    const mon = dateFormat('2026-01-12')
    const result = dateFormat.business.prevBusinessDay(mon)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('businessDaysBetween(Mon Jan 12, Fri Jan 16) → 3 (exclusive)', () => {
    const mon = dateFormat('2026-01-12')
    const fri = dateFormat('2026-01-16')
    expect(dateFormat.business.businessDaysBetween(mon, fri)).toBe(3)
  })

  test('businessDaysBetween same date → 0', () => {
    expect(dateFormat.business.businessDaysBetween(thu, thu)).toBe(0)
  })

  test('getHolidays("US", 2026) → array includes New Year', () => {
    const holidays = dateFormat.business.getHolidays('US', 2026)
    expect(Array.isArray(holidays)).toBe(true)
    expect(holidays.length).toBeGreaterThan(0)
    expect(holidays).toContain('2026-01-01')
  })

  test('getHolidays("US", 2026) → array includes Christmas', () => {
    const holidays = dateFormat.business.getHolidays('US', 2026)
    expect(holidays).toContain('2026-12-25')
  })

  test('getHolidays("UK", 2026) → array of strings', () => {
    const holidays = dateFormat.business.getHolidays('UK', 2026)
    expect(Array.isArray(holidays)).toBe(true)
    expect(holidays).toContain('2026-01-01')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Named class exports
// ─────────────────────────────────────────────────────────────────────────────
describe('named class exports', () => {
  test('new DateFormat("2026-01-15") → valid instance', () => {
    const df = new DateFormat('2026-01-15')
    expect(df).toBeInstanceOf(DateFormat)
    expect(df.isValid()).toBe(true)
    expect(df.get('year')).toBe(2026)
  })

  test('new Duration(3600000) → 1 hour', () => {
    const dur = new Duration(3600000)
    expect(dur).toBeInstanceOf(Duration)
    expect(dur.toHours()).toBe(1)
    expect(dur.isPositive()).toBe(true)
  })

  test('new DateRange("2026-01-01", "2026-01-31") → valid range', () => {
    const range = new DateRange('2026-01-01', '2026-01-31')
    expect(range).toBeInstanceOf(DateRange)
    expect(range.isValid()).toBe(true)
    expect(range.isForward()).toBe(true)
  })

  test('new DateCollection(["2026-01-01"]) → count 1', () => {
    const col = new DateCollection(['2026-01-01'])
    expect(col).toBeInstanceOf(DateCollection)
    expect(col.count()).toBe(1)
  })

  test('new Timezone("UTC") → valid', () => {
    const tz = new Timezone('UTC')
    expect(tz).toBeInstanceOf(Timezone)
    expect(tz.tz).toBe('UTC')
  })

  test('Timezone.isValid("UTC") → true', () => {
    expect(Timezone.isValid('UTC')).toBe(true)
  })

  test('Timezone.isValid("Bad/Tz") → false', () => {
    expect(Timezone.isValid('Bad/Tz')).toBe(false)
  })

  test('Timezone.guess() returns a non-empty string', () => {
    expect(typeof Timezone.guess()).toBe('string')
    expect(Timezone.guess().length).toBeGreaterThan(0)
  })

  test('new Cron("* * * * *") → valid, toString matches', () => {
    const cron = new Cron('* * * * *')
    expect(cron).toBeInstanceOf(Cron)
    expect(cron.toString()).toBe('* * * * *')
  })

  test('new Cron with invalid field count throws', () => {
    expect(() => new Cron('* * * *')).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Named function exports
// ─────────────────────────────────────────────────────────────────────────────
describe('named function exports', () => {
  test('parseNatural("tomorrow") returns DateFormat', () => {
    const result = parseNatural('tomorrow')
    expect(result).toBeInstanceOf(DateFormat)
    expect(result.isValid()).toBe(true)
  })

  test('parseNatural("yesterday") is before now', () => {
    const result = parseNatural('yesterday')
    expect(result.isBefore(new DateFormat())).toBe(true)
  })

  test('parseNatural("now") equals fake now', () => {
    const result = parseNatural('now')
    expect(result.valueOf()).toBe(FAKE_MS)
  })

  test('isBusinessDay(Thursday) → true', () => {
    expect(isBusinessDay(new DateFormat('2026-01-15'))).toBe(true)
  })

  test('isBusinessDay(Saturday) → false', () => {
    expect(isBusinessDay(new DateFormat('2026-01-17'))).toBe(false)
  })

  test('addBusinessDays(Mon Jan 12, 1) → Tue Jan 13', () => {
    const result = addBusinessDays(new DateFormat('2026-01-12'), 1)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-13')
  })

  test('subtractBusinessDays(Thu Jan 15, 1) → Wed Jan 14', () => {
    const result = subtractBusinessDays(new DateFormat('2026-01-15'), 1)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-14')
  })

  test('nextBusinessDay(Fri Jan 16) → Mon Jan 19', () => {
    const result = nextBusinessDay(new DateFormat('2026-01-16'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-19')
  })

  test('prevBusinessDay(Mon Jan 12) → Fri Jan 9', () => {
    const result = prevBusinessDay(new DateFormat('2026-01-12'))
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-09')
  })

  test('businessDaysBetween(Mon Jan 12, Mon Jan 19) → 4', () => {
    const start = new DateFormat('2026-01-12')
    const end = new DateFormat('2026-01-19')
    expect(businessDaysBetween(start, end)).toBe(4)
  })

  test('getHolidays("US", 2026) includes New Year and Christmas', () => {
    const h = getHolidays('US', 2026)
    expect(h).toContain('2026-01-01')
    expect(h).toContain('2026-12-25')
  })

  test('getHolidays("IN", 2026) includes Republic Day', () => {
    const h = getHolidays('IN', 2026)
    expect(h).toContain('2026-01-26')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Plugin system
// ─────────────────────────────────────────────────────────────────────────────
describe('plugin system', () => {
  test('dateFormat.use(plugin) invokes plugin with DateFormat as first arg', () => {
    let receivedDF: unknown = null
    dateFormat.use((DF) => {
      receivedDF = DF
    })
    expect(receivedDF).toBe(DateFormat)
  })

  test('plugin can add method to DateFormat.prototype', () => {
    dateFormat.use((DF: unknown) => {
      ;(DF as typeof DateFormat).prototype.greetFromPlugin = function () {
        return 'hello from plugin'
      }
    })
    const inst = dateFormat('2026-01-15')
    expect((inst as unknown as { greetFromPlugin: () => string }).greetFromPlugin()).toBe(
      'hello from plugin'
    )
  })

  test('plugin method returns correct value from instance context', () => {
    dateFormat.use((DF: unknown) => {
      ;(DF as typeof DateFormat).prototype.yearLabel = function () {
        return `Year: ${(this as DateFormat).get('year')}`
      }
    })
    const inst = dateFormat('2026-01-15')
    expect((inst as unknown as { yearLabel: () => string }).yearLabel()).toBe('Year: 2026')
  })

  test('second plugin accumulates alongside first', () => {
    dateFormat.use((DF: unknown) => {
      ;(DF as typeof DateFormat).prototype.pluginA = () => 'A'
    })
    dateFormat.use((DF: unknown) => {
      ;(DF as typeof DateFormat).prototype.pluginB = () => 'B'
    })
    const inst = dateFormat('2026-01-15')
    const anyInst = inst as unknown as { pluginA: () => string; pluginB: () => string }
    expect(anyInst.pluginA()).toBe('A')
    expect(anyInst.pluginB()).toBe('B')
  })

  test('no-op plugin does not break factory', () => {
    expect(() => {
      dateFormat.use(() => {})
      dateFormat('2026-01-15').format('YYYY-MM-DD')
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Factory interop checks
// ─────────────────────────────────────────────────────────────────────────────
describe('factory is a function with all namespaces attached', () => {
  test('dateFormat itself is a function', () => {
    expect(typeof dateFormat).toBe('function')
  })

  test('dateFormat.business has all 7 expected functions', () => {
    expect(typeof dateFormat.business.isBusinessDay).toBe('function')
    expect(typeof dateFormat.business.addBusinessDays).toBe('function')
    expect(typeof dateFormat.business.subtractBusinessDays).toBe('function')
    expect(typeof dateFormat.business.nextBusinessDay).toBe('function')
    expect(typeof dateFormat.business.prevBusinessDay).toBe('function')
    expect(typeof dateFormat.business.businessDaysBetween).toBe('function')
    expect(typeof dateFormat.business.getHolidays).toBe('function')
  })

  test('dateFormat.range, .natural, .cron, .collection, .tz all attached', () => {
    expect(typeof dateFormat.range).toBe('function')
    expect(typeof dateFormat.natural).toBe('function')
    expect(typeof dateFormat.cron).toBe('function')
    expect(typeof dateFormat.collection).toBe('function')
    expect(typeof dateFormat.tz).toBe('function')
  })

  test('factory result is instanceof DateFormat', () => {
    expect(dateFormat('2026-01-15')).toBeInstanceOf(DateFormat)
    expect(dateFormat(FAKE_MS)).toBeInstanceOf(DateFormat)
    expect(dateFormat()).toBeInstanceOf(DateFormat)
  })
})
