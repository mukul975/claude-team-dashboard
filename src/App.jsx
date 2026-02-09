import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Github, ExternalLink, BarChart3, MessageSquare, Users, Settings } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { StatsOverview } from './components/StatsOverview';
import { TeamCard } from './components/TeamCard';
import { ActivityFeed } from './components/ActivityFeed';
import { ConnectionStatus } from './components/ConnectionStatus';
import { LiveMetrics } from './components/LiveMetrics';
import { SystemStatus } from './components/SystemStatus';
import { LiveCommunication } from './components/LiveCommunication';
import { DetailedTaskProgress } from './components/DetailedTaskProgress';
import { AgentActivity } from './components/AgentActivity';
import { RealTimeMessages } from './components/RealTimeMessages';
import { LiveAgentStream } from './components/LiveAgentStream';

function App() {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const wsUrl = `ws://${window.location.hostname}:3001`;
  const { data, isConnected, error } = useWebSocket(wsUrl);

  // Memoize expensive computations
  const allTasks = useMemo(
    () => teams.flatMap(t => t.tasks || []),
    [teams]
  );

  useEffect(() => {
    if (data) {
      setLastUpdate(data);

      if (data.data) {
        setTeams(data.data);
      }

      if (data.stats) {
        setStats(data.stats);
      }
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-claude-orange focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-50" role="banner">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-claude-orange to-orange-600 p-2 rounded-lg">
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
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">Documentation</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-6 py-6" role="main">
        {/* Statistics Overview - Always Visible */}
        <div className="mb-6">
          <StatsOverview stats={stats} />
        </div>

        {/* Navigation Tabs */}
        <nav className="mb-6" role="tablist" aria-label="Dashboard sections">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="tab-panel-overview"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Live Metrics
            </button>
            <button
              id="tab-teams"
              onClick={() => setActiveTab('teams')}
              role="tab"
              aria-selected={activeTab === 'teams'}
              aria-controls="tab-panel-teams"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Teams & Tasks
            </button>
            <button
              id="tab-communication"
              onClick={() => setActiveTab('communication')}
              role="tab"
              aria-selected={activeTab === 'communication'}
              aria-controls="tab-panel-communication"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'communication'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Communication
            </button>
            <button
              id="tab-monitoring"
              onClick={() => setActiveTab('monitoring')}
              role="tab"
              aria-selected={activeTab === 'monitoring'}
              aria-controls="tab-panel-monitoring"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'monitoring'
                  ? 'bg-claude-orange text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Monitoring
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
              <LiveMetrics stats={stats} />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DetailedTaskProgress tasks={allTasks} />
                <AgentActivity teams={teams} />
                <SystemStatus isConnected={isConnected} lastUpdate={lastUpdate} />
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div
              role="tabpanel"
              id="tab-panel-teams"
              aria-labelledby="tab-teams"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn"
            >
              {/* Teams Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Active Teams</h2>
                  {teams.length > 0 && (
                    <span className="text-sm text-gray-400">
                      {teams.length} team{teams.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {teams.length === 0 ? (
                  <div className="card text-center py-12">
                    <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" />
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
                      <ExternalLink className="h-4 w-4" />
                      Learn How to Start a Team
                    </a>
                  </div>
                ) : (
                  teams.map((team, index) => (
                    <TeamCard key={team.name || index} team={team} />
                  ))
                )}
              </div>

              {/* Activity Feed Section */}
              <div className="lg:col-span-1">
                <ActivityFeed updates={lastUpdate} />
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div
              role="tabpanel"
              id="tab-panel-communication"
              aria-labelledby="tab-communication"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn"
            >
              <RealTimeMessages teams={teams} />
              <LiveAgentStream teams={teams} />
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div
              role="tabpanel"
              id="tab-panel-monitoring"
              aria-labelledby="tab-monitoring"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn"
            >
              <SystemStatus isConnected={isConnected} lastUpdate={lastUpdate} />
              <ActivityFeed updates={lastUpdate} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/50 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-claude-orange" />
              <span>Claude Code Agent Dashboard</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500">Built by <a href="https://mahipal.engineer" target="_blank" rel="noopener noreferrer" className="text-claude-orange hover:text-orange-400 transition-colors">mahipal.engineer</a></span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
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
    </div>
  );
}

export default App;
