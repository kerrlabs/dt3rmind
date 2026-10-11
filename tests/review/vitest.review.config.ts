/// <reference types="vitest/config" />
// REVIEW-ONLY config. The project's vite.config.ts `test.include` is
// `tests/**/*.test.ts` and omits `.tsx` under tests/, so UI render tests placed
// there are never collected. This config (used only by the review agent) adds
// the .tsx glob so tests/review/*.test.tsx can run. It does not change project
// behavior; it is additive and lives under tests/review/.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/review/**/*.test.tsx'],
  },
});
