// Astronomy helpers — sunrise/sunset/twilight, moon phase, seasons.
//
// Pure-math implementations: no network, no data tables. Accuracy is good
// enough for civil purposes (within a minute or two for sun, within a day
// for moon phase) over the year range 1801-2099.

export {
  sunrise,
  sunset,
  solarNoon,
  dayLength,
  civilTwilight,
  nauticalTwilight,
  astronomicalTwilight,
  sunHourAngle,
  sunDeclinationAt
} from './sun'

export {
  moonPhase,
  moonIllumination,
  nextNewMoon,
  nextFullMoon,
  type MoonPhase,
  type MoonPhaseName
} from './moon'

export {
  equinox,
  springEquinox,
  summerSolstice,
  autumnEquinox,
  winterSolstice,
  type Season
} from './seasons'
