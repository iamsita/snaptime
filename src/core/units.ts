import type { Unit, UnitInput } from './types'
import { MS_PER_UNIT, UNIT_ALIASES } from './constants'

const KNOWN: ReadonlySet<Unit> = new Set([
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
  'date',
  'week',
  'fortnight',
  'month',
  'quarter',
  'year',
  'decade',
  'century',
  'millennium'
])

/**
 * Resolve any user-friendly unit string to a canonical {@link Unit}.
 * Throws on unrecognized input — use {@link tryResolveUnit} for a non-throwing variant.
 */
export function resolveUnit(input: UnitInput | string): Unit {
  const aliased = UNIT_ALIASES[input]
  if (aliased) return aliased
  if (KNOWN.has(input as Unit)) return input as Unit
  throw new RangeError(`Unknown unit: "${input}"`)
}

export function tryResolveUnit(input: string): Unit | null {
  const aliased = UNIT_ALIASES[input]
  if (aliased) return aliased
  if (KNOWN.has(input as Unit)) return input as Unit
  return null
}

/**
 * Approximate ms-per-unit. Calendar-correct arithmetic happens via JS Date
 * for month/year/etc — this function is only used for purely-arithmetic units.
 */
export function msPerUnit(unit: Unit): number {
  return MS_PER_UNIT[unit]
}
