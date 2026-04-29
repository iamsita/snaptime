import { easterPlus, iso } from './easter'

export function holidaysFR(y: number): string[] {
  return [
    iso(y, 1, 1),
    easterPlus(y, 1),
    iso(y, 5, 1),
    iso(y, 5, 8),
    easterPlus(y, 39),
    easterPlus(y, 50),
    iso(y, 7, 14),
    iso(y, 8, 15),
    iso(y, 11, 1),
    iso(y, 11, 11),
    iso(y, 12, 25)
  ]
}
