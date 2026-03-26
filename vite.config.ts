import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/package/index.ts'),
      name: 'D8',
      formats: ['es', 'umd', 'cjs', 'iife'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
})
