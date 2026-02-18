import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Users, ListTodo, Clock, CheckCircle, AlertCircle, MessageSquare, Bell } from 'lucide-react';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

const HISTORY_KEY = 'dashboard-stats-history';
const MAX_HISTORY = 10;

function Sparkline({ data, color, width = 48, height = 20 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * height
  ]);
  const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function getStatsHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore parse errors */ }
  return [];
}

function saveStatsHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (_) { /* ignore quota errors */ }
}

export function StatsOverview({ stats, allInboxes = {} }) {
  const [isVisible, setIsVisible] = useState(false);
  const [statsHistory, setStatsHistory] = useState(() => getStatsHistory());
  const lastSnapshotRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Use optimized counter animation hook for each stat
  // Hook returns a number value, not a function (false positive)
  const animatedTotalTeams = useCounterAnimation(stats?.totalTeams ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedTotalAgents = useCounterAnimation(stats?.totalAgents ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedTotalTasks = useCounterAnimation(stats?.totalTasks ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedPendingTasks = useCounterAnimation(stats?.pendingTasks ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedInProgress = useCounterAnimation(stats?.inProgressTasks ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedCompleted = useCounterAnimation(stats?.completedTasks ?? 0, 1000); // lgtm[js/invocation-of-non-function]
  const animatedBlocked = useCounterAnimation(stats?.blockedTasks ?? 0, 1000); // lgtm[js/invocation-of-non-function]

  // Inbox stats
  const totalMessages = Object.values(allInboxes).reduce((t, agents) =>
    t + Object.values(agents || {}).reduce((s, a) => s + (a.messages || []).length, 0), 0);

  const unreadMessages = Object.values(allInboxes).reduce((t, agents) =>
    t + Object.values(agents || {}).reduce((s, a) => s + (a.messages || []).filter(m => m.read === false).length, 0), 0);

  const animatedTotalMessages = useCounterAnimation(totalMessages, 1000); // lgtm[js/invocation-of-non-function]
  const animatedUnreadMessages = useCounterAnimation(unreadMessages, 1000); // lgtm[js/invocation-of-non-function]

  // Track stats history in localStorage
  const appendHistory = useCallback((currentStats, msgTotal, msgUnread) => {
    if (!currentStats) return;
    const snapshot = {
      totalTeams: currentStats.totalTeams ?? 0,
      totalAgents: currentStats.totalAgents ?? 0,
      totalTasks: currentStats.totalTasks ?? 0,
      pendingTasks: currentStats.pendingTasks ?? 0,
      inProgressTasks: currentStats.inProgressTasks ?? 0,
      completedTasks: currentStats.completedTasks ?? 0,
      blockedTasks: currentStats.blockedTasks ?? 0,
      totalMessages: msgTotal,
      unreadMessages: msgUnread
    };
    const fingerprint = JSON.stringify(snapshot);
    if (lastSnapshotRef.current === fingerprint) return;
    lastSnapshotRef.current = fingerprint;
    const history = getStatsHistory();
    history.push(snapshot);
    const trimmed = history.slice(-MAX_HISTORY);
    saveStatsHistory(trimmed);
    setStatsHistory(trimmed);
  }, []);

  useEffect(() => {
    appendHistory(stats, totalMessages, unreadMessages);
  }, [stats, totalMessages, unreadMessages, appendHistory]);

  if (!stats) return null;

  // Map stat keys to their animated values
  const animatedValuesMap = {
    totalTeams: animatedTotalTeams,
    totalAgents: animatedTotalAgents,
    totalTasks: animatedTotalTasks,
    pendingTasks: animatedPendingTasks,
    inProgressTasks: animatedInProgress,
    completedTasks: animatedCompleted,
    blockedTasks: animatedBlocked,
    totalMessages: animatedTotalMessages,
    unreadMessages: animatedUnreadMessages
  };

  const statCards = [
    {
      label: 'Active Teams',
      key: 'totalTeams',
      icon: Users,
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
      iconColor: '#60a5fa',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    {
      label: 'Total Agents',
      key: 'totalAgents',
      icon: Users,
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)',
      iconColor: '#c084fc',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      borderColor: 'rgba(168, 85, 247, 0.3)'
    },
    {
      label: 'Total Tasks',
      key: 'totalTasks',
      icon: ListTodo,
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)',
      iconColor: '#22d3ee',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      borderColor: 'rgba(6, 182, 212, 0.3)'
    },
    {
      label: 'In Progress',
      key: 'inProgressTasks',
      icon: Clock,
      gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%)',
      iconColor: '#fb923c',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      borderColor: 'rgba(249, 115, 22, 0.3)'
    },
    {
      label: 'Completed',
      key: 'completedTasks',
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(21, 128, 61, 0.15) 100%)',
      iconColor: '#4ade80',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      borderColor: 'rgba(34, 197, 94, 0.3)'
    },
    {
      label: 'Blocked',
      key: 'blockedTasks',
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)',
      iconColor: '#f87171',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    {
      label: 'Messages',
      key: 'totalMessages',
      icon: MessageSquare,
      gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
      iconColor: '#38bdf8',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      borderColor: 'rgba(14, 165, 233, 0.3)'
    },
    {
      label: 'Unread',
      key: 'unreadMessages',
      icon: Bell,
      gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.25) 0%, rgba(236, 72, 153, 0.15) 100%)',
      iconColor: '#f472b6',
      glowColor: 'rgba(244, 114, 182, 0.4)',
      borderColor: 'rgba(244, 114, 182, 0.3)',
      extraClass: unreadMessages > 0 ? 'text-red-400' : ''
    }
  ];

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: 'var(--bg-card-gradient)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const value = animatedValuesMap[stat.key];

          return (
            <div
              key={stat.key}
              className="relative group rounded-xl p-4 transition-all duration-300"
              style={{
                background: stat.gradient,
                border: `1px solid ${stat.borderColor}`,
                boxShadow: 'var(--card-shadow)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${index * 80}ms`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.glowColor}`;
                e.currentTarget.style.borderColor = stat.borderColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = stat.borderColor;
              }}
            >
              {/* Icon */}
              <div
                className="inline-flex p-2.5 rounded-lg mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: 'var(--bg-secondary)',
                  boxShadow: `0 2px 8px ${stat.glowColor}`,
                  border: `1px solid ${stat.borderColor}`
                }}
              >
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5"
                  style={{
                    color: stat.iconColor,
                    filter: `drop-shadow(0 0 8px ${stat.glowColor})`
                  }}
                />
              </div>

              {/* Value */}
              <div className="mb-1">
                <p
                  className={`text-3xl font-extrabold tabular-nums ${stat.extraClass || ''}`}
                  style={{
                    color: stat.extraClass ? undefined : 'var(--text-heading)',
                    letterSpacing: '-0.03em',
                    textShadow: `0 0 12px ${stat.glowColor}`,
                    lineHeight: 1
                  }}
                >
                  {value}
                </p>
              </div>

              {/* Label */}
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em'
                }}
              >
                {stat.label}
              </p>

              {/* Sparkline & Trend */}
              {(() => {
                const historyData = statsHistory.map(h => h[stat.key] ?? 0);
                const len = historyData.length;
                let trendArrow = null;
                let changeText = null;
                if (len >= 2) {
                  const prev = historyData[len - 2];
                  const curr = historyData[len - 1];
                  const diff = curr - prev;
                  const pct = prev !== 0 ? Math.abs((diff / prev) * 100).toFixed(0) : (diff !== 0 ? 100 : 0);
                  if (diff > 0) {
                    trendArrow = <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700 }}>{'\u2191'}</span>;
                    changeText = <span style={{ color: '#4ade80', fontSize: '10px', marginLeft: '2px' }}>{pct}%</span>;
                  } else if (diff < 0) {
                    trendArrow = <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 700 }}>{'\u2193'}</span>;
                    changeText = <span style={{ color: '#f87171', fontSize: '10px', marginLeft: '2px' }}>{pct}%</span>;
                  } else {
                    trendArrow = <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700 }}>{'\u2192'}</span>;
                    changeText = <span style={{ color: '#9ca3af', fontSize: '10px', marginLeft: '2px' }}>0%</span>;
                  }
                }
                return (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '20px' }}>
                    <Sparkline data={historyData.length >= 2 ? historyData : null} color={stat.iconColor} />
                    {trendArrow}
                    {changeText}
                  </div>
                );
              })()}

              {/* Hover Glow Effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${stat.glowColor}, transparent 70%)`
                }}
              />

              {/* Top Border Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                  background: `linear-gradient(90deg, transparent, ${stat.iconColor}, transparent)`,
                  opacity: 0.6
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

StatsOverview.propTypes = {
  stats: PropTypes.shape({
    totalTeams: PropTypes.number,
    totalAgents: PropTypes.number,
    totalTasks: PropTypes.number,
    pendingTasks: PropTypes.number,
    inProgressTasks: PropTypes.number,
    completedTasks: PropTypes.number,
    blockedTasks: PropTypes.number
  }),
  allInboxes: PropTypes.object
};
