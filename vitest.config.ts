import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    include: [
      'app/**/*.test.ts',
      'server/**/*.test.ts',
      'shared/**/*.test.ts',
      'test/**/*.test.ts',
      'crawler/**/*.test.ts',
    ],
    setupFiles: ['./test/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'app/**/*.{ts,vue}',
        'server/**/*.ts',
        'shared/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '~~': resolve(__dirname),
      '~': resolve(__dirname, 'app'),
      '@': resolve(__dirname, 'app'),
      '#shared': resolve(__dirname, 'shared'),
    },
  },
})
