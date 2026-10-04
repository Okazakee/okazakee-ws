import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(
        new URL('./src/components', import.meta.url)
      ),
      '@layout': fileURLToPath(
        new URL('./src/components/layout', import.meta.url)
      ),
      '@public': fileURLToPath(new URL('./src/app/public', import.meta.url)),
    },
  },
});
