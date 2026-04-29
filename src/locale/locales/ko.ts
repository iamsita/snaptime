import type { LocaleData } from '../../core/types'
import { Locales } from '../registry'

export const KO: LocaleData = {
  name: 'ko',
  months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthsShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월'
  ],
  weekdays: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  weekdaysShort: ['일', '월', '화', '수', '목', '금', '토'],
  weekdaysMin: ['일', '월', '화', '수', '목', '금', '토'],
  weekStart: 'sunday',
  ordinal: (n) => `${n}일`,
  meridiem: (h) => (h < 12 ? '오전' : '오후'),
  longDateFormat: {
    LT: 'A h:mm',
    LTS: 'A h:mm:ss',
    L: 'YYYY.MM.DD',
    LL: 'YYYY년 MMMM D일',
    LLL: 'YYYY년 MMMM D일 A h:mm',
    LLLL: 'YYYY년 MMMM D일 dddd A h:mm'
  },
  relativeTime: {
    future: '%s 후',
    past: '%s 전',
    s: '몇 초',
    ss: '%d초',
    m: '1분',
    mm: '%d분',
    h: '한 시간',
    hh: '%d시간',
    d: '하루',
    dd: '%d일',
    M: '한 달',
    MM: '%d달',
    y: '일 년',
    yy: '%d년'
  }
}

Locales.register('ko', KO)
