/**
 * Helpers that set up API route interception for Playwright tests.
 * Call setupMockRoutes(page) before navigating to the app.
 * This intercepts REST API calls so tests work without a live backend.
 */
const {
  mockApiTeams,
  mockApiInboxes,
  mockApiHealth,
  mockSearchResults,
  mockInitialData,
} = require('./mock-data');

/**
 * Intercept all REST API routes with mock data.
 * WebSocket is NOT mocked -- the app will show a disconnected state,
 * but since the initial REST data is provided the UI still renders.
 */
async function setupMockRoutes(page) {
  // Teams endpoint
  await page.route('**/api/teams', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiTeams),
    });
  });

  // Health endpoint
  await page.route('**/api/health', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiHealth),
    });
  });

  // Inboxes endpoint
  await page.route('**/api/inboxes', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiInboxes),
    });
  });

  // Search endpoint
  await page.route('**/api/search*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSearchResults),
    });
  });

  // Stats endpoint
  await page.route('**/api/stats', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stats: mockApiTeams.stats, timestamp: new Date().toISOString() }),
    });
  });

  // Archive endpoint
  await page.route('**/api/archive', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ archives: [], count: 0 }),
    });
  });

  // Team history endpoint
  await page.route('**/api/team-history', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ history: [] }),
    });
  });

  // Agent outputs endpoint
  await page.route('**/api/agent-outputs', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ outputs: [] }),
    });
  });

  // Metrics endpoint
  await page.route('**/api/metrics', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalTeams: 1,
        totalAgents: 3,
        totalTasks: 3,
        totalMessages: 3,
        activeAgents: 2,
        teamsWithActivity: 1,
      }),
    });
  });

  // Agents endpoint
  await page.route('**/api/agents', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        agents: [
          { name: 'team-lead', teams: ['dashboard-world-class'], messageCount: 2, lastSeen: new Date().toISOString(), status: 'active' },
          { name: 'frontend-agent', teams: ['dashboard-world-class'], messageCount: 1, lastSeen: new Date().toISOString(), status: 'active' },
          { name: 'backend-agent', teams: ['dashboard-world-class'], messageCount: 0, lastSeen: null, status: 'idle' },
        ],
      }),
    });
  });
}

module.exports = { setupMockRoutes, mockInitialData };
