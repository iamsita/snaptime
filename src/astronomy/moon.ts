// ─────────────────────────────────────────────────────────────────────────────
// Lunar position / phase — simplified.
//
// Phase calculation uses Conway's formula: take the elapsed days since a
// known new moon, modulo the synodic month (29.530588853 days), and read off
// the phase. Accurate to within a day for civil purposes.
// ─────────────────────────────────────────────────────────────────────────────

const SYNODIC_MONTH = 29.530588853
/** A known new moon instant — 2000-01-06 18:14 UTC. */
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14)

export type MoonPhaseName =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent'

export interface MoonPhase {
  /** Days since the most recent new moon (0..29.53). */
  age: number
  /** Fraction of the moon's disk illuminated (0..1). */
  illumination: number
  /** Named phase. */
  name: MoonPhaseName
  /** Symbolic emoji for the phase. */
  emoji: string
}

const NAMES: { name: MoonPhaseName; emoji: string }[] = [
  { name: 'new', emoji: '🌑' },
  { name: 'waxing-crescent', emoji: '🌒' },
  { name: 'first-quarter', emoji: '🌓' },
  { name: 'waxing-gibbous', emoji: '🌔' },
  { name: 'full', emoji: '🌕' },
  { name: 'waning-gibbous', emoji: '🌖' },
  { name: 'last-quarter', emoji: '🌗' },
  { name: 'waning-crescent', emoji: '🌘' }
]

export function moonPhase(d: Date): MoonPhase {
  const age = ((d.getTime() - NEW_MOON_REF) / 86_400_000) % SYNODIC_MONTH
  const normalized = age < 0 ? age + SYNODIC_MONTH : age
  const phaseFrac = normalized / SYNODIC_MONTH // 0..1
  // illumination: 0 at new, 1 at full, back to 0 at next new
  const illumination = (1 - Math.cos(2 * Math.PI * phaseFrac)) / 2
  const idx = Math.floor((phaseFrac * 8 + 0.5) % 8)
  const { name, emoji } = NAMES[idx]
  return { age: normalized, illumination, name, emoji }
}

/** Convenience: just the illumination (0..1). */
export function moonIllumination(d: Date): number {
  return moonPhase(d).illumination
}

/** Date of the next new moon (>= `from`). */
export function nextNewMoon(from: Date): Date {
  const phase = moonPhase(from)
  const remaining = SYNODIC_MONTH - phase.age
  return new Date(from.getTime() + remaining * 86_400_000)
}

/** Date of the next full moon (>= `from`). */
export function nextFullMoon(from: Date): Date {
  const phase = moonPhase(from)
  // Full moon occurs at phase fraction 0.5 (~14.77 days into cycle)
  const target = SYNODIC_MONTH / 2
  const offset = phase.age <= target ? target - phase.age : SYNODIC_MONTH - phase.age + target
  return new Date(from.getTime() + offset * 86_400_000)
}
