// ─────────────────────────────────────────────────────────────────────────────
// Holiday registry — open for extension.
//
// Built-in calendars are pre-registered. Add your own by calling
// `Holidays.register('XX', (year) => [...])` from a plugin or extension.
// ─────────────────────────────────────────────────────────────────────────────

import { holidaysUS } from './us'
import { holidaysUK } from './uk'
import { holidaysIN } from './in'
import { holidaysDE } from './de'
import { holidaysFR } from './fr'
import { holidaysCA } from './ca'
import { holidaysAU } from './au'
import { holidaysJP } from './jp'
import { holidaysNP } from './np'

export type HolidayProvider = (year: number) => string[]

const registry: Record<string, HolidayProvider> = {
  US: holidaysUS,
  UK: holidaysUK,
  IN: holidaysIN,
  DE: holidaysDE,
  FR: holidaysFR,
  CA: holidaysCA,
  AU: holidaysAU,
  JP: holidaysJP,
  NP: holidaysNP
}

export const Holidays = {
  /** Register or replace a country's calendar. */
  register(country: string, provider: HolidayProvider): void {
    registry[country.toUpperCase()] = provider
  },

  /** True when this country has a registered provider. */
  has(country: string): boolean {
    return Object.prototype.hasOwnProperty.call(registry, country.toUpperCase())
  },

  /** All registered country codes. */
  list(): string[] {
    return Object.keys(registry)
  },

  /** ISO date strings for the given country/year. Empty for unknown country. */
  for(country: string, year: number): string[] {
    const fn = registry[country.toUpperCase()]
    return fn ? fn(year) : []
  }
}

export {
  holidaysUS,
  holidaysUK,
  holidaysIN,
  holidaysDE,
  holidaysFR,
  holidaysCA,
  holidaysAU,
  holidaysJP,
  holidaysNP
}
