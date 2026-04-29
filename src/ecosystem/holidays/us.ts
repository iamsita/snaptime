import { iso, nthWeekday, lastWeekday } from './easter'

export function holidaysUS(y: number): string[] {
  return [
    iso(y, 1, 1),
    iso(y, 1, nthWeekday(y, 1, 1, 3)), // MLK Day (3rd Mon Jan)
    iso(y, 2, nthWeekday(y, 2, 1, 3)), // Presidents' Day (3rd Mon Feb)
    iso(y, 5, lastWeekday(y, 5, 1)), // Memorial Day (last Mon May)
    iso(y, 6, 19),
    iso(y, 7, 4),
    iso(y, 9, nthWeekday(y, 9, 1, 1)), // Labor Day (1st Mon Sep)
    iso(y, 10, nthWeekday(y, 10, 1, 2)), // Columbus Day (2nd Mon Oct)
    iso(y, 11, 11),
    iso(y, 11, nthWeekday(y, 11, 4, 4)), // Thanksgiving (4th Thu Nov)
    iso(y, 12, 25)
  ]
}
