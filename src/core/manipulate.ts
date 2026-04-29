// ─────────────────────────────────────────────────────────────────────────────
// Date manipulation primitives used by DateTime — pure operations on a JS Date
// that produce a new JS Date. Keeps the DateTime class focused on identity &
// dispatch rather than mechanics.
// ─────────────────────────────────────────────────────────────────────────────

import { LOCAL_SETTERS, UTC_SETTERS, LOCAL_GETTERS, UTC_GETTERS, daysInMonth } from './helpers'

export type Mode = 'local' | 'utc'

const setters = (mode: Mode) => (mode === 'utc' ? UTC_SETTERS : LOCAL_SETTERS)
const getters = (mode: Mode) => (mode === 'utc' ? UTC_GETTERS : LOCAL_GETTERS)

function clone(d: Date): Date {
  return new Date(d.getTime())
}

// ─────────────────────────────────────────────────────────────────────────────
// startOf / endOf
// ─────────────────────────────────────────────────────────────────────────────

export type BoundaryUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'isoWeek'
  | 'day'
  | 'date'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

export function startOf(d: Date, unit: BoundaryUnit, mode: Mode, weekStartSunday = true): Date {
  const out = clone(d)
  const set = setters(mode)
  const get = getters(mode)

  switch (unit) {
    case 'year':
      set.month(out, 1)
      set.date(out, 1)
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    case 'quarter': {
      const m = get.month(out)
      const startMonth = Math.floor((m - 1) / 3) * 3 + 1
      set.month(out, startMonth)
      set.date(out, 1)
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    }
    case 'month':
      set.date(out, 1)
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    case 'week': {
      const dow = get.day(out)
      const offset = weekStartSunday ? dow : (dow + 6) % 7
      set.date(out, get.date(out) - offset)
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    }
    case 'isoWeek': {
      const dow = get.day(out)
      const isoOffset = (dow + 6) % 7 // ISO: Mon=0..Sun=6
      set.date(out, get.date(out) - isoOffset)
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    }
    case 'day':
    case 'date':
      set.hour(out, 0)
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    case 'hour':
      set.minute(out, 0)
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    case 'minute':
      set.second(out, 0)
      set.millisecond(out, 0)
      return out
    case 'second':
      set.millisecond(out, 0)
      return out
    case 'millisecond':
      return out
  }
}

export function endOf(d: Date, unit: BoundaryUnit, mode: Mode, weekStartSunday = true): Date {
  const start = startOf(d, unit, mode, weekStartSunday)
  return new Date(addToBoundary(start, unit, mode).getTime() - 1)
}

function addToBoundary(d: Date, unit: BoundaryUnit, mode: Mode): Date {
  const out = clone(d)
  const set = setters(mode)
  const get = getters(mode)
  switch (unit) {
    case 'year':
      set.year(out, get.year(out) + 1)
      return out
    case 'quarter':
      set.month(out, get.month(out) + 3)
      return out
    case 'month':
      set.month(out, get.month(out) + 1)
      return out
    case 'week':
    case 'isoWeek':
      set.date(out, get.date(out) + 7)
      return out
    case 'day':
    case 'date':
      set.date(out, get.date(out) + 1)
      return out
    case 'hour':
      set.hour(out, get.hour(out) + 1)
      return out
    case 'minute':
      set.minute(out, get.minute(out) + 1)
      return out
    case 'second':
      set.second(out, get.second(out) + 1)
      return out
    case 'millisecond':
      set.millisecond(out, get.millisecond(out) + 1)
      return out
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// firstOf / lastOf / nthOf
// All take a date and a "container" unit (month / quarter / year) plus an
// optional weekday filter. Without a weekday they pin to the first/last
// calendar day of that container.
// ─────────────────────────────────────────────────────────────────────────────

export type ContainerUnit = 'month' | 'quarter' | 'year'

function containerBounds(d: Date, container: ContainerUnit, mode: Mode): [Date, Date] {
  const start = startOf(d, container as BoundaryUnit, mode)
  const end = endOf(d, container as BoundaryUnit, mode)
  return [start, end]
}

/** First day of `container`, optionally pinned to a weekday (0=Sun..6=Sat). */
export function firstOf(d: Date, container: ContainerUnit, mode: Mode, weekday?: number): Date {
  const [start] = containerBounds(d, container, mode)
  if (weekday == null) return start
  const get = getters(mode)
  const set = setters(mode)
  const dow = get.day(start)
  const out = clone(start)
  const offset = (weekday - dow + 7) % 7
  set.date(out, get.date(out) + offset)
  return out
}

/** Last day of `container`, optionally pinned to a weekday. */
export function lastOf(d: Date, container: ContainerUnit, mode: Mode, weekday?: number): Date {
  const [, end] = containerBounds(d, container, mode)
  // Move back to the last calendar day (end - 1ms is end-of-day; floor to start of that day)
  const get = getters(mode)
  const set = setters(mode)
  const lastDay = clone(end)
  set.hour(lastDay, 0)
  set.minute(lastDay, 0)
  set.second(lastDay, 0)
  set.millisecond(lastDay, 0)
  if (weekday == null) return lastDay
  const dow = get.day(lastDay)
  const offset = (dow - weekday + 7) % 7
  set.date(lastDay, get.date(lastDay) - offset)
  return lastDay
}

/**
 * The N-th occurrence of `weekday` within `container`. Returns null if N
 * exceeds the count of that weekday in the container (e.g. 5th Friday of a
 * 4-Friday month).
 */
export function nthOf(
  d: Date,
  container: ContainerUnit,
  n: number,
  weekday: number,
  mode: Mode
): Date | null {
  const candidate = firstOf(d, container, mode, weekday)
  const get = getters(mode)
  const set = setters(mode)
  const out = clone(candidate)
  set.date(out, get.date(out) + (n - 1) * 7)
  // Validate the result is still inside the container
  const start = startOf(d, container as BoundaryUnit, mode).getTime()
  const end = endOf(d, container as BoundaryUnit, mode).getTime()
  return out.getTime() >= start && out.getTime() <= end ? out : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Round / Floor / Ceil
// ─────────────────────────────────────────────────────────────────────────────

const UNIT_MS: Record<BoundaryUnit, number | null> = {
  millisecond: 1,
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  date: 86_400_000,
  week: 604_800_000,
  isoWeek: 604_800_000,
  // For month/quarter/year, round/floor/ceil go via boundary navigation
  month: null,
  quarter: null,
  year: null
}

export function floorTo(d: Date, unit: BoundaryUnit, mode: Mode): Date {
  return startOf(d, unit, mode)
}

export function ceilTo(d: Date, unit: BoundaryUnit, mode: Mode): Date {
  const s = startOf(d, unit, mode)
  if (s.getTime() === d.getTime()) return s
  return addToBoundary(s, unit, mode)
}

export function roundTo(d: Date, unit: BoundaryUnit, mode: Mode): Date {
  const ms = UNIT_MS[unit]
  if (ms != null) {
    return new Date(Math.round(d.getTime() / ms) * ms)
  }
  // Calendar units — pick whichever boundary is closer
  const lo = startOf(d, unit, mode)
  const hi = addToBoundary(lo, unit, mode)
  return d.getTime() - lo.getTime() < hi.getTime() - d.getTime() ? lo : hi
}

/** Round to the nearest multiple of `n` of `unit` (e.g. nearest 15 minutes). */
export function roundToMultiple(d: Date, n: number, unit: BoundaryUnit): Date {
  const ms = UNIT_MS[unit]
  if (ms == null) {
    throw new RangeError(`roundToMultiple does not support calendar unit "${unit}"`)
  }
  const stride = n * ms
  return new Date(Math.round(d.getTime() / stride) * stride)
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / set primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Calendar-correct add for month/year — clamps date if target month is shorter. */
export function addMonths(d: Date, n: number, mode: Mode): Date {
  const out = clone(d)
  const get = getters(mode)
  const set = setters(mode)
  const desiredDate = get.date(out)
  set.date(out, 1)
  set.month(out, get.month(out) + n)
  const dim = daysInMonth(get.year(out), get.month(out))
  set.date(out, Math.min(desiredDate, dim))
  return out
}

export function addYears(d: Date, n: number, mode: Mode): Date {
  return addMonths(d, n * 12, mode)
}
