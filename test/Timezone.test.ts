import { describe, test, expect } from '@jest/globals'
import Timezone from '../src/ecosystem/Timezone'
import DateFormat from '../src/core/DateFormat'

// Fixed UTC instants for deterministic results regardless of host timezone
// Jan 15, 2026 12:00:00 UTC
const JAN_15_UTC = Date.UTC(2026, 0, 15, 12, 0, 0)
// Jul 15, 2026 12:00:00 UTC
const JUL_15_UTC = Date.UTC(2026, 6, 15, 12, 0, 0)
// Jan 1, 2026 00:00:00 UTC
const JAN_1_UTC = Date.UTC(2026, 0, 1, 0, 0, 0)

const dfJan = new DateFormat(JAN_15_UTC)
const dfJul = new DateFormat(JUL_15_UTC)

describe('Timezone', () => {
  // ── static guess ─────────────────────────────────────────────────────────────

  describe('static guess()', () => {
    test('returns a non-empty string', () => {
      const tz = Timezone.guess()
      expect(typeof tz).toBe('string')
      expect(tz.length).toBeGreaterThan(0)
    })

    test('is a valid IANA timezone', () => {
      expect(Timezone.isValid(Timezone.guess())).toBe(true)
    })
  })

  // ── static isValid ───────────────────────────────────────────────────────────

  describe('static isValid()', () => {
    test('"UTC" → true', () => {
      expect(Timezone.isValid('UTC')).toBe(true)
    })

    test('"America/New_York" → true', () => {
      expect(Timezone.isValid('America/New_York')).toBe(true)
    })

    test('"Asia/Kolkata" → true', () => {
      expect(Timezone.isValid('Asia/Kolkata')).toBe(true)
    })

    test('"Invalid/Timezone" → false', () => {
      expect(Timezone.isValid('Invalid/Timezone')).toBe(false)
    })

    test('"" → false', () => {
      expect(Timezone.isValid('')).toBe(false)
    })
  })

  // ── constructor ──────────────────────────────────────────────────────────────

  describe('constructor', () => {
    test('valid tz string creates instance with .tz property', () => {
      const tz = new Timezone('UTC')
      expect(tz.tz).toBe('UTC')
    })

    test('Asia/Kolkata creates instance', () => {
      const tz = new Timezone('Asia/Kolkata')
      expect(tz.tz).toBe('Asia/Kolkata')
    })

    test('invalid tz → throws RangeError', () => {
      expect(() => new Timezone('Invalid/Timezone')).toThrow(RangeError)
    })

    test('empty string → throws RangeError', () => {
      expect(() => new Timezone('')).toThrow(RangeError)
    })
  })

  // ── offsetMinutes ────────────────────────────────────────────────────────────

  describe('offsetMinutes(date)', () => {
    test('UTC timezone → 0', () => {
      const tz = new Timezone('UTC')
      expect(tz.offsetMinutes(dfJan)).toBe(0)
    })

    test('Asia/Kolkata → 330 (UTC+5:30)', () => {
      const tz = new Timezone('Asia/Kolkata')
      expect(tz.offsetMinutes(dfJan)).toBe(330)
    })

    test('America/New_York in January → -300 (UTC-5:00, standard time)', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.offsetMinutes(dfJan)).toBe(-300)
    })

    test('America/New_York in July → -240 (UTC-4:00, DST)', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.offsetMinutes(dfJul)).toBe(-240)
    })
  })

  // ── offsetString ─────────────────────────────────────────────────────────────

  describe('offsetString(date)', () => {
    test('UTC → "+00:00"', () => {
      const tz = new Timezone('UTC')
      expect(tz.offsetString(dfJan)).toBe('+00:00')
    })

    test('Asia/Kolkata → "+05:30"', () => {
      const tz = new Timezone('Asia/Kolkata')
      expect(tz.offsetString(dfJan)).toBe('+05:30')
    })

    test('America/New_York in January → "-05:00"', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.offsetString(dfJan)).toBe('-05:00')
    })

    test('America/New_York in July → "-04:00"', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.offsetString(dfJul)).toBe('-04:00')
    })
  })

  // ── format ───────────────────────────────────────────────────────────────────

  describe('format(date, fmt)', () => {
    test('UTC midnight formatted in UTC → same date', () => {
      const tz = new Timezone('UTC')
      const midnight = new DateFormat(JAN_1_UTC)
      expect(tz.format(midnight, 'YYYY-MM-DD')).toBe('2026-01-01')
    })

    test('UTC midnight in America/New_York → previous day (UTC-5)', () => {
      // 2026-01-01T00:00:00Z is Dec 31, 2025 19:00 in New York (UTC-5)
      const tz = new Timezone('America/New_York')
      const midnight = new DateFormat(JAN_1_UTC)
      expect(tz.format(midnight, 'YYYY-MM-DD')).toBe('2025-12-31')
    })

    test('Asia/Kolkata: UTC midnight → same day (05:30 ahead)', () => {
      // 2026-01-01T00:00:00Z is Jan 1 05:30 in Kolkata → still Jan 1
      const tz = new Timezone('Asia/Kolkata')
      const midnight = new DateFormat(JAN_1_UTC)
      expect(tz.format(midnight, 'YYYY-MM-DD')).toBe('2026-01-01')
    })

    test('format returns correct hour in Asia/Kolkata', () => {
      // UTC midnight (00:00) → Kolkata 05:30
      const tz = new Timezone('Asia/Kolkata')
      const midnight = new DateFormat(JAN_1_UTC)
      expect(tz.format(midnight, 'HH:mm')).toBe('05:30')
    })
  })

  // ── isDST ────────────────────────────────────────────────────────────────────

  describe('isDST(date)', () => {
    test('UTC → false (no DST)', () => {
      const tz = new Timezone('UTC')
      expect(tz.isDST(dfJan)).toBe(false)
      expect(tz.isDST(dfJul)).toBe(false)
    })

    test('America/New_York in January → false (standard time)', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.isDST(dfJan)).toBe(false)
    })

    test('America/New_York in July → true (DST)', () => {
      const tz = new Timezone('America/New_York')
      expect(tz.isDST(dfJul)).toBe(true)
    })

    test('Asia/Kolkata → always false (no DST)', () => {
      const tz = new Timezone('Asia/Kolkata')
      expect(tz.isDST(dfJan)).toBe(false)
      expect(tz.isDST(dfJul)).toBe(false)
    })
  })

  // ── toLocalDate ──────────────────────────────────────────────────────────────

  describe('toLocalDate(date)', () => {
    test('UTC input in UTC timezone → same wall-clock values', () => {
      const tz = new Timezone('UTC')
      const input = new DateFormat(JAN_1_UTC)
      const local = tz.toLocalDate(input)
      expect(local.get('hour')).toBe(0)
      expect(local.get('minute')).toBe(0)
    })

    test('UTC midnight in Asia/Kolkata → hour=5, minute=30', () => {
      const tz = new Timezone('Asia/Kolkata')
      const midnight = new DateFormat(JAN_1_UTC)
      const local = tz.toLocalDate(midnight)
      expect(local.get('hour')).toBe(5)
      expect(local.get('minute')).toBe(30)
    })

    test('returns a DateFormat instance', () => {
      const tz = new Timezone('UTC')
      const result = tz.toLocalDate(dfJan)
      expect(result).toBeInstanceOf(DateFormat)
    })

    test('result is in UTC mode (wall-clock shown via UTC getters)', () => {
      const tz = new Timezone('UTC')
      const result = tz.toLocalDate(dfJan)
      expect(result.isUtc()).toBe(true)
    })

    test('America/New_York in January: UTC noon → 7:00 AM local', () => {
      // 12:00 UTC - 5h = 07:00 local
      const tz = new Timezone('America/New_York')
      const local = tz.toLocalDate(dfJan)
      expect(local.get('hour')).toBe(7)
      expect(local.get('minute')).toBe(0)
    })
  })

  // ── toString ─────────────────────────────────────────────────────────────────

  describe('toString()', () => {
    test('returns the tz string', () => {
      expect(new Timezone('UTC').toString()).toBe('UTC')
      expect(new Timezone('Asia/Kolkata').toString()).toBe('Asia/Kolkata')
      expect(new Timezone('America/New_York').toString()).toBe('America/New_York')
    })
  })

  // ── Additional edge cases for branch coverage ────────────────────────────────

  describe('edge cases', () => {
    test('offsetString with offset 0 → "+00:00"', () => {
      const tz = new Timezone('UTC')
      expect(tz.offsetString()).toBe('+00:00')
    })

    test('offsetString with positive offset → correct sign', () => {
      const tz = new Timezone('Asia/Kolkata')
      const offset = tz.offsetString()
      expect(offset).toMatch(/^\+/)
    })

    test('offsetMinutes with no argument → uses current time', () => {
      const tz = new Timezone('UTC')
      const offsetMin = tz.offsetMinutes()
      expect(Object.is(offsetMin, 0) || Object.is(offsetMin, -0)).toBe(true)
    })

    test('isDST returns false consistently for UTC', () => {
      const tz = new Timezone('UTC')
      expect(tz.isDST()).toBe(false)
    })

    test('offsetString minute padding works for non-zero minutes', () => {
      const tz = new Timezone('Asia/Kolkata')
      const offset = tz.offsetString()
      // Asia/Kolkata is UTC+5:30, so should have :30
      expect(offset).toContain(':30')
    })
  })
})
