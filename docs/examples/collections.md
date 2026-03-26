# Collections & Ranges Examples

## Sorting a Collection

```typescript
import { DateCollection, DateFormat } from '@anilkumarthakur/d8'

const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-03-15'])

c.sort('asc').toArray().map(x => x.format('YYYY-MM-DD'))
// → ["2026-01-01", "2026-03-15", "2026-06-01"]

c.sort('desc').toArray().map(x => x.format('YYYY-MM-DD'))
// → ["2026-06-01", "2026-03-15", "2026-01-01"]
```

## Finding Min, Max, Closest, Farthest

```typescript
const c = new DateCollection(['2026-06-01', '2026-01-01', '2026-12-31'])

c.min().format('YYYY-MM-DD') // → "2026-01-01"
c.max().format('YYYY-MM-DD') // → "2026-12-31"

const target = new DateFormat('2026-01-10')
c.closest(target).format('YYYY-MM-DD')  // → "2026-01-01"
c.farthest(target).format('YYYY-MM-DD') // → "2026-12-31"
```

## Grouping

```typescript
const c = new DateCollection(['2025-06-01', '2026-01-01', '2026-06-01'])

const byYear = c.groupBy('year')
byYear.get('2025').length // → 1
byYear.get('2026').length // → 2

const c2 = new DateCollection(['2026-01-01', '2026-04-01', '2026-07-01'])
const byQ = c2.groupBy('quarter')
byQ.get('2026-Q1').length // → 1
byQ.get('2026-Q2').length // → 1
byQ.get('2026-Q3').length // → 1
```

## Filtering & Dedup

```typescript
// Weekdays only:
const c = new DateCollection(['2026-01-12', '2026-01-17', '2026-01-18', '2026-01-19'])
c.filter(x => x.isWeekday()).count() // → 2 (Mon, Mon)

// Unique by month:
new DateCollection(['2026-01-01', '2026-01-15', '2026-02-01'])
  .unique('month').count() // → 2

// Compact (remove invalid):
const inv = new DateFormat(NaN)
new DateCollection([new DateFormat('2026-01-01'), inv]).compact().count() // → 1
```

## Between

```typescript
const c = new DateCollection(['2026-01-01', '2026-03-01', '2026-06-01', '2026-12-31'])
const result = c.between(new DateFormat('2026-02-01'), new DateFormat('2026-07-01'))
result.count() // → 2 (Mar 1, Jun 1)

// Includes boundaries:
c.between(new DateFormat('2026-01-01'), new DateFormat('2026-06-01')).count()
// → 2 (Jan 1, Jun 1 included)
```

## DateRange Basics

```typescript
import { DateRange } from '@anilkumarthakur/d8'

const range = new DateRange('2026-01-01', '2026-01-31')

range.contains('2026-01-15')           // → true
range.contains('2026-01-01', false)    // → false (exclusive)
range.duration().toDays()               // → 30
range.toString()                        // → "2026-01-01 / 2026-01-31"
```

## Range Overlap Detection

```typescript
const jan = new DateRange('2026-01-01', '2026-01-31')
const partial = new DateRange('2026-01-15', '2026-02-28')

jan.overlaps(partial) // → true

const intersection = jan.intersect(partial)
intersection.start.format('YYYY-MM-DD') // → "2026-01-15"
intersection.end.format('YYYY-MM-DD')   // → "2026-01-31"

const union = jan.merge(partial)
union.start.format('YYYY-MM-DD') // → "2026-01-01"
union.end.format('YYYY-MM-DD')   // → "2026-02-28"
```

## Splitting & Iterating Ranges

```typescript
const range = new DateRange('2026-01-01', '2026-01-03')

range.split(1, 'day').length
// → 2 (Jan1→Jan2, Jan2→Jan3)

[...range.iterate('day')].length
// → 3 (Jan1, Jan2, Jan3)

range.toArray('day').map(d => d.format('MM-DD'))
// → ["01-01", "01-02", "01-03"]
```

## Iteration with for...of

```js
const col = d8.collection(['2026-01-01', '2026-06-15', '2026-12-31'])
for (const date of col) {
  console.log(date.format('MMM D'))
}
```

## forEach, some, every, find

```js
col.forEach((d, i) => console.log(`${i}: ${d.format()}`))
col.some(d => d.isWeekend())
col.every(d => d.isValid())
col.find(d => d.get('month') === 6)
```

## merge and span

```js
const merged = colA.merge(colB)
const range = col.span()  // DateRange from min to max
```
