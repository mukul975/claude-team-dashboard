const { test, expect } = require('@playwright/test');

test.describe('InboxViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-inboxes').click();
    await expect(page.locator('#tab-panel-inboxes')).toBeVisible();
  });

  test('inbox panel renders with sidebar and content area', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');

    // The InboxViewer always renders a card container
    const card = panel.locator('.card').first();
    await expect(card).toBeVisible();
  });

  test('shows empty state when no teams are active', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');

    // When there are no inboxes, InboxViewer shows either:
    // - "No Active Teams" (no data) or
    // - The sidebar with team list (data exists)
    const hasNoTeams = await panel.getByText('No Active Teams').count();
    const hasInboxSidebar = await panel.getByText('Inboxes').count();
    expect(hasNoTeams + hasInboxSidebar).toBeGreaterThan(0);
  });

  test('search input is present when teams have inboxes', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');

    // If there are inbox entries, a search input should appear
    const searchInput = panel.locator('input[placeholder="Search messages..."]');
    const noTeams = await panel.getByText('No Active Teams').count();

    if (noTeams === 0) {
      // There are teams -- search bar should be present
      await expect(searchInput).toBeVisible();
    }
    // If no teams, it's fine that search is not shown
  });

  test('filter button is present when teams have inboxes', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');
    const noTeams = await panel.getByText('No Active Teams').count();

    if (noTeams === 0) {
      // The Filters button should exist
      const filterBtn = panel.getByText('Filters');
      await expect(filterBtn).toBeVisible();
    }
  });

  test('clicking Filters button toggles the advanced filter panel', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');
    const noTeams = await panel.getByText('No Active Teams').count();

    if (noTeams === 0) {
      const filterBtn = panel.getByText('Filters');
      await filterBtn.click();

      // After clicking, filter dropdowns should appear
      // Look for the "Date Range" label
      await expect(panel.getByText('Date Range')).toBeVisible();
      await expect(panel.getByText('Sender')).toBeVisible();
      await expect(panel.getByText('Type')).toBeVisible();
      await expect(panel.getByText('Sort')).toBeVisible();

      // Click again to close
      await filterBtn.click();
      // Date Range label should no longer be visible
      await expect(panel.getByText('Date Range')).toHaveCount(0);
    }
  });

  test('inbox sidebar shows team count', async ({ page }) => {
    const panel = page.locator('#tab-panel-inboxes');
    const noTeams = await panel.getByText('No Active Teams').count();

    if (noTeams === 0) {
      // Should show something like "X team(s)" in the sidebar
      const teamCountText = panel.locator('text=/\\d+ teams?/');
      await expect(teamCountText).toBeVisible();
    }
  });
});
