import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "browser.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  retries: 0,
  reporter: "list",
  outputDir: "../../station-test-results",
  use: {
    baseURL: process.env.STATION_TEST_URL || "http://localhost:3000",
    headless: true,
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
});
