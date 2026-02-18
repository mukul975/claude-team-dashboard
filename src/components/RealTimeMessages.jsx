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
        return messages.map(msg => {
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
      .then(r => r.json())
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

  const filteredMessages = filter === 'all'
    ? allMessages
    : allMessages.filter(m => m.type === filter);

  const getMessageColor = (type) => {
    switch (type) {
      case 'status':      return 'border-blue-500/40 bg-blue-900/10';
      case 'completion':  return 'border-green-500/40 bg-green-900/10';
      case 'coordination':return 'border-purple-500/40 bg-purple-900/10';
      case 'question':    return 'border-yellow-500/40 bg-yellow-900/10';
      case 'assignment':  return 'border-cyan-500/40 bg-cyan-900/10';
      case 'system':      return 'border-gray-600/50 bg-gray-700/20';
      default:            return 'border-gray-600/50 bg-gray-700/20';
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
          <Radio className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Agent Inter-Communication</h3>
          {!hasWsData && fetchedInboxes && (
            <span className="text-xs text-gray-500">(from API)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />
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
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ minHeight: 0 }}>
        {fetchError ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-red-400">Failed to load messages</p>
            <p className="text-xs mt-1 text-gray-500">{fetchError}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-50 animate-spin" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Agent communication will stream here in real-time</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-xl border transition-all hover:brightness-110 ${getMessageColor(msg.type)}`}
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{getTypeIcon(msg.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-white bg-gray-700 px-2 py-0.5 rounded">
                      {msg.from}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300 font-medium">{msg.to}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed break-words">{msg.message}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Team: {msg.team}</span>
                    {!msg.read && (
                      <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">
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
      <div className="pt-4 mt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-400">
              {allMessages.filter(m => m.type === 'status').length}
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {allMessages.filter(m => m.type === 'completion').length}
            </div>
            <div className="text-xs text-gray-400">Completions</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">
              {allMessages.filter(m => m.type === 'coordination').length}
            </div>
            <div className="text-xs text-gray-400">Coordination</div>
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
