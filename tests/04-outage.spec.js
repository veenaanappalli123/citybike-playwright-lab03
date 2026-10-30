
const { test, expect } = require('@playwright/test');

// MISSION 4 — Mock the first /api/stations GET as 503, confirm the error banner,
// then let Retry loading reach the real server and recover to 4 stations.

test('station API outage shows an error and retry restores results', async ({ page }) => {
  let stationRequests = 0;

  await page.route('**/api/stations', async (route) => {
    if (route.request().method() === 'GET') {
      stationRequests++;

      if (stationRequests === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service temporarily unavailable' }),
        });
        return;
      }
    }

    // On retry, allow the real server to respond.
    await route.continue();
  });

  await page.goto('/');

  // The first request should fail and show the error message.
  await expect(page.getByText('Unable to load stations.')).toBeVisible();

  // Retry should make a second GET request and recover.
  await page.getByRole('button', { name: /retry loading/i }).click();

  await expect(page.locator('[data-testid="station-card"]')).toHaveCount(4);
  await expect(page.getByText('Unable to load stations.')).toBeHidden();

  expect(stationRequests).toBeGreaterThanOrEqual(2);
});

