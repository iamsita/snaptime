import { easterPlus, iso } from './easter'

export function holidaysIN(y: number): string[] {
  return [
    iso(y, 1, 1),
    iso(y, 1, 26), // Republic Day
    easterPlus(y, -2),
    iso(y, 5, 1),
    iso(y, 8, 15),
    iso(y, 10, 2),
    iso(y, 11, 14),
    iso(y, 12, 25)
  ]
}
