# Natural Language Message Parsing & Team Lifecycle Documentation

## Table of Contents

1. [Natural Language Message Parsing](#natural-language-message-parsing)
   - [Overview](#overview)
   - [Message Type Detection](#message-type-detection)
   - [Message Classification](#message-classification)
   - [Smart Features](#smart-features)
   - [Technical Implementation](#technical-implementation)
   - [API Reference](#api-reference)
   - [Code Examples](#code-examples)

2. [Team Lifecycle Tracking](#team-lifecycle-tracking)
   - [Overview](#team-lifecycle-overview)
   - [Automatic Monitoring](#automatic-team-monitoring)
   - [Archive System](#automatic-archiving-system)
   - [API Reference](#lifecycle-api-reference)
   - [File System Watchers](#file-system-watchers)
   - [Security Features](#security-features)

3. [Usage Guide](#usage-guide)
   - [Viewing Messages](#viewing-messages)
   - [Accessing Archives](#accessing-archives)
   - [Monitoring Team Activity](#monitoring-team-activity)

4. [Advanced Topics](#advanced-topics)
   - [Custom Message Parsers](#custom-message-parsers)
   - [Archive Management](#archive-management)
   - [Performance Tuning](#performance-tuning)

---

## Natural Language Message Parsing

### Overview

The Claude Agent Dashboard automatically translates **technical agent messages into human-readable natural language**. This feature eliminates the need to parse JSON, decode technical logs, or interpret cryptic status codes.

**Key Benefits:**
- ✅ Instant comprehension of agent activities
- ✅ No technical expertise required
- ✅ Real-time translation as messages arrive
- ✅ Context-aware formatting
- ✅ Visual categorization by message type

### Message Type Detection

The parser intelligently identifies message types and formats them appropriately.

#### 1. Status Updates / Idle Notifications

**Input (JSON)**:
```json
{
  "type": "idle_notification",
  "lastTaskSubject": "Fix authentication bug",
  "agentId": "agent-123",
  "timestamp": "2026-02-10T15:30:00.000Z"
}
```

**Output (Natural Language)**:
```
💤 Finished "Fix authentication bug" - ready for next task
```

**Alternative (No Previous Task)**:
```json
{
  "type": "idle_notification",
  "agentId": "agent-123",
  "timestamp": "2026-02-10T15:30:00.000Z"
}
```

**Output**:
```
💤 Available and waiting for assignment
```

#### 2. Task Completions

**Input**:
```json
{
  "type": "task_completed",
  "taskSubject": "Write comprehensive documentation",
  "taskId": "task-456",
  "completedBy": "doc-writer",
  "timestamp": "2026-02-10T16:00:00.000Z"
}
```

**Output**:
```
✅ Completed: Write comprehensive documentation
```

#### 3. Task Assignments

**Input**:
```json
{
  "type": "task_assigned",
  "taskSubject": "Review pull request #42",
  "assignedTo": "code-reviewer",
  "timestamp": "2026-02-10T14:15:00.000Z"
}
```

**Output**:
```
📋 Started working on: Review pull request #42
```

#### 4. Questions

**Input**:
```json
{
  "type": "question",
  "message": "Should I use the staging or production database for this migration?",
  "from": "backend-dev",
  "to": "team-lead",
  "timestamp": "2026-02-10T15:45:00.000Z"
}
```

**Output**:
```
❓ Should I use the staging or production database for this migration?
```

#### 5. Coordination Messages

**Input**:
```json
{
  "type": "coordination",
  "message": "Waiting for backend team to finish API endpoint before proceeding",
  "from": "frontend-dev",
  "blockedBy": "backend-dev",
  "timestamp": "2026-02-10T15:20:00.000Z"
}
```

**Output**:
```
🤝 Waiting for backend team to finish API endpoint before proceeding
```

#### 6. Error Notifications

**Input**:
```json
{
  "type": "error",
  "message": "Database connection timeout after 30 seconds",
  "severity": "high",
  "timestamp": "2026-02-10T15:50:00.000Z"
}
```

**Output**:
```
⚠️ Issue: Database connection timeout after 30 seconds
```

### Message Classification

All messages are categorized into four primary types:

| Type | Icon | Color | Border | Background | Use Case |
|------|------|-------|--------|------------|----------|
| **status** | 📊 | Blue | `border-blue-500/30` | `bg-blue-500/10` | General updates, progress reports, idle states |
| **completion** | ✅ | Green | `border-green-500/30` | `bg-green-500/10` | Task completions, success notifications |
| **coordination** | 🤝 | Purple | `border-purple-500/30` | `bg-purple-500/10` | Team communication, collaboration, help requests |
| **question** | ❓ | Yellow | `border-yellow-500/30` | `bg-yellow-500/10` | Questions requiring attention or clarification |

**Visual Example**:
```
┌─────────────────────────────────────────────┐
│ 📊 Status Update          [Blue border]     │
│ from: agent-1 → team-lead  [2 minutes ago]  │
│ Currently analyzing user authentication flow│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ✅ Completion            [Green border]      │
│ from: backend-dev         [just now]        │
│ Completed: API endpoint implementation      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🤝 Coordination         [Purple border]      │
│ from: frontend-dev → backend-dev  [5m ago]  │
│ Can you review the new component I built?   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ❓ Question             [Yellow border]      │
│ from: qa-tester → team-lead  [1 minute ago] │
│ Should we test on staging first?            │
└─────────────────────────────────────────────┘
```

### Smart Features

#### 1. Summary Prioritization

If a message includes a `summary` field, it takes precedence over the full message body:

**Input**:
```json
{
  "type": "coordination",
  "message": "I have analyzed the codebase and identified 3 potential security vulnerabilities in the authentication module. The most critical is a SQL injection vulnerability in the login endpoint at line 145 of auth.js. I recommend implementing parameterized queries and input validation immediately.",
  "summary": "Found 3 security vulnerabilities - critical SQL injection in auth.js:145",
  "from": "security-analyst",
  "timestamp": "2026-02-10T16:00:00.000Z"
}
```

**Output** (uses summary):
```
🤝 Found 3 security vulnerabilities - critical SQL injection in auth.js:145
```

**Benefit**: Keeps UI clean while preserving detailed information in hover/expand states.

#### 2. Automatic Truncation

Long messages are automatically truncated to prevent UI overflow:

**Input** (300 characters):
```json
{
  "type": "status",
  "message": "I am currently processing the user authentication flow which includes OAuth2 integration with Google and GitHub providers. The implementation requires validation of access tokens, refresh token handling, and proper session management. I have completed the Google OAuth flow and am now working on the GitHub integration which should be finished within the next 15 minutes.",
  "from": "backend-dev"
}
```

**Output** (150 characters + ellipsis):
```
📊 I am currently processing the user authentication flow which includes OAuth2 integration with Google and GitHub providers. The implementation requi...
```

#### 3. Fallback Handling

**Empty Messages**:
```json
{
  "type": "coordination",
  "message": "",
  "from": "agent-1"
}
```
**Output**: `🤝 👋 Said hello`

**Malformed JSON**:
```
This is just plain text, not JSON
```
**Output**: `This is just plain text, not JSON`

**Missing Fields**:
```json
{
  "type": "unknown_type",
  "from": "agent-1"
}
```
**Output**: `Message received`

#### 4. Real-Time Translation

Messages are parsed and displayed **instantly** as they arrive via WebSocket:

```
User Action → Claude Agent → Message File Write → File Watcher
                                                        ↓
Dashboard UI Update ← WebSocket Broadcast ← Message Parse ← File Read
        [<50ms latency]
```

### Technical Implementation

#### Parser Function

**Location**: `src/components/RealTimeMessages.jsx` (lines 8-83)

**Function Signature**:
```javascript
const parseMessageToNatural = (text, summary) => {
  // Returns: { text: string, type: string }
}
```

**Implementation Flow**:

```javascript
function parseMessageToNatural(text, summary) {
  // 1. Check for summary field
  if (summary && !summary.includes('{') && !summary.includes('idle_notification')) {
    // Determine type from summary content
    let type = 'status';
    if (summary.toLowerCase().includes('completed') || summary.includes('✓')) {
      type = 'completion';
    } else if (summary.toLowerCase().includes('question') || summary.includes('?')) {
      type = 'question';
    } else if (summary.toLowerCase().includes('coordin') || summary.toLowerCase().includes('discuss')) {
      type = 'coordination';
    }
    return { text: summary, type };
  }

  // 2. Try to parse as JSON
  try {
    const parsed = JSON.parse(text);

    // 3. Handle specific message types
    switch (parsed.type) {
      case 'idle_notification':
        return {
          text: parsed.lastTaskSubject
            ? `💤 Finished "${parsed.lastTaskSubject}" - ready for next task`
            : '💤 Available and waiting for assignment',
          type: 'status'
        };

      case 'task_completed':
        return {
          text: `✅ Completed: ${parsed.taskSubject || 'Task'}`,
          type: 'completion'
        };

      case 'task_assigned':
        return {
          text: `📋 Started working on: ${parsed.taskSubject || 'New task'}`,
          type: 'status'
        };

      case 'question':
        return {
          text: `❓ ${parsed.message || parsed.content || 'Question raised'}`,
          type: 'question'
        };

      case 'coordination':
        return {
          text: `🤝 ${parsed.message || parsed.content || 'Coordinating with team'}`,
          type: 'coordination'
        };

      default:
        return {
          text: parsed.message || parsed.content || 'Message received',
          type: 'status'
        };
    }
  } catch (e) {
    // 4. Handle non-JSON messages
    if (!text || text.trim() === '') {
      return { text: '👋 Said hello', type: 'status' };
    }

    // 5. Truncate long messages
    if (text.length > 200) {
      return {
        text: text.substring(0, 150) + '...',
        type: 'status'
      };
    }

    return { text, type: 'status' };
  }
}
```

#### Message Data Structure

**Backend (Claude Code Inbox)**:
```javascript
// ~/.claude/teams/{team-name}/inboxes/{agent-name}.json
{
  "messages": [
    {
      "text": "{\"type\":\"idle_notification\",\"lastTaskSubject\":\"Task 1\"}",
      "summary": "Finished Task 1 - ready for next task",
      "from": "team-lead",
      "timestamp": "2026-02-10T15:30:00.000Z",
      "read": false,
      "color": "blue"
    }
  ]
}
```

**Frontend (After Parsing)**:
```javascript
{
  "id": "my-team-agent-1-2026-02-10T15:30:00.000Z-0.123456",
  "from": "team-lead",
  "to": "agent-1",
  "team": "my-team",
  "type": "status",
  "message": "💤 Finished 'Task 1' - ready for next task",
  "timestamp": Date("2026-02-10T15:30:00.000Z"),
  "color": "blue",
  "read": false
}
```

### API Reference

#### Get All Team Inboxes

**Endpoint**: `GET /api/teams/:teamName/inboxes`

**Request**:
```http
GET /api/teams/dashboard-devops/inboxes HTTP/1.1
Host: localhost:3001
```

**Response**:
```json
{
  "inboxes": {
    "team-lead": {
      "messages": [
        {
          "text": "{\"type\":\"idle_notification\"}",
          "summary": "Available and waiting",
          "from": "backend-dev",
          "timestamp": "2026-02-10T15:30:00.000Z",
          "read": false
        }
      ],
      "messageCount": 1
    },
    "backend-dev": {
      "messages": [],
      "messageCount": 0
    }
  }
}
```

**Error Handling**:
```json
{
  "error": "Team not found"
}
```

#### Get Specific Agent Inbox

**Endpoint**: `GET /api/teams/:teamName/inboxes/:agentName`

**Request**:
```http
GET /api/teams/dashboard-devops/inboxes/team-lead HTTP/1.1
Host: localhost:3001
```

**Response**:
```json
{
  "agent": "team-lead",
  "messages": [
    {
      "text": "{\"type\":\"task_completed\",\"taskSubject\":\"Documentation\"}",
      "summary": "Completed: Documentation",
      "from": "doc-writer",
      "timestamp": "2026-02-10T16:00:00.000Z",
      "read": true
    }
  ],
  "messageCount": 1
}
```

**Empty Inbox**:
```json
{
  "agent": "team-lead",
  "messages": [],
  "messageCount": 0
}
```

### Code Examples

#### Example 1: Fetching and Parsing Messages

```javascript
import { parseMessageToNatural } from './utils/messageParser';

async function fetchAndDisplayMessages(teamName) {
  // Fetch messages from API
  const response = await fetch(`http://localhost:3001/api/teams/${teamName}/inboxes`);
  const data = await response.json();

  // Process each agent's inbox
  const allMessages = [];

  Object.entries(data.inboxes).forEach(([agentName, inbox]) => {
    inbox.messages.forEach(msg => {
      // Parse to natural language
      const naturalMsg = parseMessageToNatural(msg.text, msg.summary);

      allMessages.push({
        id: `${teamName}-${agentName}-${msg.timestamp}`,
        from: msg.from || agentName,
        to: agentName,
        team: teamName,
        type: naturalMsg.type,
        message: naturalMsg.text,
        timestamp: new Date(msg.timestamp),
        read: msg.read || false
      });
    });
  });

  // Sort by timestamp
  allMessages.sort((a, b) => b.timestamp - a.timestamp);

  return allMessages;
}

// Usage
const messages = await fetchAndDisplayMessages('dashboard-devops');
console.log(messages);
// [
//   {
//     id: "dashboard-devops-team-lead-2026-02-10T16:00:00.000Z",
//     from: "doc-writer",
//     to: "team-lead",
//     team: "dashboard-devops",
//     type: "completion",
//     message: "✅ Completed: Documentation",
//     timestamp: Date("2026-02-10T16:00:00.000Z"),
//     read: true
//   }
// ]
```

#### Example 2: Real-Time Message Streaming

```javascript
import { useEffect, useState } from 'react';

function useRealTimeMessages(teamName) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch immediately
    fetchMessages();

    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [teamName]);

  async function fetchMessages() {
    try {
      const response = await fetch(
        `http://localhost:3001/api/teams/${teamName}/inboxes`
      );
      const data = await response.json();

      const parsed = parseInboxData(data.inboxes, teamName);
      setMessages(parsed);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  }

  return { messages, loading };
}

// Usage in component
function MessageViewer({ teamName }) {
  const { messages, loading } = useRealTimeMessages(teamName);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {messages.map(msg => (
        <MessageCard key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

#### Example 3: Message Filtering by Type

```javascript
function MessageList({ messages }) {
  const [filter, setFilter] = useState('all');

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.type === filter);

  return (
    <div>
      {/* Filter buttons */}
      <div className="filter-buttons">
        {['all', 'status', 'completion', 'coordination', 'question'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'active' : ''}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="message-list">
        {filteredMessages.map(msg => (
          <div key={msg.id} className={`message message-${msg.type}`}>
            <div className="message-header">
              <span className="from">{msg.from}</span>
              <span className="arrow">→</span>
              <span className="to">{msg.to}</span>
              <span className="time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="message-body">{msg.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Team Lifecycle Tracking

### Team Lifecycle Overview

The dashboard automatically tracks the **complete lifecycle of every agent team** from creation to completion, with automatic archiving for historical reference.

**Lifecycle Stages**:

```
1. CREATION
   ↓ Team directory created in ~/.claude/teams/
   ↓ Dashboard detects new team
   ↓ Lifecycle tracking begins

2. ACTIVE
   ↓ Team performs tasks
   ↓ Activity monitored in real-time
   ↓ Last seen timestamp updated

3. COMPLETION
   ↓ Team directory removed
   ↓ Dashboard detects completion
   ↓ Automatic archiving triggered

4. ARCHIVED
   ↓ Complete team data saved
   ↓ Natural language summary generated
   ↓ Historical record preserved
```

### Automatic Team Monitoring

#### Detection Events

**1. Team Creation**

**Trigger**: New `config.json` file appears in `~/.claude/teams/{team-name}/`

**Actions**:
```javascript
// server.js lines 539-547
teamWatcher.on('add', async (filePath) => {
  const teamName = path.basename(path.dirname(filePath));
  if (path.basename(filePath) === 'config.json') {
    console.log(`🎉 New team created: ${teamName}`);

    // Record creation time
    teamLifecycle.set(teamName, {
      created: Date.now(),
      lastSeen: Date.now()
    });
  }

  // Broadcast update to dashboard
  const teams = await getActiveTeams();
  broadcast({ type: 'teams_update', data: teams });
});
```

**Console Output**:
```
🎉 New team created: dashboard-devops
```

**2. Team Activity**

**Trigger**: Any change to team configuration files

**Actions**:
```javascript
// server.js lines 551-559
teamWatcher.on('change', async (filePath) => {
  const teamName = path.basename(path.dirname(filePath));
  console.log(`🔄 Team active: ${teamName}`);

  // Update last seen timestamp
  if (teamLifecycle.has(teamName)) {
    teamLifecycle.get(teamName).lastSeen = Date.now();
  }

  // Broadcast update
  const teams = await getActiveTeams();
  broadcast({ type: 'teams_update', data: teams });
});
```

**Console Output**:
```
🔄 Team active: dashboard-devops
```

**3. Team Completion**

**Trigger**: `config.json` file deleted

**Actions**:
```javascript
// server.js lines 560-582
teamWatcher.on('unlink', async (filePath) => {
  const teamName = path.basename(path.dirname(filePath));

  if (path.basename(filePath) === 'config.json') {
    console.log(`👋 Team completed: ${teamName} - archiving for reference...`);

    // Get team data before it's gone
    const teams = await getActiveTeams();
    const teamData = teams.find(t => t.name === teamName);

    if (teamData) {
      // Archive the team
      await archiveTeam(teamName, teamData);

      // Calculate and log duration
      const lifecycle = teamLifecycle.get(teamName);
      if (lifecycle) {
        const duration = Math.round((Date.now() - lifecycle.created) / 1000 / 60);
        console.log(`   📊 Team "${teamName}" was active for ${duration} minutes`);
      }
    }

    // Clean up lifecycle tracking
    teamLifecycle.delete(teamName);
  }

  // Broadcast update
  const teams = await getActiveTeams();
  broadcast({ type: 'teams_update', data: teams });
});
```

**Console Output**:
```
👋 Team completed: dashboard-devops - archiving for reference...
📦 Team archived: dashboard-devops → /home/user/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json
📊 Team "dashboard-devops" was active for 45 minutes
```

### Automatic Archiving System

#### Archive Function

**Location**: `server.js` lines 60-83

**Function Signature**:
```javascript
async function archiveTeam(teamName, teamData) {
  // Returns: archiveFilePath (string)
}
```

**Implementation**:

```javascript
async function archiveTeam(teamName, teamData) {
  try {
    // 1. Generate filesystem-safe timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveFile = path.join(ARCHIVE_DIR, `${teamName}_${timestamp}.json`);

    // 2. Ensure archive directory exists
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // 3. Generate natural language summary
    const summary = {
      teamName,
      archivedAt: new Date().toISOString(),
      summary: generateTeamSummary(teamData),
      rawData: teamData
    };

    // 4. Write archive file
    await fs.writeFile(archiveFile, JSON.stringify(summary, null, 2));
    console.log(`📦 Team archived: ${teamName} → ${archiveFile}`);

    return archiveFile;
  } catch (error) {
    console.error(`Error archiving team ${teamName}:`, error);
  }
}
```

#### Summary Generation

**Location**: `server.js` lines 86-108

**Function**:
```javascript
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
      .slice(0, 10), // Top 10 accomplishments
    duration: teamData.config?.createdAt
      ? `Active for ${Math.round((Date.now() - teamData.config.createdAt) / 1000 / 60)} minutes`
      : 'Unknown duration'
  };
}
```

#### Archive File Structure

**Example Archive File**:
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
    "name": "dashboard-devops",
    "config": {
      "name": "dashboard-devops",
      "description": "DevOps team for dashboard improvements",
      "lead": {
        "name": "team-lead",
        "agentId": "agent-001",
        "agentType": "general-purpose"
      },
      "members": [
        {
          "name": "backend-dev",
          "agentId": "agent-002",
          "agentType": "general-purpose"
        },
        {
          "name": "ui-polish-dev",
          "agentId": "agent-003",
          "agentType": "general-purpose"
        },
        {
          "name": "archive-viewer-dev",
          "agentId": "agent-004",
          "agentType": "general-purpose"
        }
      ],
      "createdAt": 1707580800000
    },
    "tasks": [
      {
        "id": "task-001",
        "subject": "Fix Communication tab",
        "description": "Display natural language messages properly",
        "status": "completed",
        "owner": "backend-dev",
        "createdAt": 1707580900000,
        "completedAt": 1707581200000
      }
      // ... more tasks
    ],
    "lastUpdated": "2026-02-10T15:30:00.000Z"
  }
}
```

### Lifecycle API Reference

#### Get All Archives

**Endpoint**: `GET /api/archive`

**Request**:
```http
GET /api/archive HTTP/1.1
Host: localhost:3001
```

**Response**:
```json
{
  "archives": [
    {
      "filename": "dashboard-devops_2026-02-10T15-30-00-000Z.json",
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
        "✅ Polish dashboard UI for better user experience"
      ],
      "duration": "Active for 45 minutes",
      "archivedAt": "2026-02-10T15:30:00.000Z",
      "fullPath": "/home/user/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json"
    },
    {
      "filename": "research-team_2026-02-09T10-15-00-000Z.json",
      "overview": "Team 'research-team' with 2 members worked on 5 tasks and completed 5.",
      "created": "Started on 02/09/2026",
      "members": [
        "researcher (general-purpose)",
        "analyst (general-purpose)"
      ],
      "accomplishments": [
        "✅ Market analysis report",
        "✅ Competitor research",
        "✅ User survey compilation"
      ],
      "duration": "Active for 120 minutes",
      "archivedAt": "2026-02-09T12:15:00.000Z",
      "fullPath": "/home/user/.claude/archive/research-team_2026-02-09T10-15-00-000Z.json"
    }
  ],
  "count": 2
}
```

**Empty Archive**:
```json
{
  "archives": [],
  "count": 0
}
```

**Error Response**:
```json
{
  "error": "Failed to fetch archived teams"
}
```

#### Get Specific Archive

**Endpoint**: `GET /api/archive/:filename`

**Request**:
```http
GET /api/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json HTTP/1.1
Host: localhost:3001
```

**Response**: Complete archive file (including `rawData`)

```json
{
  "teamName": "dashboard-devops",
  "archivedAt": "2026-02-10T15:30:00.000Z",
  "summary": {
    // ... (see Archive File Structure above)
  },
  "rawData": {
    // ... (complete team data)
  }
}
```

**Not Found**:
```json
{
  "error": "Archive not found"
}
```

#### Get Team History

**Endpoint**: `GET /api/team-history`

**Request**:
```http
GET /api/team-history HTTP/1.1
Host: localhost:3001
```

**Response**:
```json
{
  "history": [
    {
      "name": "dashboard-devops",
      "config": {
        "name": "dashboard-devops",
        "description": "DevOps team for dashboard improvements",
        "lead": { /* ... */ },
        "members": [ /* ... */ ],
        "createdAt": 1707580800000
      },
      "tasks": [ /* ... */ ],
      "createdAt": "2026-02-10T14:45:00.000Z",
      "lastModified": "2026-02-10T15:30:00.000Z",
      "isActive": false
    }
  ]
}
```

### File System Watchers

The dashboard uses **Chokidar** to watch for file system changes in real-time.

#### Watcher Configuration

**Location**: `server.js` lines 519-636

**Watch Options**:
```javascript
const watchOptions = {
  persistent: true,          // Keep process running
  ignoreInitial: true,       // Don't trigger on startup
  usePolling: false,         // Use native OS events (faster)
  interval: 100,             // Polling interval (if usePolling: true)
  binaryInterval: 300,       // Binary file poll interval
  depth: 2,                  // Max recursion depth
  awaitWriteFinish: {        // Wait for complete writes
    stabilityThreshold: 200, // File size must be stable for 200ms
    pollInterval: 50         // Check every 50ms
  }
};
```

#### Three Independent Watchers

**1. Team Watcher**

**Target**: `~/.claude/teams/**/*.json`

**Events**:
- `add`: New team created (config.json appears)
- `change`: Team updated (config.json modified)
- `unlink`: Team completed (config.json deleted)

**2. Task Watcher**

**Target**: `~/.claude/tasks/**/*.json`

**Events**:
- `add`: New task created
- `change`: Task status updated
- `unlink`: Task completed/removed

**3. Output Watcher**

**Target**: `/tmp/claude/D--agentdashboard/tasks/*.output`

**Events**:
- `add`: Agent started working
- `change`: Agent output updated

#### Watcher Lifecycle

```javascript
function setupWatchers() {
  console.log('\n🔍 Setting up file watchers to track changes...');

  // Create watchers
  teamWatcher = chokidar.watch(
    path.join(TEAMS_DIR, '**/*.json'),
    watchOptions
  );

  taskWatcher = chokidar.watch(
    path.join(TASKS_DIR, '**/*.json'),
    watchOptions
  );

  outputWatcher = chokidar.watch(
    path.join(TEMP_TASKS_DIR, '*.output'),
    watchOptions
  );

  // Register event handlers
  teamWatcher
    .on('ready', () => console.log('✓ Team watcher ready'))
    .on('add', handleTeamAdd)
    .on('change', handleTeamChange)
    .on('unlink', handleTeamUnlink)
    .on('error', handleError);

  // ... similar for task and output watchers
}

// Graceful shutdown
async function shutdown() {
  if (teamWatcher) await teamWatcher.close();
  if (taskWatcher) await taskWatcher.close();
  if (outputWatcher) await outputWatcher.close();
  console.log('✓ Stopped monitoring files');
}
```

### Security Features

#### Path Sanitization

All user inputs (team names, file names) are sanitized to prevent **path traversal attacks**:

**Function**: `sanitizeTeamName(teamName)`

```javascript
function sanitizeTeamName(teamName) {
  // Reject empty or non-string
  if (!teamName || typeof teamName !== 'string') {
    throw new Error('Invalid team name');
  }

  // Reject path separators
  if (teamName.includes('/') || teamName.includes('\\') || teamName.includes(path.sep)) {
    throw new Error('Invalid team name: path separators not allowed');
  }

  // Reject parent directory references
  if (teamName.includes('..') || teamName.startsWith('.')) {
    throw new Error('Invalid team name: relative paths not allowed');
  }

  // Whitelist: only alphanumeric, dash, underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(teamName)) {
    throw new Error('Invalid team name format');
  }

  return teamName;
}
```

**Function**: `sanitizeFileName(fileName)`

```javascript
function sanitizeFileName(fileName) {
  // Same checks as sanitizeTeamName
  // Plus: use path.basename() as additional safety
  const baseName = path.basename(fileName);

  if (!/^[a-zA-Z0-9_.-]+$/.test(baseName)) {
    throw new Error('Invalid file name format');
  }

  return baseName;
}
```

#### Path Validation

Ensure constructed paths are within allowed directories:

**Function**: `validatePath(filePath, allowedDir)`

```javascript
function validatePath(filePath, allowedDir) {
  // Resolve to absolute paths
  const normalizedPath = path.resolve(filePath);
  const normalizedDir = path.resolve(allowedDir);

  // Calculate relative path
  const relativePath = path.relative(normalizedDir, normalizedPath);

  // Check if path tries to escape directory
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Path traversal attempt detected');
  }

  return normalizedPath;
}
```

**Usage**:
```javascript
// Example: Reading team config
async function readTeamConfig(teamName) {
  // 1. Sanitize user input
  const sanitizedName = sanitizeTeamName(teamName);

  // 2. Build path from sanitized input
  const teamDir = path.join(TEAMS_DIR, sanitizedName);
  const configPath = path.join(teamDir, 'config.json');

  // 3. Validate path is within allowed directory
  const validatedPath = validatePath(configPath, TEAMS_DIR);

  // 4. Read file (now safe)
  const data = await fs.readFile(validatedPath, 'utf8');
  return JSON.parse(data);
}
```

#### Read-Only Access

The dashboard **never modifies** Claude Code files:

✅ **Allowed Operations**:
- Read team configurations
- Read task files
- Read agent output files
- Read inbox messages
- Monitor file system changes

❌ **Forbidden Operations**:
- Write to team configs
- Modify tasks
- Delete agent data
- Execute commands
- Access system files outside designated directories

#### Origin Validation

WebSocket connections are validated to prevent unauthorized access:

```javascript
const wss = new WebSocket.Server({
  server,
  verifyClient: (info) => {
    const origin = info.origin || info.req.headers.origin;
    // Only allow localhost connections
    return !origin || config.CORS_ORIGINS.includes(origin);
  }
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
```

#### Rate Limiting

API endpoints are protected with rate limiting:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

---

## Usage Guide

### Viewing Messages

#### Option 1: Live Communication Panel

**Location**: Main dashboard → "Live Communication" card

**Features**:
- Chat-style interface
- Team selector dropdown
- Auto-scroll toggle
- Real-time updates (5-second polling)

**How to Use**:
```
1. Select a team from the dropdown
2. Watch messages appear in real-time
3. Toggle auto-scroll if you want to review old messages
4. Filter by clicking message type tags
```

**UI Elements**:
```
┌────────────────────────────────────────────┐
│ 💬 Live Communication      📍 Auto-scroll │
│                             🟢 LIVE        │
├────────────────────────────────────────────┤
│ Team: [dashboard-devops ▼]                 │
├────────────────────────────────────────────┤
│                                            │
│ ┌────────────────────────────────────┐    │
│ │ 📊 team-lead → backend-dev         │    │
│ │ [2 minutes ago]                    │    │
│ │ Currently working on API endpoint  │    │
│ └────────────────────────────────────┘    │
│                                            │
│ ┌────────────────────────────────────┐    │
│ │ ✅ backend-dev                     │    │
│ │ [just now]                         │    │
│ │ Completed: API endpoint            │    │
│ └────────────────────────────────────┘    │
│                                            │
├────────────────────────────────────────────┤
│ 👥 4 members online   ⏱️ 2 active        │
└────────────────────────────────────────────┘
```

#### Option 2: Agent Inter-Communication Stream

**Location**: Main dashboard → "Agent Inter-Communication" card

**Features**:
- Aggregated view across all teams
- Filter by message type
- Last 100 messages displayed
- Statistics breakdown

**How to Use**:
```
1. Click filter buttons to show specific message types:
   - All: Show everything
   - Status: General updates
   - Completion: Finished tasks
   - Coordination: Team communication
   - Question: Questions/clarifications

2. Scroll through recent messages

3. View stats at bottom showing message breakdown
```

**UI Elements**:
```
┌─────────────────────────────────────────────┐
│ 📻 Agent Inter-Communication  🟢 150 msgs   │
├─────────────────────────────────────────────┤
│ [All] [Status] [Completion] [Coordination]  │
│ [Question]                                   │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ ✅ doc-writer → team-lead           │    │
│ │ [5 minutes ago]                     │    │
│ │ Completed: Write documentation      │    │
│ │ Team: dashboard-devops  [Unread]    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🤝 frontend-dev → backend-dev       │    │
│ │ [1 minute ago]                      │    │
│ │ Can you review my PR?               │    │
│ │ Team: web-dev                       │    │
│ └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│ 📊 75 Status   ✅ 50 Completions           │
└─────────────────────────────────────────────┘
```

### Accessing Archives

Archives can be accessed via API or will be viewable in a future UI component.

#### Via API

**Example: Get all archives**
```bash
curl http://localhost:3001/api/archive
```

**Example: Get specific archive**
```bash
curl http://localhost:3001/api/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json
```

#### Via File System

Archives are stored in: `~/.claude/archive/`

```bash
# List all archives
ls -lh ~/.claude/archive/

# View archive with pretty printing
cat ~/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json | jq .

# Search archives by team name
ls ~/.claude/archive/ | grep "dashboard"

# View natural language summary only
cat ~/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json | jq .summary
```

### Monitoring Team Activity

**Real-Time Dashboard**:

1. **Launch Dashboard**:
   ```bash
   npm start
   # or
   node start.js
   ```

2. **Open Browser**:
   ```
   http://localhost:5173
   ```

3. **Watch Console for Lifecycle Events**:
   ```
   Server console will show:
   - Team creation notifications
   - Activity updates
   - Task changes
   - Team completion and archiving
   ```

**Example Console Output**:
```
🚀 Dashboard is live and ready!
   You can view it at: http://localhost:3001

📡 Real-time updates enabled - your teams will sync automatically

👀 Watching for activity:
   Teams: /home/user/.claude/teams
   Tasks: /home/user/.claude/tasks

🔍 Setting up file watchers to track changes...
   ✓ Team watcher is ready - I'll notify you when teams change
   ✓ Task watcher is ready - tracking all your agent tasks
   ✓ Output watcher is ready - monitoring agent activity

👋 A new viewer joined the dashboard

🎉 New team created: dashboard-devops
✨ New task created: task-001.json
🔄 Team active: dashboard-devops
📝 Task updated: task-001.json
✅ Task completed/removed: task-001.json
👋 Team completed: dashboard-devops - archiving for reference...
📦 Team archived: dashboard-devops → /home/user/.claude/archive/dashboard-devops_2026-02-10T15-30-00-000Z.json
📊 Team "dashboard-devops" was active for 45 minutes
```

---

## Advanced Topics

### Custom Message Parsers

You can extend the message parser to handle custom message types:

```javascript
// Custom parser for your organization
function parseCustomMessage(text, summary) {
  // First try standard parser
  const standardResult = parseMessageToNatural(text, summary);

  // Then add custom handling
  try {
    const parsed = JSON.parse(text);

    switch (parsed.type) {
      case 'deployment':
        return {
          text: `🚀 Deployed ${parsed.service} to ${parsed.environment}`,
          type: 'deployment'
        };

      case 'alert':
        return {
          text: `🚨 ${parsed.severity.toUpperCase()}: ${parsed.message}`,
          type: 'alert'
        };

      case 'approval_required':
        return {
          text: `✋ Approval needed: ${parsed.message}`,
          type: 'approval'
        };

      default:
        return standardResult;
    }
  } catch (e) {
    return standardResult;
  }
}
```

### Archive Management

**Automatic Cleanup** (Future Feature):

```javascript
// Example: Delete archives older than 90 days
async function cleanupOldArchives(days = 90) {
  const archives = await fs.readdir(ARCHIVE_DIR);
  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);

  for (const file of archives) {
    const filePath = path.join(ARCHIVE_DIR, file);
    const stats = await fs.stat(filePath);

    if (stats.mtime.getTime() < cutoffDate) {
      await fs.unlink(filePath);
      console.log(`Deleted old archive: ${file}`);
    }
  }
}
```

**Export Archives** (Future Feature):

```javascript
// Example: Export archives to CSV
async function exportArchivesToCSV() {
  const archives = await getArchives();
  const csv = archives.map(a => {
    return [
      a.teamName,
      a.archivedAt,
      a.summary.created,
      a.summary.duration,
      a.summary.members.length,
      a.summary.accomplishments.length
    ].join(',');
  }).join('\n');

  await fs.writeFile('archives.csv', csv);
}
```

### Performance Tuning

**Adjust Polling Intervals**:

```javascript
// In RealTimeMessages.jsx and LiveCommunication.jsx

// Default: Poll every 5 seconds
const interval = setInterval(fetchMessages, 5000);

// For high-activity teams: Poll every 2 seconds
const interval = setInterval(fetchMessages, 2000);

// For low-activity teams: Poll every 10 seconds
const interval = setInterval(fetchMessages, 10000);
```

**Message Limit Tuning**:

```javascript
// RealTimeMessages.jsx line 146
// Keep last 100 messages (default)
setMessages(allMessages.slice(0, 100));

// For high-traffic dashboards: Keep last 50
setMessages(allMessages.slice(0, 50));

// For archival purposes: Keep last 500
setMessages(allMessages.slice(0, 500));
```

**Watcher Performance**:

```javascript
// config.js - Adjust watch options

// For high-frequency updates:
awaitWriteFinish: {
  stabilityThreshold: 100,  // Faster detection
  pollInterval: 25
}

// For large file systems:
awaitWriteFinish: {
  stabilityThreshold: 500,  // More stable
  pollInterval: 100
},
depth: 1  // Reduce recursion
```

---

## Troubleshooting

### Messages Not Appearing

**Check**:
1. Team exists and has active members
2. Inbox files exist at `~/.claude/teams/{team}/inboxes/`
3. Console shows no errors
4. Network tab shows successful API calls
5. WebSocket connection is active

**Debug**:
```bash
# Check inbox files
ls -la ~/.claude/teams/*/inboxes/

# Manually fetch messages
curl http://localhost:3001/api/teams/your-team-name/inboxes
```

### Archive Not Created

**Check**:
1. Team was active (had tasks/activity)
2. Archive directory permissions: `~/.claude/archive/`
3. Disk space available
4. Console shows archive errors

**Debug**:
```bash
# Check archive directory
ls -la ~/.claude/archive/

# Check permissions
chmod 755 ~/.claude/archive/

# Check disk space
df -h ~/.claude/
```

### Watcher Not Detecting Changes

**Check**:
1. Correct directory paths in `server.js`
2. File system events supported (native vs polling)
3. File system permissions

**Debug**:
```javascript
// Enable polling (slower but more reliable)
const watchOptions = {
  usePolling: true,
  interval: 1000
};
```

---

## Changelog

### v1.2.2 (Current)
- ✅ Natural language message parsing
- ✅ Team lifecycle tracking
- ✅ Automatic archiving system
- ✅ Archive API endpoints
- ✅ Security hardening (path validation)

### Future Enhancements
- 🚀 Archive viewer UI component
- 🚀 Archive search functionality
- 🚀 Message export (CSV, JSON)
- 🚀 Custom message type support
- 🚀 Archive compression
- 🚀 Performance analytics
- 🚀 Webhook notifications

---

## Support

**Need Help?**
- Open an issue: https://github.com/mukul975/claude-team-dashboard/issues
- Start a discussion: https://github.com/mukul975/claude-team-dashboard/discussions
- Check existing docs: [README.md](README.md), [FEATURES.md](FEATURES.md)

**Found a Bug?**
- Use the bug report template
- Include console logs
- Provide steps to reproduce
- Mention your environment (OS, Node version)

**Want to Contribute?**
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Pick a "good first issue"
- Submit a pull request
- Join the community!

---

Built with ❤️ by [mukul975](https://github.com/mukul975)
