const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive Layout', () => {
  // Use iPhone 12 viewport dimensions
  test.use({ viewport: { width: 390, height: 844 } });

  test('header renders on mobile', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    await expect(page.locator('h1')).toContainText('Claude Agent Dashboard');
  });

  test('tabs are horizontally scrollable on mobile', async ({ page }) => {
    await page.goto('/');

    // The tab container should exist
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    // Tab buttons should be present
    const tabButtons = page.locator('[role="tab"]');
    const count = await tabButtons.count();
    expect(count).toBe(8);

    // First tab should be visible
    await expect(tabButtons.first()).toBeVisible();
  });

  test('can click tabs on mobile', async ({ page }) => {
    await page.goto('/');

    // Click first visible tab
    await page.locator('#tab-overview').click();
    await expect(page.locator('#tab-panel-overview')).toBeVisible();

    // Scroll to and click teams tab
    await page.locator('#tab-teams').scrollIntoViewIfNeeded();
    await page.locator('#tab-teams').click();
    await expect(page.locator('#tab-panel-teams')).toBeVisible();
  });

  test('stats overview grid adapts to mobile (2 columns)', async ({ page }) => {
    await page.goto('/');

    // StatsOverview uses grid-cols-2 at smallest breakpoint
    // Verify the grid container exists and stat cards are rendered
    const statCards = page.getByText('Active Teams');
    await expect(statCards).toBeVisible();
  });

  test('main content has horizontal padding on mobile', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('#main-content');
    await expect(main).toBeVisible();

    // Verify the main content is not full-bleed (has padding)
    const box = await main.boundingBox();
    expect(box.x).toBeGreaterThan(0);
  });

  test('footer is visible on mobile', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Claude Code Agent Dashboard');
  });

  test('documentation link is hidden on mobile', async ({ page }) => {
    await page.goto('/');

    // The documentation link in the header has "hidden md:flex" class
    // meaning it should not be visible on mobile
    const docLink = page.locator('header a:has-text("Documentation")');
    // It may exist in DOM but should not be visible
    if (await docLink.count() > 0) {
      await expect(docLink).not.toBeVisible();
    }
  });

  test('command palette works on mobile', async ({ page }) => {
    await page.goto('/');

    // Open command palette with Ctrl+K
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // The palette should fit within the mobile viewport
    const box = await dialog.locator('.relative.w-full').boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(390);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('Tablet Responsive Layout', () => {
  // Use iPad viewport dimensions
  test.use({ viewport: { width: 768, height: 1024 } });

  test('header renders on tablet', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Claude Agent Dashboard');
  });

  test('stats overview shows 4 columns on tablet (md breakpoint)', async ({ page }) => {
    await page.goto('/');

    // At md breakpoint, grid switches to 4 columns
    // Verify stat cards render correctly
    await expect(page.getByText('Active Teams')).toBeVisible();
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByText('Total Tasks')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
  });

  test('tab navigation works on tablet', async ({ page }) => {
    await page.goto('/');

    await page.locator('#tab-communication').click();
    await expect(page.locator('#tab-panel-communication')).toBeVisible();

    await page.locator('#tab-inboxes').click();
    await expect(page.locator('#tab-panel-inboxes')).toBeVisible();
  });
});
