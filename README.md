<div align="center">

# 🤖 Claude Agent Dashboard

### Stop Flying Blind — Monitor Your Claude Code Agent Teams in Real Time

[![npm version](https://img.shields.io/npm/v/claude-team-dashboard.svg?style=flat&color=blue)](https://www.npmjs.com/package/claude-team-dashboard)
[![npm downloads](https://img.shields.io/npm/dm/claude-team-dashboard.svg?style=flat&color=brightgreen)](https://www.npmjs.com/package/claude-team-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mukul975/claude-team-dashboard/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-58%25-F7DF1E.svg?logo=javascript&logoColor=black)](https://github.com/mukul975/claude-team-dashboard)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101.svg?logo=socketdotio&logoColor=white)](https://github.com/mukul975/claude-team-dashboard)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mukul975/claude-team-dashboard/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/mukul975/claude-team-dashboard?style=social)](https://github.com/mukul975/claude-team-dashboard)

**Monitor, track, and orchestrate** your [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) agent teams from a **single, unified dashboard** — with **zero-delay WebSocket streaming**.

[**Get Started in 60 Seconds**](#-quick-start) · [**See Features**](#-features) · [**Live Demo**](#-demo) · [**Docs**](#-documentation) · [**Contributing**](#-contributing)

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

</td>
<td width="50%">

### 📊 **Live Activity Chronology**

Every agent action — **timestamped**, **color-coded**, **filterable**. Never wonder "what happened?" again.

### 🖥️ **System Performance Metrics**

Track CPU, memory, and network usage across your agent infrastructure. Catch performance bottlenecks **before** they cause failures.

### 🔔 **Smart Alerts & Notifications**

Instant desktop notifications for task completions, errors, and state changes. **Never miss critical events**.

</td>
</tr>
</table>

> 📘 **Deep dive**: See [**FEATURES.md**](FEATURES.md) for the complete feature breakdown with architecture details.

---

## 🚀 Quick Start

### ⚡ 60-Second Setup (npm Package)

Install and run with a single command:

```bash
# Install globally
npm install -g claude-team-dashboard

# Launch dashboard
claude-dashboard
```

**Or use npx** (no installation required):

```bash
npx claude-team-dashboard
```

**That's it.** Open **http://localhost:5173** and you're monitoring agents in real time.

---

### 🛠️ Development Setup (From Source)

Want to contribute or customize? Clone and develop locally:

```bash
# 1. Clone and enter
git clone https://github.com/mukul975/claude-team-dashboard.git
cd claude-team-dashboard

# 2. Install dependencies
npm install

# 3. Launch dashboard (starts both frontend + backend)
npm start
```

### 🎁 Dev Container (Instant Environment)

Have VS Code + Docker? **Skip setup entirely**:

1. Open project in VS Code
2. Click "Reopen in Container" when prompted
3. Everything auto-installs. You're ready.

### 📦 Alternative Package Managers

```bash
# Using Yarn
yarn global add claude-team-dashboard
claude-dashboard

# Using pnpm
pnpm add -g claude-team-dashboard
claude-dashboard
```

### ✅ Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)

### 🖥️ CLI Usage

Once installed, the `claude-dashboard` command is available globally:

```bash
# Start the dashboard
claude-dashboard

# The dashboard will:
# ✓ Start backend server on http://localhost:3001
# ✓ Start frontend on http://localhost:5173
# ✓ Auto-watch ~/.claude/teams for agent activity
# ✓ Stream real-time updates via WebSocket

# Stop with Ctrl+C
```

**What gets monitored:**
- `~/.claude/teams/` - Active agent teams
- `~/.claude/tasks/` - Task management
- `/tmp/claude/{project}/tasks/` - Agent outputs

**Automatic features:**
- Team lifecycle tracking
- Auto-archiving on completion
- Real-time message parsing
- WebSocket streaming

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

### Project Structure

```
claude-team-dashboard/
├── src/                      # Frontend source code
│   ├── components/           # React UI components
│   ├── hooks/                # Custom React hooks
│   ├── config/               # Configuration constants
│   ├── styles/               # CSS stylesheets
│   └── test/                 # Test setup
├── .devcontainer/            # VS Code dev container config
├── .github/                  # GitHub templates & workflows
│   ├── ISSUE_TEMPLATE/       # Bug/feature issue forms
│   └── workflows/            # CI/CD pipelines
├── test/                     # Test files
├── dist/                     # Production build output
├── server.js                 # WebSocket backend server
├── start.js                  # Unified launcher script (CLI entry)
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
      "archivedAt": "2026-02-10T15:30:00.000Z",
      "fullPath": "/home/user/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json"
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

**3. Output Watcher** (`/tmp/claude/D--agentdashboard/tasks/*.output`)
- Monitors: Agent output files
- Triggers: Agent activity updates

**Watch Options** (configurable in `config.js`):
```javascript
{
  persistent: true,         // Keep process running
  ignoreInitial: true,      // Don't trigger on startup
  usePolling: false,        // Use native events (faster)
  interval: 100,            // Polling interval if needed
  awaitWriteFinish: {       // Wait for complete writes
    stabilityThreshold: 200,
    pollInterval: 50
  }
}
```

### Security Features

**Path Sanitization**: All team names and file paths are sanitized to prevent path traversal attacks:
```javascript
// Only allows: a-zA-Z0-9_-
// Rejects: ../, ./, path separators, control characters
```

**Validation**: Archive file paths are validated to ensure they're within allowed directories:
```javascript
validatePath(filePath, ARCHIVE_DIR)
```

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

### 🎯 Planned Features

- [ ] **Multi-project workspace** — Switch between multiple Claude projects in one dashboard
- [ ] **Performance analytics** — Historical charts, trends, bottleneck detection
- [ ] **Custom alerts** — Webhook integrations (Slack, Discord, email)
- [ ] **Theme switcher** — Dark/light mode with custom color schemes
- [ ] **Export reports** — PDF/CSV exports for task summaries and metrics
- [ ] **Plugin system** — Extensible architecture for custom visualizations
- [ ] **Docker deployment** — One-command containerized setup
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
git clone https://github.com/YOUR_USERNAME/agentdashboard.git

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
