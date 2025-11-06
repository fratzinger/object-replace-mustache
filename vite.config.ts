import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.test.{js,ts}', 'src/types.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
})
