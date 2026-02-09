import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
          <Activity className="h-5 w-5 text-claude-orange animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Live Agent Activity Stream</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Zap className="h-3 w-3 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="flex-1 overflow-y-auto space-y-1" style={{ minHeight: 0 }}>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="h-16 w-16 mx-auto mb-3 opacity-50 animate-pulse" />
            <p className="text-sm">Waiting for agent activity...</p>
            <p className="text-xs mt-1">Live stream will appear here</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="p-2 rounded-lg bg-gray-700/30 border border-gray-600/50 hover:border-claude-orange/50 transition-all"
              style={{
                animation: 'fadeIn 0.3s ease-out',
                borderLeftWidth: '3px',
                borderLeftColor: getActivityColor(activity.agentType)
              }}
            >
              <div className="flex items-start gap-2">
                <Cpu
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
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 truncate">
                      {activity.action}
                    </span>
                    <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {activity.task}
                  </div>
                  {activity.progress !== undefined && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-600 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${activity.progress}%`,
                            backgroundColor: getActivityColor(activity.agentType)
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
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
      <div className="pt-3 mt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <div className="text-lg font-bold text-blue-400">{activities.length}</div>
            <div className="text-xs text-gray-400">Events</div>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-lg font-bold text-green-400">
              {new Set(activities.map(a => a.agent)).size}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10">
            <div className="text-lg font-bold text-purple-400">
              {activities.filter(a => Date.now() - a.timestamp < 10000).length}
            </div>
            <div className="text-xs text-gray-400">Last 10s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
