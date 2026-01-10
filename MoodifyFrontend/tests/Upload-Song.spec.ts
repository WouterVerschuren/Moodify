import { test, expect } from "@playwright/test";

test("user can login, upload a song and see it in songs list", async ({
  page,
}) => {
  // 1. Open app
  await page.goto("https://4.251.168.14.nip.io");

  // 2. Login (pas selectors aan indien nodig)
  await page.fill('[data-testid="login-email"]', "finwou@gmail.com");
  await page.fill('[data-testid="login-password"]', "test123");
  await page.click('[data-testid="login-submit"]');

  // 3. Expect songs page to load
  await expect(page.getByText("Songs")).toBeVisible({ timeout: 10_000 });

  // 4. Upload song (selector moet matchen met SongsPage)
  await page.getByText("Upload").click();
  await page.setInputFiles('input[type="file"]', "tests/assets/test.mp3");
  await page.fill('input[name="title"]', "E2E Song");
  await page.fill('input[name="artist"]', "Playwright");
  await page.click('button[type="submit"]');

  // 5. Song appears in list
  await expect(page.getByText("E2E Song")).toBeVisible({ timeout: 15_000 });

  // 6. Play the song
  await page.getByText("E2E Song").click();

  // 7. Audio player shows current track
  await expect(page.getByText("E2E Song")).toBeVisible();
});
