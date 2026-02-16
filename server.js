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
const ARCHIVE_DIR = path.join(homeDir, '.claude', 'archive');

// Store connected clients
const clients = new Set();

// Team lifecycle tracking
const teamLifecycle = new Map(); // teamName -> { created, lastSeen, archived }

// Archive team data before deletion
async function archiveTeam(teamName, teamData) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveFile = path.join(ARCHIVE_DIR, `${teamName}_${timestamp}.json`);

    // Ensure archive directory exists
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // Create natural language summary
    const summary = {
      teamName,
      archivedAt: new Date().toISOString(),
      summary: generateTeamSummary(teamData),
      rawData: teamData
    };

    await fs.writeFile(archiveFile, JSON.stringify(summary, null, 2));
    console.log(`📦 Team archived: ${teamName} → ${archiveFile}`);

    return archiveFile;
  } catch (error) {
    console.error(`Error archiving team ${teamName}:`, error);
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

// Watch for file system changes
let teamWatcher = null;
let taskWatcher = null;
let outputWatcher = null;

function setupWatchers() {
  console.log('\n🔍 Setting up file watchers to track changes...');

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
      console.log('   ✓ Team watcher is ready - I\'ll notify you when teams change');
    })
    .on('add', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      if (path.basename(filePath) === 'config.json') {
        console.log(`🎉 New team created: ${teamName}`);
        teamLifecycle.set(teamName, {
          created: Date.now(),
          lastSeen: Date.now()
        });
      }
      const teams = await getActiveTeams();
      broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('change', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      console.log(`🔄 Team active: ${teamName}`);
      if (teamLifecycle.has(teamName)) {
        teamLifecycle.get(teamName).lastSeen = Date.now();
      }
      const teams = await getActiveTeams();
      broadcast({ type: 'teams_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('unlink', async (filePath) => {
      const teamName = path.basename(path.dirname(filePath));
      if (path.basename(filePath) === 'config.json') {
        console.log(`👋 Team completed: ${teamName} - archiving for reference...`);

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
      }
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
      console.log('   ✓ Task watcher is ready - tracking all your agent tasks');
    })
    .on('add', async (filePath) => {
      console.log(`✨ New task created: ${path.basename(filePath)}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('change', async (filePath) => {
      console.log(`📝 Task updated: ${path.basename(filePath)}`);
      const teams = await getActiveTeams();
      broadcast({ type: 'task_update', data: teams, stats: calculateTeamStats(teams) });
    })
    .on('unlink', async (filePath) => {
      console.log(`✅ Task completed/removed: ${path.basename(filePath)}`);
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
      console.log('   ✓ Output watcher is ready - monitoring agent activity\n');
    })
    .on('change', async (filePath) => {
      console.log(`💬 Agent is working: ${path.basename(filePath)}`);
      const outputs = await getAgentOutputs();
      broadcast({ type: 'agent_outputs_update', outputs });
    })
    .on('add', async (filePath) => {
      console.log(`🎯 Agent started: ${path.basename(filePath)}`);
      const outputs = await getAgentOutputs();
      broadcast({ type: 'agent_outputs_update', outputs });
    })
    .on('error', error => {
      console.error('[OUTPUT] Watcher error:', error);
    });
}

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('👋 A new viewer joined the dashboard');
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
    console.log('👋 A viewer left the dashboard');
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

// Get team inbox messages
app.get('/api/teams/:teamName/inboxes', async (req, res) => {
  try {
    const teamName = sanitizeProjectPath(req.params.teamName);
    const inboxesDir = path.join(TEAMS_DIR, teamName, 'inboxes');

    // Check if inboxes directory exists
    try {
      await fs.access(inboxesDir);
    } catch {
      return res.json({ inboxes: [] });
    }

    // Read all inbox files
    const files = await fs.readdir(inboxesDir);
    const inboxFiles = files.filter(f => f.endsWith('.json'));

    const inboxes = {};

    for (const file of inboxFiles) {
      const agentName = file.replace('.json', '');
      const filePath = path.join(inboxesDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        // Handle both array format (data is array) and object format (data.messages)
        const messages = Array.isArray(data) ? data : (data.messages || []);
        inboxes[agentName] = {
          messages: messages,
          messageCount: messages.length
        };
      } catch (error) {
        console.error(`Error reading inbox ${file}:`, error.message);
        inboxes[agentName] = { messages: [], messageCount: 0, error: error.message };
      }
    }

    res.json({ inboxes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific agent's inbox
app.get('/api/teams/:teamName/inboxes/:agentName', async (req, res) => {
  try {
    const teamName = sanitizeProjectPath(req.params.teamName);
    const agentName = sanitizeFileName(req.params.agentName);
    const inboxPath = path.join(TEAMS_DIR, teamName, 'inboxes', `${agentName}.json`);

    try {
      const content = await fs.readFile(inboxPath, 'utf8');
      const data = JSON.parse(content);
      // Handle both array format (data is array) and object format (data.messages)
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
    res.status(500).json({ error: error.message });
  }
});

// Get archived teams
app.get('/api/archive', async (req, res) => {
  try {
    const archives = [];

    try {
      const files = await fs.readdir(ARCHIVE_DIR);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(ARCHIVE_DIR, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          archives.push({
            filename: file,
            ...data.summary,
            archivedAt: data.archivedAt,
            fullPath: filePath
          });
        }
      }
    } catch (err) {
      // Archive directory doesn't exist yet
      if (err.code !== 'ENOENT') throw err;
    }

    // Sort by archived date (newest first)
    archives.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

    res.json({ archives, count: archives.length });
  } catch (error) {
    console.error('Error fetching archives:', error);
    res.status(500).json({ error: 'Failed to fetch archived teams' });
  }
});

// Get specific archived team details
app.get('/api/archive/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(ARCHIVE_DIR, filename);

    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    res.json(data);
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(404).json({ error: 'Archive not found' });
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
      if (taskWatcher) await taskWatcher.close();
      if (outputWatcher) await outputWatcher.close();
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

// Start server
server.listen(config.PORT, () => {
  console.log(`\n🚀 Dashboard is live and ready!`);
  console.log(`   You can view it at: http://localhost:${config.PORT}`);
  console.log(`\n📡 Real-time updates enabled - your teams will sync automatically`);
  console.log(`\n👀 Watching for activity:`);
  console.log(`   Teams: ${TEAMS_DIR}`);
  console.log(`   Tasks: ${TASKS_DIR}`);
  setupWatchers();
  setupGracefulShutdown();
});
