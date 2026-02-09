import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Zap } from 'lucide-react';

export function LiveMetrics({ stats }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (stats) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  if (!stats) return null;

  const taskCompletionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const activeTasksRate = stats.totalTasks > 0
    ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg bg-claude-orange ${pulse ? 'animate-pulse' : ''}`} style={{ background: '#f97316' }}>
          <Zap className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Live Metrics</h3>
        <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }}></span>
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Task Completion</span>
            <span className="text-sm font-semibold text-white">{taskCompletionRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${taskCompletionRate}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Tasks</span>
            <span className="text-sm font-semibold text-white">{activeTasksRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${activeTasksRate}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #374151' }}>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalAgents}</div>
          <div className="text-xs text-gray-400">Active Agents</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.inProgressTasks}</div>
          <div className="text-xs text-gray-400">Working Now</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
      </div>
    </div>
  );
}

LiveMetrics.propTypes = {
  stats: PropTypes.shape({
    totalTeams: PropTypes.number,
    totalAgents: PropTypes.number,
    totalTasks: PropTypes.number,
    inProgressTasks: PropTypes.number,
    completedTasks: PropTypes.number,
    blockedTasks: PropTypes.number
  })
};
