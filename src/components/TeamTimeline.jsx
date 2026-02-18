import React, { useState, useMemo } from 'react';
import { Clock, ChevronDown, Filter } from 'lucide-react';
import { formatRelativeTime, getAgentColor, getAgentInitials, formatMessageText } from '../utils/formatting';

const BORDER_COLORS = {
  'bg-blue-600': 'border-blue-500',
  'bg-purple-600': 'border-purple-500',
  'bg-green-600': 'border-green-500',
  'bg-red-600': 'border-red-500',
  'bg-yellow-600': 'border-yellow-500',
  'bg-pink-600': 'border-pink-500',
  'bg-indigo-600': 'border-indigo-500',
  'bg-orange-500': 'border-orange-400',
};

const PAGE_SIZE = 50;

export function TeamTimeline({ allInboxes = {}, teams = [] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTeam, setSelectedTeam] = useState('all');

  const teamNames = useMemo(() => Object.keys(allInboxes), [allInboxes]);

  const allMessages = useMemo(() => {
    return Object.entries(allInboxes)
      .flatMap(([teamName, agents]) =>
        Object.entries(agents || {}).flatMap(([agentName, inbox]) => {
          const messages = Array.isArray(inbox) ? inbox : (inbox.messages || []);
          return messages.map(msg => ({ ...msg, teamName, agentName }));
        })
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allInboxes]);

  const filteredMessages = useMemo(() => {
    if (selectedTeam === 'all') return allMessages;
    return allMessages.filter(msg => msg.teamName === selectedTeam);
  }, [allMessages, selectedTeam]);

  const visibleMessages = filteredMessages.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMessages.length;

  function getSummaryText(msg) {
    const raw = msg.summary || msg.content || msg.message || '';
    const parsed = formatMessageText(raw);
    if (parsed.type === 'text' || parsed.type === 'raw') return parsed.content;
    if (parsed.summary) return parsed.summary;
    if (parsed.subject) return parsed.subject;
    return raw;
  }

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
        className="max-h-[600px] overflow-y-auto pr-2"
        style={{ scrollbarWidth: 'thin' }}
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
              const agentColor = getAgentColor(msg.agentName);
              const agentInitials = getAgentInitials(msg.agentName);
              const colorBorder = BORDER_COLORS[agentColor] || 'border-gray-500';
              const relativeTime = formatRelativeTime(msg.timestamp);
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
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${agentColor}`}>
                    {agentInitials}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-lg p-3 border-l-2 ${colorBorder}`}
                    style={{
                      background: 'var(--bg-secondary)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
}
