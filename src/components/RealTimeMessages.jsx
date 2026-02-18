import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MessageCircle, ArrowRight, Radio, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { parseMessageToNatural } from '../utils/messageParser';
dayjs.extend(relativeTime);

function flattenInboxes(allInboxes) {
  return Object.entries(allInboxes)
    .flatMap(([teamName, agents]) =>
      Object.entries(agents || {}).flatMap(([agentName, inbox]) => {
        const messages = Array.isArray(inbox) ? inbox : (inbox.messages || []);
        return messages.filter(msg => msg != null).map(msg => {
          const naturalMsg = parseMessageToNatural(msg.text, msg.summary);
          return {
            id: `${teamName}-${agentName}-${msg.timestamp}-${(msg.text || '').slice(0, 8)}`,
            from: msg.from || agentName,
            to: agentName,
            team: teamName,
            type: naturalMsg.type,
            message: naturalMsg.text,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(0),
            color: msg.color || 'blue',
            read: msg.read !== false,
          };
        });
      })
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 200);
}

export function RealTimeMessages({ allInboxes = {} }) {
  const [filter, setFilter] = useState('all');
  const [fetchedInboxes, setFetchedInboxes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const hasWsData = Object.keys(allInboxes).length > 0;

  // Fetch from REST API on mount and whenever WebSocket data is absent
  useEffect(() => {
    if (hasWsData) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetch('/api/inboxes')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (!cancelled) {
          setFetchedInboxes(data.inboxes || {});
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setFetchError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [hasWsData]);

  // Prefer live WebSocket data; fall back to REST fetch
  const source = hasWsData ? allInboxes : (fetchedInboxes || {});
  const allMessages = useMemo(() => flattenInboxes(source), [source]);

  const filteredMessages = useMemo(
    () => filter === 'all' ? allMessages : allMessages.filter(m => m.type === filter),
    [allMessages, filter]
  );

  const getMessageColorStyle = (type) => {
    switch (type) {
      case 'status':      return { borderColor: 'rgba(59,130,246,0.4)', backgroundColor: 'rgba(59,130,246,0.1)' };
      case 'completion':  return { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.1)' };
      case 'coordination':return { borderColor: 'rgba(168,85,247,0.4)', backgroundColor: 'rgba(168,85,247,0.1)' };
      case 'question':    return { borderColor: 'rgba(234,179,8,0.4)', backgroundColor: 'rgba(234,179,8,0.1)' };
      case 'assignment':  return { borderColor: 'rgba(6,182,212,0.4)', backgroundColor: 'rgba(6,182,212,0.1)' };
      case 'system':      return { borderColor: 'rgba(107,114,128,0.3)', backgroundColor: 'rgba(107,114,128,0.1)' };
      default:            return { borderColor: 'rgba(107,114,128,0.3)', backgroundColor: 'rgba(107,114,128,0.1)' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'status':      return '📊';
      case 'completion':  return '✅';
      case 'coordination':return '🤝';
      case 'question':    return '❓';
      case 'assignment':  return '📋';
      case 'system':      return '⚙️';
      default:            return '💬';
    }
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio aria-hidden="true" className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Agent Inter-Communication</h3>
          {!hasWsData && fetchedInboxes && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(from API)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw aria-hidden="true" className="h-3 w-3 animate-spin" style={{ color: 'var(--text-muted)' }} />
          )}
          <span className="live-stats-indicator">
            <span className={`h-2 w-2 rounded-full ${hasWsData ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
            {allMessages.length} {allMessages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'status', 'completion', 'coordination', 'question', 'assignment', 'system'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-button whitespace-nowrap ${
              filter === f ? 'filter-button-active' : 'filter-button-inactive'
            }`}
            aria-label={`Filter by ${f}`}
            aria-pressed={filter === f}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ minHeight: 0 }} aria-live="polite" aria-label="Real-time agent messages">
        {fetchError ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <MessageCircle aria-hidden="true" className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-red-400">Failed to load messages</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{fetchError}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw aria-hidden="true" className="h-10 w-10 mx-auto mb-3 opacity-50 animate-spin" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <MessageCircle aria-hidden="true" className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Agent communication will stream here in real-time</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className="p-3.5 rounded-xl border transition-all hover:brightness-110"
              style={{ animation: 'fadeIn 0.3s ease-out', ...getMessageColorStyle(msg.type) }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{getTypeIcon(msg.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: 'var(--text-heading)', background: 'var(--bg-secondary)' }}>
                      {msg.from}
                    </span>
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{msg.to}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>{msg.message}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Team: {msg.team}</span>
                    {!msg.read && (
                      <span className="text-xs text-blue-300 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.3)' }}>
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-400">
              {allMessages.filter(m => m.type === 'status').length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {allMessages.filter(m => m.type === 'completion').length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Completions</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">
              {allMessages.filter(m => m.type === 'coordination').length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Coordination</div>
          </div>
        </div>
      </div>
    </div>
  );
}

RealTimeMessages.propTypes = {
  teams: PropTypes.array,
  allInboxes: PropTypes.object,
};
