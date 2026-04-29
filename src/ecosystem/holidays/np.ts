import { iso } from './easter'

/**
 * Nepal — fixed Western-calendar dates only. Lunar/festival holidays
 * (Dashain, Tihar, etc.) shift each year and are not encoded here.
 */
export function holidaysNP(y: number): string[] {
  return [
    iso(y, 1, 1),
    iso(y, 1, 11), // Prithvi Jayanti
    iso(y, 5, 1), // Labour Day
    iso(y, 5, 28), // Republic Day
    iso(y, 9, 19), // Constitution Day
    iso(y, 12, 25)
  ]
}
