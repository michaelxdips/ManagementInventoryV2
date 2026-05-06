import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/__tests__/**/*.test.js'],
    exclude: ['node_modules', 'dist', 'src/migrations/**', 'src/seeds/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**', 'src/middleware/**'],
      exclude: [
        'src/**/*.test.js',
        'src/migrations/**',
        'src/seeds/**',
        'src/config/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    globals: true,
    testTimeout: 10000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
