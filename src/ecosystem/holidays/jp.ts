import { iso, nthWeekday } from './easter'

export function holidaysJP(y: number): string[] {
  return [
    iso(y, 1, 1),
    iso(y, 1, nthWeekday(y, 1, 1, 2)), // Coming of Age Day (2nd Mon Jan)
    iso(y, 2, 11),
    iso(y, 2, 23), // Emperor's Birthday
    iso(y, 4, 29),
    iso(y, 5, 3),
    iso(y, 5, 4),
    iso(y, 5, 5),
    iso(y, 7, nthWeekday(y, 7, 1, 3)), // Marine Day
    iso(y, 8, 11),
    iso(y, 9, nthWeekday(y, 9, 1, 3)), // Respect for the Aged
    iso(y, 10, nthWeekday(y, 10, 1, 2)), // Sports Day
    iso(y, 11, 3),
    iso(y, 11, 23)
  ]
}
