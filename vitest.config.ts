import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // @ts-expect-error - environmentMatchGlobs is valid but not in types yet
    environmentMatchGlobs: [
      // Use jsdom for component tests
      ['src/components/**/*.test.tsx', 'jsdom'],
      ['src/components/**/*.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/**/__reference__/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,  // Relaxed: branch coverage typically lower, 75% is good
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
