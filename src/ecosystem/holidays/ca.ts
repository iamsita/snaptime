import { easterPlus, iso, nthWeekday, lastWeekday } from './easter'

export function holidaysCA(y: number): string[] {
  return [
    iso(y, 1, 1),
    iso(y, 2, nthWeekday(y, 2, 1, 3)),
    easterPlus(y, -2),
    iso(y, 5, lastWeekday(y, 5, 1)), // Victoria Day approx
    iso(y, 7, 1),
    iso(y, 9, nthWeekday(y, 9, 1, 1)),
    iso(y, 9, 30),
    iso(y, 10, nthWeekday(y, 10, 1, 2)),
    iso(y, 11, 11),
    iso(y, 12, 25),
    iso(y, 12, 26)
  ]
}
