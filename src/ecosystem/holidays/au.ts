import { easterPlus, easterSunday, iso, nthWeekday } from './easter'

export function holidaysAU(y: number): string[] {
  const e = easterSunday(y)
  return [
    iso(y, 1, 1),
    iso(y, 1, 26),
    easterPlus(y, -2),
    easterPlus(y, -1),
    iso(y, e.month, e.day),
    easterPlus(y, 1),
    iso(y, 4, 25),
    iso(y, 6, nthWeekday(y, 6, 1, 2)),
    iso(y, 12, 25),
    iso(y, 12, 26)
  ]
}
