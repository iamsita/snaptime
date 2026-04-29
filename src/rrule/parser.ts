import type { Freq, RRuleOptions, Weekday, WeekdayWithN } from './types'

const FREQS: Freq[] = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY', 'MINUTELY', 'SECONDLY']
const WEEKDAYS: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

function parseWeekday(token: string): WeekdayWithN {
  const m = /^(-?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/.exec(token.trim())
  if (!m) throw new SyntaxError(`Invalid BYDAY token: "${token}"`)
  return m[1] ? { day: m[2] as Weekday, n: Number(m[1]) } : { day: m[2] as Weekday }
}

function parseInts(s: string): number[] {
  return s.split(',').map((x) => Number(x.trim()))
}

/**
 * Parse an RFC 5545 RRULE line. Accepts the bare `FREQ=...;...` part with or
 * without the leading `RRULE:` prefix.
 */
export function parseRRule(input: string): RRuleOptions {
  let body = input.trim()
  if (body.toUpperCase().startsWith('RRULE:')) body = body.slice(6)

  const opts: Partial<RRuleOptions> = {}
  for (const seg of body.split(';')) {
    if (!seg) continue
    const eq = seg.indexOf('=')
    if (eq < 0) throw new SyntaxError(`Invalid RRULE segment: "${seg}"`)
    const key = seg.slice(0, eq).trim().toUpperCase()
    const val = seg.slice(eq + 1).trim()

    switch (key) {
      case 'FREQ': {
        const f = val.toUpperCase() as Freq
        if (!FREQS.includes(f)) throw new SyntaxError(`Invalid FREQ "${val}"`)
        opts.freq = f
        break
      }
      case 'INTERVAL':
        opts.interval = Number(val)
        break
      case 'COUNT':
        opts.count = Number(val)
        break
      case 'UNTIL':
        opts.until = parseUntil(val)
        break
      case 'DTSTART':
        opts.dtstart = parseUntil(val)
        break
      case 'BYDAY':
        opts.byweekday = val.split(',').map(parseWeekday)
        break
      case 'BYMONTH':
        opts.bymonth = parseInts(val)
        break
      case 'BYMONTHDAY':
        opts.bymonthday = parseInts(val)
        break
      case 'BYYEARDAY':
        opts.byyearday = parseInts(val)
        break
      case 'BYWEEKNO':
        opts.byweekno = parseInts(val)
        break
      case 'BYHOUR':
        opts.byhour = parseInts(val)
        break
      case 'BYMINUTE':
        opts.byminute = parseInts(val)
        break
      case 'BYSECOND':
        opts.bysecond = parseInts(val)
        break
      case 'BYSETPOS':
        opts.bysetpos = parseInts(val)
        break
      case 'WKST': {
        const w = val.toUpperCase() as Weekday
        if (!WEEKDAYS.includes(w)) throw new SyntaxError(`Invalid WKST "${val}"`)
        opts.wkst = w
        break
      }
      default:
        // Silently ignore unknown extensions
        break
    }
  }

  if (!opts.freq) throw new SyntaxError('RRULE missing FREQ')
  return opts as RRuleOptions
}

/** UNTIL/DTSTART iCal forms: `19970714T173000Z`, `19970714`, ISO 8601. */
function parseUntil(val: string): Date {
  // Compact iCal: YYYYMMDD or YYYYMMDDTHHMMSSZ
  const compact = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(val)
  if (compact) {
    const [, y, mo, d, h = '0', mi = '0', s = '0', z] = compact
    if (z === 'Z' || compact[7] === 'Z') {
      return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
    }
    return new Date(+y, +mo - 1, +d, +h, +mi, +s)
  }
  const ms = Date.parse(val)
  if (Number.isNaN(ms)) throw new SyntaxError(`Invalid date "${val}"`)
  return new Date(ms)
}

// ─────────────────────────────────────────────────────────────────────────────
// Serializer (round-trips a parsed rule)
// ─────────────────────────────────────────────────────────────────────────────

function fmtCompact(d: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, '0')
  return (
    `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  )
}

export function stringifyRRule(opts: RRuleOptions): string {
  const parts: string[] = [`FREQ=${opts.freq}`]
  if (opts.interval && opts.interval !== 1) parts.push(`INTERVAL=${opts.interval}`)
  if (opts.count != null) parts.push(`COUNT=${opts.count}`)
  if (opts.until != null) {
    const d = opts.until instanceof Date ? opts.until : new Date(opts.until)
    parts.push(`UNTIL=${fmtCompact(d)}`)
  }
  if (opts.byweekday)
    parts.push(
      `BYDAY=${opts.byweekday
        .map((w) => (typeof w === 'string' ? w : `${w.n ?? ''}${w.day}`))
        .join(',')}`
    )
  if (opts.bymonth) parts.push(`BYMONTH=${opts.bymonth.join(',')}`)
  if (opts.bymonthday) parts.push(`BYMONTHDAY=${opts.bymonthday.join(',')}`)
  if (opts.byyearday) parts.push(`BYYEARDAY=${opts.byyearday.join(',')}`)
  if (opts.byhour) parts.push(`BYHOUR=${opts.byhour.join(',')}`)
  if (opts.byminute) parts.push(`BYMINUTE=${opts.byminute.join(',')}`)
  if (opts.bysecond) parts.push(`BYSECOND=${opts.bysecond.join(',')}`)
  if (opts.bysetpos) parts.push(`BYSETPOS=${opts.bysetpos.join(',')}`)
  if (opts.wkst) parts.push(`WKST=${opts.wkst}`)
  return parts.join(';')
}
