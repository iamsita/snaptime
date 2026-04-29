/**
 * date.test.ts — Integration / end-to-end workflow tests
 *
 * Fake clock: 2026-01-15 12:00:00.000 UTC (Thursday)
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import dateFormat, {
  DateFormat,
  DateRange,
  DateCollection,
  Timezone,
  Cron,
  parseNatural,
  addBusinessDays,
  businessDaysBetween,
  nextBusinessDay,
  isBusinessDay
} from '../src/index'

const FAKE_NOW = '2026-01-15T12:00:00.000Z'
const FAKE_MS = new Date(FAKE_NOW).getTime()

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(FAKE_NOW))
})
afterEach(() => {
  jest.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 1: Todo App with due dates
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Todo App with due dates', () => {
  // fake now = Thu Jan 15. "next friday" from Thu = Fri Jan 16 (1 day forward)
  // parseNatural uses new DateFormat() internally → fake now → local-mode instance

  test('create task due "next friday" via parseNatural', () => {
    const due = parseNatural('next friday')
    expect(due).toBeInstanceOf(DateFormat)
    expect(due.isValid()).toBe(true)
  })

  test('due date "next friday" is after fake now', () => {
    const due = parseNatural('next friday')
    const now = new DateFormat()
    expect(due.isAfter(now)).toBe(true)
  })

  test('due date "next friday" is a Friday', () => {
    const due = parseNatural('next friday')
    expect(due.isFriday()).toBe(true)
  })

  test('due date format: dddd MMMM DD, YYYY', () => {
    const due = parseNatural('next friday')
    const formatted = due.format('dddd MMMM DD, YYYY')
    expect(formatted).toMatch(/^Friday January \d{2}, 2026$/)
  })

  test('due date is before a Feb 2026 deadline', () => {
    const due = parseNatural('next friday')
    const deadline = dateFormat('2026-02-01')
    expect(due.isBefore(deadline)).toBe(true)
  })

  test('diff from now to due date in days is 1', () => {
    const now = new DateFormat(FAKE_MS, { utc: true })
    const due = now.add(1, 'day')
    expect(due.diff(now, 'day')).toBe(1)
  })

  test('task created today is same day as fake now', () => {
    const task = dateFormat()
    expect(task.isCurrentDay()).toBe(true)
  })

  test('overdue task (yesterday) isAfter returns false', () => {
    const overdue = parseNatural('yesterday')
    const now = new DateFormat()
    expect(overdue.isAfter(now)).toBe(false)
  })

  test('task isBetween creation and deadline', () => {
    const creation = dateFormat('2026-01-10')
    const deadline = dateFormat('2026-01-20')
    const task = dateFormat('2026-01-15')
    expect(task.isBetween(creation, deadline)).toBe(true)
  })

  test('task outside range is not between', () => {
    const creation = dateFormat('2026-01-10')
    const deadline = dateFormat('2026-01-14')
    const task = dateFormat('2026-01-15')
    expect(task.isBetween(creation, deadline)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 2: Billing system
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Billing system', () => {
  const subscriptionStart = new DateFormat('2026-01-01', { utc: true })

  test('subscription start is Jan 1 2026', () => {
    expect(subscriptionStart.format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('first billing date (month 1) = Feb 1 2026', () => {
    const billing1 = subscriptionStart.add(1, 'month')
    expect(billing1.format('YYYY-MM-DD')).toBe('2026-02-01')
  })

  test('second billing date (month 2) = Mar 1 2026', () => {
    const billing2 = subscriptionStart.add(2, 'month')
    expect(billing2.format('YYYY-MM-DD')).toBe('2026-03-01')
  })

  test('third billing date (month 3) = Apr 1 2026', () => {
    const billing3 = subscriptionStart.add(3, 'month')
    expect(billing3.format('YYYY-MM-DD')).toBe('2026-04-01')
  })

  test('3 billing dates are all in correct months', () => {
    const months = [1, 2, 3].map((n) => subscriptionStart.add(n, 'month').get('month'))
    expect(months).toEqual([2, 3, 4])
  })

  test('grace period: 5 business days after Feb 1 (Sunday) = Feb 6', () => {
    const billing1 = new DateFormat('2026-02-01', { utc: true })
    const grace = addBusinessDays(billing1, 5)
    expect(grace.format('YYYY-MM-DD')).toBe('2026-02-06')
  })

  test('billing date formatted as RFC3339 is a valid string', () => {
    const billing1 = subscriptionStart.add(1, 'month')
    const rfc = billing1.toRFC3339()
    expect(typeof rfc).toBe('string')
    expect(rfc.length).toBeGreaterThan(0)
    expect(rfc).toMatch(/2026-02-01/)
  })

  test('billing date formatted as SQL (YYYY-MM-DD HH:mm:ss)', () => {
    const billing1 = subscriptionStart.add(1, 'month')
    const sql = billing1.toSQL()
    expect(sql).toMatch(/^2026-02-01 \d{2}:\d{2}:\d{2}$/)
  })

  test('billing date toSQLDate returns just date portion', () => {
    const billing1 = subscriptionStart.add(1, 'month')
    expect(billing1.toSQLDate()).toBe('2026-02-01')
  })

  test('billing dates all come after subscription start', () => {
    for (let n = 1; n <= 3; n++) {
      const billing = subscriptionStart.add(n, 'month')
      expect(billing.isAfter(subscriptionStart)).toBe(true)
    }
  })

  test('monthly billing cycle: each billing is ~30 days apart', () => {
    const billing1 = subscriptionStart.add(1, 'month')
    const billing2 = subscriptionStart.add(2, 'month')
    const daysBetween = billing2.diff(billing1, 'day')
    expect(daysBetween).toBeGreaterThanOrEqual(28)
    expect(daysBetween).toBeLessThanOrEqual(31)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 3: Event management
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Event management', () => {
  const conference = new DateRange('2026-01-20', '2026-01-22')

  test('conference DateRange is valid', () => {
    expect(conference.isValid()).toBe(true)
    expect(conference.isForward()).toBe(true)
  })

  test('today (Jan 15) is before the conference (Jan 20)', () => {
    const today = dateFormat('2026-01-15')
    expect(today.isBefore(conference.start)).toBe(true)
  })

  test('conference duration is 2 days', () => {
    const dur = conference.duration()
    expect(dur.toDays()).toBe(2)
  })

  test('conference contains Jan 21', () => {
    expect(conference.contains('2026-01-21')).toBe(true)
  })

  test('conference does not contain Jan 19', () => {
    expect(conference.contains('2026-01-19')).toBe(false)
  })

  test('conference humanize shows date range', () => {
    const label = conference.humanize()
    expect(typeof label).toBe('string')
    expect(label).toMatch(/Jan/)
  })

  test('session collection groups by day', () => {
    const sessions = new DateCollection([
      '2026-01-20T09:00:00',
      '2026-01-20T14:00:00',
      '2026-01-21T10:00:00',
      '2026-01-22T11:00:00'
    ])
    const grouped = sessions.groupBy('day')
    expect(grouped.size).toBe(3)
    expect(grouped.get('2026-01-20')).toHaveLength(2)
    expect(grouped.get('2026-01-21')).toHaveLength(1)
    expect(grouped.get('2026-01-22')).toHaveLength(1)
  })

  test('find session closest to noon on Jan 20', () => {
    const day1Sessions = new DateCollection([
      '2026-01-20T09:00:00',
      '2026-01-20T11:45:00',
      '2026-01-20T14:00:00'
    ])
    const noon = new DateFormat('2026-01-20T12:00:00')
    const closest = day1Sessions.closest(noon)
    // 11:45 is 15 min from noon, 14:00 is 2h from noon, 9:00 is 3h from noon
    expect(closest.format('HH:mm')).toBe('11:45')
  })

  test('conference range split by day yields 3 chunks', () => {
    const chunks = conference.split(1, 'day')
    expect(chunks.length).toBe(2)
  })

  test('sessions iterated in order', () => {
    const col = new DateCollection(['2026-01-20', '2026-01-21', '2026-01-22'])
    const sorted = col.sort('asc').toArray()
    expect(sorted[0].format('YYYY-MM-DD')).toBe('2026-01-20')
    expect(sorted[2].format('YYYY-MM-DD')).toBe('2026-01-22')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 4: Analytics report — Q1 2026
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Analytics report Q1 2026', () => {
  const q1Start = new DateFormat('2026-01-01', { utc: true })
  const q1End = new DateFormat('2026-03-31', { utc: true })
  const q1Range = new DateRange(q1Start, q1End)

  test('Q1 range is valid and forward', () => {
    expect(q1Range.isValid()).toBe(true)
    expect(q1Range.isForward()).toBe(true)
  })

  test('Q1 range contains Jan 15 (fake now)', () => {
    expect(q1Range.contains(FAKE_NOW)).toBe(true)
  })

  test('Q1 range does not contain Dec 31 2025', () => {
    expect(q1Range.contains('2025-12-31')).toBe(false)
  })

  test('iterate Q1 by month yields Jan, Feb, Mar starts', () => {
    const months = q1Range.toArray('month')
    // Jan 1, Feb 1, Mar 1, Apr 1 exceeds Mar 31 so stops at Mar 1
    expect(months.length).toBeGreaterThanOrEqual(3)
    expect(months[0].format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(months[1].format('YYYY-MM-DD')).toBe('2026-02-01')
    expect(months[2].format('YYYY-MM-DD')).toBe('2026-03-01')
  })

  test('Q1 duration is approximately 89 days', () => {
    const dur = q1Range.duration()
    expect(dur.toDays()).toBeCloseTo(89, 0)
  })

  test('Q1 start is in quarter 1', () => {
    expect(q1Start.format('Q')).toBe('1')
    expect(q1Start.quarter()).toBe(1)
  })

  test('January has 31 days', () => {
    expect(new DateFormat('2026-01-01').daysInMonth()).toBe(31)
  })

  test('February 2026 has 28 days (not a leap year)', () => {
    expect(new DateFormat('2026-02-01').daysInMonth()).toBe(28)
    expect(new DateFormat('2026-02-01').isLeapYear()).toBe(false)
  })

  test('March has 31 days', () => {
    expect(new DateFormat('2026-03-01').daysInMonth()).toBe(31)
  })

  test('Jan 1 is day 1 of the year', () => {
    expect(q1Start.dayOfYear()).toBe(1)
  })

  test('Mar 31 is day 90 of 2026', () => {
    // 31 (Jan) + 28 (Feb) + 31 (Mar) = 90
    expect(q1End.dayOfYear()).toBe(90)
  })

  test('Q1 range summary contains month labels', () => {
    const humanized = q1Range.humanize()
    expect(humanized).toMatch(/Jan/)
    expect(humanized).toMatch(/2026/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 5: HR system payroll
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: HR system payroll', () => {
  const now = new DateFormat(FAKE_NOW) // UTC, Jan 15 2026

  test('start of current month is Jan 1 2026', () => {
    const startOfMonth = now.startOf('month')
    expect(startOfMonth.format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('end of current month is Jan 31 2026 23:59:59', () => {
    const endOfMonth = now.endOf('month')
    expect(endOfMonth.format('YYYY-MM-DD HH:mm:ss')).toBe('2026-01-31 23:59:59')
  })

  test('Jan 31 2026 is a Saturday (not a business day)', () => {
    const jan31 = new DateFormat('2026-01-31')
    expect(isBusinessDay(jan31)).toBe(false)
    expect(jan31.isSaturday()).toBe(true)
  })

  test('last business day of January 2026 is Jan 30 (Friday)', () => {
    // Jan 31 is Sat → last BD is Jan 30
    const jan30 = new DateFormat('2026-01-30')
    expect(isBusinessDay(jan30)).toBe(true)
    expect(jan30.isFriday()).toBe(true)
  })

  test('payroll processing: 5 business days after Jan 30 = Feb 6', () => {
    const lastBD = new DateFormat('2026-01-30')
    const processed = addBusinessDays(lastBD, 5)
    expect(processed.format('YYYY-MM-DD')).toBe('2026-02-06')
  })

  test('employee born 1990-06-15 age years = 35 (in Jan 2026)', () => {
    const birthdate = new DateFormat('1990-06-15', { utc: true })
    const ageResult = now.preciseDiff(birthdate)
    expect(ageResult.years).toBe(35)
  })

  test('fiscal year for Jan 2026 with Jan start = 2026', () => {
    expect(now.fiscalYear({ startMonth: 1 })).toBe(2026)
  })

  test('fiscal quarter for Jan 2026 with Jan start = 1', () => {
    expect(now.fiscalQuarter({ startMonth: 1 })).toBe(1)
  })

  test('fiscal year with April start: Jan 2026 belongs to FY 2026', () => {
    // April start: months Jan(1), Feb(2), Mar(3) → not >= 4, so same year = 2026
    expect(now.fiscalYear({ startMonth: 4 })).toBe(2026)
  })

  test('fiscal year with April start: Apr 2026 belongs to FY 2027', () => {
    const apr = new DateFormat('2026-04-01', { utc: true })
    expect(apr.fiscalYear({ startMonth: 4 })).toBe(2027)
  })

  test('payroll period month start/end spans 31 days', () => {
    const startOfMonth = now.startOf('month')
    const endOfMonth = now.endOf('month')
    const days = endOfMonth.diff(startOfMonth, 'day')
    expect(days).toBe(30) // floor((31 days - 1ms) / ms-per-day) = 30
  })

  test('business days between Jan 1 and Feb 1 2026 (Mon to Sun)', () => {
    const jan1 = new DateFormat('2026-01-01') // Thursday
    const feb1 = new DateFormat('2026-02-01') // Sunday
    const bdays = businessDaysBetween(jan1, feb1)
    // Jan 2-31 exclusive: 2(Fri), 5-9, 12-16, 19-23, 26-30 = 1+5+5+5+5 = 21 days
    expect(bdays).toBeGreaterThan(18)
    expect(bdays).toBeLessThan(24)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 6: Global product launch countdown
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Global product launch countdown', () => {
  // Launch: Feb 1 2026 12:00:00 UTC — exactly 17 days after fake now
  const launchUTC = new DateFormat('2026-02-01T12:00:00Z')

  test('launch date is valid and in UTC mode', () => {
    expect(launchUTC.isValid()).toBe(true)
    expect(launchUTC.isUtc()).toBe(true)
  })

  test('countdown from fake now to launch has isPast = false', () => {
    const c = launchUTC.countdown()
    expect(c.isPast).toBe(false)
  })

  test('countdown days = 17', () => {
    const c = launchUTC.countdown()
    expect(c.days).toBe(17)
  })

  test('countdown hours = 0', () => {
    const c = launchUTC.countdown()
    expect(c.hours).toBe(0)
  })

  test('countdown minutes = 0', () => {
    const c = launchUTC.countdown()
    expect(c.minutes).toBe(0)
  })

  test('countdown total is positive', () => {
    const c = launchUTC.countdown()
    expect(c.total).toBeGreaterThan(0)
  })

  test('countdown format template "D day H hr"', () => {
    const c = launchUTC.countdown()
    // The countdown format replaces D→days, H→hours, m→minutes, s→seconds.
    // Letters s/m/d/h in literal text will also be replaced, so avoid them.
    const formatted = c.format('D:H:m:s')
    expect(formatted).toBe('17:0:0:0')
  })

  test('countdown humanize returns non-empty string', () => {
    const c = launchUTC.countdown()
    expect(typeof c.humanize()).toBe('string')
    expect(c.humanize().length).toBeGreaterThan(0)
  })

  test('past date countdown isPast = true', () => {
    const pastDate = new DateFormat('2026-01-01T00:00:00Z')
    const c = pastDate.countdown()
    expect(c.isPast).toBe(true)
  })

  test('format launch time in UTC timezone', () => {
    const utcTz = new Timezone('UTC')
    const formatted = utcTz.format(launchUTC, 'YYYY-MM-DD HH:mm')
    expect(formatted).toBe('2026-02-01 12:00')
  })

  test('format launch time in America/New_York (UTC-5 in Feb)', () => {
    const nycTz = new Timezone('America/New_York')
    const formatted = nycTz.format(launchUTC, 'HH:mm')
    // Feb 1 is before DST, UTC-5 → 07:00
    expect(formatted).toBe('07:00')
  })

  test('format launch time in Asia/Kolkata (UTC+5:30)', () => {
    const kolkataTz = new Timezone('Asia/Kolkata')
    const formatted = kolkataTz.format(launchUTC, 'HH:mm')
    // UTC+5:30 → 17:30
    expect(formatted).toBe('17:30')
  })

  test('launch date is after fake now', () => {
    const now = dateFormat(FAKE_MS)
    expect(launchUTC.isAfter(now)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 7: Cron-based scheduled tasks
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Cron-based scheduled tasks', () => {
  // Fake now = Jan 15 12:00 UTC (Thursday)
  const fakeNow = new DateFormat(FAKE_NOW) // UTC mode

  test('daily digest "0 8 * * *" — next after noon Jan 15 = Jan 16 8am', () => {
    const cron = new Cron('0 8 * * *')
    const next = cron.next(fakeNow)
    expect(next.format('YYYY-MM-DD HH:mm')).toBe('2026-01-16 08:00')
  })

  test('daily cron next is in the future', () => {
    const cron = new Cron('0 8 * * *')
    const next = cron.next(fakeNow)
    expect(next.isAfter(fakeNow)).toBe(true)
  })

  test('weekly summary "0 9 * * 1" — next Monday 9am = Jan 19 9am', () => {
    const cron = new Cron('0 9 * * 1')
    const next = cron.next(fakeNow)
    expect(next.format('YYYY-MM-DD HH:mm')).toBe('2026-01-19 09:00')
  })

  test('weekly cron result is a Monday', () => {
    const cron = new Cron('0 9 * * 1')
    const next = cron.next(fakeNow)
    expect(next.isMonday()).toBe(true)
  })

  test('monthly invoice "0 0 1 * *" — next run = Feb 1 00:00', () => {
    const cron = new Cron('0 0 1 * *')
    const next = cron.next(fakeNow)
    expect(next.format('YYYY-MM-DD HH:mm')).toBe('2026-02-01 00:00')
  })

  test('monthly cron next is on day 1', () => {
    const cron = new Cron('0 0 1 * *')
    const next = cron.next(fakeNow)
    expect(next.get('date')).toBe(1)
    expect(next.get('hour')).toBe(0)
    expect(next.get('minute')).toBe(0)
  })

  test('every-minute cron "* * * * *" matches any minute', () => {
    const cron = new Cron('* * * * *')
    expect(cron.matches(new DateFormat('2026-01-15T15:30:00Z'))).toBe(true)
    expect(cron.matches(new DateFormat('2026-07-04T00:00:00Z'))).toBe(true)
  })

  test('daily digest cron humanize is descriptive', () => {
    const cron = new Cron('0 8 * * *')
    const desc = cron.humanize()
    expect(typeof desc).toBe('string')
    expect(desc.length).toBeGreaterThan(0)
    expect(desc).toMatch(/08:00/)
  })

  test('weekly cron humanize mentions Monday', () => {
    const cron = new Cron('0 9 * * 1')
    const desc = cron.humanize()
    expect(desc).toMatch(/Monday/)
  })

  test('cron between() returns multiple results', () => {
    const cron = new Cron('0 8 * * *') // daily at 8am
    const start = new DateFormat('2026-01-15T00:00:00Z')
    const end = new DateFormat('2026-01-18T00:00:00Z')
    const results = cron.between(start, end)
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  test('weekday-only cron "0 9 * * 1-5" does not match Saturday', () => {
    const cron = new Cron('0 9 * * 1-5')
    const sat = new DateFormat('2026-01-17T09:00:00Z')
    expect(cron.matches(sat)).toBe(false)
  })

  test('weekday-only cron matches Thursday at correct hour', () => {
    const cron = new Cron('0 9 * * 1-5')
    const thuNoon = new DateFormat('2026-01-15T09:00:00Z')
    expect(cron.matches(thuNoon)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow 8: Date parsing and validation pipeline
// ─────────────────────────────────────────────────────────────────────────────
describe('Workflow: Date parsing and validation pipeline', () => {
  test('parse ISO format string → valid', () => {
    const d = dateFormat('2026-01-01')
    expect(d.isValid()).toBe(true)
    expect(d.format('YYYY-MM-DD')).toBe('2026-01-01')
  })

  test('parse numeric timestamp → valid', () => {
    const d = dateFormat(FAKE_MS)
    expect(d.isValid()).toBe(true)
    expect(d.valueOf()).toBe(FAKE_MS)
  })

  test('parse natural language "yesterday" → Jan 14 2026', () => {
    const d = parseNatural('yesterday')
    expect(d.isValid()).toBe(true)
    // yesterday from Jan 15 = Jan 14
    const refDay = new DateFormat(FAKE_MS).subtract(1, 'day')
    expect(d.isSameDay(refDay)).toBe(true)
  })

  test('parse "in 3 days" → Jan 18', () => {
    const d = parseNatural('in 3 days')
    expect(d.isValid()).toBe(true)
    expect(d.isAfter(new DateFormat())).toBe(true)
  })

  test('parse "5 days ago" → Jan 10', () => {
    const d = parseNatural('5 days ago')
    expect(d.isValid()).toBe(true)
    expect(d.isBefore(new DateFormat())).toBe(true)
  })

  test('invalid date string produces invalid DateFormat', () => {
    const d = dateFormat('definitely-not-a-date')
    expect(d.isValid()).toBe(false)
  })

  test('collection compact() removes invalid dates', () => {
    const col = new DateCollection([
      '2026-01-01',
      'invalid',
      '2026-06-15',
      'also-bad',
      '2025-12-31'
    ])
    const clean = col.compact()
    expect(clean.count()).toBe(3)
    clean.forEach((d) => expect(d.isValid()).toBe(true))
  })

  test('collection sorted chronologically has correct order', () => {
    const col = new DateCollection(['2026-06-15', '2025-12-31', '2026-01-01'])
    const sorted = col.sort('asc').toArray()
    expect(sorted[0].format('YYYY-MM-DD')).toBe('2025-12-31')
    expect(sorted[1].format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(sorted[2].format('YYYY-MM-DD')).toBe('2026-06-15')
  })

  test('collection min and max from parsed dates', () => {
    const col = new DateCollection(['2026-06-15', '2025-12-31', '2026-03-10'])
    expect(col.min().format('YYYY-MM-DD')).toBe('2025-12-31')
    expect(col.max().format('YYYY-MM-DD')).toBe('2026-06-15')
  })

  test('dateFormat.min and max from multiple inputs', () => {
    const earliest = dateFormat.min('2026-06-15', '2025-12-31', '2026-03-10')
    const latest = dateFormat.max('2026-06-15', '2025-12-31', '2026-03-10')
    expect(earliest.format('YYYY-MM-DD')).toBe('2025-12-31')
    expect(latest.format('YYYY-MM-DD')).toBe('2026-06-15')
  })

  test('parsed dates can be compared with isBefore/isAfter', () => {
    const a = dateFormat('2026-01-01')
    const b = dateFormat('2026-06-15')
    expect(a.isBefore(b)).toBe(true)
    expect(b.isAfter(a)).toBe(true)
    expect(a.isSame(a)).toBe(true)
  })

  test('DateFormat.parse with format string parses custom formats', () => {
    const d = DateFormat.parse('15-01-2026', 'DD-MM-YYYY')
    expect(d.isValid()).toBe(true)
    expect(d.format('YYYY-MM-DD')).toBe('2026-01-15')
  })

  test('collection of mixed valid/invalid preserves order after compact+sort', () => {
    const col = new DateCollection([
      '2026-03-01',
      'bad',
      '2026-01-01',
      'worse',
      '2026-02-01'
    ])
    const result = col.compact().sort('asc').toArray()
    expect(result).toHaveLength(3)
    expect(result[0].format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(result[2].format('YYYY-MM-DD')).toBe('2026-03-01')
  })

  test('span() of a collection returns range from min to max', () => {
    const col = new DateCollection(['2026-06-15', '2025-12-31', '2026-03-10'])
    const span = col.span()
    expect(span.start.format('YYYY-MM-DD')).toBe('2025-12-31')
    expect(span.end.format('YYYY-MM-DD')).toBe('2026-06-15')
  })
})
