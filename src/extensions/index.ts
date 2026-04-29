// ─────────────────────────────────────────────────────────────────────────────
// User extensions entry point.
//
// Drop your extension files in this folder and import them here. They will be
// loaded once per process the first time the library is imported.
//
// Example — `src/extensions/greet.ts`:
//
//   import type { PluginFn } from '@anilkumarthakur/d8'
//   declare module '@anilkumarthakur/d8' {
//     interface DateTimePluginMethods { greet(): string }
//   }
//   const plugin: PluginFn = (DT) => {
//     DT.macro('greet', function () {
//       return `Hello at ${this.format('LT')}`
//     })
//   }
//   export default plugin
//
// Then in `src/extensions/index.ts`:
//
//   import DateTime from '../core/DateTime'
//   import greet from './greet'
//   DateTime.use(greet)
//
// After publishing, end-users do exactly the same thing in their own project:
//
//   import { DateTime } from '@anilkumarthakur/d8'
//   import myPlugin from './my-plugin'
//   DateTime.use(myPlugin)
// ─────────────────────────────────────────────────────────────────────────────

// (No built-in extensions are loaded by default — keep this file tree-shake-friendly.)
export {}
