# DateCollection API

Batch operations on sets of dates.

## Constructor

```typescript
new DateCollection(dates: (string | number | Date | DateFormat)[])
```

---

## Instance Methods

### `sort(order?): DateCollection`

| Param | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `order` | `'asc' \| 'desc'` | `'asc'` | Sort direction |

### `closest(target): DateFormat`
Date nearest to `target`. Throws if empty.

### `farthest(target): DateFormat`
Date farthest from `target`. Throws if empty.

### `groupBy(unit): Map<string, DateFormat[]>`
Group by `'year'`, `'month'`, `'week'`, `'day'`, `'hour'`, or `'quarter'`.

### `filter(fn): DateCollection`
Filter with a predicate `(d: DateFormat) => boolean`.

### `unique(unit?): DateCollection`
Remove duplicates. Optional unit for coarser dedup: `'year'`, `'month'`, `'week'`, `'day'`, `'hour'`, `'minute'`, `'second'`.

### `first(): DateFormat`
First element. Throws if empty.

### `last(): DateFormat`
Last element. Throws if empty.

### `nth(n): DateFormat`
Element at index `n`. Throws if out of bounds.

### `count(): number`
Number of dates.

### `min(): DateFormat`
Earliest date. Throws if empty.

### `max(): DateFormat`
Latest date. Throws if empty.

### `map<T>(fn): T[]`
Map each date with `(d: DateFormat) => T`.

### `toArray(): DateFormat[]`
Shallow copy as array.

### `isEmpty(): boolean`

### `between(start, end): DateCollection`
Filter to dates in `[start, end]` (inclusive).

### `compact(): DateCollection`
Remove invalid dates.

### `[Symbol.iterator](): Iterator<DateFormat>`
Makes the collection iterable with `for...of` loops and spread syntax.

### `forEach(fn: (d: DateFormat, i: number) => void): void`
Execute a function for each date in the collection.

### `reduce<T>(fn: (acc: T, d: DateFormat, i: number) => T, initial: T): T`
Reduce the collection to a single value.

### `some(fn: (d: DateFormat) => boolean): boolean`
Returns `true` if at least one date satisfies the predicate.

### `every(fn: (d: DateFormat) => boolean): boolean`
Returns `true` if all dates satisfy the predicate.

### `find(fn: (d: DateFormat) => boolean): DateFormat | undefined`
Return the first date matching the predicate, or `undefined`.

### `merge(other: DateCollection): DateCollection`
Combine two collections into a new one containing all dates from both.

### `span(): DateRange`
Return a `DateRange` from the earliest to the latest date in the collection.

---

See the [DateCollection Guide](../guide/datecollection) for examples.
