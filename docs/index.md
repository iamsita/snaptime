---
layout: home

hero:
  name: "D8"
  text: "Modern Date/Time for TypeScript"
  tagline: "Zero-dependency, fully typed date library — formatting, parsing, timezones, business days, cron, and natural language."
  image:
    src: /logo-transparent.png
    alt: D8 Logo
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/anilkumarthakur60/snaptime

features:
  - icon: 🎯
    title: Fully Typed
    details: Built from the ground up in TypeScript. Every method, option, and return value has precise types — no <code>any</code> escape hatches.
  - icon: 📦
    title: Zero Dependencies
    details: Ships ESM + UMD + CJS + IIFE with type declarations. Zero external packages. ~50 KB unminified — everything included.
  - icon: 🕐
    title: 100+ Methods
    details: Format, parse, compare, diff, age, countdown, calendar grid, fiscal year, ISO weeks, ordinals, unit aliases, and dozens of is‑checks.
  - icon: 🌍
    title: Timezone Support
    details: Full IANA timezone support using the built-in Intl API. Offsets, DST detection, and wall-clock formatting.
  - icon: 💼
    title: Business Days & Holidays
    details: Add/subtract business days, skip weekends + public holidays for US, UK, IN, DE, FR, CA, AU.
  - icon: ⏰
    title: Cron Expressions
    details: Parse 5-field cron expressions, find next/previous matches, list matches between dates, and humanize to English.
  - icon: 🗣️
    title: Natural Language Parsing
    details: Parse "tomorrow at 3pm", "5 hours ago", "next Friday", "3rd Monday of January", "noon", "midnight", and more.
  - icon: 📅
    title: Ranges & Collections
    details: DateRange with contains/overlaps/merge/split/iterate. DateCollection with sort/group/unique/closest/filter/reduce — fully iterable.
  - icon: ⏱️
    title: Duration
    details: Parse durations from "2h30m" or ISO 8601 "P1DT12H". Convert units, compare, format with templates, and humanize.
  - icon: 🔌
    title: Plugin System
    details: Extend DateFormat with custom methods through a lightweight plugin API. Type-safe declaration merging included.
  - icon: 🌐
    title: Locale Support
    details: Register custom locales for month names, weekday names, and relative time strings.
  - icon: 📄
    title: Multiple Serializations
    details: Output to ISO 8601, SQL, RFC 2822, RFC 3339, Excel serial numbers, and plain objects.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #667eea33 0%, #764ba233 100%);
  --vp-home-hero-image-filter: blur(56px);
}
</style>

## Quick Example

```typescript
import d8, { Timezone, Cron, Duration } from '@anilkumarthakur/d8'

const date = d8('2026-03-18')
date.format('[It is] dddd, MMMM Do YYYY')  // "It is Wednesday, March 18th 2026"
date.add(7, 'd').format('YYYY-MM-DD')      // "2026-03-25" (unit aliases!)
date.isSameOrBefore('2026-12-31')           // true
date.isBetween('2026-01-01', '2026-06-30', undefined, '[]')  // inclusive

// Create from object
d8.fromObject({ year: 2026, month: 3, day: 18 })

// Timezones
const tz = new Timezone('America/New_York')
tz.format(date, 'HH:mm Z')                 // "19:00 -05:00"

// Cron & Duration
const job = new Cron('30 9 * * 1-5')
job.humanize()                              // "At 09:30, Monday through Friday"
Duration.fromISO('P1DT12H').humanize(false) // "1 day, 12 hours"

// Natural language with time support
d8.natural('tomorrow at 3pm').format('YYYY-MM-DD HH:mm')
d8.natural('5 hours ago')
d8.business.getHolidays('US', 2026)

// Iterable collections
for (const date of d8.collection(['2026-01-01', '2026-06-15'])) {
  console.log(date.format('MMM D'))
}
```
