/**
 * Skeleton Loader Components
 *
 * Animated placeholder components for loading states
 * Provides better UX than spinners by showing content structure
 *
 * Usage: Replace spinner/loading states with appropriate skeleton component
 */

import React from 'react';

/**
 * SkeletonCard - Full card skeleton
 * Use for: TeamCard, SystemStatus, etc.
 */
export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton-animated w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-animated h-6 w-3/4" />
          <div className="skeleton-animated h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton-animated h-4 w-full" />
        <div className="skeleton-animated h-4 w-5/6" />
        <div className="skeleton-animated h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * SkeletonStat - Stat card skeleton
 * Use for: StatsOverview items
 */
export function SkeletonStat() {
  return (
    <div className="flex items-center gap-3">
      <div className="skeleton-animated w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="skeleton-animated h-3 w-20" />
        <div className="skeleton-animated h-6 w-12" />
      </div>
    </div>
  );
}

/**
 * SkeletonStatsOverview - Full stats overview skeleton
 * Use for: Main stats bar at top of dashboard
 */
export function SkeletonStatsOverview() {
  return (
    <div className="card p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTaskItem - Single task item skeleton
 * Use for: TaskList items
 */
export function SkeletonTaskItem() {
  return (
    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
      <div className="flex items-start gap-3">
        <div className="skeleton-animated w-5 h-5 rounded-full mt-1 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="skeleton-animated h-5 w-2/3" />
            <div className="skeleton-animated h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-animated h-4 w-full" />
            <div className="skeleton-animated h-4 w-4/5" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton-animated h-6 w-24 rounded" />
            <div className="skeleton-animated h-6 w-28 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonTaskList - Full task list skeleton
 * Use for: TaskList loading state
 */
export function SkeletonTaskList({ count = 3 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonAgentCard - Agent card skeleton
 * Use for: AgentCard loading state
 */
export function SkeletonAgentCard() {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
      <div className="flex items-start gap-3">
        <div className="skeleton-animated w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="skeleton-animated h-5 w-32" />
            <div className="skeleton-animated h-5 w-12 rounded-full" />
          </div>
          <div className="skeleton-animated h-4 w-40" />
          <div className="skeleton-animated h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonTeamCard - Team card skeleton with agents
 * Use for: TeamCard loading state
 */
export function SkeletonTeamCard() {
  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton-animated w-12 h-12 rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton-animated h-6 w-40" />
            <div className="skeleton-animated h-4 w-32" />
          </div>
        </div>
        <div className="skeleton-animated h-8 w-24 rounded-full" />
      </div>

      {/* Agents */}
      <div className="space-y-3">
        <div className="skeleton-animated h-4 w-20" />
        <div className="space-y-2">
          <SkeletonAgentCard />
          <SkeletonAgentCard />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        <div className="skeleton-animated h-4 w-16" />
        <SkeletonTaskList count={2} />
      </div>
    </div>
  );
}

/**
 * SkeletonActivityItem - Activity feed item skeleton
 * Use for: ActivityFeed items
 */
export function SkeletonActivityItem() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/30">
      <div className="skeleton-animated w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-animated h-4 w-full" />
        <div className="skeleton-animated h-3 w-3/4" />
        <div className="skeleton-animated h-3 w-20" />
      </div>
    </div>
  );
}

/**
 * SkeletonActivityFeed - Full activity feed skeleton
 * Use for: ActivityFeed loading state
 */
export function SkeletonActivityFeed({ count = 5 }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton-animated h-6 w-32" />
        <div className="skeleton-animated h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {[...Array(count)].map((_, i) => (
          <SkeletonActivityItem key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonChart - Chart/graph skeleton
 * Use for: LiveMetrics, charts
 */
export function SkeletonChart() {
  return (
    <div className="card p-6 space-y-4">
      <div className="skeleton-animated h-6 w-48" />
      <div className="flex items-end justify-between h-32 gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="skeleton-animated flex-1"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              borderRadius: '4px 4px 0 0'
            }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-animated h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonMetricCard - Metric card skeleton
 * Use for: LiveMetrics cards
 */
export function SkeletonMetricCard() {
  return (
    <div className="stat-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton-animated h-5 w-32" />
        <div className="skeleton-animated h-8 w-8 rounded-lg" />
      </div>
      <div className="skeleton-animated h-10 w-20" />
      <div className="skeleton-animated h-4 w-full" />
    </div>
  );
}

/**
 * SkeletonTable - Table skeleton
 * Use for: Data tables
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="card overflow-hidden">
      {/* Table header */}
      <div className="flex gap-4 p-4 border-b border-gray-700">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="flex-1">
            <div className="skeleton-animated h-4 w-3/4" />
          </div>
        ))}
      </div>
      {/* Table rows */}
      <div className="divide-y divide-gray-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                <div className="skeleton-animated h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonText - Generic text skeleton
 * Use for: Text placeholders
 */
export function SkeletonText({ lines = 3, widths = ['100%', '90%', '80%'] }) {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="skeleton-animated h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Avatar skeleton
 * Use for: User avatars, agent icons
 */
export function SkeletonAvatar({ size = 'medium' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  };

  return (
    <div className={`skeleton-animated rounded-full ${sizeClasses[size]}`} />
  );
}

/**
 * SkeletonGrid - Grid of skeleton items
 * Use for: Dashboard grids
 */
export function SkeletonGrid({ columns = 3, rows = 2, Component = SkeletonCard }) {
  const items = columns * rows;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {[...Array(items)].map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonArchiveCard - Archive card skeleton
 * Use for: ArchiveViewer loading state
 */
export function SkeletonArchiveCard({ lines = 3, height = 'h-4' }) {
  return (
    <div className="card animate-pulse border-l-4 border-l-purple-500/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="skeleton-animated h-6 w-1/3 rounded" />
            <div className="skeleton-animated h-5 w-12 rounded-full" />
          </div>
          <div className="skeleton-animated h-4 w-full rounded mb-1" />
          <div className="skeleton-animated h-4 w-4/5 rounded" />
        </div>
        <div className="skeleton-animated w-9 h-9 rounded-lg ml-4 flex-shrink-0" />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="skeleton-animated h-9 w-36 rounded-lg" />
        <div className="skeleton-animated h-9 w-28 rounded-lg" />
        <div className="skeleton-animated h-9 w-32 rounded-lg" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`${height} skeleton-animated rounded mb-2`} style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  );
}

/**
 * SkeletonOutputViewer - Agent output viewer skeleton
 * Use for: AgentOutputViewer loading state
 */
export function SkeletonOutputViewer() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="skeleton-animated w-5 h-5 rounded" />
          <div className="skeleton-animated h-6 w-40 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-animated w-8 h-8 rounded-lg" />
          <div className="skeleton-animated w-24 h-8 rounded-lg" />
          <div className="skeleton-animated w-8 h-8 rounded-lg" />
        </div>
      </div>
      <div className="mb-4">
        <div className="skeleton-animated h-4 w-32 rounded mb-2" />
        <div className="flex gap-2">
          <div className="skeleton-animated h-16 w-32 rounded-lg" />
          <div className="skeleton-animated h-16 w-32 rounded-lg" />
          <div className="skeleton-animated h-16 w-32 rounded-lg" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 h-[300px]">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-animated h-4 rounded" style={{ width: `${Math.random() * 40 + 40}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonTeamHistoryRow - Team history row skeleton
 * Use for: TeamHistory loading state
 */
export function SkeletonTeamHistoryRow() {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 bg-gray-700/30">
        <div className="flex items-start gap-3">
          <div className="skeleton-animated w-5 h-5 rounded mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="skeleton-animated h-5 w-40 rounded" />
              <div className="skeleton-animated h-5 w-14 rounded-full" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="skeleton-animated h-3 w-24 rounded" />
              <div className="skeleton-animated h-3 w-20 rounded" />
              <div className="skeleton-animated h-3 w-28 rounded" />
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="skeleton-animated h-2 rounded-full" style={{ width: '60%' }} />
            </div>
            <div className="skeleton-animated h-3 w-36 rounded mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonInboxViewer - Inbox viewer skeleton
 * Use for: InboxViewer loading state (two-panel layout)
 */
export function SkeletonInboxViewer() {
  return (
    <div className="card animate-pulse" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: '600px',
      }}>
        {/* Left panel skeleton */}
        <div style={{
          borderRight: '1px solid rgba(55, 65, 81, 0.6)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '1rem',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton-animated w-5 h-5 rounded" />
            <div className="skeleton-animated h-5 w-16 rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                <div className="skeleton-animated w-4 h-4 rounded flex-shrink-0" />
                <div className="skeleton-animated w-4 h-4 rounded flex-shrink-0" />
                <div className="skeleton-animated h-4 rounded flex-1" />
                <div className="skeleton-animated w-5 h-5 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
        {/* Right panel skeleton */}
        <div style={{ padding: '1rem' }}>
          <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid rgba(55, 65, 81, 0.5)' }}>
            <div className="skeleton-animated w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="skeleton-animated h-4 w-40 rounded" />
              <div className="skeleton-animated h-3 w-24 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ borderLeft: '4px solid rgba(75, 85, 99, 0.4)' }}>
                <div className="skeleton-animated w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="skeleton-animated h-3 w-24 rounded" />
                    <div className="skeleton-animated h-3 w-16 rounded" />
                  </div>
                  <div className="skeleton-animated h-4 w-full rounded" />
                  <div className="skeleton-animated h-4 rounded" style={{ width: `${70 - i * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonActivityTimeline - Activity feed timeline skeleton
 * Use for: ActivityFeed loading state
 */
export function SkeletonActivityTimeline({ count = 4 }) {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton-animated w-10 h-10 rounded-xl" />
          <div className="skeleton-animated h-6 w-28 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-animated w-20 h-8 rounded-lg" />
          <div className="skeleton-animated w-20 h-7 rounded-full" />
        </div>
      </div>
      <div className="relative">
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: 'rgba(75, 85, 99, 0.3)' }}
        />
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="relative pl-14">
              <div
                className="absolute left-0 top-1 p-2 rounded-xl"
                style={{ background: 'rgba(75, 85, 99, 0.2)', border: '2px solid rgba(75, 85, 99, 0.3)' }}
              >
                <div className="skeleton-animated w-5 h-5 rounded" />
              </div>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderLeft: '3px solid rgba(75, 85, 99, 0.4)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton-animated h-4 w-16 rounded" />
                  <div className="skeleton-animated h-3 w-20 rounded" />
                </div>
                <div className="skeleton-animated h-4 rounded" style={{ width: `${80 - i * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonBadge - Badge skeleton
 * Use for: Status badges
 */
export function SkeletonBadge() {
  return (
    <div className="skeleton-animated h-6 w-20 rounded-full inline-block" />
  );
}

/**
 * SkeletonButton - Button skeleton
 * Use for: Button placeholders
 */
export function SkeletonButton({ size = 'medium' }) {
  const sizeClasses = {
    small: 'h-8 w-20',
    medium: 'h-10 w-24',
    large: 'h-12 w-32'
  };

  return (
    <div className={`skeleton-animated rounded-lg ${sizeClasses[size]}`} />
  );
}

/**
 * SkeletonDashboard - Complete dashboard skeleton
 * Use for: Initial page load
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <SkeletonStatsOverview />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams column */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonTeamCard />
          <SkeletonTeamCard />
        </div>

        {/* Activity feed column */}
        <div className="lg:col-span-1">
          <SkeletonActivityFeed />
        </div>
      </div>
    </div>
  );
}
