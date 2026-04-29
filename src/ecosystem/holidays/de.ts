import { easterPlus, easterSunday, iso } from './easter'

export function holidaysDE(y: number): string[] {
  const e = easterSunday(y)
  return [
    iso(y, 1, 1),
    iso(y, 1, 6),
    easterPlus(y, -2),
    iso(y, e.month, e.day),
    easterPlus(y, 1),
    iso(y, 5, 1),
    easterPlus(y, 39), // Christi Himmelfahrt
    easterPlus(y, 49),
    easterPlus(y, 50),
    easterPlus(y, 60),
    iso(y, 10, 3),
    iso(y, 11, 1),
    iso(y, 12, 25),
    iso(y, 12, 26)
  ]
}
