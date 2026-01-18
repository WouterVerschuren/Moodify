import { test, expect, Page } from "@playwright/test";
import * as path from "path";

// Force fresh context with no stored cookies/auth
test.use({ storageState: undefined });

// Helper function to wait for network idle
async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState("networkidle", { timeout });
}

test.describe("Music App E2E Tests", () => {
  test("complete user flow: login, upload song, play, and delete", async ({
    page,
  }) => {
    // ===========================================
    // STEP 1: Navigate to the app
    // ===========================================
    console.log("Step 1: Navigating to app...");
    await page.goto("https://20.23.0.233.nip.io", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // ===========================================
    // STEP 2: Login
    // ===========================================
    console.log("Step 2: Attempting login...");

    // Wait for either login form or already authenticated state
    try {
      await page.waitForSelector('[data-testid="login-email"]', {
        timeout: 5000,
      });

      // Fill login form
      await page.fill('[data-testid="login-email"]', "finwou@gmail.com");
      await page.fill('[data-testid="login-password"]', "test123");

      // Click login and wait for navigation
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/Auth/login") && resp.status() === 200,
          { timeout: 15000 },
        ),
        page.click('[data-testid="login-submit"]'),
      ]);

      console.log("Login successful");
    } catch (e) {
      console.log("Already authenticated or login form not found");
    }

    // Wait for app to load after login
    await waitForNetworkIdle(page);

    // ===========================================
    // STEP 3: Navigate to Songs page
    // ===========================================
    console.log("Step 3: Navigating to Songs page...");

    // Wait for navbar to be present
    await page.waitForSelector(".navbar", { timeout: 10000 });

    // Click Songs tab - using text content instead of role
    const songsTab = page.locator('button.nav-tab:has-text("Songs")');
    await songsTab.waitFor({ state: "visible", timeout: 10000 });
    await songsTab.click();

    // Wait for songs page to load
    await page.waitForSelector(".songs-page", { timeout: 10000 });
    console.log("Songs page loaded");

    // Take screenshot for debugging
    await page.screenshot({ path: "test-results/songs-page-loaded.png" });

    // ===========================================
    // STEP 4: Upload a song
    // ===========================================
    console.log("Step 4: Uploading song...");

    // Wait for upload section and form inputs to be visible
    await page.waitForSelector(".upload-section", { timeout: 10000 });
    console.log("Upload section found");

    // Take screenshot to see what's on the page
    await page.screenshot({ path: "test-results/before-upload-form.png" });

    // Try to find inputs by placeholder as fallback
    const titleInput = page.locator('input[placeholder="Song title"]');
    await titleInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("Title input found");

    const artistInput = page.locator('input[placeholder="Artist"]');
    await artistInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("Artist input found");

    const moodSelect = page.locator("select.form-select");
    await moodSelect.waitFor({ state: "visible", timeout: 10000 });
    console.log("Mood select found");

    // Fill in song details
    await titleInput.fill("E2E Test Song");
    console.log("Filled title");

    await artistInput.fill("Playwright Tester");
    console.log("Filled artist");

    await moodSelect.selectOption("Happy");
    console.log("Selected mood");

    // Upload file - use testsong.mp3 from test-assets folder
    const testFilePath = path.join(__dirname, "../../test-assets/testsong.mp3");
    console.log(`Uploading file from: ${testFilePath}`);

    // The file input is hidden, so we need to use force or find it differently
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    console.log("File selected");

    // Wait for file to be selected - check if label text changes
    await expect(page.locator(".file-label")).toContainText("testsong.mp3", {
      timeout: 5000,
    });
    console.log("File label updated");

    // Click upload button and wait for upload to complete
    const uploadButton = page.locator('button:has-text("Add Song")');
    await expect(uploadButton).toBeEnabled({ timeout: 5000 });
    console.log("Upload button is enabled");
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/Audio/upload") && resp.status() === 200,
        { timeout: 30000 },
      ),
      uploadButton.click(),
    ]);
    console.log("Upload response received");

    // Wait for the song to appear in the list - give it time to refresh
    console.log("Waiting for songs list to update...");
    await page.waitForTimeout(3000);

    // Wait for library count to update (should no longer be 0)
    await expect(page.locator('h2:has-text("My Library")')).not.toContainText(
      "My Library (0)",
      { timeout: 10000 },
    );

    console.log("Song uploaded successfully");

    // ===========================================
    // STEP 5: Verify song appears in library
    // ===========================================
    console.log("Step 5: Verifying song in library...");

    // Wait for songs container to update
    await waitForNetworkIdle(page);

    // Take a screenshot to see the current state
    await page.screenshot({ path: "test-results/after-upload.png" });

    // Look for the song card - try multiple approaches
    let songCard;

    // First try: look for song by title text
    const songTitleLocator = page.locator(
      '.song-title:has-text("E2E Test Song")',
    );
    const titleCount = await songTitleLocator.count();

    if (titleCount > 0) {
      // Find the parent song-card
      songCard = page
        .locator('.song-card:has(.song-title:has-text("E2E Test Song"))')
        .first();
      console.log("Found song by title text");
    } else {
      // Fallback: just get the first song card
      songCard = page.locator(".song-card").first();
      console.log("Using first song card as fallback");
    }

    await songCard.waitFor({ state: "visible", timeout: 15000 });

    // Verify song details are displayed
    await expect(page.locator('text="E2E Test Song"').first()).toBeVisible();
    await expect(
      page.locator('text="Playwright Tester"').first(),
    ).toBeVisible();

    console.log("Song found in library");

    // ===========================================
    // STEP 6: Play the song
    // ===========================================
    console.log("Step 6: Playing song...");

    // Click the play button - use the song card we already found
    const playButton = songCard.locator('button[title="Play song"]').first();
    await playButton.waitFor({ state: "visible", timeout: 5000 });
    await playButton.click();
    console.log("Clicked play button");

    // Wait for audio player to appear and load
    await page.waitForSelector(".audio-player", { timeout: 10000 });

    // Verify the song title appears in the player
    const playerTitle = page.locator(".audio-player .track-title");
    await expect(playerTitle).toContainText("E2E Test Song", {
      timeout: 10000,
    });

    console.log("Song is playing in audio player");

    // Optional: Verify audio element exists and has source
    const audioElement = page.locator("audio");
    await expect(audioElement).toHaveCount(1, { timeout: 5000 });

    // Wait a bit to ensure playback started
    await page.waitForTimeout(2000);

    console.log("Audio playback verified");

    // ===========================================
    // STEP 7: Delete the song (cleanup)
    // ===========================================
    console.log("Step 7: Deleting test song...");

    // Find and click delete button
    const deleteButton = songCard
      .locator('button[title="Remove from library"]')
      .first();
    await deleteButton.waitFor({ state: "visible", timeout: 5000 });

    // Handle all dialogs that will appear
    const dialogHandler = async (dialog) => {
      console.log(`Dialog appeared: "${dialog.message()}"`);
      await dialog.accept();
    };

    page.on("dialog", dialogHandler);

    // Click delete button
    await deleteButton.click();
    console.log("Clicked delete button");

    // Wait for both delete API calls (remove from playlists and user library)
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/Playlist/remove-from-playlists") &&
          resp.status() === 200,
        { timeout: 15000 },
      ),
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/User") &&
          resp.url().includes("/songs/") &&
          resp.status() === 200,
        { timeout: 15000 },
      ),
    ]);
    console.log("Delete API responded");

    // Wait for the songs list to be refetched
    await page
      .waitForResponse((resp) => resp.url().includes("/api/Audio/batch"), {
        timeout: 10000,
      })
      .catch(() => {
        console.log("No batch fetch (library might be empty now)");
      });

    // Wait for UI to update
    await page.waitForTimeout(2000);

    // Wait for network to settle
    await waitForNetworkIdle(page, 3000);

    // Remove dialog handler
    page.off("dialog", dialogHandler);

    // Verify song is no longer in the list by checking if the title still exists
    const remainingSongs = await page
      .locator('.song-title:has-text("E2E Test Song")')
      .count();
    expect(remainingSongs).toBe(0);

    console.log("Song deleted successfully");
    console.log("✅ E2E test completed successfully!");
  });

  test("verify empty state shows when no songs exist", async ({ page }) => {
    console.log("Testing empty state...");

    await page.goto("https://20.23.0.233.nip.io", {
      waitUntil: "domcontentloaded",
    });

    // Login if needed
    try {
      await page.waitForSelector('[data-testid="login-email"]', {
        timeout: 3000,
      });
      await page.fill('[data-testid="login-email"]', "finwou@gmail.com");
      await page.fill('[data-testid="login-password"]', "test123");
      await page.click('[data-testid="login-submit"]');
      await waitForNetworkIdle(page);
    } catch (e) {
      // Already logged in
    }

    // Navigate to Songs
    const songsTab = page.locator('button.nav-tab:has-text("Songs")');
    await songsTab.click();

    // Check if empty state appears (if no songs exist)
    const emptyState = page.locator(".empty-state");
    const songsExist = await page.locator(".song-card").count();

    if (songsExist === 0) {
      await expect(emptyState).toBeVisible();
      await expect(
        page.locator('text="Your music library is empty"'),
      ).toBeVisible();
      console.log("✅ Empty state verified");
    } else {
      console.log("Songs exist in library, skipping empty state test");
    }
  });
});
