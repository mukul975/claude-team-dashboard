# Component Animation Examples

Practical examples for applying animations to existing dashboard components.

## StatsOverview Component

**File**: `src/components/StatsOverview.jsx`

### Before
```jsx
<div className="stat-card">
  <div className="flex items-center justify-between">
    {/* content */}
  </div>
</div>
```

### After (Apply Animation Classes)
```jsx
<div className="stat-card stat-card-animated">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
      <p className="text-3xl font-bold text-white mt-2 counter-animated">
        {stat.value}
      </p>
    </div>
    <div className={`${stat.bgColor} p-3 rounded-lg icon-hover`}>
      <Icon className={`${stat.color} h-6 w-6`} />
    </div>
  </div>
</div>
```

**Result**: Stat cards fade in with stagger, numbers bounce on update, icons scale on hover.

---

## AgentCard Component

**File**: `src/components/AgentCard.jsx`

### Before
```jsx
<div className={`bg-gray-700/50 rounded-lg p-4 border ${
  isLead ? 'border-yellow-500/50' : 'border-gray-600'
}`}>
```

### After
```jsx
<div className={`agent-card-animated bg-gray-700/50 rounded-lg p-4 border ${
  isLead ? 'border-yellow-500/50' : 'border-gray-600'
}`}>
  <div className="flex items-start justify-between">
    <div className="flex items-start gap-3 flex-1">
      <div className={`p-2 rounded-lg icon-hover ${
        isLead ? 'bg-yellow-500/20' : 'bg-blue-500/20'
      }`}>
        {isLead ? (
          <Crown className="h-5 w-5 text-yellow-400" />
        ) : (
          <Bot className="h-5 w-5 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-white font-semibold truncate">{agent.name}</h5>
          {isLead && (
            <span className="badge badge-animated px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
              Lead
            </span>
          )}
        </div>
        {/* rest of content */}
      </div>
    </div>
  </div>
</div>
```

**Result**: Agent cards scale on hover, icons rotate slightly on hover, badge pops in.

---

## TaskList Component

**File**: `src/components/TaskList.jsx`

### Before
```jsx
<div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
```

### After
```jsx
<div className="task-item-animated bg-gray-700/30 rounded-lg p-4 border border-gray-600">
  <div className="flex items-start gap-3">
    <div className="mt-1 icon-hover">
      {getStatusIcon(task.status)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="text-white font-medium">{task.subject}</h5>
        <span className={`badge badge-animated ${getBadgeClass(task.status)}`}>
          {getStatusText(task.status)}
        </span>
      </div>
      {/* rest of content */}
    </div>
  </div>
</div>
```

**Result**: Tasks fade in, slide right on hover, status icons scale on hover, badges pop in.

---

## ConnectionStatus Component

**File**: `src/components/ConnectionStatus.jsx`

### Before
```jsx
if (isConnected) {
  return (
    <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
      <Wifi className="h-4 w-4" />
      <span className="text-sm font-medium">Connected</span>
    </div>
  );
}
```

### After
```jsx
if (isConnected) {
  return (
    <div className="connection-connected flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
      <span className="live-indicator live-indicator-sm"></span>
      <Wifi className="h-4 w-4" />
      <span className="text-sm font-medium">Connected</span>
    </div>
  );
}

if (error) {
  return (
    <div className="connection-error flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">{error}</span>
    </div>
  );
}

return (
  <div className="connection-connecting flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30">
    <RefreshCw className="h-4 w-4 animate-spin" />
    <span className="text-sm font-medium">Connecting...</span>
  </div>
);
```

**Result**: Connected status bounces in, connecting status pulses, error shakes, live indicator glows.

---

## ActivityFeed Component

**File**: `src/components/ActivityFeed.jsx`

### Enhancement
```jsx
<div className="space-y-2">
  {activities.map((activity, index) => (
    <div
      key={activity.id || index}
      className="activity-item-animated bg-gray-700/30 rounded-lg p-3 border border-gray-600"
    >
      <div className="flex items-start gap-2">
        <div className="icon-hover mt-1">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300">{activity.message}</p>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

**Result**: Activity items slide in from right with stagger, hover slides left, icons scale on hover.

---

## TeamCard Component

**File**: `src/components/TeamCard.jsx`

### Enhancement
```jsx
<div className="card team-card-animated">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="bg-claude-orange p-2 rounded-lg icon-hover">
        <Users className="h-5 w-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{team.name}</h3>
        {team.description && (
          <p className="text-sm text-gray-400">{team.description}</p>
        )}
      </div>
    </div>
    <span className="live-indicator"></span>
  </div>
  {/* rest of content */}
</div>
```

**Result**: Team card lifts on hover, icon rotates on hover, live indicator pulses.

---

## App.jsx Header

**File**: `src/App.jsx`

### Enhancement
```jsx
<header className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-50">
  <div className="container mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-claude-orange to-orange-600 p-2 rounded-lg icon-hover">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Claude Agent Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time agent team monitoring</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ConnectionStatus isConnected={isConnected} error={error} />
        <a
          href="https://code.claude.com/docs/en/agent-teams"
          target="_blank"
          rel="noopener noreferrer"
          className="button-animated flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm font-medium">Documentation</span>
        </a>
      </div>
    </div>
  </div>
</header>
```

**Result**: Logo icon rotates on hover, buttons lift on hover with ripple effect.

---

## Empty State

### Enhancement
```jsx
{teams.length === 0 ? (
  <div className="card animate-fade-in-up text-center py-12">
    <div className="animate-float">
      <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">
      No Active Teams
    </h3>
    <p className="text-gray-400 mb-4">
      Start a Claude Code agent team to see it appear here
    </p>
    <a
      href="https://code.claude.com/docs/en/agent-teams#start-your-first-agent-team"
      target="_blank"
      rel="noopener noreferrer"
      className="button-animated button-ripple inline-flex items-center gap-2 bg-claude-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
    >
      <ExternalLink className="h-4 w-4" />
      Learn How to Start a Team
    </a>
  </div>
) : (
  /* team cards */
)}
```

**Result**: Empty state fades in, icon floats gently, button has ripple effect on click.

---

## Loading States

### Skeleton Loader Example
```jsx
{isLoading ? (
  <div className="space-y-4">
    <div className="skeleton-animated" style={{height: '100px'}} />
    <div className="skeleton-animated" style={{height: '100px'}} />
    <div className="skeleton-animated" style={{height: '100px'}} />
  </div>
) : (
  /* actual content */
)}
```

### Loading Dots Example
```jsx
{isProcessing && (
  <div className="flex items-center gap-2 text-gray-400">
    <span className="text-sm">Processing</span>
    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
)}
```

---

## Quick Implementation Checklist

1. **Import animations.css** (already done in main.jsx)
2. **Add to cards**: `stat-card-animated`, `card-animated`, `team-card-animated`, `agent-card-animated`
3. **Add to lists**: `activity-item-animated`, `task-item-animated`
4. **Add to badges**: `badge-animated`, `badge-shimmer` (for in-progress)
5. **Add to buttons**: `button-animated`, `button-ripple`
6. **Add to icons**: `icon-hover`, `icon-spin-hover`, `icon-bounce-hover`
7. **Add to status**: `connection-connected`, `connection-connecting`, `connection-error`
8. **Add live indicators**: `live-indicator` (with optional size classes)
9. **Add to counters**: `counter-animated` (add `updated` class when value changes)
10. **Add hover effects**: `hover-lift`, `hover-scale`, `hover-glow-orange`

## Testing

After applying animations:

1. Check page load - cards should stagger in smoothly
2. Hover over elements - should see lift/scale/glow effects
3. Click buttons - should see press effect and ripple
4. Watch connection status - should see appropriate animations
5. Test with slow network - loading states should animate
6. Check accessibility - enable "prefers reduced motion" in browser to verify instant transitions

## Performance Notes

- All animations use GPU-accelerated properties (transform, opacity)
- Stagger delays keep initial load feeling fast (max 350ms)
- Infinite animations only on critical indicators (connection status, live dots)
- Hover effects are subtle and performant (no layout shifts)

---

Ready to bring the dashboard to life with smooth, professional animations!
