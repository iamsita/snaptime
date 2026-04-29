// ─────────────────────────────────────────────────────────────────────────────
// Plugin system — `DateTime.use(plugin, options?)`.
//
// A plugin is just a function that receives the DateTime constructor and
// (optionally) options. Plugins register macros, locales, or any other side
// effects. Each plugin is invoked exactly once.
// ─────────────────────────────────────────────────────────────────────────────

import type DateTime from '../core/DateTime'

export type PluginFn<O = unknown> = (DT: typeof DateTime, options?: O) => void

const installed = new WeakSet<PluginFn<unknown>>()

export function install<O>(DT: typeof DateTime, plugin: PluginFn<O>, options?: O): void {
  if (installed.has(plugin as PluginFn<unknown>)) return
  installed.add(plugin as PluginFn<unknown>)
  plugin(DT, options)
}

export function isInstalled(plugin: PluginFn<unknown>): boolean {
  return installed.has(plugin)
}
