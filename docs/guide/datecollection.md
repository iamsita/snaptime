# DateCollection

Batch operations on sets of dates — sort, filter, group, deduplicate, and query.

## Creating Collections

```typescript
import { DateCollection, DateFormat } from '@anilkumarthakur/d8'

// From strings:
new DateCollection(['2026-01-01', '2026-06-01'])        // count → 2

// From Date objects:
new DateCollection([new Date(2026, 0, 1)])               // count → 1

// From DateFormat instances:
new DateCollection([new DateFormat('2026-01-01')])        // count → 1

// From timestamps:
new DateCollection([1735689600000])                      // count → 1

// Mixed input types:
new DateCollection([
  '2026-01-01',
  new Date(2026, 5, 1),
  new DateFormat('2026-09-01'),
  new Date('2026-12-01').getTime()
])
// count → 4

// Or via the factory:
import d8 from '@anilkumarthakur/d8'
const c = d8.collection(['2026-01-01', '2026-06-01', '2026-03-15'])
```

---

## Sort

```typescript
const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])

c.sort().toArray().map(x => x.format('YYYY-MM-DD'))
// → ["2026-01-01", "2026-03-15", "2026-06-01"] (default: ascending)

c.sort('asc').toArray().map(x => x.format('YYYY-MM-DD'))
// → ["2026-01-01", "2026-03-15", "2026-06-01"]

c.sort('desc').toArray().map(x => x.format('YYYY-MM-DD'))
// → ["2026-06-01", "2026-03-15", "2026-01-01"]
```

---

## Closest & Farthest

```typescript
const c = new DateCollection(['2026-01-01', '2026-12-31'])
const target = new DateFormat('2026-01-10')

c.closest(target).format('YYYY-MM-DD')  // → "2026-01-01"
c.farthest(target).format('YYYY-MM-DD') // → "2026-12-31"

// Tie → first encountered wins:
const c2 = new DateCollection(['2026-01-05', '2026-01-15'])
c2.closest(new DateFormat('2026-01-10')).format('YYYY-MM-DD')
// → "2026-01-05" (both are 5 days away, first wins)

// Empty collection → throws:
new DateCollection([]).closest(target)  // → throws Error
new DateCollection([]).farthest(target) // → throws Error
```

---

## GroupBy

```typescript
// By year:
const c = new DateCollection(['2025-06-01', '2026-01-01', '2026-06-01'])
const byYear = c.groupBy('year')
byYear.size             // → 2
byYear.get('2025').length // → 1
byYear.get('2026').length // → 2

// By month (key: "YYYY-MM"):
const c2 = new DateCollection(['2026-01-01', '2026-01-15', '2026-03-01'])
const byMonth = c2.groupBy('month')
byMonth.size                // → 2
byMonth.get('2026-01').length // → 2
byMonth.get('2026-03').length // → 1

// By week (key: "YYYY-Www"):
const c3 = new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
const byWeek = c3.groupBy('week')
byWeek.get('2026-W02').length // → 2
byWeek.get('2026-W03').length // → 1

// By day (key: "YYYY-MM-DD"):
const c4 = new DateCollection(['2026-01-15', '2026-01-15', '2026-01-16'])
c4.groupBy('day').get('2026-01-15').length // → 2

// By quarter (key: "YYYY-Qn"):
const c5 = new DateCollection(['2026-01-01', '2026-04-01', '2026-07-01'])
const byQ = c5.groupBy('quarter')
byQ.get('2026-Q1').length // → 1
byQ.get('2026-Q2').length // → 1
byQ.get('2026-Q3').length // → 1
```

---

## Filter

```typescript
// Filter to weekdays only:
const c = new DateCollection([
  '2026-01-12', // Monday
  '2026-01-17', // Saturday
  '2026-01-18', // Sunday
  '2026-01-19'  // Monday
])
c.filter(x => x.isWeekday()).count() // → 2

// No matches → empty:
new DateCollection(['2026-01-17', '2026-01-18']) // Sat + Sun
  .filter(x => x.isWeekday()).isEmpty()          // → true
```

---

## Unique (Deduplicate)

```typescript
// Exact dedup (by ms):
const ts = new Date(2026, 0, 15, 9, 0, 0, 0).getTime()
new DateCollection([ts, ts, ts + 1]).unique().count() // → 2

// By year:
new DateCollection(['2026-01-01', '2026-06-01', '2025-12-31'])
  .unique('year').count() // → 2

// By month:
new DateCollection(['2026-01-01', '2026-01-15', '2026-02-01'])
  .unique('month').count() // → 2

// By week:
new DateCollection(['2026-01-12', '2026-01-14', '2026-01-19'])
  .unique('week').count() // → 2

// By day:
new DateCollection([
  new DateFormat(new Date(2026, 0, 15, 9, 0)),
  new DateFormat(new Date(2026, 0, 15, 17, 0)),
  new DateFormat(new Date(2026, 0, 16, 9, 0))
]).unique('day').count() // → 2

// By hour, minute, second also available.
```

---

## Iterable Protocol

DateCollection implements `[Symbol.iterator]()`, so you can use `for...of` loops directly:

```typescript
const c = new DateCollection(['2026-01-01', '2026-06-01', '2026-03-15'])

for (const date of c) {
  console.log(date.format('YYYY-MM-DD'))
}
// → "2026-01-01"
// → "2026-06-01"
// → "2026-03-15"

// Spread into an array:
const arr = [...c]

// Destructuring:
const [first, second] = c
```

---

## Element Access

```typescript
const c = new DateCollection(['2026-01-01', '2026-06-01'])

c.first().format('YYYY-MM-DD') // → "2026-01-01"
c.last().format('YYYY-MM-DD')  // → "2026-06-01"
c.nth(0).format('YYYY-MM-DD')  // → "2026-01-01"
c.count()                       // → 2
c.isEmpty()                     // → false

// Empty collection → throws:
new DateCollection([]).first() // → throws Error
new DateCollection([]).last()  // → throws Error
new DateCollection(['2026-01-01']).nth(5) // → throws Error (out of bounds)
new DateCollection(['2026-01-01']).nth(-1) // → throws Error (negative index)
```

---

## Min & Max

```typescript
const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])

c.min().format('YYYY-MM-DD') // → "2026-01-01"
c.max().format('YYYY-MM-DD') // → "2026-12-31"

// Empty → throws:
new DateCollection([]).min() // → throws Error
new DateCollection([]).max() // → throws Error
```

---

## Between

```typescript
const c = new DateCollection([
  '2026-01-01', '2026-03-01', '2026-06-01', '2026-12-31'
])

const result = c.between(
  new DateFormat('2026-02-01'),
  new DateFormat('2026-07-01')
)
result.count() // → 2 (Mar 1 and Jun 1)

// Includes boundary dates:
c.between(
  new DateFormat('2026-01-01'),
  new DateFormat('2026-06-01')
).count() // → 2 (Jan 1 and Jun 1 are included)

// No matches → empty:
c.between(
  new DateFormat('2026-06-02'),
  new DateFormat('2026-08-01')
).isEmpty() // → true
```

---

## Compact & Map

```typescript
// Compact removes invalid dates:
const invalid = new DateFormat(NaN)
const c = new DateCollection([
  new DateFormat('2026-01-01'), invalid, new DateFormat('2026-06-01')
])
c.compact().count() // → 2 (invalid removed)

// Map transforms each date:
new DateCollection(['2026-01-01', '2026-06-01'])
  .map(x => x.format('YYYY-MM-DD'))
// → ["2026-01-01", "2026-06-01"]

// toArray returns DateFormat array:
const arr = new DateCollection(['2026-01-01']).toArray()
arr[0].format('YYYY-MM-DD') // → "2026-01-01"

// forEach iterates with index:
new DateCollection(['2026-01-01', '2026-06-01'])
  .forEach((d, i) => console.log(i, d.format('YYYY-MM-DD')))
// → 0 "2026-01-01"
// → 1 "2026-06-01"

// reduce accumulates a value:
const totalYear = new DateCollection(['2026-01-01', '2025-06-01'])
  .reduce((sum, d) => sum + d.get('year'), 0)
// → 4051
```

---

## Predicate Testing & Search

```typescript
const c = new DateCollection([
  '2026-01-17', // Saturday
  '2026-01-19', // Monday
  '2026-01-20'  // Tuesday
])

// some() — returns true if any element matches:
c.some(d => d.isWeekend())  // → true  (Saturday matches)

// every() — returns true if all elements match:
c.every(d => d.isValid())   // → true  (all are valid dates)
c.every(d => d.isWeekday()) // → false (Saturday is not a weekday)

// find() — returns the first matching DateFormat:
const found = c.find(d => d.isWeekend())
found.format('YYYY-MM-DD') // → "2026-01-17"

// find() with no match → returns undefined:
c.find(d => d.get('year') === 2030) // → undefined
```

---

## Merge

Combine two collections into one:

```typescript
const a = new DateCollection(['2026-01-01', '2026-03-01'])
const b = new DateCollection(['2026-06-01', '2026-12-31'])

const combined = a.merge(b)
combined.count() // → 4

// Duplicates are preserved — use unique() to deduplicate:
const c = new DateCollection(['2026-01-01'])
const d = new DateCollection(['2026-01-01', '2026-06-01'])
c.merge(d).count()            // → 3
c.merge(d).unique('day').count() // → 2
```

---

## Span

Get a `DateRange` from the collection's earliest date to its latest date:

```typescript
const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])

const range = c.span()
range.start().format('YYYY-MM-DD') // → "2026-01-01"
range.end().format('YYYY-MM-DD')   // → "2026-12-31"
```

---

## DateInput Acceptance

The constructor and `between()` now accept `DateInput` — a union type covering `string`, `number` (timestamp), `Date`, or `DateFormat` — instead of requiring specific types. This means you can freely mix input formats:

```typescript
// Constructor accepts any DateInput values:
const c = new DateCollection([
  '2026-01-01',                      // string
  1751328000000,                      // number (timestamp)
  new Date(2026, 5, 1),              // Date object
  new DateFormat('2026-09-01')       // DateFormat instance
])

// between() also accepts DateInput for its bounds:
c.between('2026-02-01', new Date(2026, 8, 30)).count()
// → dates falling within Feb 1 – Sep 30
```
