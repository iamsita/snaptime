import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const ES: LocaleData = {
  name: 'es',
  months: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ],
  monthsShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  weekdaysShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  weekdaysMin: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'],
  weekStart: 'monday',
  ordinal: (n) => `${n}º`,
  longDateFormat: {
    LT: 'H:mm',
    LTS: 'H:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D [de] MMMM [de] YYYY',
    LLL: 'D [de] MMMM [de] YYYY H:mm',
    LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm'
  },
  relativeTime: {
    future: 'en %s',
    past: 'hace %s',
    s: 'unos segundos',
    ss: '%d segundos',
    m: 'un minuto',
    mm: '%d minutos',
    h: 'una hora',
    hh: '%d horas',
    d: 'un día',
    dd: '%d días',
    M: 'un mes',
    MM: '%d meses',
    y: 'un año',
    yy: '%d años'
  }
}

Locales.register('es', ES)
