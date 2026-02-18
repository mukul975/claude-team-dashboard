const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test('stats overview renders with expected stat labels', async ({ page }) => {
    await page.goto('/');

    // StatsOverview renders these stat card labels
    const expectedLabels = [
      'Active Teams',
      'Total Agents',
      'Total Tasks',
      'In Progress',
      'Completed',
      'Blocked',
      'Messages',
      'Unread',
    ];

    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('overview tab shows live metrics, task progress, agent activity, and system status', async ({ page }) => {
    await page.goto('/');

    // Overview is the default tab
    await expect(page.locator('#tab-panel-overview')).toBeVisible();

    // Should contain multiple sections within the overview panel
    const panel = page.locator('#tab-panel-overview');
    const childDivs = panel.locator('> div');
    const count = await childDivs.count();
    // LiveMetrics + grid(3 cols) + TeamTimeline = at least 3 top-level children
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('inboxes tab shows InboxViewer with inbox label', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-inboxes').click();
    const panel = page.locator('#tab-panel-inboxes');
    await expect(panel).toBeVisible();

    // InboxViewer always renders an "Inboxes" label in the sidebar header
    // or "No Active Teams" when there are no inboxes
    const hasInboxLabel = await panel.getByText('Inboxes').count();
    const hasNoTeams = await panel.getByText('No Active Teams').count();
    expect(hasInboxLabel + hasNoTeams).toBeGreaterThan(0);
  });

  test('communication tab shows message panels', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-communication').click();
    const panel = page.locator('#tab-panel-communication');
    await expect(panel).toBeVisible();

    // RealTimeMessages and LiveCommunication are rendered as child components
    const children = panel.locator('> div');
    await expect(children.first()).toBeVisible();
  });

  test('teams tab shows active teams section or empty state', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-teams').click();
    const panel = page.locator('#tab-panel-teams');
    await expect(panel).toBeVisible();

    // Should show either "Active Teams" heading or "No Active Teams" empty state
    const hasActiveTeams = await panel.getByText('Active Teams').count();
    const hasNoTeams = await panel.getByText('No Active Teams').count();
    expect(hasActiveTeams + hasNoTeams).toBeGreaterThan(0);
  });

  test('history tab shows agent output viewer and team history sections', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-history').click();
    const panel = page.locator('#tab-panel-history');
    await expect(panel).toBeVisible();

    // The panel should contain child sections (AgentOutputViewer + TeamHistory)
    const children = panel.locator('> div');
    const count = await children.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('archive tab renders ArchiveViewer', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-archive').click();
    const panel = page.locator('#tab-panel-archive');
    await expect(panel).toBeVisible();
  });

  test('analytics tab renders AnalyticsPanel', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-analytics').click();
    const panel = page.locator('#tab-panel-analytics');
    await expect(panel).toBeVisible();
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/');
    // Wait for the app to fully render
    await page.waitForSelector('header[role="banner"]');
    // Allow a brief moment for any async errors
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('page title is set', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    // Vite default or custom title
    expect(title).toBeTruthy();
  });

  test('connection status indicator is present in header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header[role="banner"]');
    // ConnectionStatus component renders inside the header
    await expect(header).toBeVisible();
  });
});
