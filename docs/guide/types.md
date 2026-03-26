# TypeScript Types

D8 ships full type declarations. All types are available from the main package:

```typescript
import type { ... } from '@anilkumarthakur/d8'
```

## Core Types

### `Unit`

All supported time units for arithmetic, getters, setters, and diff:

```typescript
type Unit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'date'       // alias for day-of-month
  | 'month'
  | 'year'
  | 'week'
  | 'fortnight'  // 14 days
  | 'unknown'
```

### Sort & Week

```typescript
type SortOrder = 'asc' | 'desc'
type WeekStart = 'sunday' | 'monday'
```

### `Inclusivity`

Controls boundary inclusion for `isBetween()`:

```typescript
type Inclusivity = '()' | '[]' | '[)' | '(]'
```

- `'()'` — exclusive on both ends (default)
- `'[]'` — inclusive on both ends
- `'[)'` — inclusive start, exclusive end
- `'(]'` — exclusive start, inclusive end

### Specialized Unit Types

```typescript
// For DateRange.iterate() and DateRange.split()
type RangeIterateUnit =
  | 'millisecond' | 'second' | 'minute' | 'hour'
  | 'day' | 'week' | 'month' | 'year'

// For DateCollection.groupBy()
type GroupByUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'quarter'

// For DateCollection.unique()
type UniqueUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'

// For getHolidays()
type HolidayCountry = 'US' | 'UK' | 'IN' | 'DE' | 'FR' | 'CA' | 'AU'
```

### `DateInput`

The universal input type accepted by most D8 APIs — parsing, comparison, arithmetic, and factory methods:

```typescript
type DateInput = string | number | Date | DateFormatLike
```

You can pass an ISO string, a Unix timestamp (ms), a native `Date`, or any object that satisfies the `DateFormatLike` duck-typing interface.

### `UnitInput`

Accepts a canonical `Unit` plus common shorthand aliases:

```typescript
type UnitInput = Unit
  | 'y' | 'M' | 'd' | 'h' | 'm' | 's' | 'ms'
  | 'w' | 'Q'
```

Methods like `add()`, `startOf()`, `diff()`, and `get()` all accept `UnitInput`, so you can write `d.add(1, 'y')` instead of `d.add(1, 'year')`.

## Result Types

### `PreciseDiffResult`

Returned by `DateFormat.preciseDiff()`:

```typescript
interface PreciseDiffResult {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  humanize(): string  // "2 years, 3 months, 5 days"
}
```

### `AgeResult`

Returned by `DateFormat.age()`:

```typescript
interface AgeResult {
  years: number
  months: number
  days: number
  toString(): string  // "35y 9mo 3d"
}
```

### `CountdownResult`

Returned by `DateFormat.countdown()`:

```typescript
interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  total: number      // signed total ms (negative if past)
  isPast: boolean
  format(template: string): string  // "DD days HH:mm:ss"
  humanize(): string                // "5 days, 8 hours"
}
```

### `DateObject`

A plain object representation of a date, used by `DateFormat.fromObject()`:

```typescript
interface DateObject {
  year: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}
```

## Calendar Types

### `CalendarCell`

One cell in a calendar grid:

```typescript
interface CalendarCell<D = unknown> {
  date: D              // DateFormat at runtime
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}
```

### `CalendarGridOptions`

```typescript
interface CalendarGridOptions {
  weekStart?: WeekStart  // 'sunday' (default) or 'monday'
}
```

## Fiscal Types

### `FiscalConfig`

```typescript
interface FiscalConfig {
  startMonth: number  // 1–12, default 1 (January)
}
```

## Locale Types

### `LocaleData`

```typescript
interface LocaleData {
  months?: string[]
  monthsShort?: string[]
  weekdays?: string[]
  weekdaysShort?: string[]
  weekdaysMin?: string[]
  relativeTime?: LocaleRelativeTime
  calendar?: LocaleCalendar
}
```

### `LocaleRelativeTime`

```typescript
interface LocaleRelativeTime {
  future: string
  past: string
  s: string
  m: string
  mm: string
  h: string
  hh: string
  d: string
  dd: string
  M: string
  MM: string
  y: string
  yy: string
}
```

### `LocaleCalendar`

```typescript
interface LocaleCalendar {
  sameDay?: string
  nextDay?: string
  lastDay?: string
  nextWeek?: string
  lastWeek?: string
  sameElse?: string
}
```

## Plugin Types

### `DateFormatLike`

A duck-typing interface that allows any object to be used wherever D8 expects a date, as long as it implements these methods:

```typescript
interface DateFormatLike {
  valueOf(): number
  isValid(): boolean
  get(unit: Unit): number
}
```

This enables interop with other date libraries or custom date wrappers without requiring an explicit dependency on D8.

### `PluginFn`

```typescript
type PluginFn = (DF: unknown, inst: unknown) => void
```

### `DateFormatPluginMethods`

Extend this interface via declaration merging:

```typescript
declare module '@anilkumarthakur/d8' {
  interface DateFormatPluginMethods {
    myMethod(): string
  }
}
```

## Cron Types

### `CronField`

Internal representation of a parsed cron field:

```typescript
interface CronField {
  values: Set<number>
  any: boolean
}
```

## Factory Types

### `DateFormatStatic`

```typescript
interface DateFormatStatic {
  (input?: string | number | Date | unknown, opts?: { utc?: boolean }): unknown
  parse(str: string, fmt: string, strict?: boolean): unknown
  min(...args: (string | number | Date | unknown)[]): unknown
  max(...args: (string | number | Date | unknown)[]): unknown
  duration(n: number, unit: Unit): unknown
  locale(name: string, data?: LocaleData): void
  use(plugin: PluginFn): unknown
}
```
