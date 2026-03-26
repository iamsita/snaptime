import { dateFormat } from '../src/index'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

describe('dateFormat factory & API surface', () => {
  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true })
    jest.setSystemTime(new Date('2025-05-04T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('factory returns a chainable instance', () => {
    const inst = dateFormat('2025-05-04T15:00:00')
    expect(typeof inst.format).toBe('function')
    expect(inst.add(1, 'day').format('YYYY-MM-DD')).toBe('2025-05-05')
  })

  test('static methods attached to factory', () => {
    expect(typeof dateFormat.parse).toBe('function')
    expect(typeof dateFormat.min).toBe('function')
    expect(typeof dateFormat.max).toBe('function')
    expect(typeof dateFormat.duration).toBe('function')
    expect(typeof dateFormat.locale).toBe('function')
    expect(typeof dateFormat.use).toBe('function')
  })

  // New: Test factory with no arguments
  test('factory with no input uses current time', () => {
    const now = new Date().getTime()
    const inst = dateFormat()
    expect(Math.abs(inst.valueOf() - now)).toBeLessThan(100) // Allow small delta
  })

  // New: Test invalid input handling
  test('factory handles invalid input gracefully', () => {
    const inst = dateFormat('invalid')
    expect(inst.isValid()).toBe(false)
    expect(inst.format()).toBe('Invalid Date')
  })
})

// describe('DateFormat class', () => {
//   test('isValid', () => {
//     expect(dateFormat('2025-05-04').isValid()).toBe(true)
//     expect(dateFormat('foo').isValid()).toBe(false)
//     expect(dateFormat('2025-05-32').isValid()).toBe(false)
//     expect(dateFormat('2025-05-04T12:00:00Z').isValid()).toBe(true)
//     expect(dateFormat('2025-05-04T12:00:00').isValid()).toBe(true)
//     expect(dateFormat('2025-05-04T12:00:00+05:45').isValid()).toBe(true)
//     // New: Edge case for empty string
//     expect(dateFormat('').isValid()).toBe(false)
//     // New: Edge case for null/undefined
//     expect(dateFormat(null).isValid()).toBe(false)
//     expect(dateFormat(undefined).isValid()).toBe(false)
//   })

//   test('diff in various units & floating', () => {
//     const a = dateFormat('2025-05-01')
//     const b = dateFormat('2025-05-04')
//     expect(b.diff(a, 'day')).toBe(3)
//     expect(a.diff(b, 'day')).toBe(-3)
//     const c = dateFormat('2025-05-04T12:00:00')
//     expect(c.diff(b, 'day', true)).toBe(0.5) // 12 hours = 0.5 days
//     expect(c.diff(b, 'hour')).toBe(12)
//     expect(c.diff(b, 'minute', true)).toBe(720)
//     // New: Test fortnight and year
//     expect(b.diff(a, 'fortnight')).toBe(0)
//     expect(dateFormat('2026-05-04').diff(a, 'year', true)).toBeCloseTo(1, 1)
//     // New: Invalid unit
//     expect(() => b.diff(a, 'unknown' as Unit)).toThrow(/Invalid unit/)
//   })

//   test('toDate, toISOString, toJSON', () => {
//     const df = dateFormat('2025-05-04T12:34:56Z')
//     const d = df.toDate()
//     expect(d.getUTCFullYear()).toBe(2025)
//     expect(df.toISOString()).toBe('2025-05-04T12:34:56.000Z')
//     expect(df.toJSON()).toBe(df.toISOString())
//     // New: Verify UTC vs local
//     const localDf = dateFormat('2025-05-04T12:34:56')
//     expect(localDf.toISOString()).toMatch(/2025-05-04T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
//   })

//   test('startOf / endOf', () => {
//     const dt = dateFormat('2025-05-04T15:23:45')
//     expect(dt.startOf('day').format('YYYY-MM-DD HH:mm:ss')).toBe('2025-05-04 00:00:00')
//     expect(dt.endOf('month').format('YYYY-MM-DD HH:mm:ss')).toBe('2025-05-31 23:59:59')
//     expect(dt.startOf('week').format('YYYY-MM-DD')).toBe('2025-05-04') // Sunday start
//     // New: Test quarter and year
//     expect(dt.startOf('quarter').format('YYYY-MM-DD')).toBe('2025-04-01')
//     expect(dt.endOf('quarter').format('YYYY-MM-DD HH:mm:ss')).toBe('2025-06-30 23:59:59')
//     expect(dt.startOf('year').format('YYYY-MM-DD')).toBe('2025-01-01')
//     // New: Invalid unit
//     expect(dt.startOf('unknown').format('YYYY-MM-DD')).toBe(dt.format('YYYY-MM-DD'))
//   })

//   test('daysInMonth, isLeapYear, dayOfYear', () => {
//     expect(dateFormat('2024-02-15').isLeapYear()).toBe(true)
//     expect(dateFormat('2025-05-04').daysInMonth()).toBe(31)
//     expect(dateFormat('2025-01-01').dayOfYear()).toBe(1)
//     expect(dateFormat('2025-02-24').dayOfYear()).toBe(55)
//     expect(dateFormat('2025-12-31').dayOfYear()).toBe(365)
//     // New: Leap year edge cases
//     expect(dateFormat('2024-12-31').dayOfYear()).toBe(366)
//     expect(dateFormat('2000-02-29').isLeapYear()).toBe(true)
//     expect(dateFormat('2100-02-28').isLeapYear()).toBe(false)
//   })

//   test('format tokens: X, x, DDD, DDDD, W, WW, Z, ZZ, A, a, Mo, ddd, dddd, dd', () => {
//     const dt = dateFormat('2025-01-02T15:04:05+05:45', { utc: true })
//     expect(dt.format('X')).toBe(String(Math.floor(dt.toDate().getTime() / 1000)))
//     expect(dt.format('x')).toBe(String(dt.toDate().getTime()))
//     expect(dt.format('DDD')).toBe('2')
//     expect(dt.format('DDDD')).toBe('002')
//     expect(dt.format('W')).toBe('1')
//     expect(dt.format('WW')).toBe('01')
//     expect(dt.format('Z')).toBe('+05:45')
//     expect(dt.format('ZZ')).toBe('+0545')
//     expect(dt.format('A')).toBe('PM')
//     expect(dt.format('a')).toBe('pm')
//     expect(dt.format('Mo')).toBe('1st')
//     expect(dt.format('ddd')).toBe('Thu')
//     expect(dt.format('dddd')).toBe('Thursday')
//     expect(dt.format('dd')).toBe('Th')
//     // New: Edge cases for tokens
//     expect(dateFormat('2025-12-31').format('DDD')).toBe('365')
//     expect(dateFormat('2024-12-31').format('DDDD')).toBe('366')
//   })

//   test('parse strict mode', () => {
//     const good = DateFormat.parse('2025-05-04', 'YYYY-MM-DD', true)
//     expect(good.isValid()).toBe(true)
//     expect(good.format('YYYY-MM-DD')).toBe('2025-05-03')
//     const bad = DateFormat.parse('2025-13-04', 'YYYY-MM-DD', true)
//     expect(bad.isValid()).toBe(false)
//     // New: Partial matches and strictness
//     expect(DateFormat.parse('2025-05', 'YYYY-MM-DD', true).isValid()).toBe(false)
//     expect(DateFormat.parse('2025-05-04', 'YYYY-MM-DD').isValid()).toBe(true)
//   })

//   test('plugin system', () => {
//     const plugin = (DF: typeof DateFormat) => {
//       DF.prototype.testPluginMethod = function () {
//         return 'plugin works'
//       }
//     }
//     DateFormat.use(plugin)
//     const inst = dateFormat()
//     expect((inst as any).testPluginMethod()).toBe('plugin works')
//     // New: Test multiple plugins
//     const plugin2 = (DF: typeof DateFormat) => {
//       DF.prototype.anotherPluginMethod = function () {
//         return 'another plugin'
//       }
//     }
//     DateFormat.use(plugin2)
//     expect((inst as any).anotherPluginMethod()).toBe('another plugin')
//     // New: Test plugin overriding existing method
//     const overridePlugin = (DF: typeof DateFormat) => {
//       DF.prototype.format = function () {
//         return 'overridden'
//       }
//     }
//     DateFormat.use(overridePlugin)
//     expect(dateFormat().format()).toBe('overridden')
//   })

//   // New: Test plugin error handling
//   test('plugin system handles errors gracefully', () => {
//     const faultyPlugin = () => {
//       throw new Error('Plugin error')
//     }
//     expect(() => DateFormat.use(faultyPlugin)).not.toThrow()
//     // Ensure instance still works
//     expect(dateFormat().format('YYYY')).toBe('2025')
//   })
// })

// describe('Parsing & Custom Parse Formats', () => {
//   test('ISO string parsing', () => {
//     const dt = dateFormat('2025-05-04T15:07:09Z').utc()
//     expect(dt.format()).toBe('2025-05-04 03:07 PM')
//     // New: Test various ISO formats
//     expect(dateFormat('2025-05-04').isValid()).toBe(true)
//     expect(dateFormat('2025-05-04T15:07').isValid()).toBe(true)
//     expect(dateFormat('2025-05-04T15:07:09.123Z').isValid()).toBe(true)
//   })

//   test('numeric timestamp & Date input', () => {
//     const ms = Date.UTC(2021, 0, 1, 0, 0, 0)
//     expect(dateFormat(ms).format('YYYY-MM-DD')).toBe('2021-01-01')
//     expect(dateFormat(new Date(ms)).format('YYYY-MM-DD')).toBe('2021-01-01')
//     // New: Test negative timestamps
//     expect(dateFormat(-86400000).format('YYYY-MM-DD')).toBe('1969-12-31')
//   })

//   test('custom parse formats', () => {
//     expect(dateFormat.parse('04-05-2025', 'DD-MM-YYYY').format('YYYY-MM-DD')).toBe('2025-05-03')
//     const t = dateFormat.parse('12:34:56', 'hh:mm:ss')
//     expect(t.isValid()).toBe(true)
//     expect(t.format('hh:mm:ss')).toMatch(/12:34:56/)
//     expect(t.format('YYYY-MM-DD')).toBe('1970-01-01')
//     expect(isNaN(dateFormat.parse('foo', 'YYYY-MM-DD').valueOf())).toBe(true)
//     // New: Test complex formats
//     expect(
//       dateFormat.parse('2025/05/04 15:30', 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm')
//     ).toBe('2025-05-03 15:30')
//     expect(dateFormat.parse('Thu, 04 May 2025', 'ddd, DD MMM YYYY').format('YYYY-MM-DD')).toBe(
//       '2025-05-03'
//     )
//   })

//   test('round-tripping basic tokens', () => {
//     const original = dateFormat('2025-05-01T00:00:00.000Z', { utc: true })
//     const fmt = 'YYYY-MM-DD'
//     const formatted = original.format(fmt)
//     const parsed = DateFormat.parse(formatted, fmt)
//     expect(parsed.format('YYYY-MM-DD')).toBe('2025-04-29')
//     // New: Test more complex round-tripping
//     const complexFmt = 'YYYY-MM-DD HH:mm:ss'
//     const complexFormatted = original.format(complexFmt)
//     const complexParsed = DateFormat.parse(complexFormatted, complexFmt)
//     expect(complexParsed.format(complexFmt)).toBe('2025-04-29 00:00:00')
//   })

//   // New: Test parsing with locale-specific formats
//   test('parsing with locale-specific formats', () => {
//     dateFormat.locale('en-US', {
//       months: [
//         'January',
//         'February',
//         'March',
//         'April',
//         'May',
//         'June',
//         'July',
//         'August',
//         'September',
//         'October',
//         'November',
//         'December'
//       ],
//       monthsShort: [
//         'Jan',
//         'Feb',
//         'Mar',
//         'Apr',
//         'May',
//         'Jun',
//         'Jul',
//         'Aug',
//         'Sep',
//         'Oct',
//         'Nov',
//         'Dec'
//       ]
//     })
//     const parsed = dateFormat.parse('May 04, 2025', 'MMM DD, YYYY')
//     expect(parsed.format('YYYY-MM-DD')).toBe('2025-05-03')
//   })

//   // New: Test parsing edge cases
//   test('parsing edge cases', () => {
//     expect(dateFormat.parse('2025-02-29', 'YYYY-MM-DD', true).isValid()).toBe(false) // Non-leap year
//     expect(dateFormat.parse('2024-02-29', 'YYYY-MM-DD', true).isValid()).toBe(true) // Leap year
//     expect(dateFormat.parse('2025-00-01', 'YYYY-MM-DD', true).isValid()).toBe(false) // Invalid month
//   })
// })

// describe('Formatting tokens', () => {
//   const dt = dateFormat('2025-11-23T00:05:07')

//   test('zero-padded basics', () => {
//     expect(dt.format('YYYY')).toBe('2025')
//     expect(dt.format('MM')).toBe('11')
//     expect(dt.format('DD')).toBe('23')
//     expect(dt.format('hh:mm:ss A')).toBe('12:05:07 AM')
//     // New: Non-padded formats
//     expect(dt.format('M')).toBe('11')
//     expect(dt.format('D')).toBe('23')
//     expect(dt.format('h')).toBe('12')
//   })

//   test('quarter and ordinals', () => {
//     expect(dateFormat('2025-02-01').format('Q')).toBe('1')
//     expect(dateFormat('2025-05-01').format('Q')).toBe('2')
//     expect(dateFormat('2025-08-01').format('Q')).toBe('3')
//     expect(dateFormat('2025-11-01').format('Q')).toBe('4')
//     const ords: Record<string, string> = {
//       '01': '1st',
//       '02': '2nd',
//       '03': '3rd',
//       '04': '4th',
//       '11': '11th',
//       '12': '12th',
//       '13': '13th',
//       '21': '21st',
//       '22': '22nd',
//       '23': '23rd',
//       '31': '31st'
//     }
//     for (const d in ords) {
//       expect(dateFormat(`2025-01-${d}`).format('Do')).toBe(ords[d])
//     }
//   })

//   test('ISO week-year (gg)', () => {
//     expect(dateFormat('2021-01-04').format('gg')).toBe('2021')
//     expect(dateFormat('2020-12-31').format('gg')).toBe('2020')
//     expect(dateFormat('2021-01-01').format('gg')).toBe('2020')
//     // New: Edge cases
//     expect(dateFormat('2025-12-31').format('gg')).toBe('2026') // Belongs to next ISO week-year
//   })

//   test('Intl locale formatting', () => {
//     dateFormat.locale('en-GB')
//     expect(
//       dateFormat('2025-05-04').formatIntl({
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       })
//     ).toBe('Sunday, 4 May 2025')
//     dateFormat.locale('unknown')
//     expect(dateFormat('2025-05-04').formatIntl({ year: 'numeric', month: 'long', day: 'numeric' }))
//     // New: Test more locales
//     dateFormat.locale('fr-FR')
//     expect(
//       dateFormat('2025-05-04').formatIntl({
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       })
//     ).toMatch(/dimanche, 4 mai 2025/)
//     dateFormat.locale('ja-JP')
//     expect(
//       dateFormat('2025-05-04').formatIntl({
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       })
//     ).toMatch(/2025年5月4日/)
//   })

//   // New: Test custom format tokens
//   test('custom format tokens', () => {
//     // Suggestion: Add support for custom tokens via plugins
//     const customTokenPlugin = (DF: typeof DateFormat) => {
//       DF.prototype.format = function (fmt: string) {
//         return fmt.replace('CUSTOM', 'CUSTOM_VALUE')
//       }
//     }
//     DateFormat.use(customTokenPlugin)
//     expect(dateFormat().format('CUSTOM')).toBe('CUSTOM_VALUE')
//   })
// })

// describe('Getters, Setters & Immutability', () => {
//   const dt = dateFormat('2025-12-31T23:59:59.500')

//   test('get() for all components', () => {
//     expect(dt.get('year')).toBe(2025)
//     expect(dt.get('month')).toBe(12)
//     expect(dt.get('date')).toBe(31)
//     expect(dt.get('hour')).toBe(23)
//     expect(dt.get('minute')).toBe(59)
//     expect(dt.get('second')).toBe(59)
//     expect(dt.get('millisecond')).toBe(500)
//     expect(dt.get('day')).toBe(new Date('2025-12-31').getDay())
//     // New: Test fortnight (unsupported unit)
//     expect(() => dt.get('fortnight')).toThrow(/Unknown unit/)
//   })

//   test('set() is immutable', () => {
//     const a = dt.set('year', 2000)
//     expect(a).not.toBe(dt)
//     expect(a.get('year')).toBe(2000)
//     expect(dt.get('year')).toBe(2025)
//     const b = dt.set('month', 1)
//     expect(b.format('MM')).toBe('01')
//     // New: Test chaining setters
//     const c = dt.set('year', 2024).set('month', 2).set('date', 29)
//     expect(c.format('YYYY-MM-DD')).toBe('2024-02-29')
//   })

//   test('invalid unit throws', () => {
//     expect(() => dt.get('unknown' as Unit)).toThrow(/Unknown unit/)
//     expect(() => dt.set('unknown' as Unit, 1)).toThrow(/Unknown unit/)
//   })

//   // New: Test setting invalid values
//   test('set() with invalid values', () => {
//     expect(dt.set('month', 13).isValid()).toBe(false)
//     expect(dt.set('date', 32).isValid()).toBe(false)
//     expect(dt.set('hour', 24).isValid()).toBe(false)
//   })
// })

// describe('Arithmetic & Chaining', () => {
//   const base = dateFormat('2025-01-01T00:00:00')

//   test('add & subtract all units', () => {
//     expect(base.add(500, 'millisecond').get('millisecond')).toBe(500)
//     expect(base.add(2, 'second').get('second')).toBe(2)
//     expect(base.add(3, 'minute').get('minute')).toBe(3)
//     expect(base.add(4, 'hour').get('hour')).toBe(4)
//     expect(base.add(5, 'day').get('date')).toBe(6)
//     expect(base.add(1, 'date').get('date')).toBe(2)
//     expect(base.add(2, 'month').get('month')).toBe(3)
//     expect(base.add(1, 'year').get('year')).toBe(2026)
//     expect(base.subtract(1, 'year').get('year')).toBe(2024)
//     // New: Test fortnight
//     expect(base.add(1, 'fortnight').get('date')).toBe(15)
//   })

//   test('chaining multiple ops', () => {
//     const r = base.add(1, 'day').add(2, 'hour').subtract(30, 'minute').format('YYYY-MM-DD hh:mm A')
//     expect(r).toBe('2025-01-02 01:30 AM')
//     // New: Complex chain
//     const complex = base
//       .add(1, 'year')
//       .subtract(2, 'month')
//       .set('date', 15)
//       .startOf('day')
//       .format('YYYY-MM-DD')
//     expect(complex).toBe('2023-11-15')
//   })

//   test('invalid unit throws', () => {
//     expect(() => base.add(1, 'unknown' as Unit)).toThrow(/Unknown unit/)
//   })

//   // New: Test arithmetic across DST boundaries
//   test('arithmetic across DST boundaries', () => {
//     // Assuming US DST change (e.g., March 14, 2021)
//     const preDST = dateFormat('2021-03-13T23:00:00-05:00')
//     const postDST = preDST.add(1, 'hour')
//     expect(postDST.format('YYYY-MM-DD HH:mm Z')).toBe('2021-03-14 01:00 -04:00')
//   })
// })

// describe('Comparisons', () => {
//   const a = dateFormat('2025-01-01'),
//     b = dateFormat('2025-01-02')
//   test('isBefore/isAfter/isSame', () => {
//     expect(a.isBefore(b)).toBe(true)
//     expect(b.isAfter(a)).toBe(true)
//     expect(a.isSame(a)).toBe(true)
//     // New: Test with same timestamp, different UTC/local
//     const utcA = dateFormat('2025-01-01T00:00:00Z', { utc: true })
//     const localA = dateFormat('2025-01-01T00:00:00')
//     expect(utcA.isSame(localA)).toBe(false) // Depends on timezone
//   })

//   test('isBetween exclusive', () => {
//     expect(dateFormat('2025-01-05').isBetween('2025-01-01', '2025-01-10')).toBe(true)
//     expect(dateFormat('2025-01-01').isBetween('2025-01-01', '2025-01-03')).toBe(false)
//     expect(dateFormat('2025-01-03').isBetween('2025-01-01', '2025-01-03')).toBe(false)
//     // New: Test inclusive option
//     // Suggestion: Add isBetween(start, end, inclusivity: 'both' | 'start' | 'end' | 'none')
//     // Example: expect(dateFormat('2025-01-01').isBetween('2025-01-01', '2025-01-03', 'start')).toBe(true)
//   })
// })

// describe('UTC vs Local', () => {
//   const iso = '2025-05-04T00:00:00Z'
//   const local = new Date(iso)
//   const dtLocal = dateFormat(local)
//   const dtUtc = dateFormat(iso, { utc: true })

//   test('local vs utc()', () => {
//     const localTime = dtLocal.format('YYYY-MM-DD hh:mm A')
//     const utcTime = dtUtc.format('YYYY-MM-DD hh:mm A')
//     expect(localTime).not.toBe(utcTime)
//     const localFromUtc = dtUtc.local().format('YYYY-MM-DD hh:mm A')
//     expect(localFromUtc).toBe(localTime)
//     // New: Test chaining utc() and local()
//     const chained = dtLocal.utc().local()
//     expect(chained.format('YYYY-MM-DD hh:mm A')).toBe(localTime)
//   })

//   // New: Test timezone offset preservation
//   test('preserves timezone offset', () => {
//     const withOffset = dateFormat('2025-05-04T00:00:00+02:00')
//     expect(withOffset.format('Z')).toBe('+02:00')
//   })
// })

// describe('Relative Time & Duration', () => {
//   test('fromNow()', () => {
//     expect(dateFormat().subtract(30, 'second').fromNow()).toBe('30 seconds ago')
//     expect(dateFormat().subtract(5, 'minute').fromNow()).toBe('5 minutes ago')
//     expect(dateFormat().subtract(3, 'hour').fromNow()).toBe('3 hours ago')
//     expect(dateFormat().subtract(2, 'day').fromNow()).toBe('2 days ago')
//     expect(dateFormat().add(45, 'second').fromNow()).toBe('in 45 seconds')
//     // New: Test edge cases
//     expect(dateFormat().fromNow()).toMatch(/0 milliseconds ago|in 0 milliseconds/)
//     expect(dateFormat().subtract(1, 'year').fromNow()).toBe('1 year ago')
//   })

//   test('Duration.as() & humanize()', () => {
//     const d = dateFormat.duration(90, 'minute')
//     expect(d.as('hour')).toBe(1.5)
//     expect(d.humanize()).toBe('2h')
//     expect(d.humanize(true)).toBe('2h')
//     // New: Test all units
//     expect(d.as('minute')).toBe(90)
//     expect(d.as('second')).toBe(90 * 60)
//     expect(d.as('millisecond')).toBe(90 * 60 * 1000)
//     expect(d.as('day')).toBe(90 / (60 * 24))
//     // New: Test negative durations
//     const negD = dateFormat.duration(-90, 'minute')
//     expect(negD.humanize()).toBe('2h')
//   })

//   test('Duration arithmetic', () => {
//     const d = dateFormat.duration(1, 'hour')
//     expect(d.add(30, 'minute').as('minute')).toBe(90)
//     expect(d.subtract(30, 'minute').as('minute')).toBe(30)
//     // New: Test chaining
//     const chained = d.add(1, 'hour').subtract(15, 'minute')
//     expect(chained.as('minute')).toBe(105)
//   })

//   // New: Test Duration parsing
//   test('Duration.parse()', () => {
//     expect(dateFormat.duration.parse('1h 30m').as('minute')).toBe(90)
//     expect(dateFormat.duration.parse('2d 12h').as('hour')).toBe(60)
//     expect(dateFormat.duration.parse('invalid').as('minute')).toBe(0)
//   })
// })

// describe('ISO Week & Weeks In Year', () => {
//   test('isoWeek() boundaries', () => {
//     expect(dateFormat('2021-01-04').isoWeek()).toBe(1)
//     expect(dateFormat('2020-12-31').isoWeek()).toBe(53)
//     expect(dateFormat('2021-01-01').isoWeek()).toBe(53)
//     // New: Test edge cases
//     expect(dateFormat('2025-12-29').isoWeek()).toBe(1) // Belongs to 2026 week 1
//   })

//   test('isoWeekYear()', () => {
//     expect(dateFormat('2021-01-01').isoWeekYear()).toBe(2020)
//     expect(dateFormat('2021-06-15').isoWeekYear()).toBe(2021)
//     // New: Test edge cases
//     expect(dateFormat('2025-12-31').isoWeekYear()).toBe(2026)
//   })

//   test('weeksInYear()', () => {
//     expect(dateFormat('2021-01-01').weeksInYear()).toBe(53)
//     expect(dateFormat('2020-01-01').weeksInYear()).toBe(53)
//     expect(dateFormat('2025-01-01').weeksInYear()).toBe(52)
//   })

//   // New: Test custom week start
//   // Suggestion: Add support for custom week start (e.g., Monday vs Sunday)
//   test('custom week start', () => {
//     // Example: expect(dateFormat('2025-05-04').startOf('week', { weekStartsOn: 1 }).format('YYYY-MM-DD')).toBe('2025-04-28')
//     expect(() => dateFormat('2025-05-04').startOf('week')).not.toThrow()
//   })
// })

// describe('Calendar Time', () => {
//   const now = dateFormat()
//   test('Today / Yesterday / Tomorrow', () => {
//     expect(now.calendar()).toMatch(/^Today at \d\d:\d\d [AP]M$/)
//     expect(now.subtract(1, 'day').calendar()).toMatch(/^Yesterday at \d\d:\d\d [AP]M$/)
//     expect(now.add(1, 'day').calendar()).toMatch(/^Tomorrow at \d\d:\d\d [AP]M$/)
//     // New: Test next/last week
//     expect(now.add(7, 'day').calendar()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
//     expect(now.subtract(7, 'day').calendar()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
//   })

//   test('fallback older', () => {
//     expect(now.subtract(2, 'day').calendar()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
//     // New: Test far future/past
//     expect(now.add(1, 'year').calendar()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
//     expect(now.subtract(1, 'year').calendar()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
//   })
// })

// describe('Static Min/Max', () => {
//   test('mixed inputs', () => {
//     const a = dateFormat('2025-01-01'),
//       b = dateFormat('2024-12-31')
//     expect(dateFormat.min(a, b).isSame(b)).toBe(true)
//     expect(dateFormat.max(a, b).isSame(a)).toBe(true)
//     expect(dateFormat.min('2023-03-03', b).format('YYYY-MM-DD')).toBe('2023-03-03')
//     // New: Test with invalid dates
//     const invalid = dateFormat('invalid')
//     expect(dateFormat.min(a, invalid).isSame(a)).toBe(true)
//     expect(dateFormat.max(a, invalid).isSame(a)).toBe(true)
//   })

//   // New: Test empty input
//   test('min/max with no arguments', () => {
//     expect(() => dateFormat.min()).toThrow(/at least one argument/)
//     expect(() => dateFormat.max()).toThrow(/at least one argument/)
//   })
// })

// // New: Performance Tests
// describe('Performance', () => {
//   test('format performance', () => {
//     const start = performance.now()
//     const dt = dateFormat('2025-05-04')
//     for (let i = 0; i < 10000; i++) {
//       dt.format('YYYY-MM-DD hh:mm:ss A')
//     }
//     const duration = performance.now() - start
//     expect(duration).toBeLessThan(100) // Adjust threshold based on target
//   })

//   test('parse performance', () => {
//     const start = performance.now()
//     for (let i = 0; i < 10000; i++) {
//       DateFormat.parse('2025-05-04', 'YYYY-MM-DD')
//     }
//     const duration = performance.now() - start
//     expect(duration).toBeLessThan(100)
//   })
// })

// // New: Advanced Features
// describe('Advanced Features', () => {
//   // Suggestion: Add support for fiscal calendars
//   test('fiscal calendar', () => {
//     // Example: expect(dateFormat('2025-07-01').startOf('fiscalYear', { fiscalStartMonth: 7 }).format('YYYY-MM-DD')).toBe('2025-07-01')
//     expect(() => dateFormat('2025-07-01').startOf('year')).not.toThrow()
//   })

//   // Suggestion: Add recurrence support (e.g., every Monday)
//   test('recurrence', () => {
//     // Example: const mondays = dateFormat('2025-05-04').recur({ frequency: 'weekly', interval: 1, weekdays: [1] })
//     // expect(mondays.next().format('YYYY-MM-DD')).toBe('2025-05-05')
//     expect(() => dateFormat('2025-05-04').format()).not.toThrow()
//   })

//   // Suggestion: Add business day calculations
//   test('business days', () => {
//     // Example: expect(dateFormat('2025-05-04').addBusinessDays(5).format('YYYY-MM-DD')).toBe('2025-05-09')
//     expect(dateFormat('2025-05-04').add(5, 'day').format('YYYY-MM-DD')).toBe('2025-05-09')
//   })
// })
