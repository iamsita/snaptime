/**
 * Anonymous Gregorian algorithm for Easter Sunday.
 * Returns 1-indexed (month, day).
 */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

/** Format a date as YYYY-MM-DD. */
export function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** ISO date `n` days after Easter Sunday. */
export function easterPlus(year: number, n: number): string {
  const { month, day } = easterSunday(year)
  const d = new Date(year, month - 1, day + n)
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/** N-th occurrence of `weekday` (0=Sun..6=Sat) in `month`. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(year, month - 1, 1).getDay()
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7
}

/** Last occurrence of `weekday` in `month`. */
export function lastWeekday(year: number, month: number, weekday: number): number {
  const last = new Date(year, month, 0)
  const lastDay = last.getDay()
  let diff = lastDay - weekday
  if (diff < 0) diff += 7
  return last.getDate() - diff
}
