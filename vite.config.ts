import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Sub-path entries — each becomes its own bundle so consumers can import
// `@anilkumarthakur/d8/locale/fr` (or any other module) without pulling the
// rest of the library into their bundle.
const SUBPATHS: Record<string, string> = {
  index: 'src/index.ts',
  rrule: 'src/rrule/index.ts',
  astronomy: 'src/astronomy/index.ts',
  validate: 'src/validate/index.ts',
  'calendars/bs': 'src/calendars/bs/index.ts',
  'collections/RangeSet': 'src/collections/RangeSet.ts',
  'locale/en': 'src/locale/default.ts',
  'locale/es': 'src/locale/locales/es.ts',
  'locale/fr': 'src/locale/locales/fr.ts',
  'locale/de': 'src/locale/locales/de.ts',
  'locale/ja': 'src/locale/locales/ja.ts',
  'locale/zh-cn': 'src/locale/locales/zh-cn.ts',
  'locale/hi': 'src/locale/locales/hi.ts',
  'locale/pt': 'src/locale/locales/pt.ts',
  'locale/it': 'src/locale/locales/it.ts',
  'locale/ar': 'src/locale/locales/ar.ts',
  'locale/ne': 'src/locale/locales/ne.ts',
  'locale/ko': 'src/locale/locales/ko.ts',
  'locale/vi': 'src/locale/locales/vi.ts',
  'locale/tr': 'src/locale/locales/tr.ts',
  'locale/ru': 'src/locale/locales/ru.ts',
  'locale/nl': 'src/locale/locales/nl.ts',
  'locale/pl': 'src/locale/locales/pl.ts',
  'locale/id': 'src/locale/locales/id.ts',
  'locale/th': 'src/locale/locales/th.ts'
}

const entries = Object.fromEntries(
  Object.entries(SUBPATHS).map(([k, v]) => [k, resolve(__dirname, v)])
)

export default defineConfig({
  plugins: [dts({ entryRoot: 'src', rollupTypes: false })],
  build: {
    lib: {
      entry: entries,
      name: 'D8',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          exports: 'named',
          preserveModules: false
        },
        {
          format: 'cjs',
          dir: 'dist',
          entryFileNames: '[name].cjs',
          chunkFileNames: 'chunks/[name]-[hash].cjs',
          exports: 'named',
          preserveModules: false
        }
      ]
    },
    sourcemap: false,
    emptyOutDir: true
  }
})
