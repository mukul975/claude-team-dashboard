const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const crypto = require('crypto');
const { exec } = require('child_process');
const config = require('./config');

const IS_WINDOWS = process.platform === 'win32';

// Restrict a file to the current user only (cross-platform)
async function lockFilePermissions(filePath) {
  if (IS_WINDOWS) {
    // Remove all inherited permissions, grant full control to current user only
    const escaped = filePath.replace(/\//g, '\\');
    await new Promise((resolve) => {
      exec(`icacls "${escaped}" /inheritance:r /grant:r "%USERNAME%":F`, resolve);
    });
  } else {
    await fs.chmod(filePath, 0o600);
  }
}

const app = express();
const server = http.createServer(app);

// --- Password Authentication (always required) ---
// Password stored as scrypt hash in ~/.claude/dashboard.key
// Format: <hex-salt>:<hex-hash>
//
// Auth token lifecycle: the token is stored in the browser's sessionStorage.
// This means it is NOT protected by HttpOnly (sessionStorage is accessible to JS),
// but it is automatically cleared when the browser tab/window is closed. For a
// localhost-only developer tool this is an acceptable tradeoff: XSS risk is minimal
// on localhost and the short-lived session scope limits exposure.
const KEY_FILE = path.join(os.homedir(), '.claude', 'dashboard.key');
let authToken = crypto.randomBytes(32).toString('hex');

// OWASP-recommended scrypt parameters (minimum): N=16384, r=8, p=1
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, SCRYPT_PARAMS, (err, derived) => {
      if (err) reject(err); else resolve(derived);
    });
  });
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, SCRYPT_PARAMS, (err, d) => {
      if (err) reject(err); else resolve(d);
    });
  });
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

async function loadStoredHash() {
  try {
    const data = await fs.readFile(KEY_FILE, 'utf8');
    return data.trim() || null;
  } catch {
    return null;
  }
}

// storedHash is null when no password has been set yet (first run)
let storedHash = null;
(async () => {
  storedHash = await loadStoredHash();

  // Security check: warn if the key file is world-readable, and auto-fix if possible
  try {
    const keyStats = await fs.stat(KEY_FILE);
    if (keyStats.mode & 0o004) {
      console.warn('WARNING: dashboard.key has loose permissions — fixing automatically...');
      try {
        await lockFilePermissions(KEY_FILE);
        console.log('✓ dashboard.key permissions fixed.');
      } catch {
        const fix = IS_WINDOWS
          ? `icacls "${KEY_FILE}" /inheritance:r /grant:r "%USERNAME%":F`
          : `chmod 600 ${KEY_FILE}`;
        console.warn(`  Could not fix automatically. Run manually: ${fix}`);
      }
    }
  } catch {
    // Key file does not exist yet (first run) — nothing to check
  }
})();

console.log('🔒 Password authentication is ENABLED');

const wss = new WebSocket.Server({
  server,
  verifyClient: (info) => {
    // Validate WebSocket origin
    const origin = info.origin || info.req.headers.origin;
    return !origin || config.CORS_ORIGINS.includes(origin);
  }
});

// Security middleware
app.use(helmet(config.HELMET_CONFIG));

// Permissions-Policy header — restrict access to sensitive browser APIs
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: config.RATE_LIMIT.MESSAGE,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Stricter rate limiter for auth endpoints: max 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Restrict CORS to localhost only for security
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));

// Gzip compression for all responses
app.use(compression({ level: 6, threshold: 1024 }));

// Request duration logging for API routes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now()-start}ms`);
    }
  });
  next();
});

// Explicit Content-Type for all API responses
app.use('/api/', (req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json({ limit: '10kb' }));

// Content-Type validation — POST requests to /api/ must be application/json
app.use('/api/', (req, res, next) => {
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({ error: 'Unsupported Media Type: Content-Type must be application/json' });
    }
  }
  next();
});

// --- Auth endpoints ---
// Returns { required: true, setup: true } when no password has been set yet
app.get('/api/auth/required', (req, res) => {
  res.json({ required: true, setup: !storedHash });
});

// First-time setup — only works when no password is stored yet
app.post('/api/auth/setup', authLimiter, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (storedHash) {
    return res.status(403).json({ error: 'Password already set' });
  }
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    storedHash = await hashPassword(password);
    const claudeDir = path.join(os.homedir(), '.claude');
    validatePath(KEY_FILE, claudeDir);
    await fs.mkdir(path.dirname(KEY_FILE), { recursive: true });
    await fs.writeFile(KEY_FILE, storedHash, { mode: 0o600 });
    await lockFilePermissions(KEY_FILE);
    authToken = crypto.randomBytes(32).toString('hex');
    res.json({ token: authToken });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (!storedHash) {
    return res.status(403).json({ error: 'No password set — complete setup first' });
  }
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }
  try {
    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    // Rotate token on every successful login so each session gets a fresh token
    authToken = crypto.randomBytes(32).toString('hex');
    res.json({ token: authToken });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Auth middleware for protected /api/* routes (skip /api/auth/*) ---
app.use('/api/', (req, res, next) => {
  // Skip auth routes
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  // Constant-time comparison
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(authToken);

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
});

// Serve pre-built frontend from dist/ (used when installed as global npm package)
app.use(express.static(path.join(__dirname, 'dist')));

// Paths to Claude Code agent team files
const homeDir = os.homedir();
const TEAMS_DIR = path.join(homeDir, '.claude', 'teams');
const TASKS_DIR = path.join(homeDir, '.claude', 'tasks');
const PROJECTS_DIR = path.join(homeDir, '.claude', 'projects');
const TEMP_TASKS_DIR = path.join(os.tmpdir(), 'claude', 'D--agentdashboard', 'tasks');
const ARCHIVE_DIR = path.join(homeDir, '.claude', 'archive');

// Store connected clients
const clients = new Set();

// Team lifecycle tracking
const teamLifecycle = new Map(); // teamName -> { created, lastSeen, archived }

// Archive team data before deletion
async function archiveTeam(teamName, teamData) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveFile = path.join(ARCHIVE_DIR, `${sanitizedName}_${timestamp}.json`);

    // Validate the archive file path is within ARCHIVE_DIR
    const validatedArchivePath = validatePath(archiveFile, ARCHIVE_DIR);

    // Ensure archive directory exists
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // Create natural language summary
    const summary = {
      teamName: sanitizedName,
      archivedAt: new Date().toISOString(),
      summary: generateTeamSummary(teamData),
      rawData: teamData
    };

    await fs.writeFile(validatedArchivePath, JSON.stringify(summary, null, 2));
    console.log(`📦 Team archived: ${sanitizedName} → ${validatedArchivePath}`);

    return archiveFile;
  } catch (error) {
    console.error(`Error archiving team ${sanitizeForLog(teamName)}:`, error.message);
  }
}

// Generate natural language summary of team activity
function generateTeamSummary(teamData) {
  const members = teamData.config?.members || [];
  const tasks = teamData.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  const createdDate = teamData.config?.createdAt
    ? new Date(teamData.config.createdAt).toLocaleDateString()
    : 'Unknown';

  return {
    overview: `Team "${teamData.name}" with ${members.length} members worked on ${totalTasks} tasks and completed ${completedTasks}.`,
    created: `Started on ${createdDate}`,
    members: members.map(m => `${m.name} (${m.agentType})`),
    accomplishments: tasks
      .filter(t => t.status === 'completed')
      .map(t => `✅ ${t.subject}`)
      .slice(0, 10), // Top 10
    duration: teamData.config?.createdAt
      ? `Active for ${Math.round((Date.now() - teamData.config.createdAt) / 1000 / 60)} minutes`
      : 'Unknown duration'
  };
}

// Broadcast to all connected clients (with dead client cleanup)
function broadcast(data) {
  const message = JSON.stringify(data);
  const deadClients = new Set();

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending to client:', error.message);
        deadClients.add(client);
      }
    } else {
      deadClients.add(client);
    }
  });

  // Remove dead connections to prevent memory leak
  deadClients.forEach(client => clients.delete(client));
}

// Sanitize team name to prevent path traversal attacks
function sanitizeTeamName(teamName) {
  if (!teamName || typeof teamName !== 'string') {
    throw new Error('Invalid team name');
  }
  if (teamName.length > 100) {
    throw new Error('Invalid team name: too long');
  }
  // Strict allowlist: alphanumeric, dash, underscore, dot
  if (!/^[a-zA-Z0-9_.-]+$/.test(teamName)) {
    throw new Error('Invalid team name format');
  }
  // Reject directory traversal even within allowlist
  if (teamName === '.' || teamName === '..' || teamName.includes('..')) {
    throw new Error('Invalid team name: relative paths not allowed');
  }
  return teamName;
}

// Sanitize agent name — same strict rules as team name
function sanitizeAgentName(agentName) {
  if (!agentName || typeof agentName !== 'string') {
    throw new Error('Invalid agent name');
  }
  if (agentName.length > 100) {
    throw new Error('Invalid agent name: too long');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(agentName)) {
    throw new Error('Invalid agent name format');
  }
  if (agentName === '.' || agentName === '..' || agentName.includes('..')) {
    throw new Error('Invalid agent name: relative paths not allowed');
  }
  return agentName;
}

// Sanitize string for logging to prevent log injection
function sanitizeForLog(input) {
  if (typeof input !== 'string') {
    return String(input);
  }
  // Remove control characters that could be used for log injection
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

// Sanitize filename to prevent path traversal
function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid file name');
  }
  if (fileName.length > 100) {
    throw new Error('Invalid file name: too long');
  }
  // Strip any path separator characters
  const stripped = fileName.replace(/[/\\]/g, '');
  // Use basename as additional safety layer
  const baseName = path.basename(stripped);
  // Reject directory traversal
  if (baseName === '.' || baseName === '..' || baseName.includes('..')) {
    throw new Error('Invalid file name: relative paths not allowed');
  }
  // Only allow safe characters (whitelist approach)
  if (!/^[a-zA-Z0-9_.-]+$/.test(baseName)) {
    throw new Error('Invalid file name format');
  }
  return baseName;
}

// Validate path is within allowed directory
function validatePath(filePath, allowedDir) {
  const normalizedPath = path.resolve(filePath);
  const normalizedDir = path.resolve(allowedDir);

  // Use relative path to detect traversal attempts
  const relativePath = path.relative(normalizedDir, normalizedPath);

  // Check if relative path tries to go outside (starts with .. or is absolute)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Path traversal attempt detected');
  }

  return normalizedPath;
}

// Read team configuration
async function readTeamConfig(teamName) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    // Build path from sanitized components only - no user input in final path
    const teamDir = path.join(TEAMS_DIR, sanitizedName);
    const configPath = path.join(teamDir, 'config.json');

    // Double-check the constructed path is within allowed directory
    const validatedPath = validatePath(configPath, TEAMS_DIR);
    // lgtm[js/path-injection] - Path is constructed from sanitized teamName that only allows [a-zA-Z0-9_-]
    const data = await fs.readFile(validatedPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // ENOENT is expected for team directories without a config.json (e.g. UUID-named or legacy dirs)
    if (error.code !== 'ENOENT') {
      console.error('Error reading team config:', {
        team: sanitizeForLog(teamName),
        error: error.message
      });
    }
    return null;
  }
}

// Read all tasks for a team
async function readTasks(teamName) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    const tasksPath = path.join(TASKS_DIR, sanitizedName);
    const validatedTasksPath = validatePath(tasksPath, TASKS_DIR);
    // lgtm[js/path-injection] - Path is constructed from sanitized teamName that only allows [a-zA-Z0-9_-]
    const files = await fs.readdir(validatedTasksPath);

    // Use Promise.all for parallel file reads (performance improvement)
    const taskPromises = files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        try {
          // Sanitize file name to prevent path traversal
          const sanitizedFile = sanitizeFileName(file);
          const taskPath = path.join(validatedTasksPath, sanitizedFile);
          const validatedPath = validatePath(taskPath, TASKS_DIR);
          // lgtm[js/path-injection] - Path is constructed from sanitized fileName that only allows [a-zA-Z0-9_.-]
          const data = await fs.readFile(validatedPath, 'utf8');
          const task = JSON.parse(data);
          return { ...task, id: path.basename(sanitizedFile, '.json') };
        } catch (fileError) {
          console.error('Error reading task file:', {
            file: sanitizeForLog(file),
            error: fileError.message
          });
          return null;
        }
      });

    const tasks = (await Promise.all(taskPromises))
      .filter(task => task !== null)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return tasks;
  } catch (error) {
    // ENOENT is expected for teams without a tasks directory
    if (error.code !== 'ENOENT') {
      console.error('Error reading tasks:', {
        team: sanitizeForLog(teamName),
        error: error.message
      });
    }
    return [];
  }
}

// In-memory cache for expensive operations
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Async-aware cache: stores resolved values, not Promises.
// Rejected promises are not cached (they fall through to re-fetch).
async function getCached(key, asyncFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.value;
  const value = await asyncFn();
  cache.set(key, { value, time: Date.now() });
  return value;
}

// Cached wrapper for getActiveTeams
function getCachedActiveTeams() {
  return getCached('activeTeams', () => getActiveTeams());
}

// Get all active teams
async function getActiveTeams() {
  try {
    await fs.access(TEAMS_DIR);
    const teams = await fs.readdir(TEAMS_DIR);
    const teamData = [];

    for (const teamName of teams) {
      const config = await readTeamConfig(teamName);
      if (config) {
        const tasks = await readTasks(teamName);
        teamData.push({
          name: teamName,
          config,
          tasks,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    return teamData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Teams directory does not exist yet');
      return [];
    }
    console.error('Error reading teams:', error.message);
    return [];
  }
}

// Calculate team statistics
function calculateTeamStats(teams) {
  const stats = {
    totalTeams: teams.length,
    totalAgents: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    blockedTasks: 0
  };

  teams.forEach(team => {
    stats.totalAgents += (team.config.members || []).length;
    stats.totalTasks += team.tasks.length;

    team.tasks.forEach(task => {
      switch (task.status) {
        case 'pending':
          stats.pendingTasks++;
          if (task.blockedBy && task.blockedBy.length > 0) {
            stats.blockedTasks++;
          }
          break;
        case 'in_progress':
          stats.inProgressTasks++;
          break;
        case 'completed':
          stats.completedTasks++;
          break;
      }
    });
  });

  return stats;
}

// Get team history (all teams including past ones)
async function getTeamHistory() {
  try {
    await fs.access(TEAMS_DIR);
    const teamNames = await fs.readdir(TEAMS_DIR);
    const history = [];

    for (const teamName of teamNames) {
      try {
        const config = await readTeamConfig(teamName);
        const tasks = await readTasks(teamName);

        if (config) {
          // Get team directory stats for timestamps
          const teamDir = path.join(TEAMS_DIR, sanitizeTeamName(teamName));
          const validatedTeamDir = validatePath(teamDir, TEAMS_DIR);
          const stats = await fs.stat(validatedTeamDir);

          history.push({
            name: teamName,
            config,
            tasks,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            isActive: true
          });
        }
      } catch (error) {
        console.error(`Error reading team history for ${sanitizeForLog(teamName)}:`, error.message);
      }
    }

    // Sort by last modified (most recent first)
    return history.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading team history:', error.message);
    return [];
  }
}

// Get agent output files
async function getAgentOutputs() {
  try {
    await fs.access(TEMP_TASKS_DIR);
    const files = await fs.readdir(TEMP_TASKS_DIR);
    const outputs = [];

    for (const file of files) {
      if (file.endsWith('.output')) {
        try {
          const sanitizedFile = sanitizeFileName(file);
          const filePath = validatePath(path.join(TEMP_TASKS_DIR, sanitizedFile), TEMP_TASKS_DIR);
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);

          outputs.push({
            taskId: file.replace('.output', ''),
            content: content.split('\n').slice(-100).join('\n'), // Last 100 lines
            lastModified: stats.mtime,
            size: stats.size
          });
        } catch (error) {
          console.error(`Error reading output file ${file}:`, error.message);
        }
      }
    }

    return outputs.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading agent outputs:', error.message);
    return [];
  }
}

// Sanitize project path to prevent path traversal
function sanitizeProjectPath(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('Invalid project path');
  }

  // Reject any absolute paths
  if (path.isAbsolute(projectPath)) {
    throw new Error('Invalid project path: absolute paths not allowed');
  }

  // Reject parent directory references
  if (projectPath.includes('..') || projectPath.startsWith('.')) {
    throw new Error('Invalid project path: relative paths not allowed');
  }

  // Reject any path separators (only allow single directory name)
  if (projectPath.includes('/') || projectPath.includes('\\')) {
    throw new Error('Invalid project path: nested paths not allowed');
  }

  // Only allow alphanumeric, dash, underscore (whitelist approach)
  if (!/^[a-zA-Z0-9_-]+$/.test(projectPath)) {
    throw new Error('Invalid project path format');
  }

  return projectPath;
}

// Get session history
async function getSessionHistory(projectPath) {
  try {
    const sanitizedPath = sanitizeProjectPath(projectPath);
    // lgtm[js/path-injection] - Path is sanitized via sanitizeProjectPath with whitelist validation
    const projectDir = path.join(PROJECTS_DIR, sanitizedPath);

    // Validate the constructed path is within allowed directory
    const validatedDir = validatePath(projectDir, PROJECTS_DIR);

    // lgtm[js/path-injection] - Path is validated to be within PROJECTS_DIR
    await fs.access(validatedDir);
    // lgtm[js/path-injection] - Path is validated to be within PROJECTS_DIR
    const files = await fs.readdir(validatedDir);
    const sessions = [];

    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        try {
          // Sanitize file name to prevent path traversal
          const sanitizedFile = sanitizeFileName(file);
          // lgtm[js/path-injection] - Path uses sanitized filename with whitelist validation
          const filePath = path.join(validatedDir, sanitizedFile);

          // Validate file path is within project directory
          const validatedPath = validatePath(filePath, PROJECTS_DIR);

          // lgtm[js/path-injection] Path is validated to be within PROJECTS_DIR
          const content = await fs.readFile(validatedPath, 'utf8');
          const lines = content.trim().split('\n').filter(l => l.trim());

          if (lines.length > 0) {
            const firstLine = JSON.parse(lines[0]);
            const lastLine = JSON.parse(lines[lines.length - 1]);

            // Get stats after successful read to avoid TOCTOU race condition
            // lgtm[js/path-injection] Path is validated to be within PROJECTS_DIR
            const stats = await fs.stat(validatedPath);

            sessions.push({
              sessionId: file.replace('.jsonl', ''),
              startTime: firstLine.timestamp || stats.birthtime,
              endTime: lastLine.timestamp || stats.mtime,
              messageCount: lines.length,
              size: stats.size
            });
          }
        } catch (error) {
          console.error(`Error reading session file ${file}:`, error.message);
        }
      }
    }

    return sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading session history:', error.message);
    return [];
  }
}

// Read all inboxes for a specific team
async function readTeamInboxes(teamName) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    const inboxesDir = path.join(TEAMS_DIR, sanitizedName, 'inboxes');
    const validatedDir = validatePath(inboxesDir, TEAMS_DIR);

    await fs.access(validatedDir);
    const files = await fs.readdir(validatedDir);
    const inboxes = {};

    await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          try {
            const sanitizedFile = sanitizeFileName(file);
            const filePath = path.join(validatedDir, sanitizedFile);
            const validatedPath = validatePath(filePath, TEAMS_DIR);
            const content = await fs.readFile(validatedPath, 'utf8');
            const data = JSON.parse(content);
            const messages = Array.isArray(data) ? data : (data.messages || []);
            const agentName = path.basename(sanitizedFile, '.json');
            inboxes[agentName] = { messages, messageCount: messages.length };
          } catch (err) {
            console.error(`Error reading inbox ${file}:`, err.message);
          }
        })
    );

    return inboxes;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    console.error(`Error reading inboxes for team ${teamName}:`, error.message);
    return {};
  }
}

// Read all inboxes across all active teams
async function readAllInboxes() {
  try {
    await fs.access(TEAMS_DIR);
    const teamNames = await fs.readdir(TEAMS_DIR);
    const allInboxes = {};

    await Promise.all(
      teamNames.map(async (teamName) => {
        const inboxes = await readTeamInboxes(teamName);
        if (Object.keys(inboxes).length > 0) {
          allInboxes[teamName] = inboxes;
        }
      })
    );

    return allInboxes;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    console.error('Error reading all inboxes:', error.message);
    return {};
  }
}

// Watch for file system changes
let teamWatcher = null;
let teamDirWatcher = null;
let taskWatcher = null;
let outputWatcher = null;
let inboxWatcher = null;

function setupWatchers() {
  console.log('\n🔍 Setting up file watchers to track changes...');

  const watchOptions = {
    persistent: config.WATCH_CONFIG.PERSISTENT,
    ignoreInitial: config.WATCH_CONFIG.IGNORE_INITIAL,
    usePolling: config.WATCH_CONFIG.USE_POLLING,
    interval: config.WATCH_CONFIG.INTERVAL,
    binaryInterval: config.WATCH_CONFIG.BINARY_INTERVAL,
    depth: config.WATCH_CONFIG.DEPTH,
    awaitWriteFinish: config.WATCH_CONFIG.AWAIT_WRITE_FINISH,
    followSymlinks: false
  };

  // Watch team config files only (not inbox files — those have their own watcher)
  teamWatcher = chokidar.watch(path.join(TEAMS_DIR, '*/config.json'), watchOptions);

  teamWatcher
    .on('ready', () => {
      console.log('   ✓ Team watcher is ready - I\'ll notify you when teams change');
    })
    .on('add', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      console.log(`🎉 New team created: ${teamName}`);
      teamLifecycle.set(teamName, {
        created: Date.now(),
        lastSeen: Date.now()
      });
      try {
        cache.delete('activeTeams');
        const teams = await getActiveTeams();
        broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
      } catch (err) {
        console.error('[TEAM] Error on add:', err.message);
      }
    })
    .on('change', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      console.log(`🔄 Team active: ${teamName}`);
      if (teamLifecycle.has(teamName)) {
        teamLifecycle.get(teamName).lastSeen = Date.now();
      }
      try {
        cache.delete('activeTeams');
        const teams = await getActiveTeams();
        broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
      } catch (err) {
        console.error('[TEAM] Error on change:', err.message);
      }
    })
    .on('unlink', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      console.log(`👋 Team completed: ${teamName} - archiving for reference...`);
      try {
        cache.delete('activeTeams');
        // Try to get team data before it's gone
        const teams = await getActiveTeams();
        const teamData = teams.find(t => t.name === teamName);

        if (teamData) {
          await archiveTeam(teamName, teamData);
          const lifecycle = teamLifecycle.get(teamName);
          if (lifecycle) {
            const duration = Math.round((Date.now() - lifecycle.created) / 1000 / 60);
            console.log(`   📊 Team "${teamName}" was active for ${duration} minutes`);
          }
        }

        teamLifecycle.delete(teamName);
        const updatedTeams = await getActiveTeams();
        broadcast({ type: 'teams_update', data: updatedTeams, stats: calculateTeamStats(updatedTeams) });
      } catch (err) {
        console.error('[TEAM] Error on unlink:', err.message);
      }
    })
    .on('error', error => {
      console.error('[TEAM] Watcher error:', error);
    });

  // Watch for team directory deletions (TeamDelete removes the whole dir, not just config.json)
  // chokidar fires 'unlinkDir' instead of 'unlink' when a directory is removed
  teamDirWatcher = chokidar.watch(TEAMS_DIR, { ...watchOptions, depth: 0 })
    .on('unlinkDir', async (dirPath) => {
      if (path.resolve(dirPath) === path.resolve(TEAMS_DIR)) return; // ignore root dir
      const teamName = path.basename(dirPath);
      console.log(`🗑️ Team directory removed: ${teamName}`);
      try {
        teamLifecycle.delete(teamName);
        cache.delete('activeTeams');
        const updatedTeams = await getActiveTeams();
        broadcast({
          type: 'teams_update',
          data: updatedTeams,
          stats: calculateTeamStats(updatedTeams),
          removedTeam: teamName
        });
      } catch (err) {
        console.error('[TEAMDIR] Error on unlinkDir:', err.message);
      }
    });

  // Watch inbox files — ~/.claude/teams/*/inboxes/*.json
  inboxWatcher = chokidar.watch(path.join(TEAMS_DIR, '*/inboxes/*.json'), watchOptions);

  inboxWatcher
    .on('ready', () => {
      console.log('   ✓ Inbox watcher is ready - tracking all agent messages');
    })
    .on('add', async (filePath) => {
      // filePath: ~/.claude/teams/<team>/inboxes/<agent>.json
      const agentName = path.basename(filePath, '.json');
      const teamName = path.basename(path.dirname(path.dirname(filePath)));
      console.log(`📬 New inbox: ${teamName}/${agentName}`);
      try {
        const inboxes = await readTeamInboxes(teamName);
        broadcast({ type: 'inbox_update', teamName, inboxes });
      } catch (err) {
        console.error('[INBOX] Error on add:', err.message);
      }
    })
    .on('change', async (filePath) => {
      const agentName = path.basename(filePath, '.json');
      const teamName = path.basename(path.dirname(path.dirname(filePath)));
      console.log(`💬 Message received: ${teamName} → ${agentName}`);
      try {
        const inboxes = await readTeamInboxes(teamName);
        broadcast({ type: 'inbox_update', teamName, inboxes });
      } catch (err) {
        console.error('[INBOX] Error on change:', err.message);
      }
    })
    .on('unlink', async (filePath) => {
      const agentName = path.basename(filePath, '.json');
      const teamName = path.basename(path.dirname(path.dirname(filePath)));
      console.log(`🗑️ Inbox removed: ${teamName}/${agentName}`);
      try {
        const inboxes = await readTeamInboxes(teamName);
        broadcast({ type: 'inbox_update', teamName, inboxes });
      } catch (err) {
        console.error('[INBOX] Error on unlink:', err.message);
      }
    })
    .on('error', error => {
      console.error('[INBOX] Watcher error:', error);
    });

  // Watch tasks directory - watch all JSON files recursively
  taskWatcher = chokidar.watch(path.join(TASKS_DIR, '**/*.json'), watchOptions);

  taskWatcher
    .on('ready', () => {
      console.log('   ✓ Task watcher is ready - tracking all your agent tasks');
    })
    .on('add', async (filePath) => {
      console.log(`✨ New task created: ${path.basename(filePath)}`);
      try {
        cache.delete('activeTeams');
        const teams = await getActiveTeams();
        broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
      } catch (err) {
        console.error('[TASK] Error on add:', err.message);
      }
    })
    .on('change', async (filePath) => {
      console.log(`📝 Task updated: ${path.basename(filePath)}`);
      try {
        cache.delete('activeTeams');
        const teams = await getActiveTeams();
        broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
      } catch (err) {
        console.error('[TASK] Error on change:', err.message);
      }
    })
    .on('unlink', async (filePath) => {
      console.log(`✅ Task completed/removed: ${path.basename(filePath)}`);
      try {
        cache.delete('activeTeams');
        const teams = await getActiveTeams();
        broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
      } catch (err) {
        console.error('[TASK] Error on unlink:', err.message);
      }
    })
    .on('error', error => {
      console.error('[TASK] Watcher error:', error);
    });

  // Watch agent output files
  outputWatcher = chokidar.watch(
    path.join(TEMP_TASKS_DIR, '*.output'),
    watchOptions
  );

  outputWatcher
    .on('ready', () => {
      console.log('   ✓ Output watcher is ready - monitoring agent activity\n');
    })
    .on('change', async (filePath) => {
      console.log(`💬 Agent is working: ${path.basename(filePath)}`);
      try {
        const outputs = await getAgentOutputs();
        broadcast({ type: 'agent_outputs_update', outputs });
      } catch (err) {
        console.error('[OUTPUT] Error on change:', err.message);
      }
    })
    .on('add', async (filePath) => {
      console.log(`🎯 Agent started: ${path.basename(filePath)}`);
      try {
        const outputs = await getAgentOutputs();
        broadcast({ type: 'agent_outputs_update', outputs });
      } catch (err) {
        console.error('[OUTPUT] Error on add:', err.message);
      }
    })
    .on('error', error => {
      console.error('[OUTPUT] Watcher error:', error);
    });
}

// WebSocket security constants
const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds between pings
const WS_PONG_TIMEOUT = 10000; // 10 seconds to respond with pong
const WS_MAX_MESSAGE_SIZE = 65536; // 64KB max message size
const WS_RATE_LIMIT_MAX = 50; // max messages per second
const WS_RATE_LIMIT_WINDOW = 1000; // 1 second window

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
  // Always require a valid token in the URL query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(authToken);

  // timingSafeEqual requires equal-length buffers; check length first
  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    ws.close(4001, 'Invalid token');
    return;
  }

  // Connection audit logging
  const clientIp = req.socket.remoteAddress || 'unknown';
  console.log(`WS connected: ${clientIp}`);
  clients.add(ws);

  // --- Ping/pong heartbeat ---
  ws.isAlive = true;
  let pongTimeout = null;

  ws.on('pong', () => {
    ws.isAlive = true;
    if (pongTimeout) {
      clearTimeout(pongTimeout);
      pongTimeout = null;
    }
  });

  const heartbeatInterval = setInterval(() => {
    if (!ws.isAlive) {
      console.log(`WS heartbeat timeout, terminating: ${clientIp}`);
      clearInterval(heartbeatInterval);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
    pongTimeout = setTimeout(() => {
      if (!ws.isAlive) {
        console.log(`WS pong timeout, terminating: ${clientIp}`);
        clearInterval(heartbeatInterval);
        ws.terminate();
      }
    }, WS_PONG_TIMEOUT);
  }, WS_HEARTBEAT_INTERVAL);

  // --- Per-connection message rate limiting ---
  let messageCount = 0;
  let rateWindowStart = Date.now();

  // --- Message handler with size validation and rate limiting ---
  ws.on('message', (data) => {
    const messageSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    if (messageSize > WS_MAX_MESSAGE_SIZE) {
      console.log(`WS message too large (${messageSize} bytes) from: ${clientIp}`);
      ws.close(1009, 'Message too big');
      return;
    }

    const now = Date.now();
    if (now - rateWindowStart >= WS_RATE_LIMIT_WINDOW) {
      messageCount = 0;
      rateWindowStart = now;
    }
    messageCount++;
    if (messageCount > WS_RATE_LIMIT_MAX) {
      console.log(`WS rate limit exceeded from: ${clientIp}`);
      ws.close(1008, 'Policy violation: rate limit exceeded');
      return;
    }
  });

  // Send initial data
  try {
    const teams = await getActiveTeams();
    const stats = calculateTeamStats(teams);
    const teamHistory = await getTeamHistory();
    const agentOutputs = await getAgentOutputs();
    const allInboxes = await readAllInboxes();

    ws.send(JSON.stringify({
      type: 'initial_data',
      data: teams,
      stats,
      teamHistory,
      agentOutputs,
      allInboxes
    }));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }

  ws.on('close', () => {
    console.log(`WS disconnected: ${clientIp}`);
    clearInterval(heartbeatInterval);
    if (pongTimeout) clearTimeout(pongTimeout);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error from ${clientIp}:`, error.message);
    clearInterval(heartbeatInterval);
    if (pongTimeout) clearTimeout(pongTimeout);
    clients.delete(ws);
  });
});

// REST API endpoints
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await getCachedActiveTeams();
    const stats = calculateTeamStats(teams);
    const body = JSON.stringify({ teams, stats });

    // ETag support — hash the response body for conditional requests
    const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=5');

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.type('json').send(body);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teams/:teamName', async (req, res) => {
  try {
    const teamName = sanitizeTeamName(req.params.teamName);
    if (teamName !== req.params.teamName) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const config = await readTeamConfig(teamName);
    const tasks = await readTasks(teamName);

    if (!config) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ config, tasks });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team inbox messages
app.get('/api/teams/:teamName/inboxes', async (req, res) => {
  try {
    const teamName = sanitizeTeamName(req.params.teamName);
    if (teamName !== req.params.teamName) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const inboxes = await readTeamInboxes(teamName);
    res.json({ inboxes });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    console.error('Error fetching team inboxes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific agent's inbox
app.get('/api/teams/:teamName/inboxes/:agentName', async (req, res) => {
  try {
    const teamName = sanitizeTeamName(req.params.teamName);
    if (teamName !== req.params.teamName) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const agentName = sanitizeAgentName(req.params.agentName);
    if (agentName !== req.params.agentName) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const inboxPath = path.join(TEAMS_DIR, teamName, 'inboxes', `${agentName}.json`);
    const validatedInboxPath = validatePath(inboxPath, TEAMS_DIR);

    try {
      const content = await fs.readFile(validatedInboxPath, 'utf8');
      const data = JSON.parse(content);
      const messages = Array.isArray(data) ? data : (data.messages || []);
      res.json({
        agent: agentName,
        messages: messages,
        messageCount: messages.length
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.json({ agent: agentName, messages: [], messageCount: 0 });
      }
      throw error;
    }
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paginated tasks for a specific team
app.get('/api/teams/:teamName/tasks', async (req, res) => {
  try {
    const teamName = sanitizeTeamName(req.params.teamName);
    if (teamName !== req.params.teamName) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const statusFilter = req.query.status || 'all';

    const tasks = await readTasks(teamName);

    // Filter by status if specified
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const filteredTasks = statusFilter === 'all'
      ? tasks
      : validStatuses.includes(statusFilter)
        ? tasks.filter(t => t.status === statusFilter)
        : tasks;

    const count = filteredTasks.length;
    const totalPages = Math.ceil(count / limit);
    const start = (page - 1) * limit;
    const paginatedTasks = filteredTasks.slice(start, start + limit);

    res.json({ tasks: paginatedTasks, count, page, limit, totalPages, status: statusFilter });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    console.error('Error fetching team tasks:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archived teams (paginated)
app.get('/api/archive', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const archives = [];

    try {
      const files = await fs.readdir(ARCHIVE_DIR);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const sanitizedFile = sanitizeFileName(file);
            const filePath = validatePath(path.join(ARCHIVE_DIR, sanitizedFile), ARCHIVE_DIR);
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            archives.push({
              filename: sanitizedFile,
              ...data.summary,
              archivedAt: data.archivedAt,
              // fullPath intentionally excluded (would leak server filesystem paths)
            });
          } catch (fileErr) {
            console.error(`Error reading archive file ${sanitizeForLog(file)}:`, fileErr.message);
          }
        }
      }
    } catch (err) {
      // Archive directory doesn't exist yet
      if (err.code !== 'ENOENT') throw err;
    }

    // Sort by archived date (newest first)
    archives.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

    const count = archives.length;
    const totalPages = Math.ceil(count / limit);
    const start = (page - 1) * limit;
    const paginatedArchives = archives.slice(start, start + limit);

    res.json({ archives: paginatedArchives, count, page, limit, totalPages });
  } catch (error) {
    console.error('Error fetching archives:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific archived team details
app.get('/api/archive/:filename', async (req, res) => {
  try {
    const filename = sanitizeFileName(req.params.filename);
    if (filename !== req.params.filename) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }
    const filePath = validatePath(path.join(ARCHIVE_DIR, filename), ARCHIVE_DIR);

    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (readError) {
      return res.status(404).json({ error: 'Archive not found' });
    }

    let data;
    try {
      data = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: 'Archive file is corrupt' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching archive:', error.message);
    res.status(400).json({ error: 'Invalid archive filename' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    watchers: {
      teams: !!teamWatcher,
      tasks: !!taskWatcher,
      inboxes: !!inboxWatcher,
      outputs: !!outputWatcher
    }
  });
});

// Pre-computed stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const teams = await getCachedActiveTeams();
    const stats = calculateTeamStats(teams);
    res.set('Cache-Control', 'public, max-age=5');
    res.json({ stats, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team history
app.get('/api/team-history', async (req, res) => {
  try {
    const history = await getTeamHistory();
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all inboxes across all teams
app.get('/api/inboxes', async (req, res) => {
  try {
    const allInboxes = await readAllInboxes();
    res.set('Cache-Control', 'public, max-age=2');
    res.json({ inboxes: allInboxes });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paginated messages across all teams (or specific team)
app.get('/api/inboxes/messages', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const teamFilter = req.query.team || null;

    let allInboxes;
    if (teamFilter) {
      const sanitizedTeam = sanitizeTeamName(teamFilter);
      if (sanitizedTeam !== teamFilter) {
        return res.status(400).json({ error: 'Invalid parameter' });
      }
      const inboxes = await readTeamInboxes(sanitizedTeam);
      allInboxes = Object.keys(inboxes).length > 0 ? { [sanitizedTeam]: inboxes } : {};
    } else {
      allInboxes = await readAllInboxes();
    }

    // Flatten all messages into a single array with metadata
    const allMessages = [];
    for (const [teamName, teamInboxes] of Object.entries(allInboxes)) {
      for (const [agentName, inbox] of Object.entries(teamInboxes)) {
        for (const msg of (inbox.messages || [])) {
          const text = typeof msg === 'string' ? msg : (msg.message || msg.content || msg.text || '');
          const timestamp = msg.timestamp || null;
          allMessages.push({
            team: teamName,
            agent: agentName,
            message: text.substring(0, 500),
            timestamp,
            _sortTime: timestamp ? new Date(timestamp).getTime() : 0
          });
        }
      }
    }

    // Sort newest first
    allMessages.sort((a, b) => b._sortTime - a._sortTime);

    // Remove internal sort key
    const count = allMessages.length;
    const totalPages = Math.ceil(count / limit);
    const start = (page - 1) * limit;
    const paginatedMessages = allMessages.slice(start, start + limit).map(({ _sortTime, ...rest }) => rest);

    res.json({ messages: paginatedMessages, count, page, limit, totalPages });
  } catch (error) {
    console.error('Error fetching paginated inboxes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent outputs
app.get('/api/agent-outputs', async (req, res) => {
  try {
    const outputs = await getAgentOutputs();
    res.json({ outputs });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific agent output
app.get('/api/agent-outputs/:taskId', async (req, res) => {
  try {
    // Validate taskId: strict allowlist, reject if sanitized !== original
    const rawTaskId = req.params.taskId;
    if (!rawTaskId || rawTaskId.length > 100) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    const taskId = rawTaskId.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!taskId || taskId !== rawTaskId) {
      return res.status(400).json({ error: 'Invalid parameter' });
    }

    // Construct file path with sanitized taskId
    const fileName = `${taskId}.output`;
    const filePath = path.join(TEMP_TASKS_DIR, fileName);

    // Validate the constructed path is within allowed directory
    const validatedPath = validatePath(filePath, TEMP_TASKS_DIR);

    // Read the output file
    const content = await fs.readFile(validatedPath, 'utf8');
    res.json({ taskId, content });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Output file not found' });
    } else {
      console.error('Error reading agent output:', error.message);
      res.status(500).json({ error: 'Failed to read output file' });
    }
  }
});

// Get session history
app.get('/api/sessions', async (req, res) => {
  try {
    const projectPath = req.query.project || 'D--agentdashboard';
    const sessions = await getSessionHistory(projectPath);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search rate limiter — 10 requests per minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many search requests, please try again shortly.',
  standardHeaders: true,
  legacyHeaders: false
});

// GET /api/search?q=query — search across teams, agents, tasks, messages
app.get('/api/search', searchLimiter, async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" is required and must be at least 2 characters.' });
    }
    if (q.length > 200) {
      return res.status(400).json({ error: 'Query too long (max 200 characters).' });
    }

    // Use simple string indexOf matching (no regex) to prevent ReDoS
    const query = q.trim().toLowerCase();
    const MAX_RESULTS = 5;

    // Optional types filter: ?types=teams,tasks,messages,agents (default: all)
    const validTypes = ['teams', 'tasks', 'messages', 'agents'];
    const typesParam = req.query.types;
    const enabledTypes = typesParam
      ? typesParam.split(',').map(t => t.trim().toLowerCase()).filter(t => validTypes.includes(t))
      : validTypes;

    const teams = await getCachedActiveTeams();
    const allInboxes = enabledTypes.includes('messages') ? await readAllInboxes() : {};

    // Search teams by name or config.description
    const matchedTeams = !enabledTypes.includes('teams') ? [] : teams
      .filter(t =>
        t.name.toLowerCase().includes(query) ||
        (t.config.description && t.config.description.toLowerCase().includes(query))
      )
      .slice(0, MAX_RESULTS)
      .map(t => ({ name: t.name, description: t.config.description || null, memberCount: (t.config.members || []).length }));

    // Search agents by member.name across all teams
    const matchedAgents = [];
    if (enabledTypes.includes('agents')) {
      const seenAgents = new Set();
      for (const team of teams) {
        for (const member of (team.config.members || [])) {
          if (member.name && member.name.toLowerCase().includes(query) && !seenAgents.has(member.name)) {
            seenAgents.add(member.name);
            matchedAgents.push({ name: member.name, team: team.name, agentType: member.agentType || null });
            if (matchedAgents.length >= MAX_RESULTS) break;
          }
        }
        if (matchedAgents.length >= MAX_RESULTS) break;
      }
    }

    // Search tasks by subject or description
    const matchedTasks = [];
    if (enabledTypes.includes('tasks')) {
      for (const team of teams) {
        for (const task of (team.tasks || [])) {
          if (
            (task.subject && task.subject.toLowerCase().includes(query)) ||
            (task.description && task.description.toLowerCase().includes(query))
          ) {
            matchedTasks.push({ id: task.id, subject: task.subject, status: task.status, team: team.name });
            if (matchedTasks.length >= MAX_RESULTS) break;
          }
        }
        if (matchedTasks.length >= MAX_RESULTS) break;
      }
    }

    // Search messages by message text from inboxes
    const matchedMessages = [];
    for (const [teamName, teamInboxes] of Object.entries(allInboxes)) {
      for (const [agentName, inbox] of Object.entries(teamInboxes)) {
        for (const msg of (inbox.messages || [])) {
          const text = typeof msg === 'string' ? msg : (msg.message || msg.content || msg.text || '');
          if (text.toLowerCase().includes(query)) {
            matchedMessages.push({
              team: teamName,
              agent: agentName,
              preview: text.substring(0, 200),
              timestamp: msg.timestamp || null
            });
            if (matchedMessages.length >= MAX_RESULTS) break;
          }
        }
        if (matchedMessages.length >= MAX_RESULTS) break;
      }
      if (matchedMessages.length >= MAX_RESULTS) break;
    }

    res.json({ teams: matchedTeams, agents: matchedAgents, tasks: matchedTasks, messages: matchedMessages });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/metrics — aggregate metrics across all teams
app.get('/api/metrics', async (req, res) => {
  try {
    const teams = await getCachedActiveTeams();
    const allInboxes = await readAllInboxes();

    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    let totalMessages = 0;
    const activeAgentSet = new Set();
    const teamsWithActivitySet = new Set();

    for (const [teamName, teamInboxes] of Object.entries(allInboxes)) {
      for (const [agentName, inbox] of Object.entries(teamInboxes)) {
        const messages = inbox.messages || [];
        totalMessages += messages.length;

        for (const msg of messages) {
          const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
          if (ts > thirtyMinutesAgo) {
            activeAgentSet.add(agentName);
          }
          if (ts > twentyFourHoursAgo) {
            teamsWithActivitySet.add(teamName);
          }
        }
      }
    }

    let totalAgents = 0;
    let totalTasks = 0;
    for (const team of teams) {
      totalAgents += (team.config.members || []).length;
      totalTasks += (team.tasks || []).length;
    }

    res.json({
      totalTeams: teams.length,
      totalAgents,
      totalTasks,
      totalMessages,
      activeAgents: activeAgentSet.size,
      teamsWithActivity: teamsWithActivitySet.size
    });
  } catch (error) {
    console.error('Metrics error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agents — all unique agents across all teams with stats
app.get('/api/agents', async (req, res) => {
  try {
    const teams = await getCachedActiveTeams();
    const allInboxes = await readAllInboxes();

    // Build agent map: name -> { teams, messageCount, lastSeen }
    const agentMap = new Map();

    // Collect agents from team configs
    for (const team of teams) {
      for (const member of (team.config.members || [])) {
        if (!member.name) continue;
        if (!agentMap.has(member.name)) {
          agentMap.set(member.name, { name: member.name, teams: [], messageCount: 0, lastSeen: null });
        }
        const entry = agentMap.get(member.name);
        if (!entry.teams.includes(team.name)) {
          entry.teams.push(team.name);
        }
      }
    }

    // Enrich with inbox data
    for (const [teamName, teamInboxes] of Object.entries(allInboxes)) {
      for (const [agentName, inbox] of Object.entries(teamInboxes)) {
        if (!agentMap.has(agentName)) {
          agentMap.set(agentName, { name: agentName, teams: [teamName], messageCount: 0, lastSeen: null });
        }
        const entry = agentMap.get(agentName);
        if (!entry.teams.includes(teamName)) {
          entry.teams.push(teamName);
        }
        const messages = inbox.messages || [];
        entry.messageCount += messages.length;

        for (const msg of messages) {
          if (msg.timestamp) {
            const ts = new Date(msg.timestamp).getTime();
            if (!entry.lastSeen || ts > entry.lastSeen) {
              entry.lastSeen = ts;
            }
          }
        }
      }
    }

    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;

    const agents = Array.from(agentMap.values()).map(a => ({
      name: a.name,
      teams: a.teams,
      messageCount: a.messageCount,
      lastSeen: a.lastSeen ? new Date(a.lastSeen).toISOString() : null,
      status: a.lastSeen && a.lastSeen > thirtyMinutesAgo ? 'active' : 'idle'
    }));

    res.json({ agents });
  } catch (error) {
    console.error('Agents error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/live — real-time counts for teams, tasks, messages, agents
app.get('/api/stats/live', async (req, res) => {
  try {
    const teams = await getCachedActiveTeams();
    const allInboxes = await readAllInboxes();

    let totalMessages = 0;
    let activeAgents = 0;
    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;
    const activeSet = new Set();

    for (const [, teamInboxes] of Object.entries(allInboxes)) {
      for (const [agentName, inbox] of Object.entries(teamInboxes)) {
        const messages = inbox.messages || [];
        totalMessages += messages.length;
        for (const msg of messages) {
          const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
          if (ts > thirtyMinutesAgo) {
            activeSet.add(agentName);
          }
        }
      }
    }
    activeAgents = activeSet.size;

    let totalAgents = 0;
    let totalTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    for (const team of teams) {
      totalAgents += (team.config.members || []).length;
      for (const task of (team.tasks || [])) {
        totalTasks++;
        if (task.status === 'pending') pendingTasks++;
        else if (task.status === 'in_progress') inProgressTasks++;
        else if (task.status === 'completed') completedTasks++;
      }
    }

    res.set('Cache-Control', 'public, max-age=2');
    res.json({
      teams: teams.length,
      agents: totalAgents,
      activeAgents,
      tasks: totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      messages: totalMessages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats/live error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown handler
function setupGracefulShutdown() {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n\n👋 Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('   ✓ Stopped accepting new connections');
    });

    // Close WebSocket connections
    const closePromises = [];
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        closePromises.push(
          new Promise(resolve => {
            client.close(1001, 'Server shutting down');
            resolve();
          })
        );
      }
    });
    await Promise.all(closePromises);
    console.log('   ✓ All viewers disconnected');

    // Close file watchers
    try {
      if (teamWatcher) await teamWatcher.close();
      if (teamDirWatcher) await teamDirWatcher.close();
      if (taskWatcher) await taskWatcher.close();
      if (outputWatcher) await outputWatcher.close();
      if (inboxWatcher) await inboxWatcher.close();
      console.log('   ✓ Stopped monitoring files');
    } catch (error) {
      console.error('Error closing watchers:', error.message);
    }

    console.log('\n✨ Dashboard shut down successfully. See you next time!\n');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: require('./package.json').version, node: process.version });
});

// Error handling middleware — never leak internal error details to clients
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// SPA fallback — serve index.html for all non-API routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global error handlers — prevent crashes from async watcher callbacks
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Start server
server.listen(config.PORT, () => {
  console.log(`\n🚀 Dashboard is live and ready!`);
  console.log(`   You can view it at: http://localhost:${config.PORT}`);
  console.log(`\n📡 Real-time updates enabled - your teams will sync automatically`);
  console.log(`\n👀 Watching for activity:`);
  console.log(`   Teams:   ${TEAMS_DIR}`);
  console.log(`   Tasks:   ${TASKS_DIR}`);
  console.log(`   Inboxes: ${path.join(TEAMS_DIR, '*/inboxes/*.json')}`);
  setupWatchers();
  setupGracefulShutdown();
});
