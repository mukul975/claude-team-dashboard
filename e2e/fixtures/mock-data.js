/**
 * Mock data fixtures for E2E tests.
 * These represent the shape of data the server sends via WebSocket and REST API.
 */

const mockTeams = [
  {
    name: 'dashboard-world-class',
    config: {
      description: 'Building a world-class dashboard',
      createdAt: Date.now() - 3600000,
      members: [
        { name: 'team-lead', agentType: 'leader' },
        { name: 'frontend-agent', agentType: 'worker' },
        { name: 'backend-agent', agentType: 'worker' },
      ],
    },
    tasks: [
      { id: '1', subject: 'Implement search feature', status: 'completed', createdAt: Date.now() - 3600000 },
      { id: '2', subject: 'Add dark mode', status: 'in_progress', createdAt: Date.now() - 1800000 },
      { id: '3', subject: 'Write E2E tests', status: 'pending', createdAt: Date.now() - 900000, blockedBy: ['2'] },
    ],
    lastUpdated: new Date().toISOString(),
  },
];

const mockStats = {
  totalTeams: 1,
  totalAgents: 3,
  totalTasks: 3,
  pendingTasks: 1,
  inProgressTasks: 1,
  completedTasks: 1,
  blockedTasks: 1,
};

const mockAllInboxes = {
  'dashboard-world-class': {
    'team-lead': {
      messages: [
        {
          from: 'frontend-agent',
          text: 'Search component is ready for review',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          read: true,
          color: 'blue',
          summary: 'Search component ready',
        },
        {
          from: 'backend-agent',
          text: 'API endpoint /api/search deployed successfully',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: false,
          color: 'green',
          summary: 'Search API deployed',
        },
      ],
      messageCount: 2,
    },
    'frontend-agent': {
      messages: [
        {
          from: 'team-lead',
          text: 'Please start working on the dark mode feature',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          read: true,
          color: 'orange',
          summary: 'Start dark mode work',
        },
      ],
      messageCount: 1,
    },
    'backend-agent': {
      messages: [],
      messageCount: 0,
    },
  },
};

const mockTeamHistory = [
  {
    name: 'dashboard-world-class',
    config: mockTeams[0].config,
    tasks: mockTeams[0].tasks,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastModified: new Date().toISOString(),
    isActive: true,
  },
];

const mockAgentOutputs = [];

const mockInitialData = {
  type: 'initial_data',
  data: mockTeams,
  stats: mockStats,
  teamHistory: mockTeamHistory,
  agentOutputs: mockAgentOutputs,
  allInboxes: mockAllInboxes,
};

const mockApiTeams = {
  teams: mockTeams,
  stats: mockStats,
};

const mockApiInboxes = {
  inboxes: mockAllInboxes,
};

const mockApiHealth = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  watchers: {
    teams: '/home/user/.claude/teams',
    tasks: '/home/user/.claude/tasks',
  },
};

const mockSearchResults = {
  teams: [{ name: 'dashboard-world-class', description: 'Building a world-class dashboard', memberCount: 3 }],
  agents: [{ name: 'frontend-agent', team: 'dashboard-world-class', agentType: 'worker' }],
  tasks: [{ id: '1', subject: 'Implement search feature', status: 'completed', team: 'dashboard-world-class' }],
  messages: [{ team: 'dashboard-world-class', agent: 'team-lead', preview: 'Search component is ready for review', timestamp: new Date().toISOString() }],
};

module.exports = {
  mockTeams,
  mockStats,
  mockAllInboxes,
  mockTeamHistory,
  mockAgentOutputs,
  mockInitialData,
  mockApiTeams,
  mockApiInboxes,
  mockApiHealth,
  mockSearchResults,
};
