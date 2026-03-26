# Type Definitions

All exported types from `@anilkumarthakur/d8`.

```typescript
import type { ... } from '@anilkumarthakur/d8'
```

---

## Common Input Types

```typescript
/** Accepted date input across the API */
type DateInput = string | number | Date | DateFormat

/** Accepted unit input for comparison and arithmetic methods */
type UnitInput =
  | 'millisecond' | 'second' | 'minute' | 'hour'
  | 'day' | 'date' | 'month' | 'year'
  | 'week' | 'quarter'

/** Plain object describing date components */
interface DateObject {
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

/** Controls boundary inclusivity for `isBetween()` */
type Inclusivity = '()' | '[]' | '[)' | '(]'

/** Any value that can be used where a DateFormat is expected */
type DateFormatLike = DateInput | DateFormat
```

---

## Unit Types

```typescript
type Unit =
  | 'millisecond' | 'second' | 'minute' | 'hour'
  | 'day' | 'date' | 'month' | 'year'
  | 'week' | 'fortnight' | 'unknown'

type SortOrder = 'asc' | 'desc'
type WeekStart = 'sunday' | 'monday'

type RangeIterateUnit =
  | 'millisecond' | 'second' | 'minute' | 'hour'
  | 'day' | 'week' | 'month' | 'year'

type GroupByUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'quarter'

type UniqueUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'

type HolidayCountry = 'US' | 'UK' | 'IN' | 'DE' | 'FR' | 'CA' | 'AU'
```

---

## Result Interfaces

```typescript
interface PreciseDiffResult {
  years: number; months: number; days: number
  hours: number; minutes: number; seconds: number; milliseconds: number
  humanize(): string
}

interface AgeResult {
  years: number; months: number; days: number
  toString(): string
}

interface CountdownResult {
  days: number; hours: number; minutes: number; seconds: number; milliseconds: number
  total: number; isPast: boolean
  format(template: string): string
  humanize(): string
}
```

---

## Calendar Types

```typescript
interface CalendarCell<D = unknown> {
  date: D; isCurrentMonth: boolean; isToday: boolean; isWeekend: boolean
}

interface CalendarGridOptions {
  weekStart?: WeekStart
}
```

---

## Fiscal Types

```typescript
interface FiscalConfig {
  startMonth: number  // 1–12
}
```

---

## Locale Types

```typescript
interface LocaleData {
  months?: string[]; monthsShort?: string[]
  weekdays?: string[]; weekdaysShort?: string[]; weekdaysMin?: string[]
  relativeTime?: LocaleRelativeTime
  calendar?: LocaleCalendar
}

interface LocaleRelativeTime {
  future: string; past: string
  s: string; m: string; mm: string
  h: string; hh: string
  d: string; dd: string
  M: string; MM: string
  y: string; yy: string
}

interface LocaleCalendar {
  sameDay?: string; nextDay?: string; lastDay?: string
  nextWeek?: string; lastWeek?: string; sameElse?: string
}
```

---

## Plugin Types

```typescript
type PluginFn = (DF: unknown, inst: unknown) => void

interface DateFormatPluginMethods {
  testPluginMethod?: () => string
}

// Extend via declaration merging:
// declare module '@anilkumarthakur/d8' {
//   interface DateFormatPluginMethods { myMethod(): string }
// }
```

---

## Cron Types

```typescript
interface CronField {
  values: Set<number>
  any: boolean
}
```

---

## Factory Type

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
