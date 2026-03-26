# Natural Language

Parse dates from English phrases — relative dates, weekday references, month boundaries, and ordinal patterns.

## Basic Usage

```typescript
import { parseNatural } from '@anilkumarthakur/d8'
// or: import d8 from '@anilkumarthakur/d8'; d8.natural(...)

// With a reference date (Jan 15, 2026, Thursday):
const ref = d8('2026-01-15T12:00:00')

parseNatural('now', ref).valueOf() === ref.valueOf()   // → true
parseNatural('today', ref).valueOf() === ref.valueOf()  // → true
parseNatural('tomorrow', ref).format('YYYY-MM-DD')      // → "2026-01-16"
parseNatural('yesterday', ref).format('YYYY-MM-DD')     // → "2026-01-14"

// Named times:
parseNatural('noon', ref).format('YYYY-MM-DD HH:mm:ss')      // → "2026-01-15 12:00:00"
parseNatural('midnight', ref).format('YYYY-MM-DD HH:mm:ss')   // → "2026-01-15 00:00:00"

// Case-insensitive:
parseNatural('NOW', ref).isValid()       // → true
parseNatural('Today', ref).isValid()     // → true
parseNatural('TOMORROW', ref).isValid()  // → true
```

## Time Support

Append `at {time}` to relative date expressions to set a specific time of day. Both 12-hour (`3pm`, `10:30am`) and named times (`noon`, `midnight`) are supported.

```typescript
// ref = Thursday Jan 15, 2026 12:00:00
parseNatural('tomorrow at 3pm', ref).format('YYYY-MM-DD HH:mm:ss')
// → "2026-01-16 15:00:00"

parseNatural('yesterday at 10:30', ref).format('YYYY-MM-DD HH:mm:ss')
// → "2026-01-14 10:30:00"

parseNatural('today at noon', ref).format('YYYY-MM-DD HH:mm:ss')
// → "2026-01-15 12:00:00"

parseNatural('today at midnight', ref).format('YYYY-MM-DD HH:mm:ss')
// → "2026-01-15 00:00:00"

parseNatural('next monday at 9am', ref).format('YYYY-MM-DD HH:mm:ss')
// → "2026-01-19 09:00:00"
```

## Next / Last Weekday

```typescript
// ref = Thursday Jan 15, 2026
parseNatural('next monday', ref)    // → Jan 19 (Mon)
parseNatural('next friday', ref)    // → Jan 16 (Fri, +1 day)
parseNatural('next thursday', ref)  // → Jan 22 (same weekday → +7)
parseNatural('next sunday', ref)    // → Jan 18 (Sun, +3 days)
parseNatural('next saturday', ref)  // → Jan 17 (Sat, +2 days)
parseNatural('next tuesday', ref)   // → Jan 20 (Tue, +5 days)
parseNatural('next wednesday', ref) // → Jan 21 (Wed, +6 days)

parseNatural('last monday', ref)    // → Jan 12 (Mon, -3 days)
parseNatural('last sunday', ref)    // → Jan 11 (Sun, -4 days)
parseNatural('last thursday', ref)  // → Jan 8  (same weekday → -7)
```

## Next / Last Period

```typescript
parseNatural('next week', ref)  // → ref + 1 week
parseNatural('next month', ref) // → ref + 1 month
parseNatural('next year', ref)  // → ref + 1 year

parseNatural('last week', ref)  // → ref - 1 week
parseNatural('last month', ref) // → ref - 1 month
parseNatural('last year', ref)  // → ref - 1 year
```

## This Period

The `this` keyword returns the start of the current period.

```typescript
parseNatural('this week', ref)   // → start of current week
parseNatural('this month', ref)  // → start of current month (Jan 1, 2026)
parseNatural('this year', ref)   // → start of current year (Jan 1, 2026)
```

## N Units Ago

```typescript
parseNatural('3 days ago', ref).format('YYYY-MM-DD')  // → "2026-01-12"
parseNatural('1 day ago', ref).format('YYYY-MM-DD')   // → "2026-01-14"
parseNatural('2 weeks ago', ref)   // → ref - 2 weeks
parseNatural('1 month ago', ref)   // → ref - 1 month
parseNatural('5 years ago', ref)   // → ref - 5 years
parseNatural('2 months ago', ref)  // → ref - 2 months

// Sub-day offsets:
parseNatural('5 hours ago', ref)    // → ref - 5 hours
parseNatural('30 minutes ago', ref) // → ref - 30 minutes
parseNatural('10 seconds ago', ref) // → ref - 10 seconds
```

## In N Units / N Units From Now

```typescript
parseNatural('in 3 days', ref).format('YYYY-MM-DD')  // → "2026-01-18"
parseNatural('in 1 week', ref)    // → ref + 1 week
parseNatural('in 2 months', ref)  // → ref + 2 months
parseNatural('in 1 year', ref)    // → ref + 1 year

parseNatural('3 days from now', ref).format('YYYY-MM-DD') // → "2026-01-18"
parseNatural('1 week from now', ref)   // → ref + 1 week
parseNatural('2 months from now', ref) // → ref + 2 months

// Sub-day offsets:
parseNatural('in 2 hours', ref)          // → ref + 2 hours
parseNatural('in 45 minutes', ref)       // → ref + 45 minutes
parseNatural('30 minutes from now', ref) // → ref + 30 minutes
parseNatural('in 90 seconds', ref)       // → ref + 90 seconds
```

## Beginning / End of Period

```typescript
parseNatural('beginning of day', ref)   // → ref.startOf('day')
parseNatural('beginning of week', ref)  // → ref.startOf('week')
parseNatural('beginning of month', ref) // → ref.startOf('month')
parseNatural('beginning of year', ref)  // → ref.startOf('year')

parseNatural('end of day', ref)   // → ref.endOf('day')
parseNatural('end of week', ref)  // → ref.endOf('week')
parseNatural('end of month', ref) // → ref.endOf('month')
parseNatural('end of year', ref)  // → ref.endOf('year')
```

## First / Last Day of Month

```typescript
parseNatural('first day of january', ref)
// → Jan 1, 2026

parseNatural('first day of march 2027', ref)
// → Mar 1, 2027

parseNatural('last day of january', ref)
// → Jan 31, 2026

parseNatural('last day of february 2024', ref)
// → Feb 29, 2024 (leap year!)

parseNatural('last day of february 2025', ref)
// → Feb 28, 2025 (non-leap)

parseNatural('last day of december', ref)
// → Dec 31, 2026
```

## Nth Weekday of Month

```typescript
// Jan 2026: Jan 1 = Thursday
parseNatural('1st monday of january', ref)
// → Jan 5, 2026

parseNatural('2nd monday of january', ref)
// → Jan 12, 2026

parseNatural('3rd monday of january 2026', ref)
// → Jan 19, 2026

parseNatural('3rd friday of january 2026', ref)
// → Jan 16, 2026

parseNatural('1st sunday of january 2026', ref)
// → Jan 4, 2026

parseNatural('2nd tuesday of march 2026', ref)
// → Mar 10, 2026

parseNatural('2nd wednesday of february 2026', ref)
// → Feb 11, 2026

// 5th Friday of January 2026 (still valid):
parseNatural('5th friday of january 2026', ref)
// → Jan 30, 2026

// 6th Friday → goes past month end → invalid:
parseNatural('6th friday of january 2026', ref).isValid()
// → false
```

## Invalid Input

```typescript
parseNatural('some gibberish', ref).isValid()  // → false
parseNatural('next blahday', ref).isValid()    // → false
parseNatural('', ref).isValid()                // → false
parseNatural('foo bar baz', ref).isValid()     // → false
```

## Without Reference Date

```typescript
// Defaults to Date.now():
parseNatural('today').isValid()     // → true
parseNatural('now').isValid()       // → true
parseNatural('tomorrow').isValid()  // → true
```

## Complete Pattern Reference

| Pattern | Example | Result |
|:--------|:--------|:-------|
| `now` / `today` | `"today"` | Current date |
| `tomorrow` | `"tomorrow"` | +1 day |
| `yesterday` | `"yesterday"` | -1 day |
| `noon` | `"noon"` | Today at 12:00:00 |
| `midnight` | `"midnight"` | Today at 00:00:00 |
| `{relative} at {time}` | `"tomorrow at 3pm"` | Relative date with specific time |
| `next {weekday}` | `"next friday"` | Next occurrence |
| `last {weekday}` | `"last monday"` | Previous occurrence |
| `next {weekday} at {time}` | `"next monday at 9am"` | Next occurrence with time |
| `next {period}` | `"next month"` | +1 period |
| `last {period}` | `"last year"` | -1 period |
| `this {period}` | `"this month"` | Start of current period |
| `{N} {unit} ago` | `"3 days ago"`, `"5 hours ago"` | -N units (days, weeks, months, years, hours, minutes, seconds) |
| `in {N} {unit}` | `"in 2 weeks"`, `"in 45 minutes"` | +N units (days, weeks, months, years, hours, minutes, seconds) |
| `{N} {unit} from now` | `"5 days from now"`, `"30 minutes from now"` | +N units |
| `beginning of {period}` | `"beginning of month"` | Start of period |
| `end of {period}` | `"end of year"` | End of period |
| `first day of {month} [year]` | `"first day of March 2027"` | 1st of month |
| `last day of {month} [year]` | `"last day of February"` | Last of month |
| `{N}th {weekday} of {month} [year]` | `"3rd Friday of January"` | Nth weekday |
