# Team Lifecycle Archiving System

This document describes the team lifecycle archiving system in the Claude Team Dashboard.

## Overview

The dashboard automatically archives team data when a team is deleted or completes its work. Archives preserve all team information in a structured format with natural language summaries for easy review.

## Features

### 1. Automatic Archiving

When a team's `config.json` file is deleted (team shutdown), the system automatically:
- Captures all team data (config, tasks, members)
- Generates a natural language summary
- Saves the archive to `~/.claude/archive/`
- Logs the archiving event with duration statistics

### 2. Natural Language Summaries

Each archive includes a human-readable summary with:

```json
{
  "overview": "Team 'dashboard-devops' with 3 members worked on 5 tasks and completed 3.",
  "created": "Started on 1/15/2025",
  "members": [
    "team-lead (team-lead)",
    "researcher (researcher)",
    "developer (developer)"
  ],
  "accomplishments": [
    "✅ Research database schema",
    "✅ Design API endpoints",
    "✅ Implement user authentication"
  ],
  "duration": "Active for 90 minutes"
}
```

### 3. Archive File Structure

Archives are stored as JSON files with timestamps:

**Filename format:** `{teamName}_{timestamp}.json`

**Example:** `dashboard-devops_2026-02-10T14-26-55.814Z.json`

**File structure:**
```json
{
  "teamName": "dashboard-devops",
  "archivedAt": "2026-02-10T14:26:55.814Z",
  "summary": {
    "overview": "Team summary text",
    "created": "Start date",
    "members": ["member list"],
    "accomplishments": ["completed tasks"],
    "duration": "Active duration"
  },
  "rawData": {
    "name": "team-name",
    "config": { /* full team config */ },
    "tasks": [ /* all tasks */ ]
  }
}
```

### 4. Archive Location

Archives are stored in: `~/.claude/archive/`

On Windows: `C:\Users\{username}\.claude\archive\`
On macOS/Linux: `~/.claude/archive/`

## API Endpoints

### GET /api/archive

List all archived teams.

**Response:**
```json
{
  "archives": [
    {
      "filename": "team-name_timestamp.json",
      "teamName": "team-name",
      "archivedAt": "2026-02-10T14:26:55.814Z",
      "overview": "Summary text",
      "created": "Started on 1/15/2025",
      "members": ["member list"],
      "accomplishments": ["task list"],
      "duration": "Active for X minutes"
    }
  ],
  "count": 1
}
```

### GET /api/archive/:filename

Get detailed information about a specific archive.

**Parameters:**
- `filename` - The archive filename (e.g., `team-name_2026-02-10T14-26-55.814Z.json`)

**Response:**
```json
{
  "teamName": "team-name",
  "archivedAt": "2026-02-10T14:26:55.814Z",
  "summary": { /* natural language summary */ },
  "rawData": { /* complete team data */ }
}
```

## Team Lifecycle Tracking

The dashboard tracks team lifecycle events:

### On Team Creation
- Detects new `config.json` file
- Records creation time
- Logs: `🎉 New team created: {teamName}`

### During Team Activity
- Updates `lastSeen` timestamp on file changes
- Logs: `🔄 Team active: {teamName}`

### On Team Completion
- Detects `config.json` deletion
- Archives team data automatically
- Calculates and logs activity duration
- Logs: `👋 Team completed: {teamName} - archiving for reference...`
- Logs: `📊 Team "{teamName}" was active for X minutes`

## Archive Data

### What Gets Archived

1. **Team Configuration**
   - Team name and description
   - Member list with roles
   - Creation timestamp
   - All custom metadata

2. **All Tasks**
   - Task details (subject, description, status)
   - Owner assignments
   - Dependencies (blockedBy, blocks)
   - Creation and update timestamps
   - Custom metadata

3. **Statistics**
   - Total team duration
   - Task completion rate
   - Member count
   - Activity timeline

### What Gets Summarized

The natural language summary includes:

1. **Overview Statement**
   - Team size and composition
   - Total tasks and completion count

2. **Timeline**
   - Start date
   - Active duration in minutes

3. **Team Members**
   - List of all members with their roles

4. **Accomplishments**
   - Up to 10 most recent completed tasks
   - Formatted with ✅ checkmarks

## Usage Examples

### Viewing Archives via API

```bash
# List all archives
curl http://localhost:3002/api/archive

# Get specific archive details
curl http://localhost:3002/api/archive/team-name_2026-02-10T14-26-55.814Z.json
```

### Testing Archiving

Run the test suite:

```bash
# Unit tests
npm test archiving

# Manual end-to-end test
node test-archiving.js

# API endpoint test
node test-archive-api.js
```

### Manual Archive Inspection

Archives can be read directly as JSON files:

```bash
# List archives
ls ~/.claude/archive/

# View archive
cat ~/.claude/archive/team-name_timestamp.json | jq .

# Pretty print summary
cat ~/.claude/archive/team-name_timestamp.json | jq .summary
```

## Implementation Details

### Archive Function

```javascript
async function archiveTeam(teamName, teamData) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const archiveFile = path.join(ARCHIVE_DIR, `${teamName}_${timestamp}.json`);

  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const summary = {
    teamName,
    archivedAt: new Date().toISOString(),
    summary: generateTeamSummary(teamData),
    rawData: teamData
  };

  await fs.writeFile(archiveFile, JSON.stringify(summary, null, 2));
}
```

### Summary Generation

```javascript
function generateTeamSummary(teamData) {
  const members = teamData.config?.members || [];
  const tasks = teamData.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return {
    overview: `Team "${teamData.name}" with ${members.length} members worked on ${totalTasks} tasks and completed ${completedTasks}.`,
    created: new Date(teamData.config.createdAt).toLocaleDateString(),
    members: members.map(m => `${m.name} (${m.agentType})`),
    accomplishments: tasks
      .filter(t => t.status === 'completed')
      .map(t => `✅ ${t.subject}`)
      .slice(0, 10),
    duration: `Active for ${Math.round((Date.now() - teamData.config.createdAt) / 1000 / 60)} minutes`
  };
}
```

### File Watcher Integration

The archiving is triggered by the team file watcher:

```javascript
teamWatcher.on('unlink', async (filePath) => {
  if (path.basename(filePath) === 'config.json') {
    const teamName = path.basename(path.dirname(filePath));
    const teams = await getActiveTeams();
    const teamData = teams.find(t => t.name === teamName);

    if (teamData) {
      await archiveTeam(teamName, teamData);
    }
  }
});
```

## Benefits

1. **Historical Record** - Keep track of all teams and their work
2. **Audit Trail** - Review what was accomplished and by whom
3. **Learning Resource** - Analyze successful team compositions and workflows
4. **Recovery** - Restore team data if needed
5. **Analytics** - Aggregate statistics across multiple teams

## Best Practices

1. **Regular Cleanup**
   - Archives are permanent by default
   - Periodically review and remove old archives if needed
   - Each archive is self-contained for easy backup/transfer

2. **Archive Management**
   - Archives are sorted by date (newest first)
   - Use descriptive team names for easy identification
   - Consider archiving manually before major team restructures

3. **Data Privacy**
   - Archives contain all team data including task descriptions
   - Store archives securely if they contain sensitive information
   - Consider excluding archives from version control

## Troubleshooting

### Archive Not Created

**Problem:** Team deleted but no archive created

**Solutions:**
- Check server logs for archiving errors
- Verify `~/.claude/archive/` is writable
- Ensure team data was read before deletion
- Check file watcher is active

### Missing Archive Data

**Problem:** Archive exists but missing expected data

**Solutions:**
- Check if team data was available at deletion time
- Verify file watcher caught the deletion event
- Review archive file structure matches expected format

### Archive API Errors

**Problem:** Cannot access archives via API

**Solutions:**
- Verify server is running
- Check archive directory exists and is readable
- Test with curl or test script
- Review server logs for errors

## Future Enhancements

Potential improvements to the archiving system:

1. **Archive Compression** - Compress old archives to save space
2. **Archive Search** - Full-text search across archived team data
3. **Archive Comparison** - Compare multiple team archives
4. **Archive Export** - Export archives in different formats (PDF, CSV)
5. **Archive Restoration** - Restore archived teams back to active state
6. **Archive Analytics** - Aggregate statistics and visualizations
7. **Automatic Cleanup** - Auto-delete archives older than X days
8. **Archive Tags** - Tag archives for categorization

## Related Documentation

- [README.md](README.md) - Main project documentation
- [server.js](server.js) - Server implementation with archiving code
- [test-archiving.js](test-archiving.js) - Manual archiving tests
- [test-archive-api.js](test-archive-api.js) - API endpoint tests
