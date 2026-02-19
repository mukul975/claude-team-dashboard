import React, { useState, useMemo } from 'react';
import { Clock, ChevronDown, Filter } from 'lucide-react';
import { formatRelativeTime, getAgentColor, getAgentInitials, formatMessageText } from '../utils/formatting';
import { getInboxMessages } from '../utils/safeKey';

const AGENT_BG_COLORS = {
  'bg-blue-600': '#2563eb',
  'bg-purple-600': '#9333ea',
  'bg-green-600': '#16a34a',
  'bg-red-600': '#dc2626',
  'bg-yellow-600': '#ca8a04',
  'bg-pink-600': '#db2777',
  'bg-indigo-600': '#4f46e5',
  'bg-orange-500': '#f97316',
};

const AGENT_BORDER_COLORS = {
  'bg-blue-600': '#3b82f6',
  'bg-purple-600': '#a855f7',
  'bg-green-600': '#22c55e',
  'bg-red-600': '#ef4444',
  'bg-yellow-600': '#eab308',
  'bg-pink-600': '#ec4899',
  'bg-indigo-600': '#6366f1',
  'bg-orange-500': '#fb923c',
};

const PAGE_SIZE = 50;

function getSummaryText(msg) {
  const raw = msg.summary || msg.content || msg.message || '';
  const parsed = formatMessageText(raw); // lgtm[js/call-to-non-callable]
  if (parsed.type === 'text' || parsed.type === 'raw') return parsed.content;
  if (parsed.summary) return parsed.summary;
  if (parsed.subject) return parsed.subject;
  return raw;
}

export const TeamTimeline = React.memo(function TeamTimeline({ allInboxes = {}, teams = [] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTeam, setSelectedTeam] = useState('all');

  const teamNames = useMemo(() => Object.keys(allInboxes), [allInboxes]);

  const allMessages = useMemo(() => {
    return Object.entries(allInboxes)
      .flatMap(([teamName, agents]) =>
        Object.entries(agents || {}).flatMap(([agentName, inbox]) => {
          const messages = getInboxMessages(inbox);
          return messages.map(msg => ({ ...msg, teamName, agentName }));
        })
      )
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [allInboxes]);

  const filteredMessages = useMemo(() => {
    if (selectedTeam === 'all') return allMessages;
    return allMessages.filter(msg => msg.teamName === selectedTeam);
  }, [allMessages, selectedTeam]);

  const visibleMessages = useMemo(() => filteredMessages.slice(0, visibleCount), [filteredMessages, visibleCount]);
  const hasMore = visibleCount < filteredMessages.length;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%)',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}
          >
            <Clock
              className="h-5 w-5"
              style={{
                color: '#fb923c',
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))'
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
            Team Activity Timeline
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Team filter dropdown */}
          <div className="relative">
            <div className="flex items-center">
              <Filter className="h-3.5 w-3.5 mr-1.5" style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="appearance-none text-xs font-medium pl-2 pr-7 py-1.5 rounded-lg focus:border-claude-orange focus:outline-none cursor-pointer"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', backgroundImage: 'none' }}
                aria-label="Filter by team"
              >
                <option value="all">All Teams</option>
                {teamNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 -ml-5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Message counter */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {filteredMessages.length} messages
          </span>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        className="overflow-y-auto pr-2"
        style={{ scrollbarWidth: 'thin', maxHeight: '600px' }}
      >
        {filteredMessages.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)'
            }}
          >
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No team activity yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Messages from agent inboxes will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMessages.map((msg, index) => {
              const agentColor = getAgentColor(msg.agentName); // lgtm[js/call-to-non-callable]
              const agentInitials = getAgentInitials(msg.agentName); // lgtm[js/call-to-non-callable]
              const bgColor = AGENT_BG_COLORS[agentColor] || '#6b7280';
              const borderColor = AGENT_BORDER_COLORS[agentColor] || '#6b7280';
              const relativeTime = formatRelativeTime(msg.timestamp); // lgtm[js/call-to-non-callable]
              const parsedSummary = getSummaryText(msg);

              return (
                <div
                  key={`${msg.teamName}-${msg.agentName}-${msg.timestamp}-${index}`}
                  className="flex gap-3 items-start"
                  style={{
                    animation: index < PAGE_SIZE ? `slideInRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)` : undefined,
                    animationDelay: index < 10 ? `${index * 40}ms` : undefined,
                    animationFillMode: index < PAGE_SIZE ? 'both' : undefined
                  }}
                >
                  {/* Agent avatar */}
                  <div className="rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ flexShrink: 0, width: 32, height: 32, backgroundColor: bgColor }}>
                    {agentInitials}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 rounded-lg p-3"
                    style={{
                      background: 'var(--bg-secondary)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      borderLeft: `2px solid ${borderColor}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-heading)' }}>{msg.agentName}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>in</span>
                      <span className="text-xs" style={{ color: '#fb923c' }}>{msg.teamName}</span>
                      <span
                        className="text-xs ml-auto"
                        style={{ color: 'var(--text-muted)' }}
                        title={msg.timestamp}
                      >
                        {relativeTime}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{parsedSummary}</p>
                  </div>
                </div>
              );
            })}

            {/* Show more button */}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  aria-label={`Show more messages, ${filteredMessages.length - visibleCount} remaining`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(249, 115, 22, 0.15)',
                    color: '#fb923c',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                  Show more ({filteredMessages.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
