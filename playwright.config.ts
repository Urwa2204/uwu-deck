import { defineConfig } from '@playwright/test'

// Run `npm run test:e2e`: it builds first, then launches the real Electron app.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: 1,
  reporter: 'list'
})
