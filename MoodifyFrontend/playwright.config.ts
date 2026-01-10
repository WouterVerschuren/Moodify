import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", // Playwright zoekt hier je tests
  timeout: 60_000, // max 60 seconden per test
  retries: 1,
  use: {
    headless: false, // false = je ziet de browser, true = achtergrond
    baseURL: "https://4.251.168.14.nip.io",
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20_000,
    trace: "on-first-retry",
  },
});
