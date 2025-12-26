import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      // Coverage thresholds (optional - adjust as needed)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    // Exclude live integration tests from coverage (they're opt-in)
    exclude: ['node_modules', 'dist', '**/live-integration.test.ts', '**/multi-city-live.test.ts'],
  },
});
