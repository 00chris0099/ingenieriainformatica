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
      '@repo/blocks': path.resolve(__dirname, '../packages/blocks/src'),
      '@repo/templates': path.resolve(__dirname, '../packages/templates/src'),
      '@repo/ai': path.resolve(__dirname, '../packages/ai/src'),
      '@repo/config': path.resolve(__dirname, '../packages/config/src'),
      '@repo/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@repo/utils': path.resolve(__dirname, '../packages/utils/src'),
    },
  },
});
