// Numeral system conversion. Accepts any string and rewrites ASCII digits
// 0-9 to the target script's digits.

const DIGITS = {
  western: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  devanagari: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  arabic: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  persian: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  bengali: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  thai: ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'],
  burmese: ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'],
  tibetan: ['༠', '༡', '༢', '༣', '༤', '༥', '༦', '༧', '༨', '༩']
} as const

export type NumeralSystem = keyof typeof DIGITS

/** Replace ASCII digits with the target system's. */
export function toNumerals(input: string, system: NumeralSystem): string {
  if (system === 'western') return input
  const table = DIGITS[system]
  return input.replace(/[0-9]/g, (d) => table[Number(d)])
}

/** Reverse — collapse any of the supported systems back to ASCII. */
export function toWesternNumerals(input: string): string {
  let out = input
  for (const sys of Object.keys(DIGITS) as NumeralSystem[]) {
    if (sys === 'western') continue
    const table = DIGITS[sys]
    for (let i = 0; i < table.length; i++) {
      out = out.split(table[i]).join(String(i))
    }
  }
  return out
}
