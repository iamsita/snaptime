# Quick Start

Get up and running with D8 in 5 minutes.

## 1. Create a Date

```typescript
import d8 from '@anilkumarthakur/d8'

const now = d8()                       // → current date/time
const iso = d8('2026-01-15')           // → 2026-01-15 (UTC mode)
const ts  = d8(1768483200000)          // → from timestamp
const nat = d8(new Date())             // → from native Date
const utc = d8('2026-01-15T12:00:00Z') // → UTC mode (auto-detected)
```

## 2. Format

```typescript
const d = d8('2026-01-15T12:00:00Z')

d.format('YYYY-MM-DD')       // → "2026-01-15"
d.format('MMMM Do, YYYY')    // → "January 15th, 2026"
d.format('dddd')              // → "Thursday"
d.format('hh:mm A')           // → "12:00 PM"
d.format('Q')                 // → "1"
d.toISOString()               // → "2026-01-15T12:00:00.000Z"
d.toSQL()                     // → "2026-01-15 12:00:00"
```

## 3. Arithmetic

```typescript
const d = d8('2026-01-15T12:00:00Z')

d.add(3, 'day').format('YYYY-MM-DD')      // → "2026-01-18"
d.subtract(1, 'month').get('month')        // → 12 (December)
d.startOf('day').format('HH:mm:ss')        // → "00:00:00"
d.endOf('day').format('HH:mm:ss.SSS')      // → "23:59:59.999"
```

## 4. Compare

```typescript
const a = d8('2026-01-15T12:00:00Z')
const b = d8('2026-01-16T12:00:00Z')

a.isBefore(b)          // → true
b.isAfter(a)           // → true
a.isSame(a.clone())    // → true
a.isSameOrBefore(b)    // → true
b.diff(a, 'day')       // → 1
b.diff(a, 'hour')      // → 24

// isBetween with inclusivity
const c = d8('2026-01-15T12:00:00Z')
c.isBetween(a, b, '[]')  // → true  (inclusive on both ends)
c.isBetween(a, b, '()')  // → false (exclusive — c equals a)
```

## 5. Relative Time & Age

```typescript
// Assuming now is 2026-01-15T12:00:00Z:
d8('2026-01-17T12:00:00Z').fromNow()    // → "in 2 days"
d8('2026-01-12T12:00:00Z').fromNow()    // → "3 days ago"
d8('2024-01-15').age().toString()         // → "2y"

const cd = d8('2026-12-25').countdown()
cd.humanize() // → "344 days, 12 hours" (approx)
```

## 6. Duration

```typescript
import { Duration } from '@anilkumarthakur/d8'

Duration.parse('2h30m').humanize(false)  // → "2 hours, 30 minutes"
Duration.parse('1d').toDays()            // → 1
new Duration(3600000).humanize()         // → "1h"
new Duration(3600000).humanize(false)    // → "1 hour"

// Parse ISO 8601 durations
Duration.fromISO('PT30M').humanize(false)  // → "30 minutes"
Duration.fromISO('P1DT12H').toHours()      // → 36
```

## 7. Timezones

```typescript
import { Timezone } from '@anilkumarthakur/d8'

const ny = new Timezone('America/New_York')
const d = d8('2026-01-15T12:00:00Z')

ny.format(d, 'HH:mm')      // → "07:00"
ny.offsetString(d)           // → "-05:00"
ny.isDST(d)                  // → false

Timezone.guess()             // → e.g. "Asia/Kolkata"
Timezone.isValid('UTC')      // → true
```

## 8. Cron

```typescript
import { Cron } from '@anilkumarthakur/d8'

const cron = new Cron('0 9 * * 1-5')
cron.humanize()              // → "At 09:00, Monday through Friday"
cron.toString()              // → "0 9 * * 1-5"
```

## 9. Natural Language

```typescript
import { parseNatural } from '@anilkumarthakur/d8'

parseNatural('tomorrow').format('YYYY-MM-DD')            // → "2026-01-16" (approx)
parseNatural('3 days ago').isValid()                       // → true
parseNatural('last day of february 2024').format('MM-DD') // → "02-29" (leap!)
parseNatural('1st monday of january 2026').format('DD')   // → "05"
parseNatural('gibberish').isValid()                        // → false

// Time-of-day and relative expressions
parseNatural('tomorrow at 3pm').format('YYYY-MM-DD HH:mm')  // → "2026-01-16 15:00" (approx)
parseNatural('5 hours ago').isValid()                         // → true
```

## 10. Business Days

```typescript
import { addBusinessDays, getHolidays, isBusinessDay } from '@anilkumarthakur/d8'

isBusinessDay(d8('2026-01-12'))   // → true  (Monday)
isBusinessDay(d8('2026-01-17'))   // → false (Saturday)

addBusinessDays(d8('2026-01-16'), 1).format('YYYY-MM-DD')
// → "2026-01-19" (Fri + 1 → Mon)

getHolidays('US', 2026).includes('2026-01-01') // → true (New Year's)
getHolidays('US', 2026).includes('2026-07-04') // → true (Independence Day)
```

## 11. Collections & Ranges

```typescript
import { DateCollection, DateRange } from '@anilkumarthakur/d8'

const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])
c.sort('asc').toArray().map(x => x.format('MMM D'))
// → ["Jan 1", "Mar 15", "Jun 1"]

c.min().format('YYYY-MM-DD') // → "2026-01-01"
c.max().format('YYYY-MM-DD') // → "2026-06-01"

const range = new DateRange('2026-01-01', '2026-01-31')
range.contains('2026-01-15')    // → true
range.duration().toDays()        // → 30
range.toString()                 // → "2026-01-01 / 2026-01-31"
```
