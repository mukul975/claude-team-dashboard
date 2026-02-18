const { test, expect } = require('@playwright/test');

test.describe('Global Search (Command Palette)', () => {
  test('Ctrl+K opens command palette', async ({ page }) => {
    await page.goto('/');

    // Open command palette with Ctrl+K
    await page.keyboard.press('Control+k');

    // Command palette should be visible as a dialog
    const dialog = page.locator('[role="dialog"][aria-label="Command palette"]');
    await expect(dialog).toBeVisible();

    // Should have a search input
    const searchInput = dialog.locator('input[aria-label="Search commands"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test('command palette shows navigation commands', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Should show navigation commands
    await expect(dialog.getByText('Navigate to Overview')).toBeVisible();
    await expect(dialog.getByText('Navigate to Teams & Tasks')).toBeVisible();
    await expect(dialog.getByText('Navigate to Communication')).toBeVisible();
    await expect(dialog.getByText('Navigate to Inboxes')).toBeVisible();
  });

  test('command palette filters commands on typing', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[aria-label="Search commands"]');

    // Type a filter query
    await searchInput.fill('inbox');

    // Should show only the inboxes command
    await expect(dialog.getByText('Navigate to Inboxes')).toBeVisible();
    // Other commands should be filtered out
    await expect(dialog.getByText('Navigate to Overview')).toHaveCount(0);
  });

  test('command palette navigates on Enter', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[aria-label="Search commands"]');

    // Type to filter to teams
    await searchInput.fill('teams');
    // Press Enter to select
    await page.keyboard.press('Enter');

    // Command palette should close
    await expect(dialog).toHaveCount(0);

    // Should have navigated to teams tab
    await expect(page.locator('#tab-teams')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-panel-teams')).toBeVisible();
  });

  test('command palette navigates on click', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click on "Navigate to Communication"
    await dialog.getByText('Navigate to Communication').click();

    // Should close and navigate
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#tab-communication')).toHaveAttribute('aria-selected', 'true');
  });

  test('command palette closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('command palette closes on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click on the backdrop (the outer container that covers the whole page)
    await dialog.click({ position: { x: 10, y: 10 } });
    await expect(dialog).toHaveCount(0);
  });

  test('command palette arrow keys navigate selection', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    const listbox = dialog.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();

    // First item should be selected by default
    const firstOption = listbox.locator('[role="option"]').first();
    await expect(firstOption).toHaveAttribute('aria-selected', 'true');

    // Press ArrowDown to select next
    await page.keyboard.press('ArrowDown');
    const secondOption = listbox.locator('[role="option"]').nth(1);
    await expect(secondOption).toHaveAttribute('aria-selected', 'true');
    // First should no longer be selected
    await expect(firstOption).toHaveAttribute('aria-selected', 'false');
  });

  test('command palette shows keyboard shortcut hints', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');

    // Should show shortcut keys for each command
    await expect(dialog.getByText('Ctrl+1')).toBeVisible();
    await expect(dialog.getByText('Ctrl+2')).toBeVisible();

    // Should show footer hints
    await expect(dialog.getByText('navigate')).toBeVisible();
    await expect(dialog.getByText('select')).toBeVisible();
    await expect(dialog.getByText('close')).toBeVisible();
  });

  test('command palette shows "No matching commands" for invalid query', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[aria-label="Search commands"]');

    await searchInput.fill('xyznonexistent');
    await expect(dialog.getByText('No matching commands')).toBeVisible();
  });
});
