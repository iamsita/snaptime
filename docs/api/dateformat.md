# DateFormat API

Complete method reference for the `DateFormat` class.

## Constructor

```typescript
new DateFormat(
  input?: string | number | Date | DateFormat,
  opts?: { utc?: boolean }
)
```

| Param | Type | Description |
|:------|:-----|:------------|
| `input` | `string \| number \| Date \| DateFormat` | Date input. Defaults to `Date.now()` |
| `opts.utc` | `boolean` | Force UTC mode. ISO strings auto-detect |

---

## Static Methods

### `parse(str, fmt, strict?): DateFormat`

Parse a string with a custom format.

| Param | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `str` | `string` | `''` | Input string |
| `fmt` | `string` | `''` | Format template using tokens: `YYYY`, `MM`, `DD`, `HH`, `hh`, `mm`, `ss`, `X`, `x`, `DDD`, `DDDD`, `Z` |
| `strict` | `boolean` | `false` | Validate month/day bounds. Date-only formats parse as local midnight |

### `min(...args): DateFormat`

Return the earliest date from the arguments.

### `max(...args): DateFormat`

Return the latest date from the arguments.

### `duration(n, unit): Duration`

Create a `Duration` of `n * unit` milliseconds.

### `locale(name, data?): void`

Register locale data and/or switch the active locale.

### `use(plugin): typeof DateFormat`

Register a plugin function. Returns the class for chaining.

### `DateFormat.fromObject(obj: DateObject, opts?): DateFormat`

Create a `DateFormat` from a plain object with date components: `{ year, month, day, hour, minute, second, millisecond }`.

---

## Instance Methods — Formatting

### `format(fmt?): string`
Format using tokens. Default: `'YYYY-MM-DD HH:mm:ss'`. Returns `'Invalid Date'` if invalid.

### `formatIntl(opts?): string`
Format using `Intl.DateTimeFormat`. Respects UTC mode.

### `toISOString(): string`
ISO 8601 string.

### `toJSON(): string`
Same as `toISOString()`. Used by `JSON.stringify()`.

### `toSQL(): string`
`'YYYY-MM-DD HH:mm:ss'`

### `toSQLDate(): string`
`'YYYY-MM-DD'`

### `toSQLTime(): string`
`'HH:mm:ss'`

### `toRFC2822(): string`
e.g. `'Wed, 18 Mar 2026 14:30:45 +0000'`

### `toRFC3339(): string`
e.g. `'2026-03-18T14:30:45Z'`

### `toExcel(): number`
Excel serial date number (days since Dec 30, 1899).

### `toObject(): object`
Returns `{ year, month, date, hour, minute, second, millisecond }`.

### `toDate(): Date`
Native JavaScript `Date`.

### `toMillis(): number`
Alias for `valueOf()`.

---

## Instance Methods — Get / Set

### `get(unit): number`
Get a component. Units: `year`, `month` (1-12), `date`, `day` (0-6), `hour`, `minute`, `second`, `millisecond`.

### `set(unit, value): DateFormat`
Set a component. Returns a new instance.

### `valueOf(): number`
Milliseconds since epoch.

### `unix(): number`
Seconds since epoch (floored).

---

## Instance Methods — Arithmetic

### `add(n, unit): DateFormat`
Add `n` units.

### `subtract(n, unit): DateFormat`
Subtract `n` units.

### `startOf(unit): DateFormat`
Start of `year`, `month`, `week`, `quarter`, `day`, `hour`, `minute`, `second`.

### `endOf(unit): DateFormat`
End of the given period (23:59:59.999).

### `clone(): DateFormat`
Deep copy.

---

## Instance Methods — Comparison

### `isBefore(other): boolean`
### `isAfter(other): boolean`
### `isSame(other: DateInput, unit?: UnitInput): boolean`

Compare equality, optionally at a given unit granularity.

### `isSameOrBefore(other: DateInput, unit?: UnitInput): boolean`

Returns `true` if this date is the same as or before `other`, optionally at a given unit granularity.

### `isSameOrAfter(other: DateInput, unit?: UnitInput): boolean`

Returns `true` if this date is the same as or after `other`, optionally at a given unit granularity.

### `isBetween(a: DateInput, b: DateInput, unit?: UnitInput, inclusivity?: Inclusivity): boolean`

Check if this date is between `a` and `b`. Default is exclusive (`()`). Use `inclusivity` to control bounds: `'()'`, `'[]'`, `'[)'`, `'(]'`.

### `isToday(): boolean`

Returns `true` if this date is today.

### `isTomorrow(): boolean`

Returns `true` if this date is tomorrow.

### `isYesterday(): boolean`

Returns `true` if this date is yesterday.

### `toString(): string`

Returns a human-readable string representation of the date.

### `diff(other, unit?, floating?): number`
Difference in the given unit. `floating=true` for decimal precision.

---

## Instance Methods — Validation

### `isValid(): boolean`
### `isUtc(): boolean`
### `isLocal(): boolean`
### `isDST(): boolean`
Always `false` in UTC mode.

### `isLeapYear(): boolean`
### `isWeekday(): boolean`
Mon–Fri.

### `isWeekend(): boolean`
Sat–Sun.

---

## Instance Methods — Day-of-Week

`isSunday()` · `isMonday()` · `isTuesday()` · `isWednesday()` · `isThursday()` · `isFriday()` · `isSaturday()`

---

## Instance Methods — Period Checks

Each period has four methods following the pattern:

| Method | Description |
|:-------|:------------|
| `isSame*(other)` | Same period as another date |
| `isCurrent*()` | In the current period |
| `isNext*()` | In the next period |
| `isLast*()` | In the previous period |

### Supported Periods

| Period | Methods |
|:-------|:--------|
| Year | `isSameYear`, `isCurrentYear`, `isNextYear`, `isLastYear` |
| Month | _(no isSameMonth)_ `isCurrentMonth`, `isNextMonth`, `isLastMonth` |
| Week | `isSameWeek`, `isCurrentWeek`, `isNextWeek`, `isLastWeek` |
| Day | `isSameDay`, `isCurrentDay`, `isNextDay`, `isLastDay` |
| Hour | `isSameHour`, `isCurrentHour`, `isNextHour`, `isLastHour` |
| Minute | `isSameMinute`, `isCurrentMinute`, `isNextMinute`, `isLastMinute` |
| Second | `isSameSecond`, `isCurrentSecond`, `isNextSecond`, `isLastSecond` |
| Millisecond | `isSameMillisecond`, `isCurrentMillisecond`, `isNextMillisecond`, `isLastMillisecond` |
| Quarter | `isCurrentQuarter`, `isNextQuarter`, `isLastQuarter` |
| Decade | `isSameDecade`, `isCurrentDecade`, `isNextDecade`, `isLastDecade` |
| Century | `isSameCentury`, `isCurrentCentury`, `isNextCentury`, `isLastCentury` |
| Millennium | `isSameMillennium`, `isCurrentMillennium`, `isNextMillennium`, `isLastMillennium` |

Microsecond aliases: `isSameMicro`, `isCurrentMicro`, `isNextMicro`, `isLastMicro`, `isSameMicrosecond`, etc. (aliased to millisecond due to JS Date limitations).

---

## Instance Methods — Relative Time

### `fromNow(): string`
e.g. `"in 5 days"` or `"3 hours ago"`.

### `calendar(): string`
`"Today at 2:30 PM"`, `"Yesterday at …"`, `"Tomorrow at …"`, or `YYYY-MM-DD`.

### `preciseDiff(other): PreciseDiffResult`
Full breakdown: years, months, days, hours, minutes, seconds, milliseconds + `humanize()`.

### `preciseFrom(other): string`
Shortcut for `preciseDiff(other).humanize()`.

### `age(): AgeResult`
Calendar age from this date to now. Returns `{ years, months, days, toString() }`.

### `countdown(): CountdownResult`
Time remaining until this date. Returns `{ days, hours, minutes, seconds, milliseconds, total, isPast, format(), humanize() }`.

---

## Instance Methods — Calendar

### `calendarGrid(opts?): CalendarCell<DateFormat>[][]`
6×7 month-view grid. Options: `{ weekStart: 'sunday' | 'monday' }`.

### `daysInMonth(): number`
### `dayOfYear(): number`
### `weekday(): number`
Same as `get('day')`.

### `isoWeek(): number`
ISO 8601 week number.

### `isoWeekYear(): number`
### `week(): number`
Alias for `isoWeek()`.

### `weeksInYear(): number`
52 or 53.

### `quarter(): number`
1–4.

---

## Instance Methods — Fiscal

### `fiscalYear(config?): number`
Fiscal year number. Config: `{ startMonth: number }` (1–12, default 1).

### `fiscalQuarter(config?): number`
Fiscal quarter (1–4).

---

## Instance Methods — Mode

### `utc(): DateFormat`
Convert to UTC mode.

### `local(): DateFormat`
Convert to local mode.

---

See the [DateFormat Guide](../guide/dateformat) for usage examples.
