import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MessageCircle, ArrowRight, Radio } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

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
                    // Parse message to determine type
                    let messageText = msg.text;
                    let messageType = 'status';

                    if (msg.text && msg.text.includes('idle_notification')) {
                      try {
                        const parsed = JSON.parse(msg.text);
                        if (parsed.type === 'idle_notification') {
                          messageText = `Idle - Last task: ${parsed.lastTaskSubject || 'None'}`;
                          messageType = 'status';
                        }
                      } catch (e) {
                        // Not JSON, use as-is
                      }
                    } else if (msg.summary) {
                      messageText = msg.summary;
                      // Infer type from summary
                      if (msg.summary.toLowerCase().includes('completed') || msg.summary.includes('✓')) {
                        messageType = 'completion';
                      } else if (msg.summary.toLowerCase().includes('question') || msg.summary.includes('?')) {
                        messageType = 'question';
                      } else if (msg.summary.toLowerCase().includes('coordin') || msg.summary.toLowerCase().includes('discuss')) {
                        messageType = 'coordination';
                      }
                    }

                    allMessages.push({
                      id: `${team.name}-${agentName}-${msg.timestamp}-${Math.random()}`,
                      from: msg.from || agentName,
                      to: agentName,
                      team: team.name,
                      type: messageType,
                      message: messageText,
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
      case 'status': return 'border-blue-500/30 bg-blue-500/10';
      case 'completion': return 'border-green-500/30 bg-green-500/10';
      case 'coordination': return 'border-purple-500/30 bg-purple-500/10';
      case 'question': return 'border-yellow-500/30 bg-yellow-500/10';
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
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          {messages.length} msgs
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'status', 'completion', 'coordination', 'question'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-claude-orange text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${getMessageColor(msg.type)}`}
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getTypeIcon(msg.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{msg.from}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-400">{msg.to}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{msg.message}</p>
                  {msg.team && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Team: {msg.team}</span>
                      {!msg.read && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Unread</span>
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
