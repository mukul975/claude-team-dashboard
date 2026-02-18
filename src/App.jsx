import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { Activity, Github, ExternalLink, BarChart3, MessageSquare, Users, Settings, History as HistoryIcon, Archive, Inbox, TrendingUp } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { useInboxNotifications } from './hooks/useInboxNotifications';
import { useToastNotifications } from './hooks/useToastNotifications';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { TeamCard } from './components/TeamCard';
import { ActivityFeed } from './components/ActivityFeed';
import { LiveMetrics } from './components/LiveMetrics';
import { SystemStatus } from './components/SystemStatus';
import { DetailedTaskProgress } from './components/DetailedTaskProgress';
import { AgentActivity } from './components/AgentActivity';
import { AgentNetworkGraph } from './components/AgentNetworkGraph';
import { RealTimeMessages } from './components/RealTimeMessages';
import { LiveCommunication } from './components/LiveCommunication';
import { TeamHistory } from './components/TeamHistory';
import { AgentOutputViewer } from './components/AgentOutputViewer';
import { ArchiveViewer } from './components/ArchiveViewer';
import { InboxViewer } from './components/InboxViewer';
import { TeamTimeline } from './components/TeamTimeline';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNotifications } from './hooks/useNotifications';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { TeamPerformancePanel } from './components/TeamPerformancePanel';
import { NotificationCenter } from './components/NotificationCenter';
import { useTheme } from './hooks/useTheme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaskDependencyGraph } from './components/TaskDependencyGraph';
import { TeamComparison } from './components/TeamComparison';


function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [teamsView, setTeamsView] = useState('list');
  const [inboxTeamFilter, setInboxTeamFilter] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const wsUrl = `ws://${window.location.hostname}:3001`;
  const { teams, stats, teamHistory, agentOutputs, allInboxes, isConnected, error, lastRawMessage, connectionStatus, reconnectAttempts } = useWebSocket(wsUrl);

  const { permission, requestPermission } = useInboxNotifications(allInboxes);

  useToastNotifications({ teams, allInboxes, lastRawMessage });

  const { notifications, unreadCount: notifUnreadCount, addNotification, markAsRead, markAllRead, clearAll } = useNotifications({ lastRawMessage });

  // Global keyboard shortcuts via custom hook
  useKeyboardShortcuts({
    onNavigate: (tab) => { setActiveTab(tab); setCommandPaletteOpen(false); },
    onToggleCommandPalette: () => setCommandPaletteOpen(prev => !prev),
    onToggleSearch: () => setCommandPaletteOpen(true),
    onToggleShortcutsModal: () => setShortcutsOpen(prev => !prev),
    onToggleAutoScroll: () => {
      document.dispatchEvent(new CustomEvent('toggle-auto-scroll'));
    },
  });

  // Memoize expensive computations
  const allTasks = useMemo(
    () => teams.flatMap(t => t.tasks || []),
    [teams]
  );

  const unreadCount = useMemo(() => {
    let count = 0;
    Object.values(allInboxes).forEach(teamInboxes => {
      Object.values(teamInboxes).forEach(messages => {
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            if (msg.read === false) count++;
          });
        }
      });
    });
    return count;
  }, [allInboxes]);

  // Keyboard navigation handler for tabs
  const handleTabKeyDown = (e) => {
    const tabs = ['overview', 'teams', 'communication', 'monitoring', 'history', 'archive', 'inboxes', 'analytics'];
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
      // Focus the new tab button
      document.getElementById(`tab-${tabs[nextIndex]}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex]);
      document.getElementById(`tab-${tabs[prevIndex]}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0]);
      document.getElementById(`tab-${tabs[0]}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1]);
      document.getElementById(`tab-${tabs[tabs.length - 1]}`)?.focus();
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-claude-orange focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header - New Glassmorphism Design */}
      <Header isConnected={isConnected} error={error} notificationPermission={permission} onRequestNotification={requestPermission} teams={teams} allInboxes={allInboxes} onNavigate={(tab) => setActiveTab(tab)} theme={theme} onToggleTheme={toggleTheme} notifUnreadCount={notifUnreadCount} onToggleNotifications={() => setNotifOpen(prev => !prev)} onToggleShortcuts={() => setShortcutsOpen(true)} />

      {/* WebSocket Connecting Overlay - shown only on initial connection */}
      {connectionStatus === 'connecting' && teams.length === 0 && !error && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
          role="status"
          aria-label="Connecting to dashboard"
          aria-live="polite"
        >
          <div
            className="rounded-2xl p-8 text-center max-w-sm mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(249, 115, 22, 0.1)',
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              >
                <Activity className="w-7 h-7" style={{ color: '#fb923c' }} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting to Dashboard</h2>
            <p className="text-gray-400 text-sm">Establishing WebSocket connection to server…</p>
            {reconnectAttempts > 0 && (
              <p className="text-orange-400 text-xs mt-2">Attempt {reconnectAttempts + 1}…</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-6 py-6" role="main">
        {/* Statistics Overview - Always Visible */}
        <div className="mb-6">
          <StatsOverview stats={stats} allInboxes={allInboxes} />
        </div>

        {/* Navigation Tabs */}
        <nav className="mb-6" role="tablist" aria-label="Dashboard sections">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="tab-panel-overview"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Live Metrics<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘1</span>
            </button>
            <button
              id="tab-teams"
              onClick={() => setActiveTab('teams')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'teams'}
              aria-controls="tab-panel-teams"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Teams & Tasks<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘2</span>
            </button>
            <button
              id="tab-communication"
              onClick={() => setActiveTab('communication')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'communication'}
              aria-controls="tab-panel-communication"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'communication'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Communication<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘3</span>
            </button>
            <button
              id="tab-monitoring"
              onClick={() => setActiveTab('monitoring')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'monitoring'}
              aria-controls="tab-panel-monitoring"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'monitoring'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Monitoring<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘4</span>
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="tab-panel-history"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <HistoryIcon className="h-4 w-4" aria-hidden="true" />
              History & Outputs<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘5</span>
            </button>
            <button
              id="tab-archive"
              onClick={() => setActiveTab('archive')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'archive'}
              aria-controls="tab-panel-archive"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'archive'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
              Archive<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘6</span>
            </button>
            <button
              id="tab-inboxes"
              onClick={() => setActiveTab('inboxes')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'inboxes'}
              aria-controls="tab-panel-inboxes"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'inboxes'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <Inbox className="h-4 w-4" aria-hidden="true" />
              Inboxes<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘7</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === 'analytics'}
              aria-controls="tab-panel-analytics"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'tab-btn-inactive'
              }`}
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Analytics<span className="ml-1.5 text-[10px] opacity-40 font-mono hidden lg:inline" aria-hidden="true">⌘8</span>
            </button>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div
              role="tabpanel"
              id="tab-panel-overview"
              aria-labelledby="tab-overview"
              className="space-y-6 animate-fadeIn"
            >
              {/* Live Metrics */}
              <ErrorBoundary name="Live Metrics">
                <LiveMetrics stats={stats} allInboxes={allInboxes} isConnected={isConnected} lastRawMessage={lastRawMessage} />
              </ErrorBoundary>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ErrorBoundary name="Task Progress">
                  <DetailedTaskProgress tasks={allTasks} />
                </ErrorBoundary>
                <ErrorBoundary name="Agent Activity">
                  <AgentActivity teams={teams} allInboxes={allInboxes} />
                </ErrorBoundary>
                <ErrorBoundary name="System Status">
                  <SystemStatus isConnected={isConnected} lastUpdate={lastRawMessage} connectionStatus={connectionStatus} reconnectAttempts={reconnectAttempts} />
                </ErrorBoundary>
              </div>

              {/* Team Performance Panel */}
              <TeamPerformancePanel teams={teams} allInboxes={allInboxes} />

              {/* Team Activity Timeline */}
              <ErrorBoundary name="Team Timeline">
                <TeamTimeline allInboxes={allInboxes} teams={teams} />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'teams' && (
            <div
              role="tabpanel"
              id="tab-panel-teams"
              aria-labelledby="tab-teams"
              className="animate-fadeIn"
            >
              {/* Teams View Toggle */}
              <div className="flex items-center gap-1 mb-6 rounded-lg p-1 w-fit" style={{ background: 'var(--bg-secondary)' }}>
                <button
                  onClick={() => setTeamsView('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    teamsView === 'list'
                      ? 'bg-claude-orange text-white shadow'
                      : 'toggle-btn-inactive'
                  }`}
                >
                  Team List
                </button>
                <button
                  onClick={() => setTeamsView('compare')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    teamsView === 'compare'
                      ? 'bg-claude-orange text-white shadow'
                      : 'toggle-btn-inactive'
                  }`}
                >
                  Compare Teams
                </button>
              </div>

              {teamsView === 'compare' ? (
                <ErrorBoundary name="Team Comparison">
                  <TeamComparison teams={teams} allInboxes={allInboxes} />
                </ErrorBoundary>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Teams Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Active Teams</h2>
                      {teams.length > 0 && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {teams.length} team{teams.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {teams.length === 0 ? (
                      <div className="card text-center py-12">
                        <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" aria-hidden="true" />
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
                          className="inline-flex items-center gap-2 bg-claude-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          Learn How to Start a Team
                        </a>
                      </div>
                    ) : (
                      teams.map((team, index) => (
                        <TeamCard key={team.name || index} team={team} inboxes={allInboxes[team.name] || {}} allInboxes={allInboxes} onNavigateToInboxes={(teamName) => { setInboxTeamFilter(teamName); setActiveTab('inboxes'); }} />
                      ))
                    )}
                  </div>

                  {/* Activity Feed Section */}
                  <div className="lg:col-span-1">
                    <ActivityFeed updates={lastRawMessage} loading={connectionStatus === 'connecting'} />
                  </div>

                  {/* Task Dependency Graph - Full Width */}
                  <div className="lg:col-span-3">
                    <TaskDependencyGraph teams={teams} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communication' && (
            <div
              role="tabpanel"
              id="tab-panel-communication"
              aria-labelledby="tab-communication"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn"
            >
              <ErrorBoundary name="Real-Time Messages">
                <RealTimeMessages teams={teams} allInboxes={allInboxes} />
              </ErrorBoundary>
              <ErrorBoundary name="Live Communication">
                <LiveCommunication teams={teams} allInboxes={allInboxes} />
              </ErrorBoundary>
              <div className="mt-6 lg:col-span-2">
                <AgentNetworkGraph allInboxes={allInboxes} teams={teams} />
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div
              role="tabpanel"
              id="tab-panel-monitoring"
              aria-labelledby="tab-monitoring"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn"
            >
              <SystemStatus isConnected={isConnected} lastUpdate={lastRawMessage} connectionStatus={connectionStatus} reconnectAttempts={reconnectAttempts} />
              <ActivityFeed updates={lastRawMessage} loading={connectionStatus === 'connecting'} />
            </div>
          )}

          {activeTab === 'history' && (
            <div
              role="tabpanel"
              id="tab-panel-history"
              aria-labelledby="tab-history"
              className="space-y-6 animate-fadeIn"
            >
              {/* Agent Output Viewer - Full Width */}
              <ErrorBoundary name="Agent Output">
                <AgentOutputViewer agentOutputs={agentOutputs} />
              </ErrorBoundary>

              {/* Team History */}
              <ErrorBoundary name="Team History">
                <TeamHistory teamHistory={teamHistory} loading={connectionStatus === 'connecting' && teamHistory.length === 0} />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'archive' && (
            <div
              role="tabpanel"
              id="tab-panel-archive"
              aria-labelledby="tab-archive"
              className="animate-fadeIn"
            >
              {/* Archive Viewer - Full Width */}
              <ErrorBoundary name="Archive Viewer">
                <ArchiveViewer />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'inboxes' && (
            <div role="tabpanel" id="tab-panel-inboxes" aria-labelledby="tab-inboxes" className="animate-fadeIn">
              <ErrorBoundary name="Inbox Viewer">
                <InboxViewer allInboxes={allInboxes} initialTeam={inboxTeamFilter} loading={connectionStatus === 'connecting' && Object.keys(allInboxes).length === 0} />
              </ErrorBoundary>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div role="tabpanel" id="tab-panel-analytics" aria-labelledby="tab-analytics" className="animate-fadeIn">
              <AnalyticsPanel teams={teams} allInboxes={allInboxes} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--footer-bg)', borderTop: '1px solid var(--footer-border)', marginTop: '3rem' }}>
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-claude-orange" aria-hidden="true" />
              <span>Claude Code Agent Dashboard</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500">Built by <a href="https://mahipal.engineer" target="_blank" rel="noopener noreferrer" className="text-claude-orange hover:text-orange-400 transition-colors">mahipal.engineer</a></span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShortcutsOpen(true)} className="flex items-center gap-1.5 hover:text-white transition-colors" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
                <kbd className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-gray-700 border border-gray-600 rounded">?</kbd>
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>GitHub</span>
              </a>
              <a
                href="https://code.claude.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>

      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        unreadCount={notifUnreadCount}
        markAllRead={markAllRead}
        markAsRead={markAsRead}
        clearAll={clearAll}
        onNavigate={(tab) => { setActiveTab(tab); setNotifOpen(false); }}
      />

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => { setActiveTab(tab); setCommandPaletteOpen(false); }}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'light' ? '#ffffff' : '#1f2937',
            color: theme === 'light' ? '#1e293b' : '#f9fafb',
            border: theme === 'light' ? '1px solid rgba(249,115,22,0.2)' : '1px solid rgba(249,115,22,0.3)',
            borderRadius: '12px',
            boxShadow: theme === 'light' ? '0 4px 24px rgba(0,0,0,0.12)' : '0 4px 24px rgba(0,0,0,0.4)',
            fontSize: '14px',
          },
          duration: 4000,
        }}
      />
    </div>
  );
}

export default App;
