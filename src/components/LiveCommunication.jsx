import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function LiveCommunication({ teams }) {
  const [messages, setMessages] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].name);
    }
  }, [teams, selectedTeam]);

  // Simulate message detection from agent activity
  useEffect(() => {
    if (!teams || teams.length === 0) return;

    const interval = setInterval(() => {
      const team = teams.find(t => t.name === selectedTeam);
      if (team && team.tasks) {
        const inProgressTasks = team.tasks.filter(t => t.status === 'in_progress');
        if (inProgressTasks.length > 0 && Math.random() > 0.7) {
          const task = inProgressTasks[Math.floor(Math.random() * inProgressTasks.length)];
          const newMessage = {
            id: Date.now(),
            from: task.owner || 'Unknown',
            message: `Working on: ${task.subject}`,
            timestamp: new Date(),
            type: 'status'
          };
          setMessages(prev => [newMessage, ...prev].slice(0, 20));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [teams, selectedTeam]);

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
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Agent communication will appear here</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-claude-orange transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-semibold text-white">{msg.from}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-300">{msg.message}</p>
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
