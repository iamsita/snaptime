# Duration API

Time span representation with conversion, arithmetic, formatting, and humanization.

## Constructor

```typescript
new Duration(ms?: number)
```

| Param | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `ms` | `number` | `0` | Duration in milliseconds |

---

## Static Methods

### `Duration.parse(input): Duration`

Parse a duration string.

```typescript
Duration.parse('2h30m15s')   // 2 hours, 30 min, 15 sec
Duration.parse('1Y6M')       // 1 year, 6 months
Duration.parse('500ms')      // 500 milliseconds
```

**Tokens:** `Y/y` (years), `M` (months), `w` (weeks), `d` (days), `h` (hours), `m` (minutes), `s` (seconds), `ms` (milliseconds).

### `Duration.fromISO(str: string): Duration`

Parse an ISO 8601 duration string (e.g. `'P1Y2M3DT4H5M6S'`).

### `Duration.between(a: number | Date, b: number | Date): Duration`

Create a `Duration` representing the time between two timestamps or `Date` objects.

---

## Instance Methods

### `as(unit): number`

Convert this duration to the given unit.

### `add(n, unit): Duration`

Add time to this duration. Returns a new `Duration`.

### `subtract(n, unit): Duration`

Subtract time. Returns a new `Duration`.

### `humanize(short?): string`

| Param | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `short` | `boolean` | `true` | `true`: compact (`"3h"`). `false`: long (`"2 hours, 30 minutes"`) |

### `format(fmt): string`

Format with template tokens: `HH`, `H`, `mm`, `m`, `ss`, `s`, `SSS`.

### `toMilliseconds(): number`
### `toSeconds(): number`
### `toMinutes(): number`
### `toHours(): number`
### `toDays(): number`
### `toWeeks(): number`
### `toMonths(): number`
### `toYears(): number`

### `valueOf(): number`
Raw milliseconds.

### `isZero(): boolean`
### `isNegative(): boolean`
### `isPositive(): boolean`

### `abs(): Duration`
Absolute value.

### `negate(): Duration`
Return a new `Duration` with the sign flipped.

### `equals(other): boolean`
Returns `true` if both durations represent the same length of time.

### `lessThan(other): boolean`
### `greaterThan(other): boolean`
### `lessThanOrEqual(other): boolean`
### `greaterThanOrEqual(other): boolean`

### `toISO(): string`
Return the duration as an ISO 8601 duration string (e.g. `'P1DT2H3M'`).

### `toString(): string`
Same as `humanize(true)`.

---

See the [Duration Guide](../guide/duration) for examples.
