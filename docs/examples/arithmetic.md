# Arithmetic Examples

## Add & Subtract

```typescript
import d8 from '@anilkumarthakur/d8'

const d = d8('2026-01-15T12:00:00Z')

d.add(1, 'day').format('YYYY-MM-DD')       // → "2026-01-16"
d.add(3, 'day').format('YYYY-MM-DD')       // → "2026-01-18"
d.add(1, 'month').get('month')              // → 2
d.add(1, 'year').get('year')                // → 2027
d.subtract(1, 'day').format('YYYY-MM-DD')   // → "2026-01-14"

// Immutable — original unchanged:
d.format('YYYY-MM-DD')                      // → "2026-01-15"

// Chaining:
d.add(1, 'month').add(5, 'day').format('YYYY-MM-DD')
// → "2026-02-20"
```

## Diff

```typescript
const a = d8('2026-01-15T12:00:00Z')
const b = d8('2026-01-16T12:00:00Z')

b.diff(a, 'day')           // → 1
b.diff(a, 'hour')          // → 24
b.diff(a, 'millisecond')   // → 86400000

// Floating precision:
const c = d8('2026-01-15T18:00:00Z')
c.diff(a, 'day', true)     // → 0.25

// String input:
b.diff('2026-01-15T12:00:00Z') // → 86400000
```

## Start & End of Period

```typescript
const d = d8('2026-06-15T14:30:45.500Z')

// Start of:
d.startOf('year').format('YYYY-MM-DD HH:mm:ss')    // → "2026-01-01 00:00:00"
d.startOf('month').format('YYYY-MM-DD')             // → "2026-06-01"
d.startOf('quarter').format('YYYY-MM-DD')            // → "2026-04-01"
d.startOf('day').format('HH:mm:ss')                 // → "00:00:00"
d.startOf('hour').format('mm:ss')                   // → "00:00"
d.startOf('minute').format('ss')                    // → "00"
d.startOf('second').format('SSS')                   // → "000"

// End of:
d.endOf('day').format('HH:mm:ss.SSS')              // → "23:59:59.999"
d.endOf('month').get('date')                         // → 30 (June)
d8('2026-02-15').endOf('month').get('date')          // → 28 (Feb non-leap)
d8('2024-02-15').endOf('month').get('date')          // → 29 (Feb leap!)
```

## Comparison

```typescript
const a = d8('2026-01-15T12:00:00Z')
const b = d8('2026-01-16T12:00:00Z')

a.isBefore(b)       // → true
b.isAfter(a)         // → true
a.isSame(a.clone())  // → true
a.isSame(b)          // → false

// isBetween (exclusive):
const mid = d8('2026-01-15T18:00:00Z')
mid.isBetween(a, b)  // → true
a.isBetween(a, b)    // → false (on boundary)
b.isBetween(a, b)    // → false (on boundary)
```

## Date Queries

```typescript
d8('2024-02-15').isLeapYear()  // → true
d8('2025-02-15').isLeapYear()  // → false
d8('2024-02-15').daysInMonth() // → 29
d8('2025-02-15').daysInMonth() // → 28
d8('2026-01-01').dayOfYear()   // → 1
d8('2025-12-31').dayOfYear()   // → 365
d8('2026-01-15').quarter()     // → 1
d8('2026-04-01').quarter()     // → 2
d8('2026-01-15').isoWeek()     // → 2
```

## Precise Diff

```typescript
const a = d8('2024-03-10T00:00:00Z')
const b = d8('2025-05-15T00:00:00Z')
const diff = b.preciseDiff(a)

diff.years   // → 1
diff.months  // → 2
diff.days    // → 5
diff.humanize() // → "1 year, 2 months, 5 days"

// Same date:
b.preciseDiff(b).humanize() // → "just now"
```

## isSameOrBefore / isSameOrAfter

```js
d8('2026-03-15').isSameOrBefore('2026-03-15')  // true
d8('2026-03-15').isSameOrAfter('2026-03-14')   // true
```

## isBetween with Inclusivity

```js
d8('2026-03-15').isBetween('2026-03-01', '2026-03-31', undefined, '[]')  // inclusive
d8('2026-03-01').isBetween('2026-03-01', '2026-03-31', undefined, '[)')  // start-inclusive
```

## isSame with Unit Granularity

```js
d8('2026-03-15 10:00').isSame('2026-03-15 22:00', 'day')  // true (same day)
```
