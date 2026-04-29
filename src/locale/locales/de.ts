import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const DE: LocaleData = {
  name: 'de',
  months: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
  ],
  monthsShort: [
    'Jan.',
    'Feb.',
    'März',
    'Apr.',
    'Mai',
    'Juni',
    'Juli',
    'Aug.',
    'Sept.',
    'Okt.',
    'Nov.',
    'Dez.'
  ],
  weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  weekdaysShort: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
  weekdaysMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  weekStart: 'monday',
  ordinal: (n) => `${n}.`,
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D. MMMM YYYY',
    LLL: 'D. MMMM YYYY HH:mm',
    LLLL: 'dddd, D. MMMM YYYY HH:mm'
  },
  relativeTime: {
    future: 'in %s',
    past: 'vor %s',
    s: 'ein paar Sekunden',
    ss: '%d Sekunden',
    m: 'einer Minute',
    mm: '%d Minuten',
    h: 'einer Stunde',
    hh: '%d Stunden',
    d: 'einem Tag',
    dd: '%d Tagen',
    M: 'einem Monat',
    MM: '%d Monaten',
    y: 'einem Jahr',
    yy: '%d Jahren'
  }
}

Locales.register('de', DE)
