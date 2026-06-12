// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    isolate: true,
    // Angular CLI test system handles project configuration and include/exclude natively
  },
});
