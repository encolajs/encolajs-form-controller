import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/',
        '**/docs/',
        '**/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/encola.ts',
        '**/zod.ts',
        '**/yup.ts',
        '**/valibot.ts',
        '**/src/validators/NoopValidator.ts',
        '**/index.ts' // exclude barrel exports from coverage
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})