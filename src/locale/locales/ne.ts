import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

/**
 * Nepali (ne) locale — included as a friendly default given the package author
 * is based in Nepal.
 */
export const NE: LocaleData = {
  name: 'ne',
  months: [
    'जनवरी',
    'फेब्रुअरी',
    'मार्च',
    'अप्रिल',
    'मे',
    'जुन',
    'जुलाई',
    'अगस्ट',
    'सेप्टेम्बर',
    'अक्टोबर',
    'नोभेम्बर',
    'डिसेम्बर'
  ],
  monthsShort: [
    'जन.',
    'फेब्रु.',
    'मार्च',
    'अप्रि.',
    'मे',
    'जुन',
    'जुलाई.',
    'अग.',
    'सेप्ट.',
    'अक्टो.',
    'नोभे.',
    'डिसे.'
  ],
  weekdays: ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'],
  weekdaysShort: ['आइत.', 'सोम.', 'मङ्गल.', 'बुध.', 'बिही.', 'शुक्र.', 'शनि.'],
  weekdaysMin: ['आ.', 'सो.', 'मं.', 'बु.', 'बि.', 'शु.', 'श.'],
  weekStart: 'sunday',
  ordinal: (n) => `${n}`,
  meridiem: (h) => {
    if (h < 3) return 'राति'
    if (h < 12) return 'बिहान'
    if (h < 16) return 'दिउँसो'
    if (h < 20) return 'साँझ'
    return 'राति'
  },
  longDateFormat: {
    LT: 'Aको h:mm बजे',
    LTS: 'Aको h:mm:ss बजे',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY, Aको h:mm बजे',
    LLLL: 'dddd, D MMMM YYYY, Aको h:mm बजे'
  },
  relativeTime: {
    future: '%sमा',
    past: '%s अगाडि',
    s: 'केही क्षण',
    ss: '%d सेकेन्ड',
    m: 'एक मिनेट',
    mm: '%d मिनेट',
    h: 'एक घण्टा',
    hh: '%d घण्टा',
    d: 'एक दिन',
    dd: '%d दिन',
    M: 'एक महिना',
    MM: '%d महिना',
    y: 'एक बर्ष',
    yy: '%d बर्ष'
  }
}

Locales.register('ne', NE)
