import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MessageCircle, ArrowRight, Radio } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Convert technical messages to natural language
const parseMessageToNatural = (text, summary) => {
  // If there's a clear summary, use it
  if (summary && !summary.includes('{') && !summary.includes('idle_notification')) {
    // Determine type from summary content
    let type = 'status';
    if (summary.toLowerCase().includes('completed') || summary.includes('✓') || summary.includes('✅')) {
      type = 'completion';
    } else if (summary.toLowerCase().includes('question') || summary.includes('?')) {
      type = 'question';
    } else if (summary.toLowerCase().includes('coordin') || summary.toLowerCase().includes('discuss') || summary.toLowerCase().includes('help')) {
      type = 'coordination';
    }
    return { text: summary, type };
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(text);

    switch (parsed.type) {
      case 'idle_notification':
        return {
          text: parsed.lastTaskSubject
            ? `💤 Finished "${parsed.lastTaskSubject}" - ready for next task`
            : '💤 Available and waiting for assignment',
          type: 'status'
        };

      case 'task_completed':
        return {
          text: `✅ Completed: ${parsed.taskSubject || 'Task'}`,
          type: 'completion'
        };

      case 'task_assigned':
        return {
          text: `📋 Started working on: ${parsed.taskSubject || 'New task'}`,
          type: 'status'
        };

      case 'question':
        return {
          text: `❓ ${parsed.message || parsed.content || 'Question raised'}`,
          type: 'question'
        };

      case 'coordination':
        return {
          text: `🤝 ${parsed.message || parsed.content || 'Coordinating with team'}`,
          type: 'coordination'
        };

      default:
        return {
          text: parsed.message || parsed.content || 'Message received',
          type: 'status'
        };
    }
  } catch (e) {
    // Not JSON, use as-is
    if (!text || text.trim() === '') {
      return { text: '👋 Said hello', type: 'status' };
    }

    // Truncate if too long
    if (text.length > 200) {
      return {
        text: text.substring(0, 150) + '...',
        type: 'status'
      };
    }

    return { text, type: 'status' };
  }
};

export function RealTimeMessages({ teams }) {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch real inbox messages from all teams
    if (!teams || teams.length === 0) return;

    const fetchAllMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const allMessages = [];

        // Fetch messages from each team
        for (const team of teams) {
          try {
            const response = await fetch(`http://localhost:3001/api/teams/${encodeURIComponent(team.name)}/inboxes`);

            if (!response.ok) {
              console.warn(`Failed to fetch messages for team ${team.name}: ${response.status}`);
              continue;
            }

            const data = await response.json();

            // Convert inbox data to message format
            if (data.inboxes && typeof data.inboxes === 'object') {
              Object.entries(data.inboxes).forEach(([agentName, inbox]) => {
                if (inbox.messages && Array.isArray(inbox.messages)) {
                  inbox.messages.forEach(msg => {
                    // Convert to natural language
                    const naturalMsg = parseMessageToNatural(msg.text, msg.summary);

                    allMessages.push({
                      id: `${team.name}-${agentName}-${msg.timestamp}-${Math.random()}`,
                      from: msg.from || agentName,
                      to: agentName,
                      team: team.name,
                      type: naturalMsg.type,
                      message: naturalMsg.text,
                      timestamp: new Date(msg.timestamp),
                      color: msg.color || 'blue',
                      read: msg.read || false
                    });
                  });
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching messages for team ${team.name}:`, err);
          }
        }

        // Sort by timestamp (newest first)
        allMessages.sort((a, b) => b.timestamp - a.timestamp);

        // Keep last 100 messages
        setMessages(allMessages.slice(0, 100));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchAllMessages();

    // Then poll every 5 seconds
    const interval = setInterval(fetchAllMessages, 5000);

    return () => clearInterval(interval);
  }, [teams]);

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.type === filter);

  const getMessageColor = (type) => {
    switch (type) {
      case 'status': return 'message-status';
      case 'completion': return 'message-completion';
      case 'coordination': return 'message-coordination';
      case 'question': return 'message-question';
      default: return 'border-gray-600 bg-gray-700/30';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'status': return '📊';
      case 'completion': return '✅';
      case 'coordination': return '🤝';
      case 'question': return '❓';
      default: return '💬';
    }
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Agent Inter-Communication</h3>
        </div>
        <span className="live-stats-indicator">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'status', 'completion', 'coordination', 'question'].map(f => (
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
        {error ? (
          <div className="text-center py-12 text-red-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Error loading messages</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : loading && filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50 animate-pulse" />
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
              className={`message-card p-3.5 rounded-xl border transition-all ${getMessageColor(msg.type)}`}
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              <div className="flex items-start gap-3">
                <span className="message-emoji text-2xl">{getTypeIcon(msg.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="agent-badge">{msg.from}</span>
                    <ArrowRight className="message-arrow h-3.5 w-3.5" />
                    <span className="text-sm text-gray-300 font-medium">{msg.to}</span>
                    <span className="message-timestamp ml-auto">
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="message-text">{msg.message}</p>
                  {msg.team && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">Team: {msg.team}</span>
                      {!msg.read && (
                        <span className="unread-badge">New</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="pt-4 mt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-400">
              {messages.filter(m => m.type === 'status').length}
            </div>
            <div className="text-xs text-gray-400">Status Updates</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {messages.filter(m => m.type === 'completion').length}
            </div>
            <div className="text-xs text-gray-400">Completions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

RealTimeMessages.propTypes = {
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      config: PropTypes.object,
      tasks: PropTypes.array
    })
  )
};
