import React, { useState } from 'react';
import { History, Users, CheckCircle2, Clock, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { SkeletonTeamHistoryRow } from './SkeletonLoader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { exportToJSON } from '../utils/exportUtils';
dayjs.extend(relativeTime);

export function TeamHistory({ teamHistory, loading }) {
  const [expandedTeam, setExpandedTeam] = useState(null);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Team History</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonTeamHistoryRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!teamHistory || teamHistory.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Team History</h3>
        </div>
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <History className="h-16 w-16 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No team history yet.</p>
        </div>
      </div>
    );
  }

  const toggleTeam = (teamName) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const getTaskStats = (tasks) => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length
    };
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Team History</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {teamHistory.length} team{teamHistory.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              const data = teamHistory.map(t => ({
                name: t.name,
                isActive: t.isActive,
                members: t.config?.members?.map(m => m.name).join('; ') || '',
                totalTasks: (t.tasks || []).length,
                completedTasks: (t.tasks || []).filter(tk => tk.status === 'completed').length,
                lastModified: t.lastModified || ''
              }));
              exportToJSON(data, 'team-history');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:text-claude-orange transition-colors"
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
            }}
            title="Export team history as JSON"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {teamHistory.map((team, index) => {
          const stats = getTaskStats(team.tasks);
          const isExpanded = expandedTeam === team.name;
          const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

          return (
            <div
              key={team.name}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                border: '1px solid var(--border-color)',
                animation: `fadeInScale 0.3s ease-out ${index * 0.05}s backwards`
              }}
            >
              {/* Team Header */}
              <div
                className="p-4 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={() => toggleTeam(team.name)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? `Collapse ${team.name} details` : `Expand ${team.name} details`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTeam(team.name);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1" aria-hidden="true">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                    ) : (
                      <ChevronRight className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold" style={{ color: 'var(--text-heading)' }}>{team.name}</h4>
                      {team.isActive && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.config.members?.length || 0} members
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {stats.total} tasks
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dayjs(team.lastModified).fromNow()}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full rounded-full h-2" style={{ background: 'var(--border-color)' }}>
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stats.completed}/{stats.total} tasks completed ({Math.round(completionRate)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 space-y-4" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                  {/* Members */}
                  <div>
                    <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Team Members</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {team.config.members?.map((member, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg"
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                        >
                          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.agentType}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div>
                    <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Task Summary</h5>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>{stats.total}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 text-center">
                        <div className="text-lg font-bold text-green-400">{stats.completed}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Done</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                        <div className="text-lg font-bold text-blue-400">{stats.inProgress}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active</div>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                        <div className="text-lg font-bold text-yellow-400">{stats.pending}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  {team.tasks.slice(0, 5).length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Recent Tasks</h5>
                      <div className="space-y-1">
                        {team.tasks.slice(0, 5).map((task, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg text-sm"
                            style={{ background: 'var(--bg-secondary)' }}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                task.status === 'completed' ? 'bg-green-400' :
                                task.status === 'in_progress' ? 'bg-blue-400' :
                                'bg-yellow-400'
                              }`}></span>
                              <span className="truncate" style={{ color: 'var(--text-primary)' }}>{task.subject}</span>
                              {task.owner && (
                                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{task.owner}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
