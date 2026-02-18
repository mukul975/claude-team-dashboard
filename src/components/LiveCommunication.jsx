import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Users, Clock, Bot, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

function parseMessageToNatural(text, summary) {
  if (summary && !summary.includes('{') && !summary.includes('idle_notification')) {
    return { text: summary, type: 'message', icon: 'message' };
  }
  try {
    const parsed = JSON.parse(text);
    switch (parsed.type) {
      case 'idle_notification':
        return {
          text: parsed.lastTaskSubject
            ? `Finished "${parsed.lastTaskSubject}" and ready for next task`
            : 'Available and waiting for assignment',
          type: 'idle', icon: 'idle'
        };
      case 'task_completed':
        return { text: `Completed: ${parsed.taskSubject || 'Task'}`, type: 'success', icon: 'check' };
      case 'task_assigned':
        return { text: `Working on: ${parsed.taskSubject || 'New task'}`, type: 'working', icon: 'zap' };
      case 'shutdown_request':
        return { text: 'Shutdown requested', type: 'system', icon: 'alert' };
      case 'shutdown_response':
        return { text: parsed.approve ? 'Shutdown approved' : 'Shutdown rejected', type: 'system', icon: 'alert' };
      default:
        if (parsed.content) return { text: parsed.content, type: 'message', icon: 'message' };
        if (parsed.message) return { text: parsed.message, type: 'message', icon: 'message' };
        return { text: 'Message received', type: 'message', icon: 'message' };
    }
  } catch (e) {
    if (!text || text.trim() === '') return { text: 'Empty message', type: 'message', icon: 'message' };
    const clean = text.length > 200 ? text.substring(0, 150) + '...' : text;
    return { text: clean, type: 'message', icon: 'message' };
  }
}

const getIconComponent = (iconType) => {
  switch (iconType) {
    case 'check': return CheckCircle;
    case 'alert': return AlertCircle;
    case 'zap':   return Zap;
    case 'idle':  return Bot;
    default:      return MessageSquare;
  }
};

function buildMessages(allInboxes, selectedTeam) {
  if (!selectedTeam) return [];
  const teamInboxes = allInboxes[selectedTeam] || {};
  return Object.entries(teamInboxes)
    .flatMap(([agentName, inbox]) => {
      const msgs = Array.isArray(inbox) ? inbox : (inbox.messages || []);
      return msgs.map(msg => {
        const naturalMsg = parseMessageToNatural(msg.text, msg.summary);
        return {
          id: `${agentName}-${msg.timestamp}-${(msg.text || '').slice(0, 8)}`,
          from: msg.from || agentName,
          to: agentName,
          message: naturalMsg.text,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(0),
          type: naturalMsg.type,
          icon: naturalMsg.icon,
          color: msg.color || 'blue',
          read: msg.read !== false,
        };
      });
    })
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-50);
}

export function LiveCommunication({ teams, allInboxes = {} }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fetchedInboxes, setFetchedInboxes] = useState(null);
  const messagesEndRef = React.useRef(null);

  const hasWsData = Object.keys(allInboxes).length > 0;
  const source = hasWsData ? allInboxes : (fetchedInboxes || {});

  // Fetch from REST when WebSocket data is absent
  useEffect(() => {
    if (hasWsData) return;
    let cancelled = false;
    fetch('/api/inboxes')
      .then(r => r.json())
      .then(data => { if (!cancelled) setFetchedInboxes(data.inboxes || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hasWsData]);

  const teamNames = useMemo(() => {
    const fromProps = (teams || []).map(t => t.name).filter(Boolean);
    const fromInboxes = Object.keys(source);
    return [...new Set([...fromProps, ...fromInboxes])];
  }, [teams, source]);

  // Auto-select first team
  useEffect(() => {
    if (teamNames.length > 0 && !selectedTeam) {
      setSelectedTeam(teamNames[0]);
    }
  }, [teamNames, selectedTeam]);

  const messages = useMemo(() => buildMessages(source, selectedTeam), [source, selectedTeam]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const currentTeam = teams?.find(t => t.name === selectedTeam);

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold text-white">Live Communication</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoScroll ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {autoScroll ? 'Auto-scroll' : 'Scroll locked'}
          </button>
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Team Selector */}
      {teamNames.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedTeam || ''}
            onChange={e => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-claude-orange focus:outline-none"
          >
            {teamNames.map(name => {
              const team = teams?.find(t => t.name === name);
              const agentCount = team?.config?.members?.length
                || Object.keys(source[name] || {}).length;
              return (
                <option key={name} value={name}>
                  {name} ({agentCount} {team ? 'members' : 'agents'})
                </option>
              );
            })}
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
          messages.map(msg => {
            const Icon = getIconComponent(msg.icon);
            const typeColors = {
              idle:    'bg-gray-700/30 border-gray-600/50',
              success: 'bg-green-900/20 border-green-700/50',
              system:  'bg-yellow-900/10 border-yellow-700/40',
              working: 'bg-blue-900/20 border-blue-700/50',
              message: 'bg-gray-700/50 border-gray-600 hover:border-claude-orange',
            };
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-lg ${
                  typeColors[msg.type] || typeColors.message
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 ${
                    msg.type === 'success' ? 'text-green-400' :
                    msg.type === 'system'  ? 'text-yellow-400' :
                    msg.type === 'working' ? 'text-blue-400' :
                    msg.type === 'idle'    ? 'text-gray-400' :
                    'text-claude-orange'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
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
                    <p className="text-sm text-gray-200 leading-relaxed break-words">{msg.message}</p>
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
              <span>{currentTeam.config?.members?.length || 0} members</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{currentTeam.tasks?.filter(t => t.status === 'in_progress').length || 0} active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
