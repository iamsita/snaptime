// ─────────────────────────────────────────────────────────────────────────────
// Composable date validation.
//
//   const rule = DateRule.required().future().businessDay()
//   const result = rule.validate(someInput)
//   if (!result.valid) showErrors(result.errors)
//
// Pairs naturally with form libraries — `validate` returns a structured
// result, `assert` throws.
// ─────────────────────────────────────────────────────────────────────────────

import DateTime from '../core/DateTime'
import type { DateInput, Inclusivity } from '../core/types'
import { isBusinessDay } from '../ecosystem/BusinessDay'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

type Predicate = (d: DateTime) => string | null
type RawPredicate = (input: DateInput | null | undefined) => string | null

/** Internal rule node — either a "value" predicate or a raw-input predicate. */
type Node = { kind: 'raw'; fn: RawPredicate } | { kind: 'value'; fn: Predicate }

export class DateRule {
  private readonly _nodes: ReadonlyArray<Node>

  private constructor(nodes: Node[]) {
    this._nodes = nodes
  }

  // ── Static factories ─────────────────────────────────────────────────────

  static empty(): DateRule {
    return new DateRule([])
  }

  static required(message = 'Date is required'): DateRule {
    return new DateRule([
      {
        kind: 'raw',
        fn: (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? message : null)
      }
    ])
  }

  static valid(message = 'Date is invalid'): DateRule {
    return new DateRule([
      { kind: 'value', fn: (d) => (d.isValid() ? null : message) }
    ])
  }

  static future(message = 'Date must be in the future'): DateRule {
    return DateRule.empty().future(message)
  }

  static past(message = 'Date must be in the past'): DateRule {
    return DateRule.empty().past(message)
  }

  // ── Builders (each returns a new DateRule) ───────────────────────────────

  private _add(node: Node): DateRule {
    return new DateRule([...this._nodes, node])
  }

  required(message = 'Date is required'): DateRule {
    return this._add({
      kind: 'raw',
      fn: (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? message : null)
    })
  }

  valid(message = 'Date is invalid'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isValid() ? null : message) })
  }

  future(message = 'Date must be in the future'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isFuture() ? null : message) })
  }

  past(message = 'Date must be in the past'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isPast() ? null : message) })
  }

  before(other: DateInput, message?: string): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => (d.isBefore(other) ? null : message ?? `Date must be before ${new DateTime(other).toISOString()}`)
    })
  }

  after(other: DateInput, message?: string): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => (d.isAfter(other) ? null : message ?? `Date must be after ${new DateTime(other).toISOString()}`)
    })
  }

  between(
    min: DateInput,
    max: DateInput,
    inclusivity: Inclusivity = '[]',
    message?: string
  ): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) =>
        d.isBetween(min, max, undefined, inclusivity)
          ? null
          : message ??
            `Date must be between ${new DateTime(min).toISOString()} and ${new DateTime(max).toISOString()}`
    })
  }

  businessDay(holidays?: string[], message = 'Must be a business day'): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => (isBusinessDay(d, holidays) ? null : message)
    })
  }

  weekday(message = 'Must be a weekday'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isWeekday() ? null : message) })
  }

  weekend(message = 'Must be a weekend'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isWeekend() ? null : message) })
  }

  dayOfWeek(weekday: number, message?: string): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => (d.dayOfWeek() === weekday ? null : message ?? `Must be weekday index ${weekday}`)
    })
  }

  year(y: number, message?: string): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => ((d.year() as number) === y ? null : message ?? `Year must be ${y}`)
    })
  }

  month(m: number, message?: string): DateRule {
    return this._add({
      kind: 'value',
      fn: (d) => ((d.month() as number) === m ? null : message ?? `Month must be ${m}`)
    })
  }

  leapYear(message = 'Must be a leap year'): DateRule {
    return this._add({ kind: 'value', fn: (d) => (d.isLeapYear() ? null : message) })
  }

  /** Custom predicate. Return a string (error) or null (pass). */
  custom(fn: (d: DateTime) => string | null): DateRule {
    return this._add({ kind: 'value', fn })
  }

  /** Compose with another rule — both must pass (default behavior). */
  and(other: DateRule): DateRule {
    return new DateRule([...this._nodes, ...other._nodes])
  }

  /**
   * At least one of `this` or `other` must pass. Errors are combined only if
   * both fail.
   */
  or(other: DateRule, message = 'No alternative passed'): DateRule {
    return this._add({
      kind: 'raw',
      fn: (v) => {
        const r1 = this._check(v)
        if (r1.valid) return null
        const r2 = other._check(v)
        if (r2.valid) return null
        return message
      }
    })
  }

  // ── Execution ────────────────────────────────────────────────────────────

  validate(input: DateInput | null | undefined): ValidationResult {
    return this._check(input)
  }

  /** Throws on failure. Returns the parsed DateTime on success. */
  assert(input: DateInput | null | undefined): DateTime {
    const r = this._check(input)
    if (!r.valid) throw new Error(`Validation failed: ${r.errors.join(', ')}`)
    return new DateTime(input as DateInput)
  }

  /** Convenience boolean check. */
  test(input: DateInput | null | undefined): boolean {
    return this._check(input).valid
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _check(input: DateInput | null | undefined): ValidationResult {
    const errors: string[] = []
    let dt: DateTime | null = null

    for (const node of this._nodes) {
      if (node.kind === 'raw') {
        const e = node.fn(input)
        if (e != null) errors.push(e)
      } else {
        if (dt == null) {
          if (input == null) {
            // Skip value checks if no value (the "required" rule handles missing)
            continue
          }
          try {
            dt = new DateTime(input as DateInput)
          } catch {
            errors.push('Date is invalid')
            continue
          }
          if (!dt.isValid()) {
            errors.push('Date is invalid')
            continue
          }
        }
        const e = node.fn(dt)
        if (e != null) errors.push(e)
      }
    }
    return { valid: errors.length === 0, errors }
  }
}

export default DateRule
