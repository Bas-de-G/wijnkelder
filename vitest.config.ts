import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // tests/legacy.spec.mjs is geen vitest-test maar een Playwright-script dat de
    // legacy-app in een echte browser opent; die draait via `npm run test:legacy`.
    include: ['tests/**/*.test.ts'],
  },
});
