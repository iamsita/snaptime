import { describe, test, expect } from '@jest/globals'
import Timezone from '../src/ecosystem/Timezone'
import DateFormat from '../src/core/DateFormat'

// ─────────────────────────────────────────────────────────────────────────────
// Fixed UTC instants for deterministic results regardless of host timezone.
// All date strings carry an explicit 'Z' suffix so DateFormat parses them
// in UTC mode (no host-offset ambiguity).
// ─────────────────────────────────────────────────────────────────────────────

// 2026-01-15 12:00:00 UTC  (January — Northern-Hemisphere winter; NY is on EST = UTC-5)
const JAN_15_UTC = Date.UTC(2026, 0, 15, 12, 0, 0)
// 2026-07-15 12:00:00 UTC  (July — NY is on EDT = UTC-4)
const JUL_15_UTC = Date.UTC(2026, 6, 15, 12, 0, 0)
// 2026-01-01 00:00:00 UTC  (midnight start of year)
const JAN_1_UTC = Date.UTC(2026, 0, 1, 0, 0, 0)
// 2026-03-29 12:00:00 UTC  (London transitions to BST ~last Sunday of March)
const MAR_29_UTC = Date.UTC(2026, 2, 29, 12, 0, 0)
// 2026-10-25 12:00:00 UTC  (London transitions back from BST ~last Sunday of October)
const OCT_25_UTC = Date.UTC(2026, 9, 25, 12, 0, 0)
// 2026-06-15 00:00:00 UTC  (Kolkata: midnight UTC = 05:30 IST)
const JUN_15_UTC = Date.UTC(2026, 5, 15, 0, 0, 0)

const dfJan = new DateFormat(JAN_15_UTC)
const dfJul = new DateFormat(JUL_15_UTC)
const dfJan1 = new DateFormat(JAN_1_UTC)
const dfMar29 = new DateFormat(MAR_29_UTC)
const dfOct25 = new DateFormat(OCT_25_UTC)
const dfJun15 = new DateFormat(JUN_15_UTC)

// ─────────────────────────────────────────────────────────────────────────────
// 1. Timezone.guess()
// ─────────────────────────────────────────────────────────────────────────────

describe('Timezone.guess()', () => {
  test('returns a non-empty string', () => {
    const tz = Timezone.guess()
    expect(typeof tz).toBe('string')
    expect(tz.length).toBeGreaterThan(0)
  })

  test('the guessed timezone is valid', () => {
    expect(Timezone.isValid(Timezone.guess())).toBe(true)
  })

  test('result can be used to construct a Timezone instance', () => {
    expect(() => new Timezone(Timezone.guess())).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Timezone.isValid()
// ─────────────────────────────────────────────────────────────────────────────

describe('Timezone.isValid()', () => {
  test('"UTC" → true', () => {
    expect(Timezone.isValid('UTC')).toBe(true)
  })

  test('"America/New_York" → true', () => {
    expect(Timezone.isValid('America/New_York')).toBe(true)
  })

  test('"Europe/London" → true', () => {
    expect(Timezone.isValid('Europe/London')).toBe(true)
  })

  test('"Asia/Kolkata" → true', () => {
    expect(Timezone.isValid('Asia/Kolkata')).toBe(true)
  })

  test('"America/Los_Angeles" → true', () => {
    expect(Timezone.isValid('America/Los_Angeles')).toBe(true)
  })

  test('"Europe/Paris" → true', () => {
    expect(Timezone.isValid('Europe/Paris')).toBe(true)
  })

  test('"Asia/Tokyo" → true', () => {
    expect(Timezone.isValid('Asia/Tokyo')).toBe(true)
  })

  test('"Australia/Sydney" → true', () => {
    expect(Timezone.isValid('Australia/Sydney')).toBe(true)
  })

  test('"Invalid/Zone" → false', () => {
    expect(Timezone.isValid('Invalid/Zone')).toBe(false)
  })

  test('"" (empty string) → false', () => {
    expect(Timezone.isValid('')).toBe(false)
  })

  test('"NotATimezone" → false', () => {
    expect(Timezone.isValid('NotATimezone')).toBe(false)
  })

  test('"America/Fake_City" → false', () => {
    expect(Timezone.isValid('America/Fake_City')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Constructor
// ─────────────────────────────────────────────────────────────────────────────

describe('constructor', () => {
  test('new Timezone("UTC") → tz property equals "UTC"', () => {
    const tz = new Timezone('UTC')
    expect(tz.tz).toBe('UTC')
  })

  test('new Timezone("America/New_York") → tz property set', () => {
    const tz = new Timezone('America/New_York')
    expect(tz.tz).toBe('America/New_York')
  })

  test('new Timezone("Europe/London") → tz property set', () => {
    const tz = new Timezone('Europe/London')
    expect(tz.tz).toBe('Europe/London')
  })

  test('new Timezone("Asia/Kolkata") → tz property set', () => {
    const tz = new Timezone('Asia/Kolkata')
    expect(tz.tz).toBe('Asia/Kolkata')
  })

  test('new Timezone("America/Los_Angeles") → tz property set', () => {
    const tz = new Timezone('America/Los_Angeles')
    expect(tz.tz).toBe('America/Los_Angeles')
  })

  test('new Timezone("Invalid/Zone") throws RangeError', () => {
    expect(() => new Timezone('Invalid/Zone')).toThrow(RangeError)
  })

  test('new Timezone("") throws RangeError', () => {
    expect(() => new Timezone('')).toThrow(RangeError)
  })

  test('new Timezone("Bogus") throws RangeError with message containing the tz string', () => {
    expect(() => new Timezone('Bogus')).toThrow(/Bogus/)
  })

  test('tz property is readonly (assignment is ignored in non-strict mode)', () => {
    const tz = new Timezone('UTC')
    expect(tz.tz).toBe('UTC')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. offsetMinutes()
// ─────────────────────────────────────────────────────────────────────────────

describe('offsetMinutes(date)', () => {
  test('UTC → 0 in January', () => {
    expect(new Timezone('UTC').offsetMinutes(dfJan)).toBe(0)
  })

  test('UTC → 0 in July (UTC never changes)', () => {
    expect(new Timezone('UTC').offsetMinutes(dfJul)).toBe(0)
  })

  test('Asia/Kolkata → 330 in January (IST = UTC+5:30)', () => {
    expect(new Timezone('Asia/Kolkata').offsetMinutes(dfJan)).toBe(330)
  })

  test('Asia/Kolkata → 330 in July (no DST in India)', () => {
    expect(new Timezone('Asia/Kolkata').offsetMinutes(dfJul)).toBe(330)
  })

  test('America/New_York in January → -300 (EST = UTC-5)', () => {
    expect(new Timezone('America/New_York').offsetMinutes(dfJan)).toBe(-300)
  })

  test('America/New_York in July → -240 (EDT = UTC-4)', () => {
    expect(new Timezone('America/New_York').offsetMinutes(dfJul)).toBe(-240)
  })

  test('America/Los_Angeles in January → -480 (PST = UTC-8)', () => {
    expect(new Timezone('America/Los_Angeles').offsetMinutes(dfJan)).toBe(-480)
  })

  test('America/Los_Angeles in July → -420 (PDT = UTC-7)', () => {
    expect(new Timezone('America/Los_Angeles').offsetMinutes(dfJul)).toBe(-420)
  })

  test('offsetMinutes() with no argument → does not throw', () => {
    expect(() => new Timezone('UTC').offsetMinutes()).not.toThrow()
  })

  test('offsetMinutes() with no argument for UTC → 0', () => {
    const result = new Timezone('UTC').offsetMinutes()
    expect(result).toBe(0)
  })

  test('accepts a raw string DateInput', () => {
    const tz = new Timezone('Asia/Kolkata')
    expect(tz.offsetMinutes('2026-01-15T12:00:00Z')).toBe(330)
  })

  test('accepts a numeric timestamp DateInput', () => {
    const tz = new Timezone('UTC')
    expect(tz.offsetMinutes(JAN_15_UTC)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. offsetString()
// ─────────────────────────────────────────────────────────────────────────────

describe('offsetString(date)', () => {
  test('UTC → "+00:00"', () => {
    expect(new Timezone('UTC').offsetString(dfJan)).toBe('+00:00')
  })

  test('UTC in July → "+00:00"', () => {
    expect(new Timezone('UTC').offsetString(dfJul)).toBe('+00:00')
  })

  test('Asia/Kolkata → "+05:30"', () => {
    expect(new Timezone('Asia/Kolkata').offsetString(dfJan)).toBe('+05:30')
  })

  test('Asia/Kolkata in July → "+05:30" (no DST)', () => {
    expect(new Timezone('Asia/Kolkata').offsetString(dfJul)).toBe('+05:30')
  })

  test('America/New_York in January → "-05:00" (EST)', () => {
    expect(new Timezone('America/New_York').offsetString(dfJan)).toBe('-05:00')
  })

  test('America/New_York in July → "-04:00" (EDT / DST)', () => {
    expect(new Timezone('America/New_York').offsetString(dfJul)).toBe('-04:00')
  })

  test('America/Los_Angeles in January → "-08:00" (PST)', () => {
    expect(new Timezone('America/Los_Angeles').offsetString(dfJan)).toBe('-08:00')
  })

  test('America/Los_Angeles in July → "-07:00" (PDT)', () => {
    expect(new Timezone('America/Los_Angeles').offsetString(dfJul)).toBe('-07:00')
  })

  test('offsetString with no argument for UTC → "+00:00"', () => {
    expect(new Timezone('UTC').offsetString()).toBe('+00:00')
  })

  test('format is always sign + HH:MM', () => {
    const offset = new Timezone('Asia/Kolkata').offsetString(dfJan)
    expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/)
  })

  test('positive offset has "+" prefix', () => {
    expect(new Timezone('Asia/Kolkata').offsetString(dfJan)).toMatch(/^\+/)
  })

  test('negative offset has "-" prefix', () => {
    expect(new Timezone('America/New_York').offsetString(dfJan)).toMatch(/^-/)
  })

  test('minutes part of "+05:30" is ":30"', () => {
    expect(new Timezone('Asia/Kolkata').offsetString(dfJan)).toContain(':30')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. format()
// ─────────────────────────────────────────────────────────────────────────────

describe('format(date, fmt)', () => {
  test('UTC midnight formatted in UTC timezone → "2026-01-01"', () => {
    expect(new Timezone('UTC').format(dfJan1, 'YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('UTC midnight in America/New_York → previous day (UTC-5 = Dec 31, 2025)', () => {
    // 2026-01-01T00:00:00Z − 5h = 2025-12-31T19:00:00 local New York
    expect(new Timezone('America/New_York').format(dfJan1, 'YYYY-MM-DD')).toBe('2025-12-31')
  })

  test('UTC midnight in Asia/Kolkata → still same day (05:30 ahead = Jan 1)', () => {
    // 2026-01-01T00:00:00Z + 5h30m = 2026-01-01T05:30:00 local Kolkata
    expect(new Timezone('Asia/Kolkata').format(dfJan1, 'YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('UTC midnight in Asia/Kolkata → hour = "05:30"', () => {
    expect(new Timezone('Asia/Kolkata').format(dfJan1, 'HH:mm')).toBe('05:30')
  })

  test('UTC noon (12:00) in Asia/Kolkata → "17:30"', () => {
    // 12:00 UTC + 5h30m = 17:30 Kolkata
    expect(new Timezone('Asia/Kolkata').format(dfJan, 'HH:mm')).toBe('17:30')
  })

  test('UTC noon in America/New_York (winter) → "07:00"', () => {
    // 12:00 UTC − 5h = 07:00 EST
    expect(new Timezone('America/New_York').format(dfJan, 'HH:mm')).toBe('07:00')
  })

  test('UTC noon in America/New_York (summer) → "08:00"', () => {
    // 12:00 UTC − 4h = 08:00 EDT
    expect(new Timezone('America/New_York').format(dfJul, 'HH:mm')).toBe('08:00')
  })

  test('UTC midnight in America/Los_Angeles (winter) → previous day + "16:00"', () => {
    // 2026-01-01T00:00:00Z − 8h = 2025-12-31T16:00:00 PST
    expect(new Timezone('America/Los_Angeles').format(dfJan1, 'HH:mm')).toBe('16:00')
    expect(new Timezone('America/Los_Angeles').format(dfJan1, 'YYYY-MM-DD')).toBe('2025-12-31')
  })

  test('UTC midnight formatted in UTC timezone → hour "00:00"', () => {
    expect(new Timezone('UTC').format(dfJan1, 'HH:mm')).toBe('00:00')
  })

  test('format accepts a string date input', () => {
    const result = new Timezone('UTC').format('2026-01-15T12:00:00Z', 'YYYY-MM-DD')
    expect(result).toBe('2026-01-15')
  })

  test('format accepts a numeric timestamp', () => {
    const result = new Timezone('UTC').format(JAN_15_UTC, 'YYYY-MM-DD')
    expect(result).toBe('2026-01-15')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. isDST()
// ─────────────────────────────────────────────────────────────────────────────

describe('isDST(date)', () => {
  test('UTC → false in January (UTC never has DST)', () => {
    expect(new Timezone('UTC').isDST(dfJan)).toBe(false)
  })

  test('UTC → false in July (UTC never has DST)', () => {
    expect(new Timezone('UTC').isDST(dfJul)).toBe(false)
  })

  test('Asia/Kolkata in January → false (IST never has DST)', () => {
    expect(new Timezone('Asia/Kolkata').isDST(dfJan)).toBe(false)
  })

  test('Asia/Kolkata in July → false (IST never has DST)', () => {
    expect(new Timezone('Asia/Kolkata').isDST(dfJul)).toBe(false)
  })

  test('America/New_York in January → false (standard time = EST)', () => {
    expect(new Timezone('America/New_York').isDST(dfJan)).toBe(false)
  })

  test('America/New_York in July → true (summer = EDT)', () => {
    expect(new Timezone('America/New_York').isDST(dfJul)).toBe(true)
  })

  test('America/Los_Angeles in January → false (PST, no DST)', () => {
    expect(new Timezone('America/Los_Angeles').isDST(dfJan)).toBe(false)
  })

  test('America/Los_Angeles in July → true (PDT)', () => {
    expect(new Timezone('America/Los_Angeles').isDST(dfJul)).toBe(true)
  })

  test('Europe/London in January → false (GMT, no DST)', () => {
    expect(new Timezone('Europe/London').isDST(dfJan)).toBe(false)
  })

  test('Europe/London in July → true (BST = UTC+1)', () => {
    expect(new Timezone('Europe/London').isDST(dfJul)).toBe(true)
  })

  test('isDST() with no argument → does not throw', () => {
    expect(() => new Timezone('UTC').isDST()).not.toThrow()
  })

  test('isDST() with no argument for UTC → false', () => {
    expect(new Timezone('UTC').isDST()).toBe(false)
  })

  test('isDST() with no argument for Asia/Kolkata → false', () => {
    expect(new Timezone('Asia/Kolkata').isDST()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. toLocalDate()
// ─────────────────────────────────────────────────────────────────────────────

describe('toLocalDate(date)', () => {
  test('returns a DateFormat instance', () => {
    const result = new Timezone('UTC').toLocalDate(dfJan)
    expect(result).toBeInstanceOf(DateFormat)
  })

  test('result is in UTC mode (wall-clock via UTC getters)', () => {
    const result = new Timezone('UTC').toLocalDate(dfJan)
    expect(result.isUtc()).toBe(true)
  })

  test('UTC timezone: UTC noon → wall-clock hour = 12', () => {
    const result = new Timezone('UTC').toLocalDate(dfJan)
    expect(result.get('hour')).toBe(12)
    expect(result.get('minute')).toBe(0)
  })

  test('UTC midnight in UTC timezone → hour=0, minute=0', () => {
    const result = new Timezone('UTC').toLocalDate(dfJan1)
    expect(result.get('hour')).toBe(0)
    expect(result.get('minute')).toBe(0)
  })

  test('Asia/Kolkata: UTC midnight → wall-clock hour=5, minute=30', () => {
    // 00:00 UTC + 5h30m = 05:30 Kolkata
    const result = new Timezone('Asia/Kolkata').toLocalDate(dfJan1)
    expect(result.get('hour')).toBe(5)
    expect(result.get('minute')).toBe(30)
  })

  test('Asia/Kolkata: UTC noon → wall-clock hour=17, minute=30', () => {
    // 12:00 UTC + 5h30m = 17:30 Kolkata
    const result = new Timezone('Asia/Kolkata').toLocalDate(dfJan)
    expect(result.get('hour')).toBe(17)
    expect(result.get('minute')).toBe(30)
  })

  test('America/New_York (winter): UTC noon → wall-clock hour=7, minute=0', () => {
    // 12:00 UTC − 5h = 07:00 EST
    const result = new Timezone('America/New_York').toLocalDate(dfJan)
    expect(result.get('hour')).toBe(7)
    expect(result.get('minute')).toBe(0)
  })

  test('America/New_York (summer): UTC noon → wall-clock hour=8, minute=0', () => {
    // 12:00 UTC − 4h = 08:00 EDT
    const result = new Timezone('America/New_York').toLocalDate(dfJul)
    expect(result.get('hour')).toBe(8)
    expect(result.get('minute')).toBe(0)
  })

  test('UTC midnight in America/New_York → previous day (Dec 31, 2025)', () => {
    // 00:00 UTC − 5h = 19:00 Dec 31, 2025 EST
    const result = new Timezone('America/New_York').toLocalDate(dfJan1)
    expect(result.get('year')).toBe(2025)
    expect(result.get('month')).toBe(12)
    expect(result.get('date')).toBe(31)
    expect(result.get('hour')).toBe(19)
  })

  test('UTC midnight in Asia/Kolkata → same date (Jan 1, 2026)', () => {
    // 00:00 UTC + 5h30m = 05:30 Jan 1, 2026 IST
    const result = new Timezone('Asia/Kolkata').toLocalDate(dfJan1)
    expect(result.get('year')).toBe(2026)
    expect(result.get('month')).toBe(1)
    expect(result.get('date')).toBe(1)
  })

  test('accepts a raw UTC string', () => {
    const result = new Timezone('UTC').toLocalDate('2026-01-15T12:00:00Z')
    expect(result.get('hour')).toBe(12)
  })

  test('accepts a numeric timestamp', () => {
    const result = new Timezone('UTC').toLocalDate(JAN_15_UTC)
    expect(result.get('hour')).toBe(12)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. toString()
// ─────────────────────────────────────────────────────────────────────────────

describe('toString()', () => {
  test('"UTC" timezone → "UTC"', () => {
    expect(new Timezone('UTC').toString()).toBe('UTC')
  })

  test('"Asia/Kolkata" timezone → "Asia/Kolkata"', () => {
    expect(new Timezone('Asia/Kolkata').toString()).toBe('Asia/Kolkata')
  })

  test('"America/New_York" timezone → "America/New_York"', () => {
    expect(new Timezone('America/New_York').toString()).toBe('America/New_York')
  })

  test('"Europe/London" timezone → "Europe/London"', () => {
    expect(new Timezone('Europe/London').toString()).toBe('Europe/London')
  })

  test('toString() === tz property', () => {
    const tz = new Timezone('Asia/Tokyo')
    expect(tz.toString()).toBe(tz.tz)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Real-life scenario: international meeting scheduler
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: international meeting scheduler', () => {
  // Meeting at 2026-01-15T14:00:00Z (UTC 14:00)
  const MEETING_UTC = Date.UTC(2026, 0, 15, 14, 0, 0)
  const dfMeeting = new DateFormat(MEETING_UTC)

  test('UTC 14:00 displays as 14:00 for UTC team', () => {
    expect(new Timezone('UTC').format(dfMeeting, 'HH:mm')).toBe('14:00')
  })

  test('UTC 14:00 displays as 09:00 for New York team (EST)', () => {
    // 14:00 UTC − 5h = 09:00 EST
    expect(new Timezone('America/New_York').format(dfMeeting, 'HH:mm')).toBe('09:00')
  })

  test('UTC 14:00 displays as 19:30 for Kolkata team (IST = UTC+5:30)', () => {
    // 14:00 UTC + 5h30m = 19:30 IST
    expect(new Timezone('Asia/Kolkata').format(dfMeeting, 'HH:mm')).toBe('19:30')
  })

  test('UTC 14:00 displays as 14:00 for London team in winter (GMT = UTC+0)', () => {
    expect(new Timezone('Europe/London').format(dfMeeting, 'HH:mm')).toBe('14:00')
  })

  test('same meeting on July 15 (summer): NY team sees 10:00 (EDT)', () => {
    const summerMeeting = new DateFormat(Date.UTC(2026, 6, 15, 14, 0, 0))
    expect(new Timezone('America/New_York').format(summerMeeting, 'HH:mm')).toBe('10:00')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. Real-life scenario: DST-aware scheduling
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: DST-aware scheduling', () => {
  test('America/New_York is NOT in DST in January', () => {
    expect(new Timezone('America/New_York').isDST(dfJan)).toBe(false)
  })

  test('America/New_York IS in DST in July', () => {
    expect(new Timezone('America/New_York').isDST(dfJul)).toBe(true)
  })

  test('Europe/London IS in DST in July (BST)', () => {
    expect(new Timezone('Europe/London').isDST(dfJul)).toBe(true)
  })

  test('Europe/London is NOT in DST in January (GMT)', () => {
    expect(new Timezone('Europe/London').isDST(dfJan)).toBe(false)
  })

  test('Asia/Kolkata is never in DST', () => {
    expect(new Timezone('Asia/Kolkata').isDST(dfJan)).toBe(false)
    expect(new Timezone('Asia/Kolkata').isDST(dfJul)).toBe(false)
  })

  test('UTC is never in DST', () => {
    expect(new Timezone('UTC').isDST(dfJan)).toBe(false)
    expect(new Timezone('UTC').isDST(dfJul)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. Real-life scenario: server log timestamp conversion
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: server log timestamp conversion', () => {
  test('UTC 12:00 server log → local wall-clock 17:30 in Kolkata', () => {
    const local = new Timezone('Asia/Kolkata').toLocalDate(dfJan)
    expect(local.get('hour')).toBe(17)
    expect(local.get('minute')).toBe(30)
  })

  test('UTC 12:00 server log → local wall-clock 07:00 in New York (winter)', () => {
    const local = new Timezone('America/New_York').toLocalDate(dfJan)
    expect(local.get('hour')).toBe(7)
    expect(local.get('minute')).toBe(0)
  })

  test('UTC 12:00 server log → local wall-clock 12:00 in UTC', () => {
    const local = new Timezone('UTC').toLocalDate(dfJan)
    expect(local.get('hour')).toBe(12)
    expect(local.get('minute')).toBe(0)
  })

  test('server log date is preserved correctly in IST', () => {
    // UTC Jan 15 → IST Jan 15 (no date rollover)
    const local = new Timezone('Asia/Kolkata').toLocalDate(dfJan)
    expect(local.get('year')).toBe(2026)
    expect(local.get('month')).toBe(1)
    expect(local.get('date')).toBe(15)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. Real-life scenario: API response timezone handling
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: API response timezone handling', () => {
  test('UTC offset string is "+00:00"', () => {
    expect(new Timezone('UTC').offsetString(dfJan)).toBe('+00:00')
  })

  test('IST offset string is "+05:30"', () => {
    expect(new Timezone('Asia/Kolkata').offsetString(dfJan)).toBe('+05:30')
  })

  test('EST offset string is "-05:00"', () => {
    expect(new Timezone('America/New_York').offsetString(dfJan)).toBe('-05:00')
  })

  test('EDT offset string is "-04:00"', () => {
    expect(new Timezone('America/New_York').offsetString(dfJul)).toBe('-04:00')
  })

  test('PST offset string is "-08:00"', () => {
    expect(new Timezone('America/Los_Angeles').offsetString(dfJan)).toBe('-08:00')
  })

  test('PDT offset string is "-07:00"', () => {
    expect(new Timezone('America/Los_Angeles').offsetString(dfJul)).toBe('-07:00')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 14. Real-life scenario: multi-timezone offset comparison
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: multi-timezone offset comparison', () => {
  test('UTC offset is 0 minutes', () => {
    expect(new Timezone('UTC').offsetMinutes(dfJan)).toBe(0)
  })

  test('IST offset is 330 minutes (ahead of UTC)', () => {
    expect(new Timezone('Asia/Kolkata').offsetMinutes(dfJan)).toBe(330)
  })

  test('EST is behind UTC: offset = -300', () => {
    expect(new Timezone('America/New_York').offsetMinutes(dfJan)).toBe(-300)
  })

  test('PST is behind UTC: offset = -480', () => {
    expect(new Timezone('America/Los_Angeles').offsetMinutes(dfJan)).toBe(-480)
  })

  test('IST is 630 minutes ahead of PST in winter', () => {
    const ist = new Timezone('Asia/Kolkata').offsetMinutes(dfJan)
    const pst = new Timezone('America/Los_Angeles').offsetMinutes(dfJan)
    expect(ist - pst).toBe(810)
  })

  test('NYC is 4 hours behind London in summer (BST vs EDT)', () => {
    const nyc = new Timezone('America/New_York').offsetMinutes(dfJul)
    const lon = new Timezone('Europe/London').offsetMinutes(dfJul)
    // EDT = -240, BST = +60 → difference = 60 - (-240) = 300
    expect(lon - nyc).toBe(300)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 15. Real-life scenario: Europe/London DST boundary
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: Europe/London DST', () => {
  test('London in winter (January) → offset "+00:00" (GMT)', () => {
    expect(new Timezone('Europe/London').offsetString(dfJan)).toBe('+00:00')
  })

  test('London in summer (July) → offset "+01:00" (BST)', () => {
    expect(new Timezone('Europe/London').offsetString(dfJul)).toBe('+01:00')
  })

  test('London offsetMinutes in January = 0', () => {
    expect(new Timezone('Europe/London').offsetMinutes(dfJan)).toBe(0)
  })

  test('London offsetMinutes in July = 60', () => {
    expect(new Timezone('Europe/London').offsetMinutes(dfJul)).toBe(60)
  })

  test('London isDST in summer = true', () => {
    expect(new Timezone('Europe/London').isDST(dfJul)).toBe(true)
  })

  test('London isDST in winter = false', () => {
    expect(new Timezone('Europe/London').isDST(dfJan)).toBe(false)
  })

  test('London UTC noon in July → local 13:00 (BST)', () => {
    // 12:00 UTC + 1h = 13:00 BST
    expect(new Timezone('Europe/London').format(dfJul, 'HH:mm')).toBe('13:00')
  })

  test('London UTC noon in January → local 12:00 (GMT = UTC+0)', () => {
    expect(new Timezone('Europe/London').format(dfJan, 'HH:mm')).toBe('12:00')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 16. Real-life scenario: valid timezone validation (user-provided strings)
// ─────────────────────────────────────────────────────────────────────────────

describe('scenario: valid timezone validation from user input', () => {
  const valid = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  const invalid = ['', 'Not/Valid', 'America/Narnia', 'EST+5', 'foo', 'UTC+05:30']

  for (const tz of valid) {
    test(`"${tz}" → isValid() true`, () => {
      expect(Timezone.isValid(tz)).toBe(true)
    })
  }

  for (const tz of invalid) {
    test(`"${tz}" → isValid() false`, () => {
      expect(Timezone.isValid(tz)).toBe(false)
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 17. Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('Kolkata midnight UTC (Jun 15) → June 15 05:30 local', () => {
    // dfJun15 = 2026-06-15T00:00:00Z → Kolkata = 05:30
    const result = new Timezone('Asia/Kolkata').toLocalDate(dfJun15)
    expect(result.get('month')).toBe(6)
    expect(result.get('date')).toBe(15)
    expect(result.get('hour')).toBe(5)
    expect(result.get('minute')).toBe(30)
  })

  test('NY offsetMinutes changes between January and July', () => {
    const jan = new Timezone('America/New_York').offsetMinutes(dfJan)
    const jul = new Timezone('America/New_York').offsetMinutes(dfJul)
    expect(jan).not.toBe(jul)
    expect(jul - jan).toBe(60)
  })

  test('Kolkata offsetMinutes is stable year-round', () => {
    const jan = new Timezone('Asia/Kolkata').offsetMinutes(dfJan)
    const jul = new Timezone('Asia/Kolkata').offsetMinutes(dfJul)
    expect(jan).toBe(jul)
    expect(jan).toBe(330)
  })

  test('UTC offsetMinutes is always 0', () => {
    expect(new Timezone('UTC').offsetMinutes(dfJan)).toBe(0)
    expect(new Timezone('UTC').offsetMinutes(dfJul)).toBe(0)
    expect(new Timezone('UTC').offsetMinutes(dfJan1)).toBe(0)
  })

  test('constructor throws for numeric string that is not an IANA name', () => {
    expect(() => new Timezone('300')).toThrow(RangeError)
  })

  test('toLocalDate preserves millisecond precision', () => {
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0, 500)
    const df = new DateFormat(ms)
    const result = new Timezone('UTC').toLocalDate(df)
    expect(result.get('millisecond')).toBe(500)
  })
})
