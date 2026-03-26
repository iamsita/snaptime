# Natural Language Examples

## Basic Parsing

```typescript
import { parseNatural } from '@anilkumarthakur/d8'

parseNatural('today').isValid()                      // → true
parseNatural('tomorrow').isValid()                   // → true
parseNatural('yesterday').isValid()                  // → true
parseNatural('3 days ago').isValid()                  // → true
parseNatural('in 2 weeks').isValid()                  // → true
parseNatural('gibberish').isValid()                   // → false
parseNatural('').isValid()                            // → false
```

## Relative Dates (with ref = Jan 15, 2026)

```typescript
const ref = d8('2026-01-15T12:00:00')

parseNatural('tomorrow', ref).format('YYYY-MM-DD')     // → "2026-01-16"
parseNatural('yesterday', ref).format('YYYY-MM-DD')    // → "2026-01-14"
parseNatural('3 days ago', ref).format('YYYY-MM-DD')   // → "2026-01-12"
parseNatural('in 3 days', ref).format('YYYY-MM-DD')    // → "2026-01-18"
parseNatural('next monday', ref).format('YYYY-MM-DD')  // → "2026-01-19"
parseNatural('last monday', ref).format('YYYY-MM-DD')  // → "2026-01-12"
```

## Month Boundaries

```typescript
parseNatural('first day of january 2026').format('YYYY-MM-DD')
// → "2026-01-01"

parseNatural('last day of february 2024').format('YYYY-MM-DD')
// → "2024-02-29" (leap year!)

parseNatural('last day of february 2025').format('YYYY-MM-DD')
// → "2025-02-28" (non-leap)

parseNatural('last day of december 2026').format('MM-DD')
// → "12-31"
```

## Nth Weekday of Month

```typescript
parseNatural('1st monday of january 2026').format('YYYY-MM-DD')
// → "2026-01-05"

parseNatural('3rd friday of january 2026').format('YYYY-MM-DD')
// → "2026-01-16"

parseNatural('2nd tuesday of march 2026').format('YYYY-MM-DD')
// → "2026-03-10"

// Invalid (past month end):
parseNatural('6th friday of january 2026').isValid()
// → false
```

## Smart Date Picker

```typescript
function parseUserInput(input: string): string {
  const result = parseNatural(input)
  if (!result.isValid()) return 'Could not understand that date'
  return result.format('dddd, MMMM Do, YYYY')
}

parseUserInput('next friday')              // → "Friday, January 16th, 2026"
parseUserInput('in 2 weeks')               // → date 2 weeks from now
parseUserInput('3rd monday of march 2026') // → "Monday, March 16th, 2026"
parseUserInput('blah blah')                // → "Could not understand that date"
```

## Reminder System

```typescript
function scheduleReminder(phrase: string) {
  const date = parseNatural(phrase)
  if (!date.isValid()) return { error: 'Invalid date' }

  return {
    scheduled: date.format('YYYY-MM-DD HH:mm'),
    relative: date.fromNow(),
  }
}

scheduleReminder('tomorrow')
// → { scheduled: "2026-01-16 12:00", relative: "in 1 day" }

scheduleReminder('in 3 days')
// → { scheduled: "2026-01-18 12:00", relative: "in 3 days" }

scheduleReminder('nonsense')
// → { error: "Invalid date" }
```

## Time Support

```js
d8.natural('tomorrow at 3pm')
d8.natural('next friday at 10:30')
d8.natural('yesterday at midnight')
```

## Sub-day Offsets

```js
d8.natural('5 hours ago')
d8.natural('30 minutes from now')
d8.natural('in 10 seconds')
```

## Named Times

```js
d8.natural('noon')       // today at 12:00
d8.natural('midnight')   // today at 00:00
```
