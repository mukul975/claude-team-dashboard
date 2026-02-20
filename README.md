<div align="center">

# 🤖 Claude Agent Dashboard

### Stop Flying Blind — Monitor Your Claude Code Agent Teams in Real Time

[![npm](https://img.shields.io/npm/v/claude-team-dashboard.svg)](https://www.npmjs.com/package/claude-team-dashboard)
[![npm downloads](https://img.shields.io/npm/dm/claude-team-dashboard.svg)](https://www.npmjs.com/package/claude-team-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mukul975/claude-team-dashboard/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-58%25-F7DF1E.svg?logo=javascript&logoColor=black)](https://github.com/mukul975/claude-team-dashboard)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101.svg?logo=socketdotio&logoColor=white)](https://github.com/mukul975/claude-team-dashboard)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mukul975/claude-team-dashboard/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/mukul975/claude-team-dashboard?style=social)](https://github.com/mukul975/claude-team-dashboard)

**Monitor, track, and orchestrate** your [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) agent teams from a **single, unified dashboard** — with **zero-delay WebSocket streaming**.

[**Get Started**](#-quick-start) · [**See Features**](#-features) · [**Live Demo**](#-demo) · [**Docs**](#-documentation) · [**Contributing**](#-contributing)

---

</div>

## 🎯 Why This Exists

### The Problem

You're running multiple Claude Code agents across projects. Suddenly, chaos:

- **Lost visibility**: Which agent is doing what? You have no idea.
- **Ghost messages**: Agents talk to each other. You can't see it.
- **Debug hell**: Something breaks. You're stuck playing detective across 5 terminal windows.
- **Task black holes**: Tasks start, disappear, maybe finish. Who knows?

**Running multi-agent workflows without monitoring is like driving blindfolded.**

### The Solution

Claude Agent Dashboard gives you **X-ray vision into your agent teams**:

✅ **See everything** — Live status, tasks, messages, system metrics
✅ **Debug faster** — Trace inter-agent communication in real time
✅ **Stay in control** — Know exactly what's happening, always
✅ **Ship with confidence** — Spot failures before they cascade

> Built by a **cybersecurity researcher** who knows that **visibility is the first line of defense** — even for AI agents.

---

## ✨ Highlights

<table>
<tr>
<td width="50%">

### 🚀 **Zero-Config Real-Time Monitoring**

Launch the dashboard with **one command**. WebSocket streaming auto-discovers agents. No configuration needed.

### 📋 **Visual Task Management**

See tasks as they flow through your agent team. **Progress bars**, status badges, dependency chains — all live-updated.

### 💬 **Inter-Agent Message Inspector**

Debug coordination issues instantly. Watch agents communicate in real time with **full message history** and **conversation threads**.

### 🌗 **Full Light & Dark Mode**

Pixel-perfect theming with CSS custom properties. Every component — cards, charts, modals, toasts — adapts instantly when you toggle the theme.

### ♿ **WCAG-Accessible Interface**

Every button has a descriptive `aria-label`. Interactive elements have `role`, `tabIndex`, and keyboard handlers. Status components use `aria-live`. Modals trap focus. Fully navigable without a mouse.

### ⌨️ **Keyboard-First Navigation**

Command palette (`⌘K`), tab shortcuts (`⌘1-8`), and a shortcuts modal (`?`) so you never have to touch the mouse.

</td>
<td width="50%">

### 📊 **Live Activity Chronology**

Every agent action — **timestamped**, **color-coded**, **filterable**. Never wonder "what happened?" again.

### 🖥️ **System Performance Metrics**

Track CPU, memory, and network usage across your agent infrastructure. Catch performance bottlenecks **before** they cause failures.

### 🔔 **Smart Alerts & Notifications**

Instant desktop notifications for task completions, errors, and state changes. Full **notification center** with grouping, mark-read, and tab navigation.

### 📤 **One-Click Data Export**

Export any team's tasks and inbox messages as **JSON or CSV** directly from the header. Full data portability built-in.

### 📱 **PWA — Installable & Offline-Ready**

Works as a **Progressive Web App** — add to your home screen, get an app icon, and keep viewing cached data when the server is temporarily unreachable.

### 🔒 **Enterprise-Grade Security**

Audited by 6 security specialists. OWASP scrypt password hashing, auth rate limiting, token rotation, tight CSP, CORP/COOP, Permissions-Policy, strict input validation on every route, WebSocket heartbeat + rate limiting, and `followSymlinks: false` on all file watchers. Zero npm vulnerabilities.

</td>
</tr>
</table>

> 📘 **Deep dive**: See [**FEATURES.md**](FEATURES.md) for the complete feature breakdown with architecture details.

---

## 🚀 Quick Start

### ✅ Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))

### ⚡ Install via npm (Recommended)

```bash
npm install -g claude-team-dashboard
claude-dashboard
```

Or run without installing:

```bash
npx claude-team-dashboard
```

Open **http://localhost:3001** and you're monitoring agents in real time.

### 🛠️ Clone & Build (Development)

```bash
# 1. Clone the repo
git clone https://github.com/mukul975/claude-team-dashboard.git
cd claude-team-dashboard

# 2. Install dependencies
npm install

# 3. Build the frontend
npm run build

# 4. Start the dashboard
npm start
```

Open **http://localhost:3001** and you're monitoring agents in real time.

### 🔒 Password Authentication

The dashboard **always requires a password**. The first time you open it, you'll see a setup screen — create your password there. After that, you'll be asked for it on every visit.

**First run:**
```
npm start
→ open http://localhost:3001
→ "Set Up Dashboard" screen appears
→ enter and confirm your password
→ dashboard unlocks
```

**Every run after that:**
```
npm start
→ open http://localhost:3001
→ login screen appears
→ enter your password
→ dashboard unlocks
```

Your password is stored as a secure `scrypt` hash in `~/.claude/dashboard.key`. The session token lives in `sessionStorage` and clears when the browser tab closes.

### 🎁 Dev Container (Instant Environment)

Have VS Code + Docker? **Skip setup entirely**:

1. Open project in VS Code
2. Click "Reopen in Container" when prompted
3. Everything auto-installs. You're ready.

### 🧑‍💻 Development Mode

To work on the frontend with hot-reload:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend dev server
npm run dev
```

**What gets monitored automatically:**
- `~/.claude/teams/` — Active agent teams
- `~/.claude/tasks/` — Task management
- `/tmp/claude/{project}/tasks/` — Agent outputs

---

## 🎬 Demo

<!-- VIDEO/GIF PLACEHOLDER -->
> **🎥 Demo video coming soon** — Watch a 2-minute walkthrough of key features

**Try it yourself**: Clone the repo and run `npm start` — see your agent team in action within 60 seconds.

---

## 🏗️ How It Works

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                │
│  ├── Real-time UI components                            │
│  ├── WebSocket client                                   │
│  └── State management                                   │
└────────────────┬────────────────────────────────────────┘
                 │ WebSocket (bidirectional)
┌────────────────▼────────────────────────────────────────┐
│  Backend (Node.js + Express)                            │
│  ├── WebSocket server                                   │
│  ├── Agent event aggregation                            │
│  └── File system monitoring (chokidar)                  │
└────────────────┬────────────────────────────────────────┘
                 │ Reads agent logs
┌────────────────▼────────────────────────────────────────┐
│  Claude Code Agent Teams                                │
│  ├── ~/.claude/projects/{project}/*.jsonl               │
│  └── Real-time agent session logs                       │
└─────────────────────────────────────────────────────────┘
```

## 📬 Inbox Monitoring

### How Claude Code Agent Teams Communicate

When Claude Code creates a team, it creates this folder structure:
```
~/.claude/teams/
└── {team-name}/
    ├── config.json          ← team configuration & members
    └── inboxes/
        ├── team-lead.json   ← messages for team-lead
        ├── researcher.json  ← messages for researcher
        └── ...              ← one file per agent
```

Each inbox file is a JSON array of messages:
```json
[
  {
    "from": "team-lead",
    "text": "Your task assignment...",
    "summary": "Brief summary",
    "timestamp": "2026-02-18T10:00:00.000Z",
    "read": false,
    "color": "green"
  }
]
```

### Real-Time Inbox Monitoring

The dashboard watches `~/.claude/teams/*/inboxes/*.json` with a dedicated chokidar watcher. Every time an inbox file changes:
- The new messages are read immediately
- An `inbox_update` WebSocket event is pushed to all connected dashboard clients
- The UI updates in real-time — no polling required

On initial connection, `allInboxes` is included in the `initial_data` payload so you see all current messages instantly.

### What the Dashboard Shows

| Feature | Description |
|---------|-------------|
| **Inbox Viewer** | Browse all teams → agents → message threads |
| **Unread Badges** | Red badge on team cards and Inboxes tab |
| **Activity Timeline** | All agent messages in chronological order |
| **Desktop Notifications** | Browser notifications for new messages |
| **Search** | Full-text search across all messages |
| **Export** | Download messages as JSON or CSV |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/inboxes` | All teams' inboxes at once |
| `GET /api/teams/:teamName/inboxes` | All agents' inboxes for one team |
| `GET /api/teams/:teamName/inboxes/:agentName` | Specific agent's inbox |

### WebSocket Events

```js
// On connect — full inbox snapshot
{ type: 'initial_data', allInboxes: { [teamName]: { [agentName]: { messages, messageCount } } } }

// On inbox change — targeted update
{ type: 'inbox_update', teamName: string, inboxes: { [agentName]: { messages, messageCount } } }
```

---

### Project Structure

```
claude-team-dashboard/
├── src/                      # Frontend source code
│   ├── components/           # React UI components
│   │   ├── InboxViewer.jsx       # Browse agent inbox messages
│   │   └── TeamTimeline.jsx      # Chronological activity timeline
│   ├── hooks/                # Custom React hooks
│   │   └── useInboxNotifications.js  # Browser notifications for new messages
│   ├── utils/                # Shared utilities
│   │   ├── messageParser.js      # Natural language message parsing
│   │   └── formatting.js         # Time, color, initials utilities
│   ├── config/               # Configuration constants
│   ├── styles/               # CSS stylesheets
│   └── test/                 # Test setup
├── .devcontainer/            # VS Code dev container config
├── .github/                  # GitHub templates & workflows
│   └── workflows/            # CI/CD pipelines
├── test/                     # Test files
├── dist/                     # Production build output
├── server.js                 # WebSocket backend server
├── start.js                  # Launcher script
├── cleanup.js                # Process cleanup utility
├── config.js                 # Server configuration
├── vite.config.js            # Vite bundler config
├── FEATURES.md               # Detailed feature list
├── CONTRIBUTING.md           # Contribution guide
└── CODE_OF_CONDUCT.md        # Community standards
```

---

## 🛠️ Built With

<table>
<tr>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br><strong>React 19.2</strong>
<br><sub>UI Framework</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js" />
<br><strong>Node.js 18+</strong>
<br><sub>Backend Runtime</sub>
</td>
<td align="center" width="25%">
<img src="https://vitejs.dev/logo.svg" width="48" height="48" alt="Vite" />
<br><strong>Vite 7.x</strong>
<br><sub>Build Tool</sub>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="48" height="48" alt="JavaScript" />
<br><strong>JavaScript ES6+</strong>
<br><sub>Core Language</sub>
</td>
</tr>
</table>

**Core Technologies:**

- **WebSocket (ws)** — Real-time bidirectional communication
- **Express.js** — Backend API framework
- **Chokidar** — File system monitoring for agent logs
- **Lucide React** — Icon library
- **Vitest** — Unit testing framework

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [**FEATURES.md**](FEATURES.md) | Complete feature breakdown with technical architecture |
| [**NATURAL_LANGUAGE_AND_LIFECYCLE.md**](NATURAL_LANGUAGE_AND_LIFECYCLE.md) | **📖 Comprehensive guide** to message parsing and team lifecycle tracking |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | How to contribute — setup, coding standards, PR process |
| [**CODE_OF_CONDUCT.md**](CODE_OF_CONDUCT.md) | Community guidelines and standards |
| [**Natural Language Features**](#-natural-language-message-parsing) | How the dashboard translates technical agent messages to readable format |
| [**Team Lifecycle Tracking**](#-team-lifecycle-tracking) | Automatic team monitoring, archiving, and history management |

**Need help?** Open a [Discussion](https://github.com/mukul975/claude-team-dashboard/discussions) or check existing [Issues](https://github.com/mukul975/claude-team-dashboard/issues).

---

## 💬 Natural Language Message Parsing

One of the dashboard's most powerful features is its ability to **automatically translate technical agent messages into human-readable natural language**. This makes it easy to understand what your agents are doing without decoding JSON or technical jargon.

### How It Works

The dashboard intelligently parses inter-agent messages and converts them from raw technical format to friendly, contextual descriptions:

#### Message Type Detection

The parser automatically identifies message types and formats them appropriately:

**Status Updates**
```json
// Raw message:
{"type": "idle_notification", "lastTaskSubject": "Fix authentication bug"}

// Displayed as:
💤 Finished "Fix authentication bug" - ready for next task
```

**Task Completions**
```json
// Raw message:
{"type": "task_completed", "taskSubject": "Write documentation"}

// Displayed as:
✅ Completed: Write documentation
```

**Task Assignments**
```json
// Raw message:
{"type": "task_assigned", "taskSubject": "Review pull request"}

// Displayed as:
📋 Started working on: Review pull request
```

**Coordination Messages**
```json
// Raw message:
{"type": "coordination", "message": "Waiting for backend team to finish API endpoint"}

// Displayed as:
🤝 Waiting for backend team to finish API endpoint
```

**Questions**
```json
// Raw message:
{"type": "question", "message": "Should I use the staging or production database?"}

// Displayed as:
❓ Should I use the staging or production database?
```

### Message Classification

Messages are automatically categorized into four types with distinct visual styling:

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| **Status** | 📊 | Blue | General updates, progress reports, idle notifications |
| **Completion** | ✅ | Green | Task completions, success notifications |
| **Coordination** | 🤝 | Purple | Team communication, help requests, discussions |
| **Question** | ❓ | Yellow | Questions requiring attention or clarification |

### Smart Features

**Summary Prioritization**: If a message includes a `summary` field, the dashboard displays it instead of the full technical content, making messages more concise.

**Truncation**: Long messages are automatically truncated to 150 characters with "..." to prevent UI clutter.

**Fallback Handling**: If a message can't be parsed as JSON, it's displayed as-is with intelligent handling of empty or malformed messages.

**Real-Time Translation**: Messages are parsed and displayed instantly as they arrive via WebSocket — no delays or batch processing.

### Viewing Messages

The dashboard provides two views for agent communication:

**1. Live Communication Panel** (`LiveCommunication.jsx`)
- Chat-style interface showing conversation flow
- Team selector to focus on specific team messages
- Auto-scroll feature (can be toggled)
- Shows sender → recipient for each message
- Updates every 5 seconds

**2. Agent Inter-Communication Stream** (`RealTimeMessages.jsx`)
- Aggregated view across all teams
- Filter messages by type (all, status, completion, coordination, question)
- Displays last 100 messages across all teams
- Shows team context for each message
- Visual stats showing breakdown by message type

### Technical Implementation

The parsing logic is located in:
- **File**: `src/components/RealTimeMessages.jsx` (lines 8-83)
- **Function**: `parseMessageToNatural(text, summary)`

**Message Sources**: Messages are fetched from the Claude Code inbox files:
```
~/.claude/teams/{team-name}/inboxes/{agent-name}.json
```

**API Endpoints**:
- `GET /api/teams/:teamName/inboxes` - Get all inboxes for a team
- `GET /api/teams/:teamName/inboxes/:agentName` - Get specific agent's inbox

### Example: Message Flow

```
1. Agent sends technical message
   → Claude Code writes to ~/.claude/teams/my-team/inboxes/agent-1.json

2. Dashboard fetches message via API
   → GET /api/teams/my-team/inboxes

3. Parser processes message
   → parseMessageToNatural(rawMessage)

4. Natural language message displayed
   → "💤 Finished 'Fix bug' - ready for next task"
```

### Benefits

- **No Technical Knowledge Required**: Anyone can understand what agents are doing
- **Quick Status Checks**: Glance at communication panel to see team progress
- **Contextual Understanding**: Message types provide instant context
- **Reduced Cognitive Load**: No need to parse JSON or technical logs
- **Instant Clarity**: Messages are translated in real-time as they arrive

---

## 🔄 Team Lifecycle Tracking

The dashboard automatically tracks the **complete lifecycle of every agent team** from creation to completion, with automatic archiving for historical reference.

### Automatic Team Monitoring

The dashboard watches the Claude Code teams directory (`~/.claude/teams/`) in real-time and tracks:

**Team Creation**
- Automatically detected when a new `config.json` appears
- Logs creation timestamp
- Starts activity monitoring
- Console notification: `🎉 New team created: {team-name}`

**Team Activity**
- Tracks every configuration change
- Updates "last seen" timestamp
- Monitors task progress
- Records all agent actions
- Console notification: `🔄 Team active: {team-name}`

**Team Completion**
- Detected when team directory is removed
- Triggers automatic archiving
- Records final state
- Calculates session duration
- Console notification: `👋 Team completed: {team-name} - archiving for reference...`

### Automatic Archiving System

When a team completes its work, the dashboard **automatically archives all team data** for future reference.

#### What Gets Archived

**Complete Team Snapshot**:
- Team configuration (name, description, lead, members)
- All tasks (subject, description, status, owner, dependencies)
- Team statistics (member count, task counts, completion rate)
- Lifecycle metadata (created date, duration, last activity)

**Natural Language Summary**:
```json
{
  "teamName": "dashboard-devops",
  "archivedAt": "2026-02-10T15:30:00.000Z",
  "summary": {
    "overview": "Team 'dashboard-devops' with 4 members worked on 12 tasks and completed 10.",
    "created": "Started on 02/10/2026",
    "members": [
      "team-lead (general-purpose)",
      "backend-dev (general-purpose)",
      "ui-polish-dev (general-purpose)",
      "archive-viewer-dev (general-purpose)"
    ],
    "accomplishments": [
      "✅ Fix Communication tab to display natural language messages properly",
      "✅ Verify and improve team lifecycle archiving",
      "✅ Polish dashboard UI for better user experience",
      "✅ Add archive viewer component to frontend",
      "✅ Test all features and fix empty task outputs",
      "✅ Document natural language features and team lifecycle",
      "✅ Create archive viewer UI component",
      "✅ Add API endpoint for retrieving archives",
      "✅ Test archive functionality end-to-end",
      "✅ Write comprehensive documentation"
    ],
    "duration": "Active for 45 minutes"
  },
  "rawData": {
    // Complete team data for detailed analysis
  }
}
```

#### Archive Storage

**Location**: `~/.claude/archive/`

**File Naming**: `{team-name}_{timestamp}.json`
- Example: `dashboard-devops_2026-02-10T15-30-00-000Z.json`
- Timestamp in ISO format with colons replaced by hyphens (filesystem-safe)

**Automatic Creation**: Archive directory is created automatically if it doesn't exist

#### Duration Tracking

The dashboard calculates how long each team was active:

```javascript
// Example console output:
"📊 Team 'dashboard-devops' was active for 45 minutes"
```

**Tracking Method**:
1. Team created → Start timestamp recorded
2. Team activity → Last seen timestamp updated
3. Team completed → Duration calculated from timestamps
4. Duration included in archive summary

### Archive Viewer (API)

Access archived team data programmatically:

**Get All Archives**
```http
GET /api/archive
```

**Response**:
```json
{
  "archives": [
    {
      "filename": "dashboard-devops_2026-02-10T15-30-00-000Z.json",
      "overview": "Team 'dashboard-devops' with 4 members worked on 12 tasks and completed 10.",
      "created": "Started on 02/10/2026",
      "members": ["team-lead (general-purpose)", "..."],
      "accomplishments": ["✅ Task 1", "✅ Task 2", "..."],
      "duration": "Active for 45 minutes",
      "archivedAt": "2026-02-10T15:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Get Specific Archive**
```http
GET /api/archive/{filename}
```

**Response**: Complete archive including raw data

### Team History Tracking

The **Team History** feature provides a complete chronological view of all teams:

**API Endpoint**:
```http
GET /api/team-history
```

**Response**:
```json
{
  "history": [
    {
      "name": "dashboard-devops",
      "config": { /* team config */ },
      "tasks": [ /* all tasks */ ],
      "createdAt": "2026-02-10T14:45:00.000Z",
      "lastModified": "2026-02-10T15:30:00.000Z",
      "isActive": false
    }
  ]
}
```

**Features**:
- Shows all teams (active and completed)
- Sorted by last modified (most recent first)
- Includes creation and modification timestamps
- Active status indicator

### Real-Time Notifications

The dashboard provides console notifications for all lifecycle events:

```
🎉 New team created: dashboard-devops
🔄 Team active: dashboard-devops
✨ New task created: task-123.json
📝 Task updated: task-123.json
✅ Task completed/removed: task-123.json
👋 Team completed: dashboard-devops - archiving for reference...
📦 Team archived: dashboard-devops → /home/user/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json
📊 Team "dashboard-devops" was active for 45 minutes
```

### File System Watchers

The lifecycle tracking is powered by three independent watchers:

**1. Team Watcher** (`~/.claude/teams/**/*.json`)
- Monitors: `config.json` files
- Triggers: Team creation, updates, completion

**2. Task Watcher** (`~/.claude/tasks/**/*.json`)
- Monitors: Individual task files
- Triggers: Task creation, updates, completion

**3. Output Watcher** (`/tmp/claude/{project}/tasks/*.output`)
- Monitors: Agent output files
- Triggers: Agent activity updates

**Watch Options** (configurable in `config.js`):
```javascript
{
  persistent: true,         // Keep process running
  ignoreInitial: true,      // Don't trigger on startup
  usePolling: true,         // Use polling for cross-platform reliability
  interval: 1000,           // Polling interval (ms)
  depth: 10,                // Directory depth limit
  awaitWriteFinish: {       // Wait for complete writes
    stabilityThreshold: 500,
    pollInterval: 100
  }
}
```

### Security Features

The dashboard was audited by a team of 6 security specialists. Every layer has been hardened:

#### 🔐 Authentication
- **First-time setup screen** — set your password in the browser on first run; stored as an `scrypt` hash (`N=16384, r=8, p=1` — OWASP recommended) in `~/.claude/dashboard.key` (`chmod 600`)
- **Token rotation** — a fresh 256-bit random token is issued on every successful login
- **Timing-safe comparison** — `crypto.timingSafeEqual` used for both password and token validation (prevents timing attacks)
- **Auth rate limiter** — max 5 login/setup attempts per IP per 15 minutes (separate from the global limiter)
- **sessionStorage** — token clears on tab close; acceptable tradeoff for a localhost tool
- **Key file permission check** — warns on startup if `dashboard.key` is world-readable

#### 🛡️ HTTP Security Headers
- **CSP** — strict allowlist: `default-src 'self'`, explicit `connect-src`/`img-src`/`font-src`, `frame-ancestors 'none'`, `object-src 'none'`
- **CORP / COOP** — `Cross-Origin-Resource-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`
- **HSTS** — `max-age=31536000; includeSubDomains`
- **Referrer-Policy** — `strict-origin-when-cross-origin`
- **Permissions-Policy** — `camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- **Helmet** — `noSniff`, `frameguard: deny`, `xssFilter` all enabled

#### 🔍 Input Validation
- **Strict sanitization** — `sanitizeTeamName()`, `sanitizeAgentName()`, `sanitizeFileName()` enforce `[a-zA-Z0-9_.-]` allowlist with 100-char max on every route param
- **Exact-match validation** — every parameterized route returns 400 if sanitized value ≠ original (catches partial encoding attacks)
- **Content-Type enforcement** — POST requests without `application/json` get 415
- **Body type checking** — rejects arrays, nulls, and non-object bodies on all POST endpoints
- **ReDoS-safe search** — uses `String.indexOf()` not regex; 200-char query limit

#### 🔌 WebSocket
- **Token always required** — connection closed with 4001 if no valid token in query string
- **Ping/pong heartbeat** — 30s interval, 10s pong timeout; dead clients terminated
- **Per-connection rate limit** — 50 messages/sec max; exceeding closes with code 1008
- **Message size limit** — 64 KB max; exceeding closes with code 1009
- **Connection audit log** — IP logged on connect/disconnect/error

#### 📁 File System
- **`validatePath()` on every fs call** — uses `path.resolve()` to block all path traversal
- **No symlink following** — `followSymlinks: false` on all 5 chokidar watchers
- **Log injection prevention** — team names sanitized before appearing in log output

#### 🌐 Network
- **CORS** — restricted to `localhost:3001` and `localhost:5173` only; no wildcard origins
- **Rate limiting** — global limiter on all `/api/` routes
- **Error hardening** — global error handler never leaks stack traces or internal messages

**Read-Only**: The dashboard never modifies Claude Code files — it only reads and archives data.

### Use Cases

**Project Retrospectives**: Review what a team accomplished and how long it took

**Performance Analysis**: Track team efficiency across multiple projects

**Audit Trails**: Maintain records of all agent activities for compliance

**Learning**: Study successful team patterns and task breakdowns

**Recovery**: Restore team context if needed from archived data

### Benefits

- **Zero Configuration**: Archiving happens automatically — nothing to set up
- **Complete History**: Never lose team data when a project completes
- **Natural Language**: Archive summaries are human-readable
- **Forensic Analysis**: Full raw data included for detailed investigation
- **Storage Efficient**: JSON format with automatic cleanup of old archives (future feature)
- **Fast Retrieval**: Timestamped filenames for easy chronological sorting

---

## 🗺️ Roadmap

### ✅ Recently Shipped

- [x] **Full security audit (6-expert team)** — OWASP scrypt auth, auth rate limiting, token rotation, tight CSP, CORP/COOP, Permissions-Policy, strict input validation on every route, WebSocket heartbeat + rate limiting + size limits, `followSymlinks: false` on all watchers, 0 npm vulnerabilities
- [x] **First-time setup flow** — open dashboard → set your password in the browser → hash stored in `~/.claude/dashboard.key` → login on every subsequent visit; WebSocket reconnects immediately after login (no backoff delay)
- [x] **Password auth (always on)** — scrypt hash with OWASP params, timing-safe comparison, token rotation, 5-attempt rate limit per IP
- [x] **Tailwind v4 + code splitting** — `@tailwindcss/vite` installed; 4 heavy components lazy-loaded, cutting initial JS bundle by ~50 kB
- [x] **Expanded test suite** — 223 tests across 15 files covering all 4 custom hooks, key components, and utility functions
- [x] **Full accessibility audit** — 50+ buttons with `aria-label`, interactive divs with `role`/`tabIndex`/`onKeyDown`, `aria-live` on status components, `role="alert"` on error states, focus management in modals
- [x] **Security hardening** — server.js: fixed wrong sanitizer on inbox route, patched error message leakage in global handler, added path validation on archive listing, consistent error responses across all endpoints
- [x] **Complete inline styles migration** — All 30+ components now use React inline `style={{}}` for every sizing, color, animation, and layout value — no broken Tailwind arbitrary values remain
- [x] **Production code cleanup** — Removed 5 debug `console.log` statements from `useWebSocket.js`; cleaned unused imports across multiple components
- [x] **Light / Dark mode** — Full CSS-variable-based theme system; every component, card, chart, modal, and toast adapts instantly
- [x] **Export reports** — CSV & JSON export for tasks and inbox messages via the header Export menu
- [x] **Performance analytics** — Analytics panel with historical charts, team comparison, and performance scoring
- [x] **Keyboard shortcuts** — Command palette (`⌘K`), tab hotkeys (`⌘1–8`), shortcuts reference modal (`?`)
- [x] **Notification center** — Grouped notification tray (Just Now / Today / Earlier) with mark-read, clear-all, and direct tab navigation
- [x] **PWA support** — Installable progressive web app with offline caching via Service Worker
- [x] **Agent network graph** — Live D3 force-directed graph of inter-agent communication flows
- [x] **Task dependency graph** — Visual map of which tasks block which across the whole team
- [x] **Team comparison** — Side-by-side performance view across multiple active teams
- [x] **Skeleton loaders** — Smooth loading states instead of blank panels on first connect

### 🎯 Planned Features

- [ ] **Multi-project workspace** — Switch between multiple Claude projects in one dashboard
- [ ] **Custom alerts** — Webhook integrations (Slack, Discord, email)
- [ ] **Plugin system** — Extensible architecture for custom visualizations
- [ ] **Docker deployment** — One-command containerised setup
- [ ] **Agent replay** — Rewind and replay agent sessions for debugging
- [ ] **Collaborative mode** — Share dashboards with team members

### 💡 Have an Idea?

We prioritize features based on community feedback. [**Open a feature request →**](https://github.com/mukul975/claude-team-dashboard/issues/new?template=feature_request.yml)

---

## 🤝 Contributing

We love contributions! Whether you're fixing bugs, adding features, or improving docs — **every contribution matters**.

### 🚀 Quick Contribution Guide

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/claude-team-dashboard.git

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes & commit
git commit -m "feat: add amazing feature"

# 4. Push & create PR
git push origin feature/amazing-feature
```

**📖 Read the full guide**: [**CONTRIBUTING.md**](CONTRIBUTING.md)

### 🌟 Ways to Contribute

- 🐛 **Report bugs** — Use the [bug report template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=bug_report.yml)
- ✨ **Suggest features** — Use the [feature request template](https://github.com/mukul975/claude-team-dashboard/issues/new?template=feature_request.yml)
- 📝 **Improve docs** — Fix typos, add examples, clarify instructions
- 🧪 **Write tests** — Increase code coverage and reliability
- 🎨 **Design improvements** — UI/UX enhancements welcome

**First time contributing?** Check out issues labeled [`good first issue`](https://github.com/mukul975/claude-team-dashboard/labels/good%20first%20issue).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**TL;DR**: Free to use, modify, and distribute. Commercial use allowed. Just keep the license notice.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mukul975/claude-team-dashboard&type=Date)](https://star-history.com/#mukul975/claude-team-dashboard&Date)

---

<div align="center">

---

### ⭐ If This Helps You — Star It!

**Starring helps others discover this project.** It takes 2 seconds and makes a huge difference.

[![GitHub stars](https://img.shields.io/github/stars/mukul975/claude-team-dashboard?style=social)](https://github.com/mukul975/claude-team-dashboard/stargazers)

---

**Built by [Mahipal](https://www.mahipal.engineer)**

_Maintained by [@mukul975](https://github.com/mukul975) — cybersecurity researcher, AI agent enthusiast_

</div>
