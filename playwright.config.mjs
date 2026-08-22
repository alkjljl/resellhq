import { defineConfig } from "@playwright/test";
import { sanitizeApplicationEnvironment } from "./scripts/acceptance/test-environment.mjs";

const appUrl = process.env.PHASE1_TEST_APP_URL ?? "http://127.0.0.1:3000";
const webServerEnvironment = sanitizeApplicationEnvironment(process.env);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [
        ["line"],
        ["junit", { outputFile: "test-results/playwright-results.xml" }],
      ]
    : "line",
  outputDir: "test-results/playwright-artifacts",
  use: {
    baseURL: appUrl,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "node scripts/acceptance/start-app.mjs",
    env: webServerEnvironment,
    url: appUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "desktop",
      testMatch: /phase1\.spec\.mjs/,
      use: { viewport: { width: 1440, height: 1024 } },
    },
    {
      name: "mobile",
      testMatch: /responsive\.spec\.mjs/,
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet",
      testMatch: /responsive\.spec\.mjs/,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "laptop",
      testMatch: /responsive\.spec\.mjs/,
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop-responsive",
      testMatch: /responsive\.spec\.mjs/,
      use: { viewport: { width: 1440, height: 1024 } },
    },
  ],
});
