import {
  BS_EPOCH_AD_MS,
  BS_FIRST_YEAR,
  BS_MONTHS,
  BS_MONTH_NAMES_EN,
  BS_MONTH_NAMES_NE,
  BS_WEEKDAYS_NE
} from './data'
import DateTime from '../../core/DateTime'

const MS_PER_DAY = 86_400_000

const customYears = new Map<number, number[]>()

function getMonths(bsYear: number): number[] | null {
  const custom = customYears.get(bsYear)
  if (custom) return custom
  const idx = bsYear - BS_FIRST_YEAR
  if (idx < 0 || idx >= BS_MONTHS.length) return null
  return BS_MONTHS[idx]
}

/**
 * Days from BS epoch (BS year `BS_FIRST_YEAR`-01-01) to the start of `bsYear`.
 */
function bsYearStartDays(bsYear: number): number {
  let days = 0
  for (let y = BS_FIRST_YEAR; y < bsYear; y++) {
    const months = getMonths(y)
    if (!months) {
      throw new RangeError(
        `Bikram Sambat year ${y} is not in the embedded range. ` +
          `Register it via BikramSambat.registerYear(${y}, [m1..m12]).`
      )
    }
    for (const m of months) days += m
  }
  return days
}

/**
 * Days into `bsYear` to the start of `bsMonth` (1-12).
 */
function bsMonthStartDays(bsYear: number, bsMonth: number): number {
  const months = getMonths(bsYear)
  if (!months) throw new RangeError(`BS year ${bsYear} not registered`)
  let days = 0
  for (let m = 1; m < bsMonth; m++) days += months[m - 1]
  return days
}

export interface BSDate {
  /** Year (e.g. 2081). */
  year: number
  /** 1-12. */
  month: number
  /** 1-32. */
  day: number
  /** Day-of-week 0=Sunday..6=Saturday (matches AD weekday). */
  weekday: number
  /** Days since BS_FIRST_YEAR-01-01 (Saturday in our reference). */
  totalDays: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion functions
// ─────────────────────────────────────────────────────────────────────────────

/** Convert any AD instant to its BS calendar components. */
export function adToBs(ad: Date | number): BSDate {
  const ms = typeof ad === 'number' ? ad : ad.getTime()
  // Normalize to UTC midnight for stable day arithmetic
  const utcMidnight = Date.UTC(
    new Date(ms).getUTCFullYear(),
    new Date(ms).getUTCMonth(),
    new Date(ms).getUTCDate()
  )
  let days = Math.floor((utcMidnight - BS_EPOCH_AD_MS) / MS_PER_DAY)
  if (days < 0) {
    throw new RangeError('AD date is before the supported BS epoch (1943-04-14)')
  }
  const totalDays = days

  let bsYear = BS_FIRST_YEAR
  while (true) {
    const months = getMonths(bsYear)
    if (!months) {
      throw new RangeError(
        `Bikram Sambat year ${bsYear} not in embedded range. Register it via registerYear().`
      )
    }
    const yearLen = months.reduce((a, b) => a + b, 0)
    if (days < yearLen) break
    days -= yearLen
    bsYear++
  }

  const months = getMonths(bsYear)!
  let bsMonth = 1
  while (days >= months[bsMonth - 1]) {
    days -= months[bsMonth - 1]
    bsMonth++
  }
  const bsDay = days + 1

  // 1943-04-14 was a Wednesday (UTC midnight). Verify by JS:
  const weekday = new Date(utcMidnight).getUTCDay()

  return { year: bsYear, month: bsMonth, day: bsDay, weekday, totalDays }
}

/** Convert BS components to an AD Date (UTC midnight of the corresponding day). */
export function bsToAd(year: number, month: number, day: number): Date {
  if (month < 1 || month > 12) throw new RangeError(`BS month ${month} out of range`)
  const months = getMonths(year)
  if (!months) {
    throw new RangeError(
      `Bikram Sambat year ${year} not in embedded range. Register via registerYear().`
    )
  }
  if (day < 1 || day > months[month - 1]) {
    throw new RangeError(
      `BS day ${day} out of range for ${year}-${month} (max ${months[month - 1]})`
    )
  }
  const days = bsYearStartDays(year) + bsMonthStartDays(year, month) + (day - 1)
  return new Date(BS_EPOCH_AD_MS + days * MS_PER_DAY)
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────────────────────

const DEVANAGARI = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

function toDevanagari(s: string): string {
  return s.replace(/\d/g, (d) => DEVANAGARI[Number(d)])
}

/**
 * Format a BS date with Moment-like tokens. Numerals come out Western by
 * default — pass `{ numerals: 'devanagari' }` for ०-९.
 *
 * Tokens:
 *   YYYY YY M MM MMM MMMM (Nepali) MMMM-en (English) D DD Do d ddd dddd
 */
export function formatBS(
  bs: BSDate,
  fmt: string,
  opts: { numerals?: 'western' | 'devanagari'; weekday?: 'ne' | 'en' } = {}
): string {
  const numerals = opts.numerals ?? 'western'
  const weekdayLang = opts.weekday ?? (numerals === 'devanagari' ? 'ne' : 'en')

  const tokenMap: Record<string, string> = {
    YYYY: pad(bs.year, 4),
    YY: pad(bs.year % 100),
    MMMM: BS_MONTH_NAMES_NE[bs.month - 1],
    'MMMM-en': BS_MONTH_NAMES_EN[bs.month - 1],
    MMM: BS_MONTH_NAMES_EN[bs.month - 1].slice(0, 3),
    MM: pad(bs.month),
    M: String(bs.month),
    DD: pad(bs.day),
    D: String(bs.day),
    dddd:
      weekdayLang === 'ne'
        ? BS_WEEKDAYS_NE[bs.weekday]
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
            bs.weekday
          ],
    ddd:
      weekdayLang === 'ne'
        ? BS_WEEKDAYS_NE[bs.weekday].slice(0, -3)
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][bs.weekday],
    d: String(bs.weekday)
  }

  // Replace longest tokens first
  const keys = Object.keys(tokenMap).sort((a, b) => b.length - a.length)
  let out = ''
  for (let i = 0; i < fmt.length; ) {
    const ch = fmt[i]
    if (ch === '[') {
      const end = fmt.indexOf(']', i + 1)
      if (end !== -1) {
        out += fmt.slice(i + 1, end)
        i = end + 1
        continue
      }
    }
    let matched: string | null = null
    for (const t of keys) {
      if (fmt.startsWith(t, i)) {
        matched = t
        break
      }
    }
    if (matched) {
      out += tokenMap[matched]
      i += matched.length
    } else {
      out += ch
      i++
    }
  }

  return numerals === 'devanagari' ? toDevanagari(out) : out
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export const BikramSambat = {
  /** From an AD DateTime/Date/timestamp. */
  fromAD(input: DateTime | Date | number): BSDate {
    if (input instanceof DateTime) return adToBs(input.toDate())
    return adToBs(input)
  },

  /** Build an AD DateTime from BS components. */
  toAD(year: number, month: number, day: number): DateTime {
    return new DateTime(bsToAd(year, month, day), { utc: true })
  },

  /** Format a BS date. */
  format(
    input: DateTime | Date | number,
    fmt = 'YYYY-MM-DD',
    opts?: { numerals?: 'western' | 'devanagari'; weekday?: 'ne' | 'en' }
  ): string {
    return formatBS(this.fromAD(input), fmt, opts)
  },

  /** Days in a given BS month (1-12). */
  daysInMonth(year: number, month: number): number {
    const months = getMonths(year)
    if (!months) throw new RangeError(`BS year ${year} not registered`)
    return months[month - 1]
  },

  /** Total days in a given BS year (sum of 12 months). */
  daysInYear(year: number): number {
    const months = getMonths(year)
    if (!months) throw new RangeError(`BS year ${year} not registered`)
    return months.reduce((a, b) => a + b, 0)
  },

  /** Min/max BS years currently supported (built-in + registered). */
  range(): { min: number; max: number } {
    const min = Math.min(BS_FIRST_YEAR, ...customYears.keys())
    const max = Math.max(BS_FIRST_YEAR + BS_MONTHS.length - 1, ...customYears.keys())
    return { min, max }
  },

  /**
   * Register or replace a BS year's month-length table.
   *   BikramSambat.registerYear(2100, [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30])
   */
  registerYear(year: number, monthDays: number[]): void {
    if (monthDays.length !== 12) throw new RangeError('BS year must have 12 month entries')
    if (monthDays.some((d) => d < 28 || d > 33)) {
      throw new RangeError('BS month days should be in 28..33')
    }
    customYears.set(year, [...monthDays])
  },

  /** Devanagari numeral conversion utility. */
  toDevanagari,

  /** Native Nepali / Romanized month names. */
  monthNames: { ne: BS_MONTH_NAMES_NE, en: BS_MONTH_NAMES_EN },
  weekdayNames: { ne: BS_WEEKDAYS_NE }
}

export default BikramSambat
