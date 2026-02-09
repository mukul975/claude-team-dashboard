// WebSocket Configuration
export const WS_CONFIG = {
  RECONNECT_DELAY: 3000,
  PING_INTERVAL: 30000,
  MAX_RECONNECT_ATTEMPTS: 5
};

// Server Configuration
export const SERVER_CONFIG = {
  WS_PORT: 3001,
  API_PORT: 3001,
  ALLOWED_ORIGINS: ['http://localhost:5173', 'http://127.0.0.1:5173']
};

// UI Configuration
export const UI_CONFIG = {
  MAX_ACTIVITY_ITEMS: 50,
  ACTIVITY_UPDATE_INTERVAL: 5000,
  PULSE_ANIMATION_DURATION: 300,
  DEFAULT_TEAM_EXPANDED: true
};

// Task Status
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELETED: 'deleted'
};

// Theme Colors
export const THEME_COLORS = {
  CLAUDE_ORANGE: '#f28234',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6'
};

// Message Types
export const MESSAGE_TYPES = {
  INITIAL_DATA: 'initial_data',
  TEAMS_UPDATE: 'teams_update',
  TASK_UPDATE: 'task_update'
};

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// File Watching
export const WATCH_CONFIG = {
  POLLING_INTERVAL: 1000,
  STABILITY_THRESHOLD: 500,
  POLL_INTERVAL: 100,
  DEPTH: 10
};
