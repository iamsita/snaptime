// ─────────────────────────────────────────────────────────────────────────────
// Macro registry — adds instance & static methods to DateTime at runtime.
//
// This is the same pattern as Carbon's Carbon::macro() (PHP) and Moment's
// moment.fn extension. We expose it as a first-class registry so that user
// extensions can be declared in plugins:
//
//   DateTime.macro('greet', function () { return `hi at ${this.format('LT')}` })
//
// Type-safety: extend `DateTimePluginMethods` via declaration merging so the
// macro shows up on DateTime instances in TypeScript.
// ─────────────────────────────────────────────────────────────────────────────

import type DateTime from '../core/DateTime'

export type MacroFn = (this: DateTime, ...args: unknown[]) => unknown
export type StaticMacroFn = (...args: unknown[]) => unknown

interface MacroRegistry {
  instance: Record<string, MacroFn>
  static: Record<string, StaticMacroFn>
}

const registry: MacroRegistry = {
  instance: {},
  static: {}
}

/** True when an instance macro of this name is registered. */
export function hasInstanceMacro(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry.instance, name)
}

/** True when a static macro of this name is registered. */
export function hasStaticMacro(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry.static, name)
}

/** Apply all currently-registered macros onto a DateTime constructor. */
export function applyMacros(DT: typeof DateTime): void {
  for (const [name, fn] of Object.entries(registry.instance)) {
    if (!(name in DT.prototype)) {
      Object.defineProperty(DT.prototype, name, {
        value: fn,
        writable: true,
        enumerable: false,
        configurable: true
      })
    }
  }
  for (const [name, fn] of Object.entries(registry.static)) {
    if (!(name in DT)) {
      Object.defineProperty(DT, name, {
        value: fn,
        writable: true,
        enumerable: false,
        configurable: true
      })
    }
  }
}

/**
 * Register an instance macro. The function is bound to a DateTime instance
 * via `this`. Returns the registry for chaining.
 */
export function registerMacro(name: string, fn: MacroFn): void {
  if (registry.instance[name]) {
    throw new Error(`Macro "${name}" is already registered`)
  }
  registry.instance[name] = fn
}

/** Register a static macro on the DateTime constructor. */
export function registerStaticMacro(name: string, fn: StaticMacroFn): void {
  if (registry.static[name]) {
    throw new Error(`Static macro "${name}" is already registered`)
  }
  registry.static[name] = fn
}

/** Remove all registered macros. Used by tests. */
export function resetMacros(): void {
  for (const k of Object.keys(registry.instance)) delete registry.instance[k]
  for (const k of Object.keys(registry.static)) delete registry.static[k]
}

export const Macros = {
  register: registerMacro,
  registerStatic: registerStaticMacro,
  has: hasInstanceMacro,
  hasStatic: hasStaticMacro,
  apply: applyMacros,
  reset: resetMacros
}
