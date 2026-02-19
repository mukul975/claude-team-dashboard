import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Activity, Users, ListTodo, CheckCircle2,
  Mail, Cpu, Pause, Play, ChevronDown,
  AlertTriangle, Plus, Settings
} from 'lucide-react';
import { SkeletonActivityTimeline } from './SkeletonLoader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const MAX_EVENTS = 200;
const VISIBLE_BATCH = 50;

// Visual categories for the activity feed.
// Some map 1:1 to WebSocket types; others are sub-categories
// derived from inspecting the data payload.
const EVENT_TYPE_CONFIG = {
  teams_update: {
    icon: Users,
    label: 'Team',
    color: '#60a5fa',
    borderColor: 'rgba(59, 130, 246, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
  },
  task_created: {
    icon: Plus,
    label: 'Task Created',
    color: '#c084fc',
    borderColor: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)',
  },
  task_completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: '#4ade80',
    borderColor: 'rgba(34, 197, 94, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(21, 128, 61, 0.15) 100%)',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
    badgeBorder: 'rgba(34, 197, 94, 0.3)',
  },
  task_blocked: {
    icon: AlertTriangle,
    label: 'Blocked',
    color: '#f87171',
    borderColor: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.3)',
  },
  task_update: {
    icon: ListTodo,
    label: 'Task',
    color: '#c084fc',
    borderColor: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)',
  },
  inbox_update: {
    icon: Mail,
    label: 'Message',
    color: '#fb923c',
    borderColor: 'rgba(249, 115, 22, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: 'rgba(249, 115, 22, 0.3)',
  },
  agent_outputs_update: {
    icon: Cpu,
    label: 'Agent',
    color: '#22d3ee',
    borderColor: 'rgba(34, 211, 238, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    badgeBg: 'rgba(34, 211, 238, 0.15)',
    badgeBorder: 'rgba(34, 211, 238, 0.3)',
  },
  initial_data: {
    icon: Settings,
    label: 'System',
    color: '#9ca3af',
    borderColor: 'rgba(156, 163, 175, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(75, 85, 99, 0.25) 0%, rgba(55, 65, 81, 0.15) 100%)',
    glowColor: 'rgba(75, 85, 99, 0.4)',
    badgeBg: 'rgba(75, 85, 99, 0.15)',
    badgeBorder: 'rgba(75, 85, 99, 0.3)',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  label: 'Event',
  color: '#9ca3af',
  borderColor: 'rgba(156, 163, 175, 0.6)',
  bgGradient: 'rgba(55, 65, 81, 0.3)',
  glowColor: 'rgba(75, 85, 99, 0.3)',
  badgeBg: 'rgba(75, 85, 99, 0.15)',
  badgeBorder: 'rgba(75, 85, 99, 0.3)',
};

function getConfig(type) {
  return EVENT_TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

// Extract stats snapshot from a task_update message's data array
function extractTaskSnapshot(data) {
  let total = 0;
  let completed = 0;
  let blocked = 0;
  if (!Array.isArray(data)) return { total, completed, blocked };
  for (const team of data) {
    for (const task of (team.tasks || [])) {
      total++;
      if (task.status === 'completed') completed++;
      if (task.blockedBy && task.blockedBy.length > 0) blocked++;
    }
  }
  return { total, completed, blocked };
}

// Classify a task_update into a more specific sub-type by comparing with prev stats
function classifyTaskUpdate(update, prevSnapshot) {
  const curr = update.stats
    ? { total: update.stats.totalTasks || 0, completed: update.stats.completedTasks || 0, blocked: update.stats.blockedTasks || 0 }
    : extractTaskSnapshot(update.data);

  if (!prevSnapshot) return 'task_update';

  if (curr.completed > prevSnapshot.completed) return 'task_completed';
  if (curr.blocked > prevSnapshot.blocked) return 'task_blocked';
  if (curr.total > prevSnapshot.total) return 'task_created';
  return 'task_update';
}

function buildActivityMessage(update, eventType) {
  if (!update) return 'System event';

  switch (update.type) {
    case 'initial_data': {
      const count = update.data?.length || 0;
      return `Connected to dashboard -- ${count} team${count !== 1 ? 's' : ''} loaded`;
    }
    case 'teams_update': {
      const names = (update.data || []).map(t => t.name).filter(Boolean);
      if (names.length > 0) {
        return `Team updated: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` +${names.length - 3} more` : ''}`;
      }
      return 'Team configuration updated';
    }
    case 'task_update': {
      const team = update.teamName || update.team || '';
      const inTeam = team ? ` in ${team}` : '';
      if (eventType === 'task_completed') {
        const n = update.stats?.completedTasks;
        return `Task completed${inTeam}${n ? ` (${n} total completed)` : ''}`;
      }
      if (eventType === 'task_blocked') {
        const n = update.stats?.blockedTasks;
        return `Task blocked${inTeam}${n ? ` (${n} blocked)` : ''}`;
      }
      if (eventType === 'task_created') {
        const n = update.stats?.totalTasks;
        return `New task created${inTeam}${n ? ` (${n} total)` : ''}`;
      }
      return team ? `Task updated in ${team}` : 'Task status changed';
    }
    case 'inbox_update': {
      const team = update.teamName || update.team;
      const count = update.inboxes ? Object.keys(update.inboxes).length : 0;
      if (team) {
        return `Agent message in ${team}${count ? ` (${count} inbox${count !== 1 ? 'es' : ''})` : ''}`;
      }
      return 'New agent message received';
    }
    case 'agent_outputs_update': {
      const count = (update.outputs || []).length;
      return count > 0 ? `Agent output received (${count} entries)` : 'Agent output updated';
    }
    default:
      return `Event: ${update.type || 'unknown'}`;
  }
}

export function ActivityFeed({ updates, loading }) {
  const [activities, setActivities] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH);
  const scrollRef = useRef(null);
  const newItemIdRef = useRef(null);
  const prevTaskSnapshotRef = useRef(null);
  const prevUpdatesRef = useRef(null);

  useEffect(() => {
    if (!updates || !updates.type) return;

    // Skip if same reference as last processed update (prevents duplicate processing
    // when parent re-renders without a new update object)
    if (updates === prevUpdatesRef.current) return;
    prevUpdatesRef.current = updates;

    // Determine the display event type. For task_update, sub-classify
    let eventType = updates.type;
    if (updates.type === 'task_update') {
      eventType = classifyTaskUpdate(updates, prevTaskSnapshotRef.current);
      // Update the snapshot for next comparison
      prevTaskSnapshotRef.current = updates.stats
        ? { total: updates.stats.totalTasks || 0, completed: updates.stats.completedTasks || 0, blocked: updates.stats.blockedTasks || 0 }
        : extractTaskSnapshot(updates.data);
    }
    if (updates.type === 'initial_data' && updates.stats) {
      prevTaskSnapshotRef.current = {
        total: updates.stats.totalTasks || 0,
        completed: updates.stats.completedTasks || 0,
        blocked: updates.stats.blockedTasks || 0,
      };
    }

    const newActivity = {
      id: Date.now() + Math.random(),
      type: eventType,
      timestamp: new Date().toISOString(),
      message: buildActivityMessage(updates, eventType),
    };

    newItemIdRef.current = newActivity.id;

    setActivities(prev => {
      const next = [newActivity, ...prev];
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });
  }, [updates]);

  // Auto-scroll to top when new events arrive (unless paused)
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities.length, isPaused]);

  // Count events by type
  const typeCounts = useMemo(() => {
    const counts = {};
    for (const a of activities) {
      counts[a.type] = (counts[a.type] || 0) + 1;
    }
    return counts;
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (!activeFilter) return activities;
    return activities.filter(a => a.type === activeFilter);
  }, [activities, activeFilter]);

  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, visibleCount);
  }, [filteredActivities, visibleCount]);

  const hasMore = filteredActivities.length > visibleCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + VISIBLE_BATCH, MAX_EVENTS));
  }, []);

  const handleFilterClick = useCallback((type) => {
    setActiveFilter(prev => prev === type ? null : type);
    setVisibleCount(VISIBLE_BATCH);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Build the ordered filter list -- only types that have events
  const filterTypes = useMemo(() => {
    const order = [
      'teams_update', 'task_created', 'task_completed', 'task_blocked',
      'task_update', 'inbox_update', 'agent_outputs_update', 'initial_data',
    ];
    return order.filter(t => (typeCounts[t] || 0) > 0);
  }, [typeCounts]);

  if (loading && activities.length === 0) {
    return <SkeletonActivityTimeline count={4} />;
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%)',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
            }}
          >
            <Activity
              aria-hidden="true"
              className="h-5 w-5"
              style={{
                color: '#fb923c',
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))',
              }}
            />
          </div>
          <h3
            className="text-lg font-bold"
            style={{
              color: 'var(--text-heading)',
              letterSpacing: '-0.01em',
            }}
          >
            Activity Feed
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Play toggle */}
          <button
            onClick={togglePause}
            aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: isPaused ? 'rgba(249, 115, 22, 0.2)' : 'var(--bg-secondary)',
              color: isPaused ? '#fb923c' : 'var(--text-muted)',
              border: `1px solid ${isPaused ? 'rgba(249, 115, 22, 0.4)' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
            title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
          >
            {isPaused ? <Play aria-hidden="true" className="h-3 w-3" /> : <Pause aria-hidden="true" className="h-3 w-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Total event count */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            {activities.length} events
          </span>
        </div>
      </div>

      {/* Filter bar with type badges */}
      {activities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTypes.map((type) => {
            const cfg = EVENT_TYPE_CONFIG[type];
            if (!cfg) return null;
            const count = typeCounts[type] || 0;
            const isActive = activeFilter === type;
            return (
              <button
                key={type}
                onClick={() => handleFilterClick(type)}
                aria-label={`Filter by ${cfg.label}`}
                aria-pressed={isActive}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? cfg.badgeBg : 'var(--bg-secondary)',
                  color: isActive ? cfg.color : 'var(--text-muted)',
                  border: `1px solid ${isActive ? cfg.badgeBorder : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 0 8px ${cfg.glowColor}` : 'none',
                }}
              >
                <cfg.icon aria-hidden="true" className="h-3 w-3" />
                {cfg.label}
                <span
                  className="ml-0.5 px-1.5 py-0 rounded-full text-xs font-bold"
                  style={{
                    background: isActive ? cfg.color : 'var(--bg-secondary)',
                    color: isActive ? '#0f172a' : 'var(--text-secondary)',
                    fontSize: '10px',
                    lineHeight: '16px',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {activeFilter && (
            <button
              onClick={() => { setActiveFilter(null); setVisibleCount(VISIBLE_BATCH); }}
              aria-label="Clear activity filter"
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Timeline Container */}
      <div
        ref={scrollRef}
        className="overflow-y-auto pr-2"
        style={{ maxHeight: '24rem', scrollbarWidth: 'thin' }}
        aria-live="polite"
        aria-label="Activity feed updates"
      >
        {activities.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <Activity aria-hidden="true" className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet. Events will appear here in real-time.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-0.5"
              style={{
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0.05) 100%)',
              }}
            />

            <div className="space-y-3">
              {visibleActivities.map((activity, index) => {
                const config = getConfig(activity.type);
                const Icon = config.icon;
                const isNew = activity.id === newItemIdRef.current && index === 0;

                return (
                  <div
                    key={activity.id}
                    className={`relative pl-14 group ${isNew ? 'activity-item-enter' : ''}`}
                  >
                    {/* Timeline Node */}
                    <div
                      className="absolute left-0 top-1 p-2 rounded-xl transition-all duration-300"
                      style={{
                        background: config.bgGradient,
                        border: `2px solid ${config.borderColor}`,
                        boxShadow: `0 4px 12px ${config.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                        zIndex: 10,
                      }}
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-5 w-5"
                        style={{
                          color: config.color,
                          filter: `drop-shadow(0 0 6px ${config.glowColor})`,
                        }}
                      />
                      {index === 0 && !isPaused && (
                        <div
                          className="absolute inset-0 rounded-xl animate-ping"
                          style={{
                            background: config.bgGradient,
                            opacity: 0.4,
                          }}
                        />
                      )}
                    </div>

                    {/* Activity Card */}
                    <div
                      className="rounded-xl p-4 transition-all duration-300"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderLeft: `3px solid ${config.borderColor}`,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = config.borderColor;
                        e.currentTarget.style.borderLeftColor = config.color;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${config.glowColor}`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.borderLeftColor = config.borderColor;
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Type label + timestamp row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            background: config.badgeBg,
                            color: config.color,
                            border: `1px solid ${config.badgeBorder}`,
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          <Icon aria-hidden="true" className="h-2.5 w-2.5" />
                          {config.label}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {dayjs(activity.timestamp).fromNow()}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {activity.message}
                      </p>

                      {/* LIVE / PAUSED indicator on first item */}
                      {index === 0 && !isPaused && (
                        <div className="absolute top-4 right-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full animate-pulse"
                              style={{
                                background: '#4ade80',
                                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                              }}
                            />
                            LIVE
                          </span>
                        </div>
                      )}
                      {index === 0 && isPaused && (
                        <div className="absolute top-4 right-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(249, 115, 22, 0.15)',
                              color: '#fb923c',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                            }}
                          >
                            <Pause aria-hidden="true" className="h-2.5 w-2.5" />
                            PAUSED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more button */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  aria-label={`Load more activities (${filteredActivities.length - visibleCount} remaining)`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                    e.currentTarget.style.color = '#fb923c';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  Load more ({filteredActivities.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ActivityFeed.propTypes = {
  updates: PropTypes.shape({
    type: PropTypes.string,
    data: PropTypes.array,
    stats: PropTypes.object,
    teamName: PropTypes.string,
    team: PropTypes.string,
    inboxes: PropTypes.object,
    outputs: PropTypes.array,
  }),
  loading: PropTypes.bool,
};
