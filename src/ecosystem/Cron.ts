import DateTime from '../core/DateTime'
import type { CronField, DateInput } from '../core/types'

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulary
// ─────────────────────────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6
}

const MONTH_ABBR: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MAX_ITER_MINUTES = 366 * 24 * 60

// ─────────────────────────────────────────────────────────────────────────────
// Field parser — turns "*/15" / "1-5" / "MON-FRI" / "1,3,5" into a CronField.
// ─────────────────────────────────────────────────────────────────────────────

function resolveValue(token: string, isDow: boolean, isMonth: boolean): number {
  const upper = token.toUpperCase()
  if (isDow && DAY_ABBR[upper] !== undefined) return DAY_ABBR[upper]
  if (isMonth && MONTH_ABBR[upper] !== undefined) return MONTH_ABBR[upper]
  return parseInt(token, 10)
}

function parseField(
  token: string,
  min: number,
  max: number,
  isDow = false,
  isMonth = false
): CronField {
  if (token === '*' || token === '?') return { values: new Set(), any: true }

  const values = new Set<number>()
  for (const part of token.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    let range = part
    let step: number | null = null
    if (stepMatch) {
      range = stepMatch[1]
      step = parseInt(stepMatch[2], 10)
    }

    let lo: number
    let hi: number
    if (range === '*') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-')
      lo = resolveValue(a, isDow, isMonth)
      hi = resolveValue(b, isDow, isMonth)
    } else {
      lo = resolveValue(range, isDow, isMonth)
      hi = step != null ? max : lo
    }

    if (isDow) {
      if (lo === 7) lo = 0
      if (hi === 7) hi = 0
    }

    const s = step ?? 1
    if (lo <= hi) {
      for (let i = lo; i <= hi; i += s) values.add(i)
    } else if (isDow) {
      for (let i = lo; i <= 6; i += s) values.add(i)
      for (let i = 0; i <= hi; i += s) values.add(i)
    }
  }

  return { values, any: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Humanize — produce a friendly description of a cron expression.
// ─────────────────────────────────────────────────────────────────────────────

function fieldDescription(field: CronField, name: string, min: number, max: number): string {
  if (field.any) return `every ${name}`
  const vals = [...field.values].sort((a, b) => a - b)
  if (vals.length === max - min + 1) return `every ${name}`
  return `at ${name} ${vals.join(', ')}`
}

function dowDescription(field: CronField): string {
  if (field.any) return ''
  const vals = [...field.values].sort((a, b) => a - b)
  const consecutive = vals.length > 1 && vals.every((v, i) => i === 0 || v === vals[i - 1] + 1)
  if (consecutive && vals.length > 2)
    return `${DAY_NAMES[vals[0]]} through ${DAY_NAMES[vals[vals.length - 1]]}`
  return vals.map((v) => DAY_NAMES[v]).join(', ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Cron — the public class
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *'
}

export default class Cron {
  readonly expression: string
  private readonly minute: CronField
  private readonly hour: CronField
  private readonly dom: CronField
  private readonly month: CronField
  private readonly dow: CronField

  constructor(expression: string) {
    const expanded = PRESETS[expression.trim().toLowerCase()] ?? expression.trim()
    this.expression = expanded
    const parts = expanded.split(/\s+/)
    if (parts.length !== 5) {
      throw new RangeError(`Invalid cron expression: expected 5 fields, got ${parts.length}`)
    }
    this.minute = parseField(parts[0], 0, 59)
    this.hour = parseField(parts[1], 0, 23)
    this.dom = parseField(parts[2], 1, 31)
    this.month = parseField(parts[3], 1, 12, false, true)
    this.dow = parseField(parts[4], 0, 6, true)
  }

  /** Was this expression created from a preset like `@daily`? */
  static parse(expression: string): Cron {
    return new Cron(expression)
  }

  matches(date: DateInput): boolean {
    const d = date instanceof DateTime ? date : new DateTime(date)
    const min = d.get('minute')
    const hr = d.get('hour')
    const day = d.get('date')
    const mo = d.get('month')
    const dw = d.get('day')

    if (!this.minute.any && !this.minute.values.has(min)) return false
    if (!this.hour.any && !this.hour.values.has(hr)) return false
    if (!this.month.any && !this.month.values.has(mo)) return false

    const domAny = this.dom.any
    const dowAny = this.dow.any
    const domMatch = domAny || this.dom.values.has(day)
    const dowMatch = dowAny || this.dow.values.has(dw)

    // Cron semantic: when both DOM and DOW are restricted, OR them together
    if (!domAny && !dowAny) return domMatch || dowMatch
    return domMatch && dowMatch
  }

  next(from?: DateInput): DateTime {
    const start = from ? (from instanceof DateTime ? from : new DateTime(from)) : new DateTime()
    let cursor = start.set('second', 0).set('millisecond', 0).add(1, 'minute')
    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (this.matches(cursor)) return cursor
      cursor = cursor.add(1, 'minute')
    }
    throw new Error('Cron.next: no matching date found within 366 days')
  }

  prev(from?: DateInput): DateTime {
    const start = from ? (from instanceof DateTime ? from : new DateTime(from)) : new DateTime()
    let cursor = start.set('second', 0).set('millisecond', 0).subtract(1, 'minute')
    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (this.matches(cursor)) return cursor
      cursor = cursor.subtract(1, 'minute')
    }
    throw new Error('Cron.prev: no matching date found within 366 days')
  }

  /** All matches in `[start, end]`, optionally capped at `limit`. */
  between(start: DateInput, end: DateInput, limit?: number): DateTime[] {
    const s = start instanceof DateTime ? start : new DateTime(start)
    const e = end instanceof DateTime ? end : new DateTime(end)
    const out: DateTime[] = []
    let cursor = s.set('second', 0).set('millisecond', 0)
    if (!this.matches(cursor)) cursor = cursor.add(1, 'minute')
    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (cursor.isAfter(e)) break
      if (limit !== undefined && out.length >= limit) break
      if (this.matches(cursor)) out.push(cursor)
      cursor = cursor.add(1, 'minute')
    }
    return out
  }

  humanize(): string {
    if (this.minute.any && this.hour.any && this.dom.any && this.month.any && this.dow.any)
      return 'Every minute'

    if (!this.minute.any && this.hour.any && this.dom.any && this.month.any && this.dow.any) {
      const vals = [...this.minute.values].sort((a, b) => a - b)
      return `At minute ${vals.join(', ')} past every hour`
    }

    const parts: string[] = []
    if (!this.minute.any && !this.hour.any) {
      const mins = [...this.minute.values].sort((a, b) => a - b)
      const hrs = [...this.hour.values].sort((a, b) => a - b)
      const times = hrs.flatMap((h) =>
        mins.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      )
      parts.push(`At ${times.join(', ')}`)
    } else if (!this.minute.any) {
      parts.push(fieldDescription(this.minute, 'minute', 0, 59))
    } else if (!this.hour.any) {
      parts.push(fieldDescription(this.hour, 'hour', 0, 23))
    }

    if (!this.dom.any) {
      parts.push(`on day ${[...this.dom.values].sort((a, b) => a - b).join(', ')} of every month`)
    }
    if (!this.month.any) {
      const vals = [...this.month.values].sort((a, b) => a - b)
      parts.push(`in ${vals.map((v) => MONTH_NAMES[v - 1]).join(', ')}`)
    }
    if (!this.dow.any) parts.push(dowDescription(this.dow))
    return parts.join(', ')
  }

  toString(): string {
    return this.expression
  }
}
