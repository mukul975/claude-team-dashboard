const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Restrict CORS to localhost only for security
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Paths to Claude Code agent team files
const homeDir = os.homedir();
const TEAMS_DIR = path.join(homeDir, '.claude', 'teams');
const TASKS_DIR = path.join(homeDir, '.claude', 'tasks');

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
  // Only allow alphanumeric, dash, underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(teamName)) {
    throw new Error('Invalid team name format');
  }
  return teamName;
}

// Read team configuration
async function readTeamConfig(teamName) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    const configPath = path.join(TEAMS_DIR, sanitizedName, 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading team config for ${teamName}:`, error.message);
    return null;
  }
}

// Read all tasks for a team
async function readTasks(teamName) {
  try {
    const sanitizedName = sanitizeTeamName(teamName);
    const tasksPath = path.join(TASKS_DIR, sanitizedName);
    const files = await fs.readdir(tasksPath);

    // Use Promise.all for parallel file reads (performance improvement)
    const taskPromises = files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const taskPath = path.join(tasksPath, file);
        const data = await fs.readFile(taskPath, 'utf8');
        const task = JSON.parse(data);
        return { ...task, id: path.basename(file, '.json') };
      });

    const tasks = await Promise.all(taskPromises);
    return tasks.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch (error) {
    console.error(`Error reading tasks for ${teamName}:`, error.message);
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

// Watch for file system changes
let teamWatcher = null;
let taskWatcher = null;

function setupWatchers() {
  console.log('Setting up file watchers...');

  const watchOptions = {
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 1000,
    binaryInterval: 1000,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
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
}

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Send initial data
  try {
    const teams = await getActiveTeams();
    const stats = calculateTeamStats(teams);
    ws.send(JSON.stringify({
      type: 'initial_data',
      data: teams,
      stats
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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Agent Dashboard Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Monitoring teams at: ${TEAMS_DIR}`);
  console.log(`Monitoring tasks at: ${TASKS_DIR}`);
  setupWatchers();
  setupGracefulShutdown();
});
