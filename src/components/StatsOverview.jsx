import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Users, ListTodo, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useCounterAnimation } from '../hooks/useCounterAnimation';

export function StatsOverview({ stats }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Use optimized counter animation hook for each stat
  const animatedTotalTeams = useCounterAnimation(stats?.totalTeams ?? 0, 1000);
  const animatedTotalAgents = useCounterAnimation(stats?.totalAgents ?? 0, 1000);
  const animatedTotalTasks = useCounterAnimation(stats?.totalTasks ?? 0, 1000);
  const animatedPendingTasks = useCounterAnimation(stats?.pendingTasks ?? 0, 1000);
  const animatedInProgress = useCounterAnimation(stats?.inProgressTasks ?? 0, 1000);
  const animatedCompleted = useCounterAnimation(stats?.completedTasks ?? 0, 1000);
  const animatedBlocked = useCounterAnimation(stats?.blockedTasks ?? 0, 1000);

  if (!stats) return null;

  // Map stat keys to their animated values
  const animatedValuesMap = {
    totalTeams: animatedTotalTeams,
    totalAgents: animatedTotalAgents,
    totalTasks: animatedTotalTasks,
    pendingTasks: animatedPendingTasks,
    inProgressTasks: animatedInProgress,
    completedTasks: animatedCompleted,
    blockedTasks: animatedBlocked
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
    }
  ];

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${index * 80}ms`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.12)`;
                e.currentTarget.style.borderColor = stat.borderColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = stat.borderColor;
              }}
            >
              {/* Icon */}
              <div
                className="inline-flex p-2.5 rounded-lg mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  boxShadow: `0 2px 8px ${stat.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                  border: `1px solid ${stat.borderColor}`
                }}
              >
                <Icon
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
                  className="text-3xl font-extrabold tabular-nums"
                  style={{
                    color: '#ffffff',
                    letterSpacing: '-0.03em',
                    textShadow: `0 2px 4px rgba(0, 0, 0, 0.3), 0 0 12px ${stat.glowColor}`,
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
                  color: 'rgba(209, 213, 219, 0.7)',
                  letterSpacing: '0.05em'
                }}
              >
                {stat.label}
              </p>

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
  })
};
