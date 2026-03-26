# Factory Function

The default export of D8 is a factory function that creates `DateFormat` instances and provides convenient access to all sub-modules.

## Signature

```typescript
import d8 from '@anilkumarthakur/d8'

d8(input?: string | number | Date | DateFormat, opts?: { utc?: boolean }): DateFormat
```

## Creating Dates

```typescript
d8()                              // now
d8('2026-03-18')                  // from ISO string
d8('2026-03-18T14:30:00Z')        // from ISO datetime
d8(new Date())                    // from native Date
d8(1774022400000)                 // from timestamp
d8(existingDateFormat)            // clone
```

## Static Properties

### `d8.parse(str, fmt, strict?): DateFormat`
Parse with custom format. See [DateFormat.parse()](./dateformat#static-methods).

### `d8.fromObject(obj: DateObject, opts?): DateFormat`
Create a `DateFormat` from a plain object with date components. See [DateFormat.fromObject()](./dateformat#static-methods).

### `d8.min(...dates): DateFormat`
Return the earliest date.

### `d8.max(...dates): DateFormat`
Return the latest date.

### `d8.duration(n, unit): Duration`
Create a Duration.

### `d8.locale(name, data?): void`
Register or switch locale.

### `d8.use(plugin): DateFormat`
Register a plugin.

### `d8.range(start, end): DateRange`
Create a date range.

### `d8.natural(input, ref?): DateFormat`
Parse a natural language phrase.

### `d8.cron(expression): Cron`
Create a Cron instance.

### `d8.collection(dates): DateCollection`
Create a DateCollection.

### `d8.tz(timezone): Timezone`
Create a Timezone instance.

### `d8.business`

Business day functions:

| Method | Signature |
|:-------|:----------|
| `isBusinessDay` | `(date: DateFormat, holidays?: string[]) => boolean` |
| `addBusinessDays` | `(date: DateFormat, n: number, holidays?: string[]) => DateFormat` |
| `subtractBusinessDays` | `(date: DateFormat, n: number, holidays?: string[]) => DateFormat` |
| `nextBusinessDay` | `(date: DateFormat, holidays?: string[]) => DateFormat` |
| `prevBusinessDay` | `(date: DateFormat, holidays?: string[]) => DateFormat` |
| `businessDaysBetween` | `(start: DateFormat, end: DateFormat, holidays?: string[]) => number` |
| `getHolidays` | `(country: HolidayCountry, year: number) => string[]` |
