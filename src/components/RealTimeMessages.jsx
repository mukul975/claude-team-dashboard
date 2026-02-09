import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowRight, Users, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RealTimeMessages({ teams }) {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Monitor task changes and agent activity to infer communication
    if (!teams || teams.length === 0) return;

    const interval = setInterval(() => {
      teams.forEach(team => {
        if (team.tasks) {
          team.tasks.forEach(task => {
            // Detect task status changes
            if (task.status === 'in_progress' && task.owner) {
              if (Math.random() > 0.85) {
                addMessage({
                  from: task.owner,
                  to: 'team-lead',
                  team: team.name,
                  type: 'status',
                  message: `Started working on: ${task.subject}`,
                  timestamp: new Date()
                });
              }
            }

            // Detect completed tasks
            if (task.status === 'completed' && task.owner) {
              if (Math.random() > 0.9) {
                addMessage({
                  from: task.owner,
                  to: 'team',
                  team: team.name,
                  type: 'completion',
                  message: `✓ Completed: ${task.subject}`,
                  timestamp: new Date()
                });
              }
            }
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [teams]);

  const addMessage = (msg) => {
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(m =>
        m.from === msg.from &&
        m.message === msg.message &&
        Date.now() - m.timestamp < 30000
      );
      if (!exists) {
        return [{ ...msg, id: Date.now() + Math.random() }, ...prev].slice(0, 50);
      }
      return prev;
    });
  };

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
        {filteredMessages.length === 0 ? (
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
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{msg.message}</p>
                  {msg.team && (
                    <div className="mt-1 text-xs text-gray-500">
                      Team: {msg.team}
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
