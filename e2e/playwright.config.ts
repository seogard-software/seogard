import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:3333'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: [
    // Auth setup — login all users and save storageState
    {
      name: 'setup',
      testDir: '.',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Owner tests
    {
      name: 'owner',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/owner.json',
      },
      dependencies: ['setup'],
    },

    // Zone admin tests
    {
      name: 'zone-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Zone member tests
    {
      name: 'zone-member',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/member.json',
      },
      dependencies: ['setup'],
    },

    // Zone viewer tests
    {
      name: 'zone-viewer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/viewer.json',
      },
      dependencies: ['setup'],
    },

    // Trial expired tests
    {
      name: 'trial-expired',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/trialExpired.json',
      },
      dependencies: ['setup'],
    },

    // Trial active tests
    {
      name: 'trial-active',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/trialActive.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npx nuxt dev --port 3333',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL || '',
      NUXT_JWT_SECRET: 'test-secret-for-e2e',
    },
  },
})
