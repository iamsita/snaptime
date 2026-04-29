// ─────────────────────────────────────────────────────────────────────────────
// Equinoxes & solstices.
//
// Uses Meeus's polynomial expressions from Astronomical Algorithms (Ch. 27)
// for years 1000-3000. The "JDE0" mean values produced here are accurate to
// within ~20 minutes of the truth. For years 2000-3000:
//
//   Y = (year - 2000) / 1000
//   spring  = 2451623.80984 + 365242.37404*Y +  0.05169*Y² - 0.00411*Y³ - 0.00057*Y⁴
//   summer  = 2451716.56767 + 365241.62603*Y +  0.00325*Y² + 0.00888*Y³ - 0.00030*Y⁴
//   autumn  = 2451810.21715 + 365242.01767*Y -  0.11575*Y² + 0.00337*Y³ + 0.00078*Y⁴
//   winter  = 2451900.05952 + 365242.74049*Y -  0.06223*Y² - 0.00823*Y³ + 0.00032*Y⁴
//
// And for years 1000-2000 there's a separate set anchored at year 1000.
// ─────────────────────────────────────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

const COEFFS_2000: Record<Season, [number, number, number, number, number]> = {
  spring: [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
  summer: [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003],
  autumn: [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
  winter: [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]
}

const COEFFS_1000: Record<Season, [number, number, number, number, number]> = {
  spring: [1721139.29189, 365242.1374, 0.06134, 0.00111, -0.00071],
  summer: [1721233.25401, 365241.72562, -0.05323, 0.00907, 0.00025],
  autumn: [1721325.70455, 365242.49558, -0.11677, -0.00297, 0.00074],
  winter: [1721414.39987, 365242.88257, -0.00769, -0.00933, -0.00006]
}

function jdToDate(jd: number): Date {
  return new Date((jd - 2_440_587.5) * 86_400_000)
}

function jde0(year: number, season: Season): number {
  const coeffs = year >= 2000 ? COEFFS_2000[season] : COEFFS_1000[season]
  const Y = year >= 2000 ? (year - 2000) / 1000 : (year - 1000) / 1000
  const Y2 = Y * Y
  const Y3 = Y2 * Y
  const Y4 = Y3 * Y
  return coeffs[0] + coeffs[1] * Y + coeffs[2] * Y2 + coeffs[3] * Y3 + coeffs[4] * Y4
}

/** UTC instant of the requested equinox/solstice for `year`. */
export function equinox(year: number, season: Season): Date {
  return jdToDate(jde0(year, season))
}

export function springEquinox(year: number): Date {
  return equinox(year, 'spring')
}
export function summerSolstice(year: number): Date {
  return equinox(year, 'summer')
}
export function autumnEquinox(year: number): Date {
  return equinox(year, 'autumn')
}
export function winterSolstice(year: number): Date {
  return equinox(year, 'winter')
}
