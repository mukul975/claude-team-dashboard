/**
 * Telemetry configuration persistence.
 *
 * Stores OpenTelemetry export settings in ~/.claude/dashboard-telemetry.json
 * (chmod 600, same protection model as dashboard.key).
 *
 * The OTEL_EXPORTER_OTLP_ENDPOINT environment variable always overrides the
 * stored endpoint so that deployments via Docker/systemd don't need to touch
 * the settings file.
 */

const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const TELEMETRY_FILE = process.env.CLAUDE_TELEMETRY_CONFIG
  || path.join(os.homedir(), '.claude', 'dashboard-telemetry.json');

const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  endpoint: 'http://localhost:4318/v1/traces',
  authToken: ''
});

/**
 * Reads the telemetry config file.
 * @param {string} [filePath] - Override config file path (for tests)
 * @returns {Promise<{enabled: boolean, endpoint: string, authToken: string}>}
 */
async function loadTelemetryConfig(filePath = TELEMETRY_FILE) {
  const stored = { ...DEFAULT_CONFIG };
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed.enabled === 'boolean') stored.enabled = parsed.enabled;
    if (typeof parsed.endpoint === 'string' && parsed.endpoint) stored.endpoint = parsed.endpoint;
    if (typeof parsed.authToken === 'string') stored.authToken = parsed.authToken;
  } catch {
    // Missing or malformed file → defaults (opt-in: disabled)
  }

  // Environment variable takes precedence over the stored endpoint
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    stored.endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }
  return stored;
}

/**
 * Merges a partial config into the stored config and persists it.
 * @param {Object} partial - Fields to update: enabled, endpoint, authToken
 * @param {string} [filePath] - Override config file path (for tests)
 * @returns {Promise<{enabled: boolean, endpoint: string, authToken: string}>}
 */
async function saveTelemetryConfig(partial, filePath = TELEMETRY_FILE) {
  const current = await loadTelemetryConfig(filePath);
  const next = {
    enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
    endpoint: typeof partial.endpoint === 'string' && partial.endpoint ? partial.endpoint : current.endpoint,
    authToken: typeof partial.authToken === 'string' ? partial.authToken : current.authToken
  };

  // Don't clobber a stored token with an empty string unless explicitly clearing
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

module.exports = {
  TELEMETRY_FILE,
  DEFAULT_CONFIG,
  loadTelemetryConfig,
  saveTelemetryConfig
};
