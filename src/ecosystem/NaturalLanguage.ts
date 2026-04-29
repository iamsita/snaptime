// ─────────────────────────────────────────────────────────────────────────────
// Natural-language date parser.
//
// Built around a pluggable list of {@link Pattern}s. Each pattern is a regex
// + handler. Users can register their own patterns to extend recognition
// without forking the library:
//
//   NaturalLanguage.addPattern({
//     match: /^cyber-monday$/i,
//     parse: (_, ref) => ref.firstOf('month', 1).add(28, 'day') // 4th Mon Nov, etc.
//   })
//
// Open/Closed in action.
// ─────────────────────────────────────────────────────────────────────────────

import DateTime from '../core/DateTime'
import type { UnitInput } from '../core/types'

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
}

const MONTH_RE = Object.keys(MONTHS).join('|')
const WEEKDAY_RE = Object.keys(WEEKDAYS).join('|')
const UNIT_RE = '(?:second|minute|hour|day|week|month|year)s?'

const UNIT_MAP: Record<string, UnitInput> = {
  second: 'second',
  seconds: 'second',
  minute: 'minute',
  minutes: 'minute',
  hour: 'hour',
  hours: 'hour',
  day: 'day',
  days: 'day',
  week: 'week',
  weeks: 'week',
  month: 'month',
  months: 'month',
  year: 'year',
  years: 'year'
}

export interface Pattern {
  match: RegExp
  parse: (m: RegExpExecArray, ref: DateTime) => DateTime
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyTime(date: DateTime, timeStr: string): DateTime {
  const lower = timeStr.toLowerCase().trim()
  if (lower === 'noon') return date.set('hour', 12).set('minute', 0).set('second', 0)
  if (lower === 'midnight') return date.set('hour', 0).set('minute', 0).set('second', 0)

  const m = lower.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/)
  if (!m) return date

  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const sec = m[3] ? parseInt(m[3], 10) : 0
  const ampm = m[4]
  if (ampm === 'pm' && h < 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return date.set('hour', h).set('minute', min).set('second', sec)
}

function nthWeekdayOfMonth(n: number, weekday: number, month: number, year: number): DateTime {
  let d = new DateTime(new Date(year, month - 1, 1))
  const firstDow = d.get('day')
  let offset = (weekday - firstDow + 7) % 7
  offset += (n - 1) * 7
  d = d.add(offset, 'day')
  if (d.get('month') !== month) return new DateTime(NaN)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in patterns — order matters: first match wins.
// ─────────────────────────────────────────────────────────────────────────────

const BUILTIN_PATTERNS: Pattern[] = [
  {
    match: /^(?:now|today)$/,
    parse: (_, ref) => ref
  },
  { match: /^tomorrow$/, parse: (_, ref) => ref.add(1, 'day') },
  { match: /^yesterday$/, parse: (_, ref) => ref.subtract(1, 'day') },
  { match: /^noon$/, parse: (_, ref) => ref.set('hour', 12).set('minute', 0).set('second', 0) },
  { match: /^midnight$/, parse: (_, ref) => ref.set('hour', 0).set('minute', 0).set('second', 0) },

  {
    match: /^(?:beginning|start)\s+of\s+(day|week|month|year)$/,
    parse: (m, ref) => ref.startOf(m[1] as UnitInput)
  },
  {
    match: /^end\s+of\s+(day|week|month|year)$/,
    parse: (m, ref) => ref.endOf(m[1] as UnitInput)
  },
  {
    match: /^this\s+(week|month|year)$/,
    parse: (m, ref) => ref.startOf(m[1] as UnitInput)
  },

  {
    match: /^(today|tomorrow|yesterday)\s+at\s+(.+)$/,
    parse: (m, ref) => {
      const word = m[1]
      let d = ref
      if (word === 'tomorrow') d = ref.add(1, 'day')
      else if (word === 'yesterday') d = ref.subtract(1, 'day')
      return applyTime(d, m[2])
    }
  },

  {
    match: new RegExp(`^(next|last)\\s+(${WEEKDAY_RE})(?:\\s+at\\s+(.+))?$`),
    parse: (m, ref) => {
      const target = WEEKDAYS[m[2]]
      const cur = ref.get('day')
      let d: DateTime
      if (m[1] === 'next') {
        let diff = (target - cur + 7) % 7
        if (diff === 0) diff = 7
        d = ref.add(diff, 'day')
      } else {
        let diff = (cur - target + 7) % 7
        if (diff === 0) diff = 7
        d = ref.subtract(diff, 'day')
      }
      return m[3] ? applyTime(d, m[3]) : d
    }
  },

  {
    match: /^(next|last)\s+(week|month|year)$/,
    parse: (m, ref) => {
      const u = UNIT_MAP[m[2]]
      return m[1] === 'next' ? ref.add(1, u) : ref.subtract(1, u)
    }
  },

  {
    match: new RegExp(`^(\\d+)\\s+(${UNIT_RE})\\s+ago$`),
    parse: (m, ref) => ref.subtract(parseInt(m[1], 10), UNIT_MAP[m[2]])
  },
  {
    match: new RegExp(`^in\\s+(\\d+)\\s+(${UNIT_RE})$`),
    parse: (m, ref) => ref.add(parseInt(m[1], 10), UNIT_MAP[m[2]])
  },
  {
    match: new RegExp(`^(\\d+)\\s+(${UNIT_RE})\\s+from\\s+now$`),
    parse: (m, ref) => ref.add(parseInt(m[1], 10), UNIT_MAP[m[2]])
  },

  {
    match: new RegExp(`^last\\s+day\\s+of\\s+(${MONTH_RE})(?:\\s+(\\d{4}))?$`),
    parse: (m, ref) => {
      const month = MONTHS[m[1]]
      const year = m[2] ? parseInt(m[2], 10) : ref.get('year')
      const lastDay = new Date(year, month, 0).getDate()
      return new DateTime(new Date(year, month - 1, lastDay))
    }
  },

  {
    match: new RegExp(`^first\\s+day\\s+of\\s+(${MONTH_RE})(?:\\s+(\\d{4}))?$`),
    parse: (m, ref) => {
      const month = MONTHS[m[1]]
      const year = m[2] ? parseInt(m[2], 10) : ref.get('year')
      return new DateTime(new Date(year, month - 1, 1))
    }
  },

  {
    match: new RegExp(
      `^(\\d+)(?:st|nd|rd|th)\\s+(${WEEKDAY_RE})\\s+of\\s+(${MONTH_RE})(?:\\s+(\\d{4}))?$`
    ),
    parse: (m, ref) =>
      nthWeekdayOfMonth(
        parseInt(m[1], 10),
        WEEKDAYS[m[2]],
        MONTHS[m[3]],
        m[4] ? parseInt(m[4], 10) : ref.get('year')
      )
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const userPatterns: Pattern[] = []

export const NaturalLanguage = {
  /** Try each pattern in order; returns invalid DateTime if none matches. */
  parse(input: string, ref?: DateTime): DateTime {
    const base = ref ?? new DateTime()
    const lower = input.trim().toLowerCase()
    for (const p of [...userPatterns, ...BUILTIN_PATTERNS]) {
      const m = p.match.exec(lower)
      if (m) return p.parse(m, base)
    }
    return new DateTime(NaN)
  },

  /** Append a custom pattern. Custom patterns are tried before built-ins. */
  addPattern(p: Pattern): void {
    userPatterns.unshift(p)
  },

  /** Remove a previously-added custom pattern. */
  removePattern(p: Pattern): boolean {
    const i = userPatterns.indexOf(p)
    if (i < 0) return false
    userPatterns.splice(i, 1)
    return true
  },

  /** Reset to built-ins only. */
  reset(): void {
    userPatterns.length = 0
  }
}

export default function parseNatural(input: string, ref?: DateTime): DateTime {
  return NaturalLanguage.parse(input, ref)
}
