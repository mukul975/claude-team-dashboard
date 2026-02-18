import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Inbox, Users, Search, ChevronDown, ChevronRight, ArrowDown, MessageSquare, User } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const AVATAR_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#06b6d4',
  '#f97316', '#ec4899', '#eab308', '#ef4444',
  '#6366f1', '#14b8a6', '#f43f5e', '#10b981'
];

const BORDER_COLOR_MAP = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#22d3ee',
  orange: '#f97316',
  pink: '#ec4899',
  yellow: '#eab308',
  red: '#ef4444',
};

const DEFAULT_BORDER_COLOR = '#4b5563';

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvatarColor(name) {
  return AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getBorderColor(color) {
  if (!color) return DEFAULT_BORDER_COLOR;
  return BORDER_COLOR_MAP[color.toLowerCase()] || DEFAULT_BORDER_COLOR;
}

function renderBoldMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ text }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.trim() === '') {
    return <p className="text-sm text-gray-400" style={{ fontStyle: 'italic', marginBottom: 0 }}>Empty message</p>;
  }

  let parsed = null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      return (
        <pre
          className="text-xs text-gray-300"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(55, 65, 81, 0.5)',
            maxHeight: '200px',
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '0.5rem',
            borderRadius: '4px',
            margin: 0,
          }}
        >
          <code>{trimmed}</code>
        </pre>
      );
    }
  }

  if (parsed && typeof parsed === 'object') {
    const summary = parsed.summary || parsed.content || parsed.message;
    return (
      <div>
        {summary && (
          <p className="text-sm text-gray-200" style={{ lineHeight: 1.6, marginBottom: '0.25rem' }}>
            {renderBoldMarkdown(String(summary))}
          </p>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => { e.target.style.color = '#d1d5db'; }}
          onMouseLeave={e => { e.target.style.color = '#6b7280'; }}
        >
          {expanded ? 'Hide raw data' : 'Show raw data'}
        </button>
        {expanded && (
          <pre
            className="text-xs text-gray-400"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              maxHeight: '200px',
              overflowY: 'auto',
              overflowX: 'auto',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            <code>{JSON.stringify(parsed, null, 2)}</code>
          </pre>
        )}
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-200" style={{ lineHeight: 1.6, marginBottom: 0 }}>
      {renderBoldMarkdown(text)}
    </p>
  );
}

MessageContent.propTypes = {
  text: PropTypes.string,
};

function getUnreadCount(agentData) {
  if (!agentData || !agentData.messages) return 0;
  return agentData.messages.filter(m => m.read === false).length;
}

function getTeamUnreadCount(teamData) {
  if (!teamData) return 0;
  let count = 0;
  Object.values(teamData).forEach(agent => {
    count += getUnreadCount(agent);
  });
  return count;
}

export function InboxViewer({ allInboxes }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const teamNames = allInboxes ? Object.keys(allInboxes) : [];

  useEffect(() => {
    if (teamNames.length > 0 && !selectedTeam) {
      const firstTeam = teamNames[0];
      setSelectedTeam(firstTeam);
      setExpandedTeams(prev => ({ ...prev, [firstTeam]: true }));
      const agents = Object.keys(allInboxes[firstTeam] || {});
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }
    }
  }, [allInboxes, teamNames, selectedTeam]);

  const currentMessages = (selectedTeam && selectedAgent && allInboxes?.[selectedTeam]?.[selectedAgent]?.messages) || [];

  useEffect(() => {
    if (currentMessages.length > prevMessageCountRef.current) {
      if (isAtBottom && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (!isAtBottom) {
        setHasNewMessages(true);
      }
    }
    prevMessageCountRef.current = currentMessages.length;
  }, [currentMessages.length, isAtBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 60;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewMessages(false);
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    }
  };

  const toggleTeam = (teamName) => {
    setExpandedTeams(prev => ({ ...prev, [teamName]: !prev[teamName] }));
  };

  const selectAgent = (teamName, agentName) => {
    setSelectedTeam(teamName);
    setSelectedAgent(agentName);
    setSearchQuery('');
    setHasNewMessages(false);
    prevMessageCountRef.current = allInboxes?.[teamName]?.[agentName]?.messages?.length || 0;
  };

  const filteredMessages = searchQuery.trim()
    ? currentMessages.filter(msg => {
        const q = searchQuery.toLowerCase();
        return (
          (msg.text && msg.text.toLowerCase().includes(q)) ||
          (msg.from && msg.from.toLowerCase().includes(q)) ||
          (msg.summary && msg.summary.toLowerCase().includes(q))
        );
      })
    : currentMessages;

  if (!allInboxes || teamNames.length === 0) {
    return (
      <div className="card" style={{ minHeight: '400px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 146, 60, 0.1))',
            padding: '1rem',
            borderRadius: '16px',
            marginBottom: '1rem'
          }}>
            <Inbox style={{ height: '48px', width: '48px', color: '#6b7280' }} />
          </div>
          <h3 className="text-lg font-semibold text-white" style={{ marginBottom: '0.5rem' }}>
            No Active Teams
          </h3>
          <p className="text-sm text-gray-400" style={{ textAlign: 'center', maxWidth: '300px', marginBottom: 0 }}>
            When agent teams start communicating, their inboxes will appear here for monitoring.
          </p>
        </div>
      </div>
    );
  }

  const currentAgentData = selectedTeam && selectedAgent ? allInboxes[selectedTeam]?.[selectedAgent] : null;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="inbox-viewer-grid" style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: '600px',
        minHeight: 0,
      }}>
        {/* LEFT PANEL */}
        <div style={{
          borderRight: '1px solid rgba(55, 65, 81, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.4)',
        }}>
          <div style={{
            padding: '1rem 1rem 0.75rem 1rem',
            borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
          }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
              <Inbox style={{ height: '18px', width: '18px', color: '#ff8a3d' }} />
              <span className="text-sm font-semibold text-white">Inboxes</span>
            </div>
            <p className="text-xs text-gray-500" style={{ marginBottom: 0 }}>
              {teamNames.length} team{teamNames.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {teamNames.map(teamName => {
              const teamData = allInboxes[teamName];
              const agentNames = Object.keys(teamData || {});
              const teamUnread = getTeamUnreadCount(teamData);
              const isExpanded = expandedTeams[teamName];
              const isTeamSelected = selectedTeam === teamName;

              return (
                <div key={teamName} style={{ marginBottom: '0.25rem' }}>
                  <button
                    onClick={() => {
                      toggleTeam(teamName);
                      if (!isExpanded) {
                        setSelectedTeam(teamName);
                        if (agentNames.length > 0 && !selectedAgent) {
                          setSelectedAgent(agentNames[0]);
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isTeamSelected
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 146, 60, 0.1))'
                        : 'transparent',
                      borderLeft: isTeamSelected ? '3px solid #f97316' : '3px solid transparent',
                      color: 'inherit',
                    }}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown style={{ height: '14px', width: '14px', color: '#9ca3af', flexShrink: 0 }} />
                    ) : (
                      <ChevronRight style={{ height: '14px', width: '14px', color: '#9ca3af', flexShrink: 0 }} />
                    )}
                    <Users style={{ height: '14px', width: '14px', color: '#ff8a3d', flexShrink: 0 }} />
                    <span className="text-sm text-white truncate" style={{ flex: 1, textAlign: 'left' }}>
                      {teamName}
                    </span>
                    <span className="text-xs text-gray-500" style={{ flexShrink: 0 }}>
                      {agentNames.length}
                    </span>
                    {teamUnread > 0 && (
                      <span style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9px',
                        padding: '0 5px',
                        flexShrink: 0,
                      }}>
                        {teamUnread}
                      </span>
                    )}
                  </button>

                  {isExpanded && agentNames.length > 0 && (
                    <div style={{ paddingLeft: '1.25rem', marginTop: '0.125rem' }}>
                      {agentNames.map(agentName => {
                        const agentData = teamData[agentName];
                        const agentUnread = getUnreadCount(agentData);
                        const msgCount = agentData?.messageCount || agentData?.messages?.length || 0;
                        const isSelected = selectedTeam === teamName && selectedAgent === agentName;

                        return (
                          <button
                            key={agentName}
                            onClick={() => selectAgent(teamName, agentName)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.375rem 0.625rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              marginBottom: '0.125rem',
                              background: isSelected
                                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 146, 60, 0.12))'
                                : 'transparent',
                              borderLeft: isSelected ? '2px solid #fb923c' : '2px solid transparent',
                              color: 'inherit',
                            }}
                          >
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.5625rem',
                              fontWeight: 700,
                              color: 'white',
                              flexShrink: 0,
                              background: getAvatarColor(agentName),
                            }}>
                              {getInitials(agentName)}
                            </div>
                            <span
                              className="text-xs truncate"
                              style={{
                                flex: 1,
                                textAlign: 'left',
                                color: isSelected ? '#ffffff' : '#d1d5db',
                              }}
                            >
                              {agentName}
                            </span>
                            <span className="text-xs text-gray-500" style={{ flexShrink: 0 }}>
                              {msgCount}
                            </span>
                            {agentUnread > 0 && (
                              <span style={{
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                minWidth: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                padding: '0 4px',
                                flexShrink: 0,
                              }}>
                                {agentUnread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && agentNames.length === 0 && (
                    <div style={{ padding: '0.5rem 0.5rem 0.5rem 2rem' }}>
                      <p className="text-xs text-gray-500" style={{ fontStyle: 'italic', marginBottom: 0 }}>No inboxes yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          position: 'relative',
        }}>
          {selectedTeam && selectedAgent && currentAgentData ? (
            <>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white',
                    background: getAvatarColor(selectedAgent),
                  }}>
                    {getInitials(selectedAgent)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white" style={{ marginBottom: 0 }}>
                      {selectedAgent} <span className="text-gray-500 font-normal">@</span> <span className="text-gray-400 font-normal">{selectedTeam}</span>
                    </h4>
                    <p className="text-xs text-gray-500" style={{ marginBottom: 0 }}>
                      {currentAgentData.messageCount || currentMessages.length} message{(currentAgentData.messageCount || currentMessages.length) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {getUnreadCount(currentAgentData) > 0 && (
                  <span style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93c5fd',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                  }}>
                    {getUnreadCount(currentAgentData)} unread
                  </span>
                )}
              </div>

              <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid rgba(55, 65, 81, 0.3)',
                flexShrink: 0,
              }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '14px',
                    width: '14px',
                    color: '#6b7280',
                  }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.625rem 0.375rem 2rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(55, 65, 81, 0.5)',
                      background: 'rgba(17, 24, 39, 0.6)',
                      color: '#e5e7eb',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(55, 65, 81, 0.5)'; }}
                  />
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.75rem 1rem',
                  minHeight: 0,
                }}
              >
                {filteredMessages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '4rem',
                  }}>
                    <MessageSquare style={{ height: '40px', width: '40px', color: '#4b5563', marginBottom: '0.75rem' }} />
                    <p className="text-sm text-gray-400" style={{ marginBottom: 0 }}>
                      {searchQuery.trim() ? 'No messages match your search' : 'No messages yet'}
                    </p>
                    {!searchQuery.trim() && (
                      <p className="text-xs text-gray-500" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                        Messages to this agent will appear here
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredMessages.map((msg, idx) => {
                      const borderColor = getBorderColor(msg.color);
                      const isUnread = msg.read === false;
                      const timestamp = msg.timestamp ? dayjs(msg.timestamp) : null;
                      const relTime = timestamp ? timestamp.fromNow() : '';
                      const fullTime = timestamp ? timestamp.format('YYYY-MM-DD HH:mm:ss') : '';

                      return (
                        <div
                          key={`${msg.timestamp}-${msg.from}-${idx}`}
                          style={{
                            padding: '0.625rem 0.75rem',
                            borderRadius: '0 8px 8px 0',
                            borderLeft: `4px solid ${borderColor}`,
                            background: isUnread
                              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.85))'
                              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.45))',
                            transition: 'background 0.15s ease',
                            maxHeight: '200px',
                            overflowY: 'auto',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {isUnread && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#3b82f6',
                                boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
                                flexShrink: 0,
                                marginTop: '6px',
                              }} />
                            )}

                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: 'white',
                              flexShrink: 0,
                              background: getAvatarColor(msg.from || 'unknown'),
                            }}>
                              {getInitials(msg.from || 'unknown')}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                                <span className="text-xs font-semibold text-white">
                                  {msg.from || 'Unknown'}
                                </span>
                                {timestamp && (
                                  <span
                                    className="text-xs text-gray-500"
                                    title={fullTime}
                                    style={{ flexShrink: 0, marginLeft: '0.5rem' }}
                                  >
                                    {relTime}
                                  </span>
                                )}
                              </div>
                              <MessageContent text={msg.text} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {hasNewMessages && (
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                }}>
                  <button
                    onClick={scrollToBottom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.875rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9), rgba(251, 146, 60, 0.9))',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                    }}
                  >
                    <ArrowDown style={{ height: '12px', width: '12px' }} />
                    New messages
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(251, 146, 60, 0.06))',
                padding: '1rem',
                borderRadius: '16px',
                marginBottom: '0.75rem',
              }}>
                <User style={{ height: '36px', width: '36px', color: '#6b7280' }} />
              </div>
              <p className="text-sm text-gray-400" style={{ marginBottom: 0 }}>
                {selectedTeam ? 'Select an agent to view messages' : 'Select a team to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .inbox-viewer-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .inbox-viewer-grid > div:first-child {
            border-right: none !important;
            border-bottom: 1px solid rgba(55, 65, 81, 0.6);
            max-height: 200px;
          }
          .inbox-viewer-grid > div:last-child {
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
}

InboxViewer.propTypes = {
  allInboxes: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.shape({
        messages: PropTypes.arrayOf(PropTypes.shape({
          from: PropTypes.string,
          text: PropTypes.string,
          timestamp: PropTypes.string,
          read: PropTypes.bool,
          color: PropTypes.string,
          summary: PropTypes.string,
        })),
        messageCount: PropTypes.number,
      })
    )
  ),
};
