import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Inbox, Users, Search, ChevronDown, ChevronRight, ArrowDown, MessageSquare, User, Filter, X, Calendar, SortAsc, SortDesc, Download } from 'lucide-react';
import { SkeletonInboxViewer } from './SkeletonLoader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { parseMessageToNatural } from '../utils/messageParser';
import { exportToCSV } from '../utils/exportUtils';
import { safePropKey } from '../utils/safeKey';
import { getAgentColor, getAgentInitials } from '../utils/formatting';

dayjs.extend(relativeTime);

const TAILWIND_TO_HEX = {
  'bg-blue-600': '#3b82f6',
  'bg-purple-600': '#a855f7',
  'bg-green-600': '#22c55e',
  'bg-red-600': '#ef4444',
  'bg-yellow-600': '#eab308',
  'bg-pink-600': '#ec4899',
  'bg-indigo-600': '#6366f1',
  'bg-orange-500': '#f97316',
};

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

function getAvatarColor(name) {
  return TAILWIND_TO_HEX[getAgentColor(name)] || '#3b82f6';
}

function getInitials(name) {
  if (!name) return '??';
  const result = getAgentInitials(name);
  return result || name.substring(0, 2).toUpperCase();
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
      return <strong key={i} className="font-semibold" style={{ color: 'var(--text-heading)' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ text }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.trim() === '') {
    return <p className="text-sm" style={{ fontStyle: 'italic', marginBottom: 0, color: 'var(--text-muted)' }}>Empty message</p>;
  }

  let parsed = null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      return (
        <pre
          className="text-xs"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--code-bg)',
            border: '1px solid var(--code-border)',
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
    const rawSummary = parsed.summary || parsed.content || parsed.message;
    // Fall back to natural-language parser for structured messages (task_assignment, idle_notification, etc.)
    const summary = rawSummary || parseMessageToNatural(text).text; // lgtm[js/call-to-non-callable]
    return (
      <div>
        {summary && (
          <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {renderBoldMarkdown(String(summary))}
          </p>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Hide raw JSON data' : 'Show raw JSON data'}
          aria-expanded={expanded}
          className="text-xs"
          style={{
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => { e.target.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; }}
        >
          {expanded ? 'Hide raw data' : 'Show raw data'}
        </button>
        {expanded && (
          <pre
            className="text-xs"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--code-bg)',
              border: '1px solid var(--code-border)',
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
    <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: 0, color: 'var(--text-primary)' }}>
      {renderBoldMarkdown(text)}
    </p>
  );
}

MessageContent.propTypes = {
  text: PropTypes.string,
};

// Normalize inbox entry to a messages array regardless of shape ({ messages: [...] } or plain array)
function getMessages(agentData) {
  if (!agentData) return [];
  if (Array.isArray(agentData)) return agentData;
  return agentData.messages || [];
}

function getUnreadCount(agentData) {
  return getMessages(agentData).filter(m => m != null && m.read === false).length;
}

function getTeamUnreadCount(teamData) {
  if (!teamData) return 0;
  let count = 0;
  Object.values(teamData).forEach(agent => {
    count += getUnreadCount(agent);
  });
  return count;
}

export function InboxViewer({ allInboxes, initialTeam = null, loading }) {
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [expandedTeams, setExpandedTeams] = useState(() => {
    const key = safePropKey(initialTeam);
    return key ? { [key]: true } : {};
  });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filter state with localStorage persistence
  const [dateRange, setDateRange] = useState(() => {
    try { return localStorage.getItem('inbox_dateRange') || 'all'; } catch { return 'all'; }
  });
  const [senderFilter, setSenderFilter] = useState(() => {
    try { return localStorage.getItem('inbox_senderFilter') || 'all'; } catch { return 'all'; }
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    try { return localStorage.getItem('inbox_typeFilter') || 'all'; } catch { return 'all'; }
  });
  const [sortOrder, setSortOrder] = useState(() => {
    try { return localStorage.getItem('inbox_sortOrder') || 'newest'; } catch { return 'newest'; }
  });

  // Persist filter state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inbox_dateRange', dateRange);
      localStorage.setItem('inbox_senderFilter', senderFilter);
      localStorage.setItem('inbox_typeFilter', typeFilter);
      localStorage.setItem('inbox_sortOrder', sortOrder);
    } catch { /* localStorage not available */ }
  }, [dateRange, senderFilter, typeFilter, sortOrder]);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const teamNames = allInboxes ? Object.keys(allInboxes) : [];

  // When initialTeam changes externally (e.g. "View Inboxes" from TeamCard), update selection
  useEffect(() => {
    const safeInitial = safePropKey(initialTeam);
    if (safeInitial && allInboxes?.[safeInitial]) {
      setSelectedTeam(safeInitial);
      setExpandedTeams(prev => ({ ...prev, [safeInitial]: true }));
      const agents = Object.keys(allInboxes[safeInitial] || {});
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }
    }
  }, [initialTeam, allInboxes]);

  useEffect(() => {
    if (teamNames.length > 0 && !selectedTeam) {
      const firstTeam = safePropKey(teamNames[0]);
      if (!firstTeam) return;
      setSelectedTeam(firstTeam);
      setExpandedTeams(prev => ({ ...prev, [firstTeam]: true }));
      const agents = Object.keys(allInboxes[firstTeam] || {});
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }
    }
  }, [allInboxes, teamNames, selectedTeam]);

  const currentMessages = selectedTeam && selectedAgent
    ? getMessages(allInboxes?.[selectedTeam]?.[selectedAgent])
    : [];

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
    const key = safePropKey(teamName);
    if (!key) return;
    setExpandedTeams(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAgent = (teamName, agentName) => {
    const safeTeam = safePropKey(teamName);
    const safeAgent = safePropKey(agentName);
    if (!safeTeam || !safeAgent) return;
    setSelectedTeam(safeTeam);
    setSelectedAgent(safeAgent);
    setSearchQuery('');
    setHasNewMessages(false);
    const teamData = allInboxes && Object.hasOwn(allInboxes, safeTeam) ? allInboxes[safeTeam] : null;
    const agentData = teamData && Object.hasOwn(teamData, safeAgent) ? teamData[safeAgent] : null;
    prevMessageCountRef.current = getMessages(agentData).length;
  };

  // Collect all messages from the current team (for sender dropdown)
  const allTeamMessages = useMemo(() => {
    if (!selectedTeam || !allInboxes?.[selectedTeam]) return [];
    const msgs = [];
    Object.values(allInboxes[selectedTeam]).forEach(agentData => {
      msgs.push(...getMessages(agentData));
    });
    return msgs;
  }, [allInboxes, selectedTeam]);

  // Unique senders from team messages
  const uniqueSenders = useMemo(() => {
    const senders = new Set();
    allTeamMessages.forEach(msg => {
      if (msg.from) senders.add(msg.from);
    });
    return Array.from(senders).sort();
  }, [allTeamMessages]);

  // Classify message type using parseMessageToNatural
  const getMessageType = useCallback((msg) => {
    const natural = parseMessageToNatural(msg.text, msg.summary); // lgtm[js/call-to-non-callable]
    const t = natural.type;
    // Map parser types to our filter categories
    if (t === 'system') return 'system';
    if (t === 'status') {
      // Check if it's idle specifically
      try {
        const parsed = JSON.parse(msg.text);
        if (parsed.type === 'idle_notification') return 'idle';
      } catch { /* not JSON */ }
      return 'message';
    }
    if (t === 'completion' || t === 'assignment') return 'task_update';
    if (t === 'coordination' || t === 'question') return 'message';
    return 'message';
  }, []);

  // Active filter count
  const activeFilterCount = [
    dateRange !== 'all' ? 1 : 0,
    senderFilter !== 'all' ? 1 : 0,
    typeFilter !== 'all' ? 1 : 0,
    sortOrder !== 'newest' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setDateRange('all');
    setSenderFilter('all');
    setTypeFilter('all');
    setSortOrder('newest');
  };

  // Apply all filters: search + date range + sender + type + sort
  const filteredMessages = useMemo(() => {
    let msgs = currentMessages.filter(msg => msg != null);

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      msgs = msgs.filter(msg =>
        (msg.text && msg.text.toLowerCase().includes(q)) ||
        (msg.from && msg.from.toLowerCase().includes(q)) ||
        (msg.summary && msg.summary.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = dayjs();
      let cutoff;
      if (dateRange === 'today') cutoff = now.startOf('day');
      else if (dateRange === '7days') cutoff = now.subtract(7, 'day');
      else if (dateRange === '30days') cutoff = now.subtract(30, 'day');
      if (cutoff) {
        msgs = msgs.filter(msg => msg.timestamp && dayjs(msg.timestamp).isAfter(cutoff));
      }
    }

    // Sender filter
    if (senderFilter !== 'all') {
      msgs = msgs.filter(msg => msg.from === senderFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      msgs = msgs.filter(msg => getMessageType(msg) === typeFilter);
    }

    // Sort
    if (sortOrder === 'oldest') {
      msgs.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return ta - tb;
      });
    } else {
      msgs.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
    }

    return msgs;
  }, [currentMessages, searchQuery, dateRange, senderFilter, typeFilter, sortOrder, getMessageType]);

  const filtersAreActive = activeFilterCount > 0 || searchQuery.trim();

  if (loading) {
    return <SkeletonInboxViewer />;
  }

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
            <Inbox style={{ height: '48px', width: '48px', color: '#6b7280' }} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
            No Inbox Messages Yet
          </h3>
          <p className="text-sm" style={{ textAlign: 'center', maxWidth: '300px', marginBottom: 0, color: 'var(--text-secondary)' }}>
            No inbox messages yet. Messages will appear here when agents communicate.
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
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            padding: '1rem 1rem 0.75rem 1rem',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
              <Inbox style={{ height: '18px', width: '18px', color: '#ff8a3d' }} aria-hidden="true" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Inboxes</span>
            </div>
            <p className="text-xs" style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
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
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} team ${teamName}`}
                  >
                    {isExpanded ? (
                      <ChevronDown style={{ height: '14px', width: '14px', color: '#9ca3af', flexShrink: 0 }} aria-hidden="true" />
                    ) : (
                      <ChevronRight style={{ height: '14px', width: '14px', color: '#9ca3af', flexShrink: 0 }} aria-hidden="true" />
                    )}
                    <Users style={{ height: '14px', width: '14px', color: '#ff8a3d', flexShrink: 0 }} aria-hidden="true" />
                    <span className="text-sm truncate" style={{ flex: 1, textAlign: 'left', color: 'var(--text-primary)' }}>
                      {teamName}
                    </span>
                    <span className="text-xs" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
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
                        const msgCount = agentData?.messageCount || getMessages(agentData).length;
                        const isSelected = selectedTeam === teamName && selectedAgent === agentName;

                        return (
                          <button
                            key={agentName}
                            onClick={() => selectAgent(teamName, agentName)}
                            aria-label={`View inbox for ${agentName}`}
                            aria-current={isSelected ? 'true' : undefined}
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
                                color: isSelected ? 'var(--text-heading)' : 'var(--text-primary)',
                              }}
                            >
                              {agentName}
                            </span>
                            <span className="text-xs" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
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
                      <p className="text-xs" style={{ fontStyle: 'italic', marginBottom: 0, color: 'var(--text-muted)' }}>No inboxes yet</p>
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
                borderBottom: '1px solid var(--border-color)',
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
                    <h4 className="text-sm font-semibold" style={{ marginBottom: 0, color: 'var(--text-heading)' }}>
                      {selectedAgent} <span style={{ color: 'var(--text-muted)' }} className="font-normal">@</span> <span style={{ color: 'var(--text-secondary)' }} className="font-normal">{selectedTeam}</span>
                    </h4>
                    <p className="text-xs" style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
                      {currentAgentData.messageCount || currentMessages.length} message{(currentAgentData.messageCount || currentMessages.length) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => {
                      const data = filteredMessages.map(msg => ({
                        team: selectedTeam,
                        agent: selectedAgent,
                        from: msg.from || '',
                        message: (msg.text || '').replace(/\n/g, ' '),
                        timestamp: msg.timestamp || ''
                      }));
                      exportToCSV(data, `inbox-${selectedTeam}-${selectedAgent}`); // lgtm[js/call-to-non-callable]
                    }}
                    aria-label="Export messages as CSV"
                    title="Export messages as CSV"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--tab-inactive-bg)',
                      color: 'var(--text-muted)',
                      fontSize: '0.6875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                      e.currentTarget.style.color = '#fb923c';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <Download style={{ height: '12px', width: '12px' }} aria-hidden="true" />
                    CSV
                  </button>
                </div>
              </div>

              <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{
                      position: 'absolute',
                      left: '0.625rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '14px',
                      width: '14px',
                      color: 'var(--text-muted)',
                    }} aria-hidden="true" />
                    <label htmlFor="inbox-search" className="sr-only">Search messages</label>
                    <input
                      id="inbox-search"
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      style={{
                        width: '100%',
                        padding: '0.375rem 0.625rem 0.375rem 2rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(prev => !prev)}
                    aria-label={`Toggle filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
                    aria-expanded={showFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.625rem',
                      borderRadius: '6px',
                      border: `1px solid ${showFilters || activeFilterCount > 0 ? 'rgba(249, 115, 22, 0.5)' : 'var(--border-color)'}`,
                      background: showFilters || activeFilterCount > 0
                        ? 'rgba(249, 115, 22, 0.1)'
                        : 'var(--tab-inactive-bg)',
                      color: showFilters || activeFilterCount > 0 ? '#fb923c' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Filter style={{ height: '13px', width: '13px' }} aria-hidden="true" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f97316, #fb923c)',
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
                      }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.625rem',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {/* Date Range */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '120px' }}>
                        <label htmlFor="inbox-date-range" className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <Calendar style={{ height: '10px', width: '10px' }} aria-hidden="true" /> Date Range
                        </label>
                        <select
                          id="inbox-date-range"
                          value={dateRange}
                          onChange={e => setDateRange(e.target.value)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All time</option>
                          <option value="today">Today</option>
                          <option value="7days">Last 7 days</option>
                          <option value="30days">Last 30 days</option>
                        </select>
                      </div>

                      {/* Sender */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '130px' }}>
                        <label htmlFor="inbox-sender-filter" className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <User style={{ height: '10px', width: '10px' }} aria-hidden="true" /> Sender
                        </label>
                        <select
                          id="inbox-sender-filter"
                          value={senderFilter}
                          onChange={e => setSenderFilter(e.target.value)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            outline: 'none',
                            cursor: 'pointer',
                            maxWidth: '160px',
                          }}
                        >
                          <option value="all">All senders</option>
                          {uniqueSenders.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Message Type */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '120px' }}>
                        <label htmlFor="inbox-type-filter" className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <MessageSquare style={{ height: '10px', width: '10px' }} aria-hidden="true" /> Type
                        </label>
                        <select
                          id="inbox-type-filter"
                          value={typeFilter}
                          onChange={e => setTypeFilter(e.target.value)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All types</option>
                          <option value="message">Messages</option>
                          <option value="idle">Idle</option>
                          <option value="task_update">Task Updates</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '120px' }}>
                        <label htmlFor="inbox-sort-order" className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          {sortOrder === 'newest'
                            ? <SortDesc style={{ height: '10px', width: '10px' }} aria-hidden="true" />
                            : <SortAsc style={{ height: '10px', width: '10px' }} aria-hidden="true" />
                          } Sort
                        </label>
                        <select
                          id="inbox-sort-order"
                          value={sortOrder}
                          onChange={e => setSortOrder(e.target.value)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear filters + active count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {activeFilterCount > 0 ? (
                        <span className="text-xs" style={{ color: '#fb923c' }}>
                          {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No filters active</span>
                      )}
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          aria-label="Clear all filters"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '5px',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <X style={{ height: '10px', width: '10px' }} aria-hidden="true" /> Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Filtered message count when filters are active */}
                {filtersAreActive && (
                  <div style={{ marginTop: '0.375rem' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                )}
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
                    <MessageSquare style={{ height: '40px', width: '40px', color: '#4b5563', marginBottom: '0.75rem' }} aria-hidden="true" />
                    <p className="text-sm" style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
                      {filtersAreActive ? 'No messages match your filters' : 'No messages yet'}
                    </p>
                    {!filtersAreActive && (
                      <p className="text-xs" style={{ marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
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
                              ? 'var(--tab-inactive-bg)'
                              : 'var(--bg-card)',
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
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                                  {msg.from || 'Unknown'}
                                </span>
                                {timestamp && (
                                  <span
                                    className="text-xs"
                                    title={fullTime}
                                    style={{ flexShrink: 0, marginLeft: '0.5rem', color: 'var(--text-muted)' }}
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
                    aria-label="Scroll to new messages"
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
                    <ArrowDown style={{ height: '12px', width: '12px' }} aria-hidden="true" />
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
                <User style={{ height: '36px', width: '36px', color: '#6b7280' }} aria-hidden="true" />
              </div>
              <p className="text-sm" style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
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
            border-bottom: 1px solid var(--border-color);
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
