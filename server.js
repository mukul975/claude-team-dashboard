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
const config = require('./config');

const app = express();
const server = http.createServer(app);
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

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: config.RATE_LIMIT.MESSAGE,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Restrict CORS to localhost only for security
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Paths to Claude Code agent team files
const homeDir = os.homedir();
const TEAMS_DIR = path.join(homeDir, '.claude', 'teams');
const TASKS_DIR = path.join(homeDir, '.claude', 'tasks');
const PROJECTS_DIR = path.join(homeDir, '.claude', 'projects');
const TEMP_TASKS_DIR = path.join(os.tmpdir(), 'claude', 'D--agentdashboard', 'tasks');

// Store connected clients
const clients = new Set();

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

  // Reject any path separators to prevent traversal
  if (teamName.includes('/') || teamName.includes('\\') || teamName.includes(path.sep)) {
    throw new Error('Invalid team name: path separators not allowed');
  }

  // Reject parent directory references
  if (teamName.includes('..') || teamName.startsWith('.')) {
    throw new Error('Invalid team name: relative paths not allowed');
  }

  // Only allow alphanumeric, dash, underscore (whitelist approach)
  if (!/^[a-zA-Z0-9_-]+$/.test(teamName)) {
    throw new Error('Invalid team name format');
  }

  // Return the sanitized team name (now guaranteed safe for path operations)
  return teamName;
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

  // Reject any path separators
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes(path.sep)) {
    throw new Error('Invalid file name: path separators not allowed');
  }

  // Reject parent directory references
  if (fileName.includes('..')) {
    throw new Error('Invalid file name: relative paths not allowed');
  }

  // Use basename as additional safety layer
  const baseName = path.basename(fileName);

  // Only allow safe characters (whitelist approach)
  if (!/^[a-zA-Z0-9_.-]+$/.test(baseName)) {
    throw new Error('Invalid file name format');
  }

  // Return the sanitized filename (now guaranteed safe for path operations)
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
    console.error('Error reading team config:', {
      team: sanitizeForLog(teamName),
      error: error.message
    });
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
    console.error('Error reading tasks:', {
      team: sanitizeForLog(teamName),
      error: error.message
    });
    return [];
  }
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
          const stats = await fs.stat(teamDir);

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
        console.error(`Error reading team history for ${teamName}:`, error.message);
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
          const filePath = path.join(TEMP_TASKS_DIR, file);
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
          const stats = await fs.stat(validatedPath);

          // lgtm[js/path-injection] Path is validated to be within PROJECTS_DIR
          // lgtm[js/toctou-race-condition] Stats used only for metadata (size, timestamps), not for access control decisions
          const content = await fs.readFile(validatedPath, 'utf8');
          const lines = content.trim().split('\n').filter(l => l.trim());

          if (lines.length > 0) {
            const firstLine = JSON.parse(lines[0]);
            const lastLine = JSON.parse(lines[lines.length - 1]);

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

// Watch for file system changes
let teamWatcher = null;
let taskWatcher = null;
let outputWatcher = null;

function setupWatchers() {
  console.log('Setting up file watchers...');

  const watchOptions = {
    persistent: config.WATCH_CONFIG.PERSISTENT,
    ignoreInitial: config.WATCH_CONFIG.IGNORE_INITIAL,
    usePolling: config.WATCH_CONFIG.USE_POLLING,
    interval: config.WATCH_CONFIG.INTERVAL,
    binaryInterval: config.WATCH_CONFIG.BINARY_INTERVAL,
    depth: config.WATCH_CONFIG.DEPTH,
    awaitWriteFinish: config.WATCH_CONFIG.AWAIT_WRITE_FINISH
  };

  // Watch teams directory - watch all JSON files recursively
  teamWatcher = chokidar.watch(path.join(TEAMS_DIR, '**/*.json'), watchOptions);

  teamWatcher
    .on('ready', () => {
      console.log('✓ Team file watcher is ready');
      console.log(`  Watching: ${TEAMS_DIR}/**/*.json`);
    })
    .on('add', async (filePath) => {
      console.log(`[TEAM] File added: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('change', async (filePath) => {
      console.log(`[TEAM] File changed: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('unlink', async (filePath) => {
      console.log(`[TEAM] File removed: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('error', error => {
      console.error('[TEAM] Watcher error:', error);
    });

  // Watch tasks directory - watch all JSON files recursively
  taskWatcher = chokidar.watch(path.join(TASKS_DIR, '**/*.json'), watchOptions);

  taskWatcher
    .on('ready', () => {
      console.log('✓ Task file watcher is ready');
      console.log(`  Watching: ${TASKS_DIR}/**/*.json`);
    })
    .on('add', async (filePath) => {
      console.log(`[TASK] File added: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('change', async (filePath) => {
      console.log(`[TASK] File changed: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('unlink', async (filePath) => {
      console.log(`[TASK] File removed: ${filePath}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
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
      console.log('✓ Agent output watcher is ready');
      console.log(`  Watching: ${TEMP_TASKS_DIR}/*.output`);
    })
    .on('change', async (filePath) => {
      console.log(`[OUTPUT] File changed: ${filePath}`);
      const outputs = await getAgentOutputs();
      broadcast({ type: 'agent_outputs_update', outputs });
    })
    .on('add', async (filePath) => {
      console.log(`[OUTPUT] File added: ${filePath}`);
      const outputs = await getAgentOutputs();
      broadcast({ type: 'agent_outputs_update', outputs });
    })
    .on('error', error => {
      console.error('[OUTPUT] Watcher error:', error);
    });
}

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Send initial data
  try {
    const teams = await getActiveTeams();
    const stats = calculateTeamStats(teams);
    const teamHistory = await getTeamHistory();
    const agentOutputs = await getAgentOutputs();

    ws.send(JSON.stringify({
      type: 'initial_data',
      data: teams,
      stats,
      teamHistory,
      agentOutputs
    }));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// REST API endpoints
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await getActiveTeams();
    const stats = calculateTeamStats(teams);
    res.json({ teams, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams/:teamName', async (req, res) => {
  try {
    const config = await readTeamConfig(req.params.teamName);
    const tasks = await readTasks(req.params.teamName);

    if (!config) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ config, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    watchers: {
      teams: TEAMS_DIR,
      tasks: TASKS_DIR
    }
  });
});

// Get team history
app.get('/api/team-history', async (req, res) => {
  try {
    const history = await getTeamHistory();
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent outputs
app.get('/api/agent-outputs', async (req, res) => {
  try {
    const outputs = await getAgentOutputs();
    res.json({ outputs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific agent output
app.get('/api/agent-outputs/:taskId', async (req, res) => {
  try {
    // Sanitize taskId to prevent path traversal
    const taskId = req.params.taskId.replace(/[^a-zA-Z0-9_-]/g, '');

    // Validate taskId is not empty after sanitization
    if (!taskId || taskId.length === 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
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
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown handler
function setupGracefulShutdown() {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('✓ HTTP server closed');
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
    console.log('✓ WebSocket connections closed');

    // Close file watchers
    try {
      if (teamWatcher) await teamWatcher.close();
      if (taskWatcher) await taskWatcher.close();
      if (outputWatcher) await outputWatcher.close();
      console.log('✓ File watchers closed');
    } catch (error) {
      console.error('Error closing watchers:', error.message);
    }

    console.log('✓ Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server
server.listen(config.PORT, () => {
  console.log(`Agent Dashboard Server running on port ${config.PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Monitoring teams at: ${TEAMS_DIR}`);
  console.log(`Monitoring tasks at: ${TASKS_DIR}`);
  setupWatchers();
  setupGracefulShutdown();
});
