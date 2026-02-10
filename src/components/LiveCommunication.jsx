import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, Bot, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Convert technical messages to natural language
const parseMessageToNatural = (text, summary) => {
  // If there's a summary, prefer it
  if (summary && !summary.includes('{') && !summary.includes('idle_notification')) {
    return { text: summary, type: 'message', icon: 'message' };
  }

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(text);

    // Handle different message types
    switch (parsed.type) {
      case 'idle_notification':
        return {
          text: parsed.lastTaskSubject
            ? `💤 Finished "${parsed.lastTaskSubject}" and ready for next task`
            : '💤 Available and waiting for assignment',
          type: 'idle',
          icon: 'idle'
        };

      case 'task_completed':
        return {
          text: `✅ Completed: ${parsed.taskSubject || 'Task'}`,
          type: 'success',
          icon: 'check'
        };

      case 'task_assigned':
        return {
          text: `📋 Working on: ${parsed.taskSubject || 'New task'}`,
          type: 'working',
          icon: 'zap'
        };

      case 'error':
        return {
          text: `⚠️ Issue: ${parsed.message || 'Something went wrong'}`,
          type: 'error',
          icon: 'alert'
        };

      case 'status_update':
        return {
          text: `📊 ${parsed.message || 'Status update'}`,
          type: 'info',
          icon: 'message'
        };

      default:
        // Unknown JSON type, show content if available
        if (parsed.content) {
          return { text: parsed.content, type: 'message', icon: 'message' };
        }
        if (parsed.message) {
          return { text: parsed.message, type: 'message', icon: 'message' };
        }
        return { text: 'Message received', type: 'message', icon: 'message' };
    }
  } catch (e) {
    // Not JSON, return as-is but make it friendlier
    if (!text || text.trim() === '') {
      return { text: '👋 Said hello', type: 'message', icon: 'message' };
    }

    // If text is too long, show summary
    if (text.length > 200) {
      return {
        text: text.substring(0, 150) + '...',
        fullText: text,
        type: 'message',
        icon: 'message'
      };
    }

    return { text, type: 'message', icon: 'message' };
  }
};

const getIconComponent = (iconType) => {
  switch (iconType) {
    case 'check': return CheckCircle;
    case 'alert': return AlertCircle;
    case 'zap': return Zap;
    case 'idle': return Bot;
    default: return MessageSquare;
  }
};

export function LiveCommunication({ teams }) {
  const [messages, setMessages] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].name);
    }
  }, [teams, selectedTeam]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Fetch real inbox messages from API
  useEffect(() => {
    if (!selectedTeam) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3001/api/teams/${encodeURIComponent(selectedTeam)}/inboxes`);

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const data = await response.json();

        // Convert inbox data to message format
        const allMessages = [];

        if (data.inboxes && typeof data.inboxes === 'object') {
          Object.entries(data.inboxes).forEach(([agentName, inbox]) => {
            if (inbox.messages && Array.isArray(inbox.messages)) {
              inbox.messages.forEach(msg => {
                // Convert to natural language
                const naturalMsg = parseMessageToNatural(msg.text, msg.summary);

                allMessages.push({
                  id: `${agentName}-${msg.timestamp}-${Math.random()}`,
                  from: msg.from || agentName,
                  to: agentName,
                  message: naturalMsg.text,
                  fullText: naturalMsg.fullText || msg.text,
                  timestamp: new Date(msg.timestamp),
                  type: naturalMsg.type,
                  icon: naturalMsg.icon,
                  color: msg.color || 'blue',
                  read: msg.read || false
                });
              });
            }
          });
        }

        // Sort by timestamp (oldest first for chat-style)
        allMessages.sort((a, b) => a.timestamp - b.timestamp);

        // Keep last 50 messages
        setMessages(allMessages.slice(-50));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchMessages();

    // Then poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [selectedTeam]);

  const currentTeam = teams?.find(t => t.name === selectedTeam);

  return (
    <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Live Communication</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoScroll
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            {autoScroll ? '📍 Auto-scroll' : '🔒 Scroll locked'}
          </button>
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Team Selector */}
      {teams && teams.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedTeam || ''}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-claude-orange focus:outline-none"
          >
            {teams.map(team => (
              <option key={team.name} value={team.name}>
                {team.name} ({team.config?.members?.length || 0} members)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ minHeight: 0 }}>
        {error ? (
          <div className="text-center py-8 text-red-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Error loading messages</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Agent communication will appear here</p>
          </div>
        ) : (
          messages.map(msg => {
            const Icon = getIconComponent(msg.icon);
            const typeColors = {
              idle: 'bg-gray-700/30 border-gray-600/50',
              success: 'bg-green-900/20 border-green-700/50',
              error: 'bg-red-900/20 border-red-700/50',
              working: 'bg-blue-900/20 border-blue-700/50',
              message: 'bg-gray-700/50 border-gray-600 hover:border-claude-orange'
            };

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-lg ${
                  typeColors[msg.type] || typeColors.message
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 ${
                    msg.type === 'success' ? 'text-green-400' :
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'working' ? 'text-blue-400' :
                    msg.type === 'idle' ? 'text-gray-400' :
                    'text-claude-orange'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{msg.from}</span>
                        {msg.to && msg.from !== msg.to && (
                          <>
                            <span className="text-xs text-gray-500">→</span>
                            <span className="text-xs text-gray-400">{msg.to}</span>
                          </>
                        )}
                        {!msg.read && (
                          <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">New</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {dayjs(msg.timestamp).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Team Info */}
      {currentTeam && (
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="h-4 w-4" />
              <span>{currentTeam.config?.members?.length || 0} members online</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>
                {currentTeam.tasks?.filter(t => t.status === 'in_progress').length || 0} active
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
