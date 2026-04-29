import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const IT: LocaleData = {
  name: 'it',
  months: [
    'gennaio',
    'febbraio',
    'marzo',
    'aprile',
    'maggio',
    'giugno',
    'luglio',
    'agosto',
    'settembre',
    'ottobre',
    'novembre',
    'dicembre'
  ],
  monthsShort: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  weekdays: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
  weekdaysShort: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  weekdaysMin: ['do', 'lu', 'ma', 'me', 'gi', 've', 'sa'],
  weekStart: 'monday',
  ordinal: (n) => `${n}º`,
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd D MMMM YYYY HH:mm'
  },
  relativeTime: {
    future: 'tra %s',
    past: '%s fa',
    s: 'alcuni secondi',
    ss: '%d secondi',
    m: 'un minuto',
    mm: '%d minuti',
    h: "un'ora",
    hh: '%d ore',
    d: 'un giorno',
    dd: '%d giorni',
    M: 'un mese',
    MM: '%d mesi',
    y: 'un anno',
    yy: '%d anni'
  }
}

Locales.register('it', IT)
