// Locale registry + English default. Other locales are opt-in (tree-shaking
// friendly): import them explicitly from `@anilkumarthakur/d8/locale/<name>`.

export { Locales, type ResolvedLocale } from './registry'
export { EN } from './default'
export type { LocaleData, LocaleRelativeTime, LocaleCalendar } from '../core/types'
