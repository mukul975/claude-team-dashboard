import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function LiveAgentStream({ teams }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!teams || teams.length === 0) return;

    const interval = setInterval(() => {
      teams.forEach(team => {
        if (team.config && team.config.members && team.tasks) {
          team.config.members.forEach(member => {
            const memberTasks = team.tasks.filter(t => t.owner === member.name);
            const inProgressTask = memberTasks.find(t => t.status === 'in_progress');

            if (inProgressTask && Math.random() > 0.7) {
              const actions = [
                'Analyzing requirements',
                'Writing code',
                'Testing implementation',
                'Reviewing changes',
                'Optimizing performance',
                'Debugging issue',
                'Updating documentation',
                'Refactoring code',
                'Running tests',
                'Committing changes'
              ];

              const action = actions[Math.floor(Math.random() * actions.length)];

              addActivity({
                agent: member.name,
                agentType: member.agentType,
                team: team.name,
                action: action,
                task: inProgressTask.subject,
                timestamp: new Date(),
                progress: Math.floor(Math.random() * 100)
              });
            }
          });
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [teams]);

  const addActivity = (activity) => {
    setActivities(prev => [
      { ...activity, id: Date.now() + Math.random() },
      ...prev
    ].slice(0, 100));
  };

  const getActivityColor = (agentType) => {
    const colors = {
      'Front-End-Developer': '#60a5fa',
      'Animator': '#c084fc',
      'general-purpose': '#34d399',
      'Opus 4.6': '#fbbf24',
      'Sonnet 4.5': '#f97316'
    };
    return colors[agentType] || '#9ca3af';
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity aria-hidden="true" className="h-5 w-5 text-claude-orange animate-pulse" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Live Agent Activity Stream</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Zap aria-hidden="true" className="h-3 w-3 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="flex-1 overflow-y-auto space-y-1" style={{ minHeight: 0 }}>
        {activities.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <Activity aria-hidden="true" className="h-16 w-16 mx-auto mb-3 opacity-50 animate-pulse" />
            <p className="text-sm">Waiting for agent activity...</p>
            <p className="text-xs mt-1">Live stream will appear here</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="p-2 rounded-lg border transition-all"
              style={{
                animation: 'fadeIn 0.3s ease-out',
                backgroundColor: 'rgba(55,65,81,0.3)',
                borderColor: 'rgba(75,85,99,0.5)',
                borderLeftWidth: '3px',
                borderLeftColor: getActivityColor(activity.agentType)
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,117,10,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(75,85,99,0.5)'}
            >
              <div className="flex items-start gap-2">
                <Cpu
                  aria-hidden="true"
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{ color: getActivityColor(activity.agentType) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: getActivityColor(activity.agentType) }}
                    >
                      {activity.agent}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {activity.action}
                    </span>
                    <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {dayjs(activity.timestamp).fromNow()}
                    </span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {activity.task}
                  </div>
                  {activity.progress !== undefined && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 rounded-full h-1" style={{ background: 'var(--bg-secondary)' }}>
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${activity.progress}%`,
                            backgroundColor: getActivityColor(activity.agentType)
                          }}
                        ></div>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {activity.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Stats */}
      <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
            <div className="text-lg font-bold" style={{ color: '#60a5fa' }}>{activities.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Events</div>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
            <div className="text-lg font-bold" style={{ color: '#4ade80' }}>
              {new Set(activities.map(a => a.agent)).size}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active</div>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}>
            <div className="text-lg font-bold" style={{ color: '#c084fc' }}>
              {activities.filter(a => Date.now() - a.timestamp < 10000).length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 10s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
