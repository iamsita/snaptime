import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const PL: LocaleData = {
  name: 'pl',
  months: [
    'styczeń',
    'luty',
    'marzec',
    'kwiecień',
    'maj',
    'czerwiec',
    'lipiec',
    'sierpień',
    'wrzesień',
    'październik',
    'listopad',
    'grudzień'
  ],
  monthsShort: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  weekdays: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'],
  weekdaysShort: ['ndz', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob'],
  weekdaysMin: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
  weekStart: 'monday',
  ordinal: (n) => `${n}.`,
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm'
  },
  relativeTime: {
    future: 'za %s',
    past: '%s temu',
    s: 'kilka sekund',
    ss: '%d sekund',
    m: 'minuta',
    mm: '%d minut',
    h: 'godzina',
    hh: '%d godzin',
    d: '1 dzień',
    dd: '%d dni',
    M: 'miesiąc',
    MM: '%d miesięcy',
    y: 'rok',
    yy: '%d lat'
  }
}

Locales.register('pl', PL)
