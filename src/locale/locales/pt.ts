import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const PT: LocaleData = {
  name: 'pt',
  months: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ],
  monthsShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  weekdays: [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado'
  ],
  weekdaysShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  weekdaysMin: ['do', 'se', 'te', 'qu', 'qu', 'se', 'sá'],
  weekStart: 'monday',
  ordinal: (n) => `${n}º`,
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D [de] MMMM [de] YYYY',
    LLL: 'D [de] MMMM [de] YYYY [às] HH:mm',
    LLLL: 'dddd, D [de] MMMM [de] YYYY [às] HH:mm'
  },
  relativeTime: {
    future: 'em %s',
    past: 'há %s',
    s: 'segundos',
    ss: '%d segundos',
    m: 'um minuto',
    mm: '%d minutos',
    h: 'uma hora',
    hh: '%d horas',
    d: 'um dia',
    dd: '%d dias',
    M: 'um mês',
    MM: '%d meses',
    y: 'um ano',
    yy: '%d anos'
  }
}

Locales.register('pt', PT)
