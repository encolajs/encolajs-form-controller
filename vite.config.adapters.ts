import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// Separate config for building adapters (ES modules only for tree-shaking)
export default defineConfig({
  plugins: [
    dts({
      include: ['zod.ts', 'yup.ts', 'valibot.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      insertTypesEntry: false // Don't generate main types, only for adapters
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear the dist directory
    lib: {
      entry: {
        zod: resolve(__dirname, 'zod.ts'),
        yup: resolve(__dirname, 'yup.ts'),
        valibot: resolve(__dirname, 'valibot.ts')
      },
      formats: ['es'], // Only ES modules for tree-shaking
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      external: ['alien-signals', 'zod', 'yup', 'valibot'],
      output: {
        preserveModules: false
      }
    },
    sourcemap: true,
    target: 'es2020'
  }
})