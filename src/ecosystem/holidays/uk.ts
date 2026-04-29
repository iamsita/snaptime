import { easterPlus, iso, nthWeekday, lastWeekday } from './easter'

export function holidaysUK(y: number): string[] {
  return [
    iso(y, 1, 1),
    easterPlus(y, -2), // Good Friday
    easterPlus(y, 1), // Easter Monday
    iso(y, 5, nthWeekday(y, 5, 1, 1)), // Early May Bank Holiday
    iso(y, 5, lastWeekday(y, 5, 1)), // Spring Bank Holiday
    iso(y, 8, lastWeekday(y, 8, 1)), // Summer Bank Holiday
    iso(y, 12, 25),
    iso(y, 12, 26)
  ]
}
