import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const HI: LocaleData = {
  name: 'hi',
  months: [
    'जनवरी',
    'फ़रवरी',
    'मार्च',
    'अप्रैल',
    'मई',
    'जून',
    'जुलाई',
    'अगस्त',
    'सितंबर',
    'अक्टूबर',
    'नवंबर',
    'दिसंबर'
  ],
  monthsShort: [
    'जन.',
    'फ़र.',
    'मार्च',
    'अप्रै.',
    'मई',
    'जून',
    'जुल.',
    'अग.',
    'सित.',
    'अक्टू.',
    'नव.',
    'दिस.'
  ],
  weekdays: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरूवार', 'शुक्रवार', 'शनिवार'],
  weekdaysShort: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरू', 'शुक्र', 'शनि'],
  weekdaysMin: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
  weekStart: 'sunday',
  ordinal: (n) => `${n}`,
  longDateFormat: {
    LT: 'A h:mm बजे',
    LTS: 'A h:mm:ss बजे',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY, A h:mm बजे',
    LLLL: 'dddd, D MMMM YYYY, A h:mm बजे'
  },
  meridiem: (h) => {
    if (h < 4) return 'रात'
    if (h < 10) return 'सुबह'
    if (h < 17) return 'दोपहर'
    if (h < 20) return 'शाम'
    return 'रात'
  },
  relativeTime: {
    future: '%s में',
    past: '%s पहले',
    s: 'कुछ ही क्षण',
    ss: '%d सेकंड',
    m: 'एक मिनट',
    mm: '%d मिनट',
    h: 'एक घंटा',
    hh: '%d घंटे',
    d: 'एक दिन',
    dd: '%d दिन',
    M: 'एक महीने',
    MM: '%d महीने',
    y: 'एक वर्ष',
    yy: '%d वर्ष'
  }
}

Locales.register('hi', HI)
