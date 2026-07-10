import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/prisma': path.resolve(__dirname, '../packages/prisma/src'),
      '@repo/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@repo/utils': path.resolve(__dirname, '../packages/utils/src'),
    },
  },
});
