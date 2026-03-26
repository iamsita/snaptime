import { dateFormat } from '../src/index'

describe('dateFormat factory & API surface', () => {
  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true })
    jest.setSystemTime(new Date('2025-05-04T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('isValid', () => {
    expect(dateFormat('2025-05-04').isValid()).toBe(true)
    expect(dateFormat('foo').isValid()).toBe(false)
    expect(dateFormat('2025-05-32').isValid()).toBe(false)
    expect(dateFormat('2025-05-04T12:00:00Z').isValid()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isValid()).toBe(true)
  })

  test('isUtc', () => {
    expect(dateFormat('2025-05-04T12:00:00Z').isUtc()).toBe(true)
    expect(dateFormat('2025-05-04 12:00:00').isUtc()).toBe(false)
  })

  test('isLocal', () => {
    expect(dateFormat('2025-05-04T12:00:00Z').isLocal()).toBe(false)
  })

  test('isDST', () => {
    // expect(dateFormat('2025-06-01T12:00:00').isDST()).toBe(true)
    // expect(dateFormat('2025-01-01T12:00:00').isDST()).toBe(true)
    expect(dateFormat('2025-06-01T12:00:00Z').isDST()).toBe(false)
  })

  test('isSunday', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSunday()).toBe(true)
    expect(dateFormat('2025-05-05T12:00:00').isSunday()).toBe(false)
  })

  test('isMonday', () => {
    expect(dateFormat('2025-05-05T12:00:00').isMonday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isMonday()).toBe(false)
  })

  test('isTuesday', () => {
    expect(dateFormat('2025-05-06T12:00:00').isTuesday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isTuesday()).toBe(false)
  })

  test('isWednesday', () => {
    expect(dateFormat('2025-05-07T12:00:00').isWednesday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isWednesday()).toBe(false)
  })

  test('isThursday', () => {
    expect(dateFormat('2025-05-08T12:00:00').isThursday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isThursday()).toBe(false)
  })

  test('isFriday', () => {
    expect(dateFormat('2025-05-09T12:00:00').isFriday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isFriday()).toBe(false)
  })

  test('isSaturday', () => {
    expect(dateFormat('2025-05-10T12:00:00').isSaturday()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isSaturday()).toBe(false)
  })

  test('isSameYear', () => {
    expect(dateFormat('2025-01-01T12:00:00').isSameYear(dateFormat('2025-12-31T12:00:00'))).toBe(
      true
    )
    expect(dateFormat('2025-01-01T12:00:00').isSameYear(dateFormat('2026-01-01T12:00:00'))).toBe(
      false
    )
  })

  test('isCurrentYear', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentYear()).toBe(true)
    expect(dateFormat('2026-05-04T12:00:00').isCurrentYear()).toBe(false)
  })

  test('isNextYear', () => {
    expect(dateFormat('2026-05-04T12:00:00').isNextYear()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextYear()).toBe(false)
  })

  test('isLastYear', () => {
    expect(dateFormat('2024-05-04T12:00:00').isLastYear()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastYear()).toBe(false)
  })

  test('isCurrentMonth', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentMonth()).toBe(true)
    expect(dateFormat('2025-06-04T12:00:00').isCurrentMonth()).toBe(false)
  })

  test('isNextMonth', () => {
    expect(dateFormat('2025-06-04T12:00:00').isNextMonth()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextMonth()).toBe(false)
  })

  test('isLastMonth', () => {
    expect(dateFormat('2025-04-04T12:00:00').isLastMonth()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastMonth()).toBe(false)
  })

  test('isSameWeek', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameWeek(dateFormat('2025-05-05T12:00:00'))).toBe(
      false
    )
    expect(dateFormat('2025-05-03T12:00:00').isSameWeek(dateFormat('2025-05-04T12:00:00'))).toBe(
      true
    )
  })

  test('isCurrentWeek', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentWeek()).toBe(true)
    expect(dateFormat('2025-05-11T12:00:00').isCurrentWeek()).toBe(false)
  })

  test('isNextWeek', () => {
    expect(dateFormat('2025-05-11T12:00:00').isNextWeek()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextWeek()).toBe(false)
  })

  test('isLastWeek', () => {
    expect(dateFormat('2025-04-27T12:00:00').isLastWeek()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastWeek()).toBe(false)
  })

  test('isSameDay', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameDay(dateFormat('2025-05-04T15:00:00'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameDay(dateFormat('2025-05-05T12:00:00'))).toBe(
      false
    )
  })

  test('isCurrentDay', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentDay()).toBe(true)
    expect(dateFormat('2025-05-05T12:00:00').isCurrentDay()).toBe(false)
  })

  test('isNextDay', () => {
    expect(dateFormat('2025-05-05T12:00:00').isNextDay()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextDay()).toBe(false)
  })

  test('isLastDay', () => {
    expect(dateFormat('2025-05-03T12:00:00').isLastDay()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastDay()).toBe(false)
  })

  test('isSameHour', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameHour(dateFormat('2025-05-04T12:30:00'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameHour(dateFormat('2025-05-04T13:00:00'))).toBe(
      false
    )
  })

  test('isCurrentHour', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentHour()).toBe(true)
    expect(dateFormat('2025-05-04T13:00:00').isCurrentHour()).toBe(false)
  })

  test('isNextHour', () => {
    expect(dateFormat('2025-05-04T13:00:00').isNextHour()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextHour()).toBe(false)
  })

  test('isLastHour', () => {
    expect(dateFormat('2025-05-04T11:00:00').isLastHour()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastHour()).toBe(false)
  })

  test('isSameMinute', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameMinute(dateFormat('2025-05-04T12:00:30'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameMinute(dateFormat('2025-05-04T12:01:00'))).toBe(
      false
    )
  })

  test('isCurrentMinute', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentMinute()).toBe(true)
    expect(dateFormat('2025-05-04T12:01:00').isCurrentMinute()).toBe(false)
  })

  test('isNextMinute', () => {
    expect(dateFormat('2025-05-04T12:01:00').isNextMinute()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextMinute()).toBe(false)
  })

  test('isLastMinute', () => {
    expect(dateFormat('2025-05-04T11:59:00').isLastMinute()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastMinute()).toBe(false)
  })

  test('isSameSecond', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameSecond(dateFormat('2025-05-04T12:00:00'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameSecond(dateFormat('2025-05-04T12:00:01'))).toBe(
      false
    )
  })

  test('isCurrentSecond', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentSecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:01').isCurrentSecond()).toBe(false)
  })

  test('isNextSecond', () => {
    expect(dateFormat('2025-05-04T12:00:01').isNextSecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextSecond()).toBe(false)
  })

  test('isLastSecond', () => {
    expect(dateFormat('2025-05-04T11:59:59').isLastSecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastSecond()).toBe(false)
  })

  test('isSameMillisecond', () => {
    expect(
      dateFormat('2025-05-04T12:00:00.000').isSameMillisecond(dateFormat('2025-05-04T12:00:00.000'))
    ).toBe(true)
    expect(
      dateFormat('2025-05-04T12:00:00.000').isSameMillisecond(dateFormat('2025-05-04T12:00:00.001'))
    ).toBe(false)
  })

  test('isCurrentMillisecond', () => {
    expect(dateFormat('2025-05-04T12:00:00.000').isCurrentMillisecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.001').isCurrentMillisecond()).toBe(false)
  })

  test('isNextMillisecond', () => {
    expect(dateFormat('2025-05-04T12:00:00.001').isNextMillisecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.000').isNextMillisecond()).toBe(false)
  })

  test('isLastMillisecond', () => {
    expect(dateFormat('2025-05-04T11:59:59.999').isLastMillisecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.000').isLastMillisecond()).toBe(false)
  })

  // Microsecond tests aliased to millisecond due to JavaScript Date limitations
  test('isSameMicrosecond', () => {
    expect(
      dateFormat('2025-05-04T12:00:00.000').isSameMicrosecond(dateFormat('2025-05-04T12:00:00.000'))
    ).toBe(true)
    expect(
      dateFormat('2025-05-04T12:00:00.000').isSameMicrosecond(dateFormat('2025-05-04T12:00:00.001'))
    ).toBe(false)
  })

  test('isCurrentMicrosecond', () => {
    expect(dateFormat('2025-05-04T12:00:00.000').isCurrentMicrosecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.001').isCurrentMicrosecond()).toBe(false)
  })

  test('isNextMicrosecond', () => {
    expect(dateFormat('2025-05-04T12:00:00.001').isNextMicrosecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.000').isNextMicrosecond()).toBe(false)
  })

  test('isLastMicrosecond', () => {
    expect(dateFormat('2025-05-04T11:59:59.999').isLastMicrosecond()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00.000').isLastMicrosecond()).toBe(false)
  })

  test('isSameDecade', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameDecade(dateFormat('2029-05-04T12:00:00'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameDecade(dateFormat('2035-05-04T12:00:00'))).toBe(
      false
    )
  })

  test('isCurrentDecade', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentDecade()).toBe(true)
    expect(dateFormat('2035-05-04T12:00:00').isCurrentDecade()).toBe(false)
  })

  test('isNextDecade', () => {
    expect(dateFormat('2035-05-04T12:00:00').isNextDecade()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextDecade()).toBe(false)
  })

  test('isLastDecade', () => {
    expect(dateFormat('2015-05-04T12:00:00').isLastDecade()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastDecade()).toBe(false)
  })

  test('isSameCentury', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSameCentury(dateFormat('2099-05-04T12:00:00'))).toBe(
      true
    )
    expect(dateFormat('2025-05-04T12:00:00').isSameCentury(dateFormat('2100-05-04T12:00:00'))).toBe(
      false
    )
  })

  test('isCurrentCentury', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentCentury()).toBe(true)
    expect(dateFormat('2100-05-04T12:00:00').isCurrentCentury()).toBe(false)
  })

  test('isNextCentury', () => {
    expect(dateFormat('2100-05-04T12:00:00').isNextCentury()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextCentury()).toBe(false)
  })

  test('isLastCentury', () => {
    expect(dateFormat('1925-05-04T12:00:00').isLastCentury()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastCentury()).toBe(false)
  })

  test('isSameMillennium', () => {
    expect(
      dateFormat('2025-05-04T12:00:00').isSameMillennium(dateFormat('2999-05-04T12:00:00'))
    ).toBe(true)
    expect(
      dateFormat('2025-05-04T12:00:00').isSameMillennium(dateFormat('3000-05-04T12:00:00'))
    ).toBe(false)
  })

  test('isCurrentMillennium', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentMillennium()).toBe(true)
    expect(dateFormat('3000-05-04T12:00:00').isCurrentMillennium()).toBe(false)
  })

  test('isNextMillennium', () => {
    expect(dateFormat('3000-05-04T12:00:00').isNextMillennium()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextMillennium()).toBe(false)
  })

  test('isLastMillennium', () => {
    expect(dateFormat('1025-05-04T12:00:00').isLastMillennium()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastMillennium()).toBe(false)
  })

  test('isLeapYear', () => {
    expect(dateFormat('2024-05-04T12:00:00').isLeapYear()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLeapYear()).toBe(false)
  })

  test('isSame', () => {
    expect(dateFormat('2025-05-04T12:00:00').isSame(dateFormat('2025-05-04T12:00:00'))).toBe(true)
    expect(dateFormat('2025-03-04T12:00:00').isSame(dateFormat('2025-05-04T12:00:00'))).toBe(false)
  })

  test('isCurrentQuarter', () => {
    expect(dateFormat('2025-05-04T12:00:00').isCurrentQuarter()).toBe(true)
    expect(dateFormat('2025-08-04T12:00:00').isCurrentQuarter()).toBe(false)
  })

  test('isNextQuarter', () => {
    expect(dateFormat('2025-08-04T12:00:00').isNextQuarter()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isNextQuarter()).toBe(false)
  })

  test('isLastQuarter', () => {
    expect(dateFormat('2025-02-04T12:00:00').isLastQuarter()).toBe(true)
    expect(dateFormat('2025-05-04T12:00:00').isLastQuarter()).toBe(false)
  })
})
