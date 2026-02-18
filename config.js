// Server Configuration
module.exports = {
  // Server Port
  PORT: process.env.PORT || 3001,

  // Allowed CORS Origins
  CORS_ORIGINS: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],

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
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        connectSrc: ["'self'", "ws://localhost:3001", "wss://localhost:3001", "ws://127.0.0.1:3001"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }
};
