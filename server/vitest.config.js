import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    deps: {
      interopDefault: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'prisma/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  }
})
