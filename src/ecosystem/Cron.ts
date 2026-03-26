import DateFormat from './DateFormat'
import type { CronField, DateInput } from './type'

const DAY_ABBR: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6
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

function parseField(token: string, min: number, max: number, isDow = false): CronField {
  if (token === '*') {
    return { values: new Set(), any: true }
  }

  const values = new Set<number>()
  const parts = token.split(',')

  for (const part of parts) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    let range: string
    let step: number | null = null

    if (stepMatch) {
      range = stepMatch[1]
      step = parseInt(stepMatch[2], 10)
    } else {
      range = part
    }

    let lo: number
    let hi: number

    if (range === '*') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-')
      lo = resolveValue(a, isDow)
      hi = resolveValue(b, isDow)
    } else {
      lo = resolveValue(range, isDow)
      hi = step != null ? max : lo
    }

    if (isDow) {
      if (lo === 7) lo = 0
      if (hi === 7) hi = 0
    }

    const s = step ?? 1
    if (lo <= hi) {
      for (let i = lo; i <= hi; i += s) {
        values.add(i)
      }
    } else if (isDow) {
      for (let i = lo; i <= 6; i += s) {
        values.add(i)
      }
      for (let i = 0; i <= hi; i += s) {
        values.add(i)
      }
    }
  }

  return { values, any: false }
}

function resolveValue(token: string, isDow: boolean): number {
  if (isDow) {
    const upper = token.toUpperCase()
    if (DAY_ABBR[upper] !== undefined) return DAY_ABBR[upper]
  }
  return parseInt(token, 10)
}

export default class Cron {
  private readonly expression: string
  private readonly minute: CronField
  private readonly hour: CronField
  private readonly dom: CronField
  private readonly month: CronField
  private readonly dow: CronField

  constructor(expression: string) {
    this.expression = expression.trim()
    const parts = this.expression.split(/\s+/)
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`)
    }

    this.minute = parseField(parts[0], 0, 59)
    this.hour = parseField(parts[1], 0, 23)
    this.dom = parseField(parts[2], 1, 31)
    this.month = parseField(parts[3], 1, 12)
    this.dow = parseField(parts[4], 0, 6, true)
  }

  matches(date: DateInput): boolean {
    if (!(date instanceof DateFormat)) date = new DateFormat(date as string | number | Date)
    const min = date.get('minute')
    const hr = date.get('hour')
    const d = date.get('date')
    const mo = date.get('month')
    const dw = date.get('day')

    if (!this.minute.any && !this.minute.values.has(min)) return false
    if (!this.hour.any && !this.hour.values.has(hr)) return false
    if (!this.month.any && !this.month.values.has(mo)) return false

    const domAny = this.dom.any
    const dowAny = this.dow.any
    const domMatch = domAny || this.dom.values.has(d)
    const dowMatch = dowAny || this.dow.values.has(dw)

    if (!domAny && !dowAny) {
      return domMatch || dowMatch
    }

    return domMatch && dowMatch
  }

  next(from?: DateInput): DateFormat {
    const start = from ? (from instanceof DateFormat ? from : new DateFormat(from as string | number | Date)) : new DateFormat()
    let cursor = start.set('second', 0).set('millisecond', 0).add(1, 'minute')

    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (this.matches(cursor)) return cursor
      cursor = cursor.add(1, 'minute')
    }

    throw new Error('No matching date found within 366 days')
  }

  prev(from?: DateInput): DateFormat {
    const start = from ? (from instanceof DateFormat ? from : new DateFormat(from as string | number | Date)) : new DateFormat()
    let cursor = start.set('second', 0).set('millisecond', 0).subtract(1, 'minute')

    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (this.matches(cursor)) return cursor
      cursor = cursor.subtract(1, 'minute')
    }

    throw new Error('No matching date found within 366 days')
  }

  between(start: DateInput, end: DateInput, limit?: number): DateFormat[] {
    const results: DateFormat[] = []
    const s = start instanceof DateFormat ? start : new DateFormat(start as string | number | Date)
    const e = end instanceof DateFormat ? end : new DateFormat(end as string | number | Date)
    let cursor = s.set('second', 0).set('millisecond', 0)

    if (!this.matches(cursor)) {
      cursor = cursor.add(1, 'minute')
    }

    for (let i = 0; i < MAX_ITER_MINUTES; i++) {
      if (cursor.isAfter(e)) break
      if (limit !== undefined && results.length >= limit) break

      if (this.matches(cursor)) {
        results.push(cursor)
      }

      cursor = cursor.add(1, 'minute')
    }

    return results
  }

  humanize(): string {
    const parts: string[] = []

    const minStr = this.fieldDescription(this.minute, 'minute', 0, 59)
    const hrStr = this.fieldDescription(this.hour, 'hour', 0, 23)
    const dowStr = this.dowDescription()

    if (this.minute.any && this.hour.any && this.dom.any && this.month.any && this.dow.any) {
      return 'Every minute'
    }

    if (!this.minute.any && this.hour.any && this.dom.any && this.month.any && this.dow.any) {
      const vals = [...this.minute.values].sort((a, b) => a - b)
      return `At minute ${vals.join(', ')} past every hour`
    }

    if (!this.minute.any && !this.hour.any) {
      const mins = [...this.minute.values].sort((a, b) => a - b)
      const hrs = [...this.hour.values].sort((a, b) => a - b)

      const times = hrs.flatMap((h) =>
        mins.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      )

      parts.push(`At ${times.join(', ')}`)
    } else if (!this.minute.any) {
      parts.push(minStr)
    } else if (!this.hour.any) {
      parts.push(hrStr)
    }

    if (!this.dom.any) {
      parts.push(`on day ${[...this.dom.values].sort((a, b) => a - b).join(', ')} of every month`)
    }

    if (!this.month.any) {
      const vals = [...this.month.values].sort((a, b) => a - b)
      parts.push(`in ${vals.map((v) => MONTH_NAMES[v - 1]).join(', ')}`)
    }

    if (!this.dow.any) {
      parts.push(dowStr)
    }

    return parts.join(', ')
  }

  toString(): string {
    return this.expression
  }

  private fieldDescription(field: CronField, name: string, min: number, max: number): string {
    if (field.any) return `every ${name}`

    const vals = [...field.values].sort((a, b) => a - b)
    if (vals.length === max - min + 1) return `every ${name}`

    return `at ${name} ${vals.join(', ')}`
  }

  private dowDescription(): string {
    if (this.dow.any) return ''

    const vals = [...this.dow.values].sort((a, b) => a - b)

    const isConsecutive = vals.length > 1 && vals.every((v, i) => i === 0 || v === vals[i - 1] + 1)

    if (isConsecutive && vals.length > 2) {
      return `${DAY_NAMES[vals[0]]} through ${DAY_NAMES[vals[vals.length - 1]]}`
    }

    return vals.map((v) => DAY_NAMES[v]).join(', ')
  }
}
