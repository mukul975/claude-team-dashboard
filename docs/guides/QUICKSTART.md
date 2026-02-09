# Quick Start Guide - Claude Agent Dashboard

## 🚀 Getting Started in 3 Steps

### Step 1: Enable Agent Teams in Claude Code

First, enable the experimental agent teams feature:

1. Open your Claude Code settings file:
   - Windows: `C:\Users\YOUR_USERNAME\.claude\settings.json`
   - Mac/Linux: `~/.claude/settings.json`

2. Add this configuration:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

3. Save the file and restart Claude Code if it's running.

### Step 2: Start the Dashboard

Open a terminal in the `agentdashboard` directory and run:

```bash
npm start
```

You should see:
```
Starting Claude Agent Dashboard...
Backend server starting on http://localhost:3001
Frontend dashboard starting on http://localhost:5173
```

### Step 3: Create an Agent Team

Open Claude Code and create your first agent team:

```
Create an agent team with 3 teammates to help me refactor the authentication module.
One teammate should handle the backend, one the frontend, and one should write tests.
```

The dashboard will automatically detect and display your team!

## 🌐 Accessing the Dashboard

Once started, open your browser to:

**http://localhost:5173**

You should see the Claude Agent Dashboard with:
- Connection status indicator (green = connected)
- Statistics overview
- Team cards (when teams are active)
- Real-time activity feed

## ⚠️ Troubleshooting

### Port Already in Use

If you see `EACCES: permission denied` or `port already in use`:

**Solution 1**: Kill the process using the port
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

**Solution 2**: Use a different port

Edit `vite.config.js` and change the port:
```javascript
server: {
  port: 8080,  // Change to any available port
  // ...
}
```

### Dashboard Shows "No Active Teams"

This is normal if you haven't created any teams yet. To create one:

1. Open Claude Code
2. Start a conversation
3. Ask Claude to create an agent team
4. The dashboard will update automatically

### WebSocket Connection Fails

1. Make sure the backend server is running (check terminal)
2. Verify you can access http://localhost:3001/api/health
3. Check your firewall isn't blocking the connection
4. Try refreshing the browser

### Backend Server Not Starting

**Check Node version:**
```bash
node --version  # Should be v16 or higher
```

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 What You'll See

### When No Teams Are Active

The dashboard will show:
- Empty statistics (all zeros)
- "No Active Teams" message
- Instructions on how to create a team
- Live connection status

### When Teams Are Running

The dashboard displays:
- **Statistics Cards**: Team count, agent count, task breakdown
- **Team Cards**: Each team with:
  - Team name and description
  - Agent list (lead + teammates)
  - Complete task list with statuses
  - Last update timestamp
- **Activity Feed**: Real-time log of all events

## 🎯 Example Use Case

Here's a complete example workflow:

1. **Start the Dashboard**
   ```bash
   npm start
   ```

2. **Create a Team in Claude Code**
   ```
   Create an agent team to help me build a REST API. I need:
   - One teammate to design the database schema
   - One teammate to implement the API endpoints
   - One teammate to write integration tests

   Spawn them with plan mode enabled so I can review their approaches.
   ```

3. **Monitor Progress**
   - Watch agents get created in the dashboard
   - See tasks being created and assigned
   - Track status changes in real-time
   - View which agent owns which task

4. **View Completion**
   - See tasks move from "pending" → "in progress" → "completed"
   - Check the activity feed for all events
   - Review final statistics

## 🔧 Configuration Options

### Change Backend Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001;  // Change 3001
```

### Change Frontend Port

Edit `vite.config.js`:
```javascript
server: {
  port: 5173,  // Change this
}
```

### Enable Debug Logging

In `server.js`, uncomment debug lines or add:
```javascript
console.log('Debug:', JSON.stringify(data, null, 2));
```

## 📁 File Locations

The dashboard monitors these directories:

**Teams:**
- Windows: `C:\Users\YOUR_USERNAME\.claude\teams\`
- Mac/Linux: `~/.claude/teams/`

**Tasks:**
- Windows: `C:\Users\YOUR_USERNAME\.claude\tasks\`
- Mac/Linux: `~/.claude/tasks/`

You can manually inspect these files to verify data.

## 🛑 Stopping the Dashboard

Press `Ctrl+C` in the terminal where you ran `npm start`.

This will gracefully shut down both servers.

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.js`:
```javascript
colors: {
  'claude-orange': '#F97316',  // Change this
  'claude-dark': '#1F2937',    // Change this
}
```

### Modify Dashboard Layout

Edit `src/App.jsx` to change the grid layout:
```javascript
// Change from 3-column to 2-column
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

## 📚 Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [FEATURES.md](FEATURES.md) for feature descriptions
- Visit [Claude Code Documentation](https://code.claude.com/docs/en/agent-teams)

## 💡 Tips

1. **Keep it Running**: Leave the dashboard open in a browser tab while working with agent teams
2. **Multiple Monitors**: Put the dashboard on a second monitor for continuous monitoring
3. **Bookmark It**: Bookmark http://localhost:5173 for quick access
4. **Check Health**: Visit http://localhost:3001/api/health to verify backend is running

## 🆘 Still Having Issues?

1. Check the terminal output for error messages
2. Open browser DevTools (F12) and check the Console tab
3. Verify Claude Code agent teams are enabled
4. Ensure you have an active internet connection
5. Try restarting both the dashboard and Claude Code

---

**Enjoy monitoring your Claude Agent Teams!** 🎉
