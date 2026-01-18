import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 1,
  use: {
    headless: true, // false = browser, true = background
    baseURL: "https://4.251.168.14.nip.io",
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20_000,
    trace: "on-first-retry",
  },
});
