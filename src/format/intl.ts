// Thin wrapper over Intl.DateTimeFormat for locale-aware formatting that goes
// beyond our token table.

export function formatIntl(
  d: Date,
  isUtc: boolean,
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions
): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    ...opts,
    timeZone: isUtc ? 'UTC' : opts.timeZone
  })
  return fmt.format(d)
}

export function formatIntlParts(
  d: Date,
  isUtc: boolean,
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatPart[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    ...opts,
    timeZone: isUtc ? 'UTC' : opts.timeZone
  })
  return fmt.formatToParts(d)
}
