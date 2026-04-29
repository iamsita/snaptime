import {
  DEFAULT_MONTHS,
  DEFAULT_MONTHS_SHORT,
  DEFAULT_WEEKDAYS,
  DEFAULT_WEEKDAYS_SHORT,
  DEFAULT_WEEKDAYS_MIN
} from '../core/constants'
import { ordinal } from '../core/helpers'
import type { LocaleData } from '../core/types'

/**
 * Built-in English locale. Used when no other locale has been registered or
 * when a registered locale is missing a field.
 */
export const EN: LocaleData = {
  name: 'en',
  months: DEFAULT_MONTHS,
  monthsShort: DEFAULT_MONTHS_SHORT,
  weekdays: DEFAULT_WEEKDAYS,
  weekdaysShort: DEFAULT_WEEKDAYS_SHORT,
  weekdaysMin: DEFAULT_WEEKDAYS_MIN,
  weekStart: 'sunday',
  ordinal,
  meridiem: (h, _m, isLower) => (h < 12 ? (isLower ? 'am' : 'AM') : isLower ? 'pm' : 'PM'),
  longDateFormat: {
    LT: 'h:mm A',
    LTS: 'h:mm:ss A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A',
    l: 'M/D/YYYY',
    ll: 'MMM D, YYYY',
    lll: 'MMM D, YYYY h:mm A',
    llll: 'ddd, MMM D, YYYY h:mm A'
  },
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  },
  calendar: {
    sameDay: '[Today at] {time}',
    nextDay: '[Tomorrow at] {time}',
    nextWeek: '{day} [at] {time}',
    lastDay: '[Yesterday at] {time}',
    lastWeek: '[Last] {day} [at] {time}',
    sameElse: 'L'
  }
}
