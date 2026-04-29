// ─────────────────────────────────────────────────────────────────────────────
// Solar position calculations — pure math, no API calls.
//
// Based on NOAA's Solar Calculator (https://gml.noaa.gov/grad/solcalc/).
// Accurate to within ~1 minute for civil purposes within years 1801-2099.
//
// All functions take an instant + (lat, lon) in degrees and return either a
// Date (sunrise/sunset/transit) or a number (azimuth/altitude/etc.).
// ─────────────────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Julian day number for a JS Date. */
function julianDay(d: Date): number {
  return d.getTime() / 86_400_000 + 2_440_587.5
}

/** Julian centuries since J2000.0. */
function julianCenturies(jd: number): number {
  return (jd - 2_451_545) / 36_525
}

function geomMeanLongSun(t: number): number {
  let l = 280.46646 + t * (36000.76983 + t * 0.0003032)
  l = ((l % 360) + 360) % 360
  return l
}

function geomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t)
}

function eccentricityEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
}

function sunEqOfCenter(t: number): number {
  const m = geomMeanAnomalySun(t)
  const mrad = m * RAD
  const sinm = Math.sin(mrad)
  const sin2m = Math.sin(2 * mrad)
  const sin3m = Math.sin(3 * mrad)
  return (
    sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sin2m * (0.019993 - 0.000101 * t) +
    sin3m * 0.000289
  )
}

function sunTrueLong(t: number): number {
  return geomMeanLongSun(t) + sunEqOfCenter(t)
}

function sunApparentLong(t: number): number {
  const o = sunTrueLong(t)
  return o - 0.00569 - 0.00478 * Math.sin(RAD * (125.04 - 1934.136 * t))
}

function meanObliquityOfEcliptic(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))
  return 23 + (26 + seconds / 60) / 60
}

function obliquityCorrection(t: number): number {
  const e0 = meanObliquityOfEcliptic(t)
  return e0 + 0.00256 * Math.cos(RAD * (125.04 - 1934.136 * t))
}

function sunDeclination(t: number): number {
  const e = obliquityCorrection(t)
  const lambda = sunApparentLong(t)
  return DEG * Math.asin(Math.sin(RAD * e) * Math.sin(RAD * lambda))
}

function equationOfTime(t: number): number {
  const epsilon = obliquityCorrection(t)
  const l0 = geomMeanLongSun(t)
  const e = eccentricityEarthOrbit(t)
  const m = geomMeanAnomalySun(t)
  const y = Math.tan((RAD * epsilon) / 2) ** 2
  const sin2l0 = Math.sin(2 * RAD * l0)
  const sinm = Math.sin(RAD * m)
  const cos2l0 = Math.cos(2 * RAD * l0)
  const sin4l0 = Math.sin(4 * RAD * l0)
  const sin2m = Math.sin(2 * RAD * m)
  const Etime =
    y * sin2l0 -
    2 * e * sinm +
    4 * e * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * e * e * sin2m
  return DEG * Etime * 4 // minutes
}

/**
 * Compute the UTC instant of the sun reaching a given altitude (in degrees,
 * negative for below-horizon) on the given calendar date. Returns null if the
 * sun never reaches that altitude (polar day/night).
 *
 * `direction` controls which crossing: -1 for morning (rising), +1 for evening.
 */
function timeAtAltitude(
  date: Date,
  lat: number,
  lon: number,
  altitudeDeg: number,
  direction: -1 | 1
): Date | null {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const noonUTC = utcMidnight + (12 - lon / 15) * 3_600_000
  const t = julianCenturies(julianDay(new Date(noonUTC)))
  const decl = sunDeclination(t)
  const eqTime = equationOfTime(t)

  const cosArg =
    Math.cos(RAD * (90 - altitudeDeg)) / (Math.cos(RAD * lat) * Math.cos(RAD * decl)) -
    Math.tan(RAD * lat) * Math.tan(RAD * decl)
  if (cosArg < -1 || cosArg > 1) return null

  const ha = Math.acos(cosArg) * DEG // degrees, always positive
  // NOAA convention: sunrise = solar_noon - 4*ha; sunset = solar_noon + 4*ha
  // direction: -1 = morning (subtract), +1 = evening (add)
  const minutes = 720 - 4 * lon - eqTime + direction * 4 * ha
  return new Date(utcMidnight + minutes * 60_000)
}

/** Geometric sunrise (refraction-adjusted standard altitude -0.833°). */
export function sunrise(date: Date, lat: number, lon: number): Date | null {
  return timeAtAltitude(date, lat, lon, -0.833, -1)
}

/** Geometric sunset. */
export function sunset(date: Date, lat: number, lon: number): Date | null {
  return timeAtAltitude(date, lat, lon, -0.833, 1)
}

/** Solar noon (sun's transit). */
export function solarNoon(date: Date, lat: number, lon: number): Date {
  // Reuse equationOfTime
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const noonUTC = utcMidnight + (12 - lon / 15) * 3_600_000
  const t = julianCenturies(julianDay(new Date(noonUTC)))
  const eqTime = equationOfTime(t)
  const minutes = 720 - 4 * lon - eqTime
  // lat unused in solar noon, keep for signature parity
  void lat
  return new Date(utcMidnight + minutes * 60_000)
}

/** Day length in milliseconds (sunset - sunrise). 0 for polar night. */
export function dayLength(date: Date, lat: number, lon: number): number {
  const r = sunrise(date, lat, lon)
  const s = sunset(date, lat, lon)
  if (!r || !s) return 0
  return s.getTime() - r.getTime()
}

/** Civil twilight (sun at -6°). */
export function civilTwilight(
  date: Date,
  lat: number,
  lon: number
): { dawn: Date | null; dusk: Date | null } {
  return {
    dawn: timeAtAltitude(date, lat, lon, -6, -1),
    dusk: timeAtAltitude(date, lat, lon, -6, 1)
  }
}

/** Nautical twilight (sun at -12°). */
export function nauticalTwilight(
  date: Date,
  lat: number,
  lon: number
): { dawn: Date | null; dusk: Date | null } {
  return {
    dawn: timeAtAltitude(date, lat, lon, -12, -1),
    dusk: timeAtAltitude(date, lat, lon, -12, 1)
  }
}

/** Astronomical twilight (sun at -18°). */
export function astronomicalTwilight(
  date: Date,
  lat: number,
  lon: number
): { dawn: Date | null; dusk: Date | null } {
  return {
    dawn: timeAtAltitude(date, lat, lon, -18, -1),
    dusk: timeAtAltitude(date, lat, lon, -18, 1)
  }
}

/** Hour-angle helper exposed for advanced users. */
export function sunHourAngle(date: Date, lat: number, altitudeDeg = -0.833): number | null {
  const t = julianCenturies(julianDay(date))
  const decl = sunDeclination(t)
  const cosArg =
    Math.cos(RAD * (90 - altitudeDeg)) / (Math.cos(RAD * lat) * Math.cos(RAD * decl)) -
    Math.tan(RAD * lat) * Math.tan(RAD * decl)
  if (cosArg < -1 || cosArg > 1) return null
  return Math.acos(cosArg) * DEG
}

/** Sun declination in degrees at a given instant. */
export function sunDeclinationAt(d: Date): number {
  return sunDeclination(julianCenturies(julianDay(d)))
}
