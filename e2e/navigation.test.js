const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('page loads and shows the header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    await expect(page.locator('h1')).toContainText('Claude Agent Dashboard');
  });

  test('tab navigation - click each tab and verify panel shows', async ({ page }) => {
    await page.goto('/');

    const tabs = [
      { id: 'tab-overview', panelId: 'tab-panel-overview' },
      { id: 'tab-teams', panelId: 'tab-panel-teams' },
      { id: 'tab-communication', panelId: 'tab-panel-communication' },
      { id: 'tab-monitoring', panelId: 'tab-panel-monitoring' },
      { id: 'tab-history', panelId: 'tab-panel-history' },
      { id: 'tab-archive', panelId: 'tab-panel-archive' },
      { id: 'tab-inboxes', panelId: 'tab-panel-inboxes' },
      { id: 'tab-analytics', panelId: 'tab-panel-analytics' },
    ];

    for (const tab of tabs) {
      await page.locator(`#${tab.id}`).click();
      const panel = page.locator(`#${tab.panelId}`);
      await expect(panel).toBeVisible();
      // Verify aria-selected is true on the active tab
      await expect(page.locator(`#${tab.id}`)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('only one tab panel visible at a time', async ({ page }) => {
    await page.goto('/');

    // Click teams tab
    await page.locator('#tab-teams').click();
    await expect(page.locator('#tab-panel-teams')).toBeVisible();
    // Overview panel should not be in the DOM (React conditional rendering)
    await expect(page.locator('#tab-panel-overview')).toHaveCount(0);
  });

  test('tab buttons have correct ARIA roles', async ({ page }) => {
    await page.goto('/');

    const tabButtons = page.locator('[role="tab"]');
    const count = await tabButtons.count();
    expect(count).toBe(8);

    // The tablist wrapper should exist
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Each tab should have aria-controls pointing to a panel id
    for (let i = 0; i < count; i++) {
      const ariaControls = await tabButtons.nth(i).getAttribute('aria-controls');
      expect(ariaControls).toBeTruthy();
      expect(ariaControls).toMatch(/^tab-panel-/);
    }
  });

  test('keyboard navigation - Ctrl+1 switches to overview tab', async ({ page }) => {
    await page.goto('/');

    // First switch to a different tab
    await page.locator('#tab-teams').click();
    await expect(page.locator('#tab-panel-teams')).toBeVisible();

    // Use Ctrl+1 to switch back to overview
    await page.keyboard.press('Control+1');
    await expect(page.locator('#tab-panel-overview')).toBeVisible();
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard navigation - Ctrl+3 switches to communication tab', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+3');
    await expect(page.locator('#tab-panel-communication')).toBeVisible();
    await expect(page.locator('#tab-communication')).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard navigation - Ctrl+7 switches to inboxes tab', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+7');
    await expect(page.locator('#tab-panel-inboxes')).toBeVisible();
    await expect(page.locator('#tab-inboxes')).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard navigation - cycle through multiple tabs with shortcuts', async ({ page }) => {
    await page.goto('/');

    // Ctrl+4 -> Monitoring
    await page.keyboard.press('Control+4');
    await expect(page.locator('#tab-panel-monitoring')).toBeVisible();

    // Ctrl+6 -> Archive
    await page.keyboard.press('Control+6');
    await expect(page.locator('#tab-panel-archive')).toBeVisible();

    // Ctrl+8 -> Analytics
    await page.keyboard.press('Control+8');
    await expect(page.locator('#tab-panel-analytics')).toBeVisible();

    // Ctrl+1 -> back to Overview
    await page.keyboard.press('Control+1');
    await expect(page.locator('#tab-panel-overview')).toBeVisible();
  });

  test('arrow key navigation on tab buttons', async ({ page }) => {
    await page.goto('/');

    // Focus the overview tab
    await page.locator('#tab-overview').focus();

    // Press ArrowRight to move to teams tab
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-teams')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-panel-teams')).toBeVisible();

    // Press ArrowRight again to move to communication
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-communication')).toHaveAttribute('aria-selected', 'true');

    // Press ArrowLeft to go back to teams
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tab-teams')).toHaveAttribute('aria-selected', 'true');
  });

  test('Home and End key navigation on tabs', async ({ page }) => {
    await page.goto('/');

    // Focus a middle tab
    await page.locator('#tab-communication').click();
    await page.locator('#tab-communication').focus();

    // Press Home to go to first tab
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');

    // Press End to go to last tab
    await page.keyboard.press('End');
    await expect(page.locator('#tab-analytics')).toHaveAttribute('aria-selected', 'true');
  });

  test('skip to main content link exists', async ({ page }) => {
    await page.goto('/');

    // The skip link should exist but be visually hidden
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toContainText('Skip to main content');

    // The main content landmark should exist
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#main-content')).toHaveAttribute('role', 'main');
  });

  test('footer is rendered with expected links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Claude Code Agent Dashboard');
    await expect(footer.locator('a[href="https://github.com/anthropics/claude-code"]')).toBeVisible();
  });
});
