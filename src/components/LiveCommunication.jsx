import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function LiveCommunication({ teams }) {
  const [messages, setMessages] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].name);
    }
  }, [teams, selectedTeam]);

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
                // Parse idle_notification messages
                let messageText = msg.text;
                let messageType = 'message';

                if (msg.text && msg.text.includes('idle_notification')) {
                  try {
                    const parsed = JSON.parse(msg.text);
                    if (parsed.type === 'idle_notification') {
                      messageText = `Idle - Last task: ${parsed.lastTaskSubject || 'None'}`;
                      messageType = 'idle';
                    }
                  } catch (e) {
                    // Not JSON, use as-is
                  }
                }

                allMessages.push({
                  id: `${agentName}-${msg.timestamp}-${Math.random()}`,
                  from: msg.from || agentName,
                  to: agentName,
                  message: msg.summary || messageText,
                  fullText: messageText,
                  timestamp: new Date(msg.timestamp),
                  type: messageType,
                  color: msg.color || 'blue',
                  read: msg.read || false
                });
              });
            }
          });
        }

        // Sort by timestamp (newest first)
        allMessages.sort((a, b) => b.timestamp - a.timestamp);

        // Keep last 50 messages
        setMessages(allMessages.slice(0, 50));
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
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          ACTIVE
        </span>
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
          messages.map(msg => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg border transition-colors ${
                msg.type === 'idle'
                  ? 'bg-gray-700/30 border-gray-600/50'
                  : 'bg-gray-700/50 border-gray-600 hover:border-claude-orange'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{msg.from}</span>
                  {msg.to && (
                    <>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-xs text-gray-400">{msg.to}</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {dayjs(msg.timestamp).fromNow()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{msg.message}</p>
              {!msg.read && (
                <div className="mt-1">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Unread</span>
                </div>
              )}
            </div>
          ))
        )}
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
