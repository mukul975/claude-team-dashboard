import React from 'react';

export function SkeletonCard() {
  return (
    <div className="card p-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer" style={{ width: '64px', height: '64px', borderRadius: '9999px', flexShrink: 0 }} />
        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-shimmer" style={{ height: '24px', width: '75%' }} />
          <div className="skeleton-shimmer" style={{ height: '16px', width: '50%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
        <div className="skeleton-shimmer" style={{ height: '16px', width: '83.33%' }} />
        <div className="skeleton-shimmer" style={{ height: '16px', width: '80%' }} />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="flex items-center gap-3">
      <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '8px', flexShrink: 0 }} />
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '12px', width: '80px' }} />
        <div className="skeleton-shimmer" style={{ height: '24px', width: '48px' }} />
      </div>
    </div>
  );
}

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

export function SkeletonTaskItem() {
  return (
    <div className="rounded-lg p-4 border border-gray-600" style={{ backgroundColor: 'rgba(55,65,81,0.3)' }}>
      <div className="flex items-start gap-3">
        <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '9999px', marginTop: '4px', flexShrink: 0 }} />
        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="skeleton-shimmer" style={{ height: '20px', width: '66.67%' }} />
            <div className="skeleton-shimmer" style={{ height: '24px', width: '80px', borderRadius: '9999px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
            <div className="skeleton-shimmer" style={{ height: '16px', width: '80%' }} />
          </div>
          <div className="flex gap-2">
            <div className="skeleton-shimmer" style={{ height: '24px', width: '96px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ height: '24px', width: '112px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTaskList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[...Array(count)].map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
}

export function SkeletonAgentCard() {
  return (
    <div className="rounded-lg p-4 border border-gray-600" style={{ backgroundColor: 'rgba(55,65,81,0.5)' }}>
      <div className="flex items-start gap-3">
        <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }} />
        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer" style={{ height: '20px', width: '128px' }} />
            <div className="skeleton-shimmer" style={{ height: '20px', width: '48px', borderRadius: '9999px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ height: '16px', width: '160px' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', width: '96px' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTeamCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ height: '24px', width: '160px' }} />
            <div className="skeleton-shimmer" style={{ height: '16px', width: '128px' }} />
          </div>
        </div>
        <div className="skeleton-shimmer" style={{ height: '32px', width: '96px', borderRadius: '9999px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '80px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonAgentCard />
          <SkeletonAgentCard />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '64px' }} />
        <SkeletonTaskList count={2} />
      </div>
    </div>
  );
}

export function SkeletonActivityItem() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(55,65,81,0.3)' }}>
      <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '9999px', flexShrink: 0 }} />
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '75%' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '80px' }} />
      </div>
    </div>
  );
}

export function SkeletonActivityFeed({ count = 5 }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton-shimmer" style={{ height: '24px', width: '128px' }} />
        <div className="skeleton-shimmer" style={{ height: '32px', width: '32px', borderRadius: '9999px' }} />
      </div>
      <div className="max-h-96 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[...Array(count)].map((_, i) => (
          <SkeletonActivityItem key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="skeleton-shimmer" style={{ height: '24px', width: '192px' }} />
      <div className="flex justify-between gap-2" style={{ height: '128px', alignItems: 'flex-end' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer flex-1"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              borderRadius: '4px 4px 0 0'
            }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
        <div className="skeleton-shimmer" style={{ height: '12px', width: '32px' }} />
      </div>
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="stat-card p-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer" style={{ height: '20px', width: '128px' }} />
        <div className="skeleton-shimmer" style={{ height: '32px', width: '32px', borderRadius: '8px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ height: '40px', width: '80px' }} />
      <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 p-4" style={{ borderBottom: '1px solid rgba(55, 65, 81, 0.6)' }}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="flex-1">
            <div className="skeleton-shimmer" style={{ height: '16px', width: '75%' }} />
          </div>
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4" style={{ borderBottom: rowIndex < rows - 1 ? '1px solid rgba(55, 65, 81, 0.6)' : 'none' }}>
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, widths = ['100%', '90%', '80%'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{ height: '16px', width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'medium' }) {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96
  };
  const px = sizeMap[size] || 48;

  return (
    <div className="skeleton-shimmer" style={{ width: `${px}px`, height: `${px}px`, borderRadius: '9999px' }} />
  );
}

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

export function SkeletonArchiveCard({ lines = 3 }) {
  return (
    <div className="card animate-pulse" style={{ borderLeft: '4px solid rgba(168,85,247,0.3)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="skeleton-shimmer" style={{ height: '24px', width: '33.33%', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ height: '20px', width: '48px', borderRadius: '9999px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px', marginBottom: '4px' }} />
          <div className="skeleton-shimmer" style={{ height: '16px', width: '80%', borderRadius: '4px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px', marginLeft: '16px', flexShrink: 0 }} />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="skeleton-shimmer" style={{ height: '36px', width: '144px', borderRadius: '8px' }} />
        <div className="skeleton-shimmer" style={{ height: '36px', width: '112px', borderRadius: '8px' }} />
        <div className="skeleton-shimmer" style={{ height: '36px', width: '128px', borderRadius: '8px' }} />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-shimmer" style={{ height: '16px', borderRadius: '4px', marginBottom: '8px', width: `${85 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonOutputViewer() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          <div className="skeleton-shimmer" style={{ height: '24px', width: '160px', borderRadius: '4px' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ width: '96px', height: '32px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        </div>
      </div>
      <div className="mb-4">
        <div className="skeleton-shimmer" style={{ height: '16px', width: '128px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="flex gap-2">
          <div className="skeleton-shimmer" style={{ height: '64px', width: '128px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '64px', width: '128px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '64px', width: '128px', borderRadius: '8px' }} />
        </div>
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(55, 65, 81, 0.6)', height: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '16px', borderRadius: '4px', width: `${Math.random() * 40 + 40}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTeamHistoryRow() {
  return (
    <div className="rounded-lg overflow-hidden animate-pulse" style={{ border: '1px solid rgba(55,65,81,0.5)', borderRadius: '12px' }}>
      <div className="p-4" style={{ backgroundColor: 'rgba(55,65,81,0.3)' }}>
        <div className="flex items-start gap-3">
          <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '4px', marginTop: '4px', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="skeleton-shimmer" style={{ height: '20px', width: '160px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '20px', width: '56px', borderRadius: '9999px' }} />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="skeleton-shimmer" style={{ height: '12px', width: '96px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '12px', width: '80px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '12px', width: '112px', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(75, 85, 99, 0.6)', borderRadius: '9999px', height: '8px' }}>
              <div className="skeleton-shimmer" style={{ height: '8px', borderRadius: '9999px', width: '60%' }} />
            </div>
            <div className="skeleton-shimmer" style={{ height: '12px', width: '144px', borderRadius: '4px', marginTop: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonInboxViewer() {
  return (
    <div className="card animate-pulse" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: '600px',
      }}>
        <div style={{
          borderRight: '1px solid rgba(55, 65, 81, 0.6)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '1rem',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ height: '20px', width: '64px', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                <div className="skeleton-shimmer" style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0 }} />
                <div className="skeleton-shimmer" style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0 }} />
                <div className="skeleton-shimmer flex-1" style={{ height: '16px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '9999px', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <div className="flex items-center gap-3 mb-6" style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(55, 65, 81, 0.5)' }}>
            <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '9999px', flexShrink: 0 }} />
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="skeleton-shimmer" style={{ height: '16px', width: '160px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '12px', width: '96px', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ borderLeft: '4px solid rgba(75, 85, 99, 0.4)' }}>
                <div className="skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '9999px', flexShrink: 0 }} />
                <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="flex items-center justify-between">
                    <div className="skeleton-shimmer" style={{ height: '12px', width: '96px', borderRadius: '4px' }} />
                    <div className="skeleton-shimmer" style={{ height: '12px', width: '64px', borderRadius: '4px' }} />
                  </div>
                  <div className="skeleton-shimmer" style={{ height: '16px', width: '100%', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ height: '16px', borderRadius: '4px', width: `${70 - i * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityTimeline({ count = 4 }) {
  return (
    <div
      className="animate-pulse"
      style={{
        borderRadius: '16px',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          <div className="skeleton-shimmer" style={{ height: '24px', width: '112px', borderRadius: '4px' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
          <div className="skeleton-shimmer" style={{ width: '80px', height: '28px', borderRadius: '9999px' }} />
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '2px', background: 'rgba(75, 85, 99, 0.3)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ position: 'relative', paddingLeft: '56px' }}>
              <div
                style={{ position: 'absolute', left: 0, top: '4px', padding: '8px', borderRadius: '12px', background: 'rgba(75, 85, 99, 0.2)', border: '2px solid rgba(75, 85, 99, 0.3)' }}
              >
                <div className="skeleton-shimmer" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              </div>
              <div
                className="p-4"
                style={{
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderLeft: '3px solid rgba(75, 85, 99, 0.4)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton-shimmer" style={{ height: '16px', width: '64px', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ height: '12px', width: '80px', borderRadius: '4px' }} />
                </div>
                <div className="skeleton-shimmer" style={{ height: '16px', borderRadius: '4px', width: `${80 - i * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBadge() {
  return (
    <div className="skeleton-shimmer" style={{ height: '24px', width: '80px', borderRadius: '9999px', display: 'inline-block' }} />
  );
}

export function SkeletonButton({ size = 'medium' }) {
  const sizeMap = {
    small: { height: '32px', width: '80px' },
    medium: { height: '40px', width: '96px' },
    large: { height: '48px', width: '128px' }
  };
  const dims = sizeMap[size] || sizeMap.medium;

  return (
    <div className="skeleton-shimmer" style={{ ...dims, borderRadius: '8px' }} />
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SkeletonStatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SkeletonTeamCard />
          <SkeletonTeamCard />
        </div>
        <div className="lg:col-span-1">
          <SkeletonActivityFeed />
        </div>
      </div>
    </div>
  );
}
