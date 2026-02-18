import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Users, Clock, Bot, CheckCircle, AlertCircle, Zap, ChevronLeft, Layers, List } from 'lucide-react';
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

function buildThreads(messages) {
  const threadMap = {};
  messages.forEach(msg => {
    const pair = [msg.from, msg.to].sort();
    const key = pair.join(' <-> ');
    if (!threadMap[key]) {
      threadMap[key] = { pairKey: key, agents: pair, messages: [] };
    }
    threadMap[key].messages.push(msg);
  });
  // Sort messages within each thread chronologically
  Object.values(threadMap).forEach(thread => {
    thread.messages.sort((a, b) => a.timestamp - b.timestamp);
    thread.lastMessage = thread.messages[thread.messages.length - 1];
    thread.count = thread.messages.length;
    thread.unreadCount = thread.messages.filter(m => !m.read).length;
  });
  // Sort threads by most recent message first
  return Object.values(threadMap).sort(
    (a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp
  );
}

export function LiveCommunication({ teams, allInboxes = {} }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fetchedInboxes, setFetchedInboxes] = useState(null);
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'threads'
  const [expandedThread, setExpandedThread] = useState(null); // pairKey of expanded thread
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
  const threads = useMemo(() => buildThreads(messages), [messages]);

  // Reset expanded thread when switching teams or view modes
  useEffect(() => { setExpandedThread(null); }, [selectedTeam, viewMode]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll, expandedThread]);

  const currentTeam = teams?.find(t => t.name === selectedTeam);

  const renderFlatView = () => (
    <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ minHeight: 0 }}>
      {messages.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <MessageSquare aria-hidden="true" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Agent communication will appear here</p>
        </div>
      ) : (
        messages.map(msg => {
          const Icon = getIconComponent(msg.icon);
          const typeColors = {
            idle:    'bg-gray-500/10 border-gray-500/30',
            success: 'bg-green-500/10 border-green-500/30',
            system:  'bg-yellow-500/10 border-yellow-500/30',
            working: 'bg-blue-500/10 border-blue-500/30',
            message: 'bg-gray-500/10 border-gray-500/30 hover:border-claude-orange',
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
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{msg.from}</span>
                      {msg.to && msg.from !== msg.to && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{msg.to}</span>
                        </>
                      )}
                      {!msg.read && (
                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <span className="text-xs whitespace-nowrap ml-2" style={{ color: 'var(--text-muted)' }}>
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>{msg.message}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderThreadList = () => (
    <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ minHeight: 0 }}>
      {threads.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <Layers aria-hidden="true" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conversation threads</p>
          <p className="text-xs mt-1">Agent conversations will be grouped here</p>
        </div>
      ) : (
        threads.map(thread => (
          <button
            key={thread.pairKey}
            onClick={() => setExpandedThread(thread.pairKey)}
            className="w-full text-left p-3 rounded-lg border hover:border-claude-orange transition-all cursor-pointer"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <MessageSquare aria-hidden="true" className="h-4 w-4 text-claude-orange flex-shrink-0" />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {thread.agents[0]} &#8596; {thread.agents[1]}
                </span>
                {thread.unreadCount > 0 && (
                  <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                    {thread.unreadCount} new
                  </span>
                )}
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                {dayjs(thread.lastMessage.timestamp).fromNow()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs truncate mr-4 max-w-[70%]" style={{ color: 'var(--text-secondary)' }}>
                {thread.lastMessage.message}
              </p>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {thread.count} message{thread.count !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderExpandedThread = () => {
    const thread = threads.find(t => t.pairKey === expandedThread);
    if (!thread) return null;
    // In the expanded view, pick one agent as "self" (the second alphabetically)
    // Messages FROM agents[0] show on left (gray), FROM agents[1] show on right (orange)
    const [leftAgent, rightAgent] = thread.agents;

    return (
      <div className="flex-1 overflow-y-auto mb-4 flex flex-col" style={{ minHeight: 0 }}>
        {/* Thread header */}
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setExpandedThread(null)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Back to thread list"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
            {leftAgent} &#8596; {rightAgent}
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {thread.count} message{thread.count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Chat bubbles */}
        <div className="flex-1 overflow-y-auto space-y-2 px-1">
          {thread.messages.map(msg => {
            const isRight = msg.from === rightAgent;
            return (
              <div
                key={msg.id}
                className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg border ${
                    isRight
                      ? 'bg-claude-orange/20 border-claude-orange/40'
                      : ''
                  }`}
                  style={!isRight ? { background: 'var(--glass-bg)', borderColor: 'var(--border-color)' } : undefined}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold ${isRight ? 'text-orange-300' : ''}`}
                      style={!isRight ? { color: 'var(--text-secondary)' } : undefined}
                    >
                      {msg.from}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {dayjs(msg.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare aria-hidden="true" className="h-5 w-5 text-claude-orange" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Live Communication</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setViewMode('flat')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                viewMode === 'flat'
                  ? 'bg-claude-orange/20 text-claude-orange'
                  : ''
              }`}
              style={viewMode !== 'flat' ? { color: 'var(--text-muted)' } : undefined}
              title="Flat view"
              aria-pressed={viewMode === 'flat'}
            >
              <List aria-hidden="true" className="h-3 w-3" />
              Flat
            </button>
            <button
              onClick={() => setViewMode('threads')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                viewMode === 'threads'
                  ? 'bg-claude-orange/20 text-claude-orange'
                  : ''
              }`}
              style={viewMode !== 'threads' ? { color: 'var(--text-muted)' } : undefined}
              title="Threads view"
              aria-pressed={viewMode === 'threads'}
            >
              <Layers aria-hidden="true" className="h-3 w-3" />
              Threads
            </button>
          </div>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoScroll ? 'bg-green-500/20 text-green-400' : ''
            }`}
            style={!autoScroll ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)' } : undefined}
            aria-pressed={autoScroll}
            aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
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
          <label htmlFor="live-comm-team-select" className="sr-only">Select team</label>
          <select
            id="live-comm-team-select"
            value={selectedTeam || ''}
            onChange={e => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 rounded-lg focus:border-claude-orange focus:outline-none"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-heading)', border: '1px solid var(--border-color)' }}
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

      {/* Content Area - switches between flat, thread list, and expanded thread */}
      {viewMode === 'flat'
        ? renderFlatView()
        : expandedThread
          ? renderExpandedThread()
          : renderThreadList()
      }

      {/* Team Info */}
      {currentTeam && (
        <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Users aria-hidden="true" className="h-4 w-4" />
              <span>{currentTeam.config?.members?.length || 0} members</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Clock aria-hidden="true" className="h-4 w-4" />
              <span>{currentTeam.tasks?.filter(t => t.status === 'in_progress').length || 0} active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
