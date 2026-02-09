// Server Configuration
module.exports = {
  // Server Port
  PORT: process.env.PORT || 3001,

  // Allowed CORS Origins
  CORS_ORIGINS: ['http://localhost:5173', 'http://127.0.0.1:5173'],

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Too many requests from this IP, please try again later.'
  },

  // File Watching
  WATCH_CONFIG: {
    PERSISTENT: true,
    IGNORE_INITIAL: true,
    USE_POLLING: true,
    INTERVAL: 1000,
    BINARY_INTERVAL: 1000,
    DEPTH: 10,
    AWAIT_WRITE_FINISH: {
      STABILITY_THRESHOLD: 500,
      POLL_INTERVAL: 100
    }
  },

  // Security
  HELMET_CONFIG: {
    CONTENT_SECURITY_POLICY: false,
    CROSS_ORIGIN_EMBEDDER_POLICY: false
  }
};
