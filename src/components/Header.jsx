import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Activity, ExternalLink, Menu, X, Bell, Sun, Moon, Search, Keyboard } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ExportMenu } from './ExportMenu';

export function Header({ isConnected, error, onMenuToggle, isMenuOpen, notificationPermission, onRequestNotification, teams, allInboxes, theme, onToggleTheme, onNavigate, notifUnreadCount, onToggleNotifications, onToggleShortcuts }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Build search results from real data only
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return { teams: [], agents: [], tasks: [] };

    const q = searchQuery.toLowerCase();
    const teamResults = [];
    const agentResults = [];
    const taskResults = [];

    if (Array.isArray(teams)) {
      for (const team of teams) {
        if (teamResults.length >= 3) break;
        const teamName = team.name || team.session_id || '';
        if (teamName.toLowerCase().includes(q)) {
          teamResults.push({ label: teamName, tab: 'teams' });
        }
      }

      for (const team of teams) {
        const agents = team.agents || [];
        for (const agent of agents) {
          if (agentResults.length >= 3) break;
          const agentName = agent.name || agent.agent_id || '';
          if (agentName.toLowerCase().includes(q)) {
            agentResults.push({ label: `${agentName} (${team.name || 'team'})`, tab: 'teams' });
          }
        }
        if (agentResults.length >= 3) break;
      }

      for (const team of teams) {
        const tasks = team.tasks || [];
        for (const task of tasks) {
          if (taskResults.length >= 3) break;
          const subject = task.subject || task.description || '';
          if (subject.toLowerCase().includes(q)) {
            taskResults.push({ label: subject, tab: 'teams' });
          }
        }
        if (taskResults.length >= 3) break;
      }
    }

    if (allInboxes && typeof allInboxes === 'object' && agentResults.length < 3) {
      for (const teamName of Object.keys(allInboxes)) {
        if (agentResults.length >= 3) break;
        const teamInbox = allInboxes[teamName];
        if (teamInbox && typeof teamInbox === 'object') {
          for (const agentName of Object.keys(teamInbox)) {
            if (agentResults.length >= 3) break;
            if (agentName.toLowerCase().includes(q)) {
              const alreadyExists = agentResults.some(r => r.label.startsWith(agentName));
              if (!alreadyExists) {
                agentResults.push({ label: `${agentName} (${teamName})`, tab: 'inboxes' });
              }
            }
          }
        }
      }
    }

    return { teams: teamResults, agents: agentResults, tasks: taskResults };
  }, [searchQuery, teams, allInboxes]);

  const flatResults = useMemo(() => {
    const items = [];
    if (searchResults.teams.length > 0) {
      searchResults.teams.forEach(r => items.push({ ...r, group: 'Teams' }));
    }
    if (searchResults.agents.length > 0) {
      searchResults.agents.forEach(r => items.push({ ...r, group: 'Agents' }));
    }
    if (searchResults.tasks.length > 0) {
      searchResults.tasks.forEach(r => items.push({ ...r, group: 'Tasks' }));
    }
    return items;
  }, [searchResults]);

  const hasResults = flatResults.length > 0;
  const showDropdown = searchQuery.length >= 2;

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
      setSelectedIndex(-1);
      return;
    }
    if (!showDropdown || !hasResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatResults.length) {
      e.preventDefault();
      const item = flatResults[selectedIndex];
      if (onNavigate) onNavigate(item.tab);
      setSearchOpen(false);
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  };

  const handleResultClick = (item) => {
    if (onNavigate) onNavigate(item.tab);
    setSearchOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: '#f97316', fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const renderResults = () => {
    if (!showDropdown) return null;
    if (!hasResults) {
      return (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No results found</div>
        </div>
      );
    }

    let currentGroup = '';

    return (
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {flatResults.map((item, idx) => {
          const showGroupHeader = item.group !== currentGroup;
          if (showGroupHeader) currentGroup = item.group;
          const isSelected = selectedIndex === idx;

          return (
            <React.Fragment key={`${item.group}-${idx}`}>
              {showGroupHeader && (
                <div
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(249, 115, 22, 0.8)' }}
                >
                  {item.group}
                </div>
              )}
              <button
                className="w-full text-left px-4 py-2 text-sm transition-colors duration-150 cursor-pointer"
                style={{
                  color: isSelected ? 'var(--text-heading)' : 'var(--text-secondary)',
                  background: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'transparent'
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleResultClick(item)}
              >
                {highlightMatch(item.label, searchQuery)}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: 'var(--header-shadow)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      role="banner"
    >
      {/* Header-specific animations */}
      <style>{`
        @keyframes header-orange-sweep {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes live-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes bottom-line-flow {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg transition-all duration-200"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
              )}
            </button>

            {/* Clickable Logo + Title */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => onNavigate && onNavigate('overview')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('overview'); } }}
              aria-label="Go to overview"
            >
              {/* Logo with Animated Orange Sweep */}
              <div
                className="relative p-2.5 rounded-xl overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.12) 100%)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.35)'
                }}
              >
                {/* Animated Orange Sweep Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'header-orange-sweep 4s ease-in-out infinite',
                  }}
                />

                <Activity
                  className="h-6 w-6 text-claude-orange relative z-10 group-hover:scale-110 transition-transform duration-300"
                  aria-hidden="true"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))'
                  }}
                />
              </div>

              {/* Title and Subtitle */}
              <div className="hidden sm:block">
                <h1
                  className="text-xl font-bold leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, var(--text-heading) 0%, #fb923c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Claude Agent Dashboard
                </h1>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: 'var(--text-muted, rgba(209, 213, 219, 0.8))',
                    letterSpacing: '0.02em'
                  }}
                >
                  Real-time agent monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search */}
            <div className="relative" ref={containerRef}>
              {searchOpen ? (
                <div className="relative">
                  <div
                    className="flex items-center gap-2 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                      boxShadow: '0 0 12px rgba(249, 115, 22, 0.15)'
                    }}
                  >
                    <Search className="h-4 w-4 ml-3 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(-1); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search teams, agents, tasks..."
                      className="bg-transparent text-sm outline-none py-2 pr-3 w-48 md:w-64 header-search-input"
                      style={{ color: 'var(--text-primary)' }}
                      aria-label="Search teams, agents, tasks"
                    />
                    <button
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); setSelectedIndex(-1); }}
                      className="p-2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {renderResults()}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-lg transition-all duration-200 group"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  title="Search (Ctrl+K)"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5 group-hover:text-claude-orange transition-colors duration-200" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* LIVE Indicator with pulse */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-widest select-none"
              style={{
                background: isConnected
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(21, 128, 61, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
                border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: isConnected ? '#4ade80' : '#f87171',
              }}
              role="status"
              aria-label={isConnected ? 'Live and connected' : 'Disconnected'}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: isConnected ? '#4ade80' : '#f87171',
                  boxShadow: isConnected
                    ? '0 0 6px rgba(34, 197, 94, 0.8)'
                    : '0 0 6px rgba(239, 68, 68, 0.8)',
                  animation: isConnected ? 'live-pulse-dot 1.5s ease-in-out infinite' : 'none',
                }}
              />
              LIVE
            </div>

            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg transition-all duration-200"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4.5 w-4.5" style={{ color: '#fbbf24' }} aria-hidden="true" />
                ) : (
                  <Moon className="h-4.5 w-4.5" style={{ color: '#6366f1' }} aria-hidden="true" />
                )}
              </button>
            )}

            {/* Notification Center Bell */}
            {onToggleNotifications && (
              <button
                onClick={onToggleNotifications}
                className="relative p-2 rounded-lg transition-all duration-200 group"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title="Notification center"
                aria-label={`Notifications${notifUnreadCount > 0 ? ` (${notifUnreadCount} unread)` : ''}`}
              >
                <Bell className="h-5 w-5 group-hover:text-claude-orange transition-colors duration-200" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                {notifUnreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1"
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                      boxShadow: '0 2px 6px rgba(249, 115, 22, 0.5)',
                    }}
                  >
                    {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop Notification Permission */}
            {notificationPermission === 'default' && (
              <button
                onClick={onRequestNotification}
                className="relative p-2 rounded-lg transition-all duration-200 group"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title="Enable desktop notifications"
                aria-label="Enable desktop notifications"
              >
                <Bell className="h-5 w-5 group-hover:text-claude-orange transition-colors duration-200" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </button>
            )}
            {notificationPermission === 'granted' && !onToggleNotifications && (
              <div
                className="relative p-2 rounded-lg"
                title="Notifications enabled"
                aria-label="Desktop notifications are enabled"
              >
                <Bell className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
            )}

            {/* Keyboard Shortcuts */}
            {onToggleShortcuts && (
              <button
                onClick={onToggleShortcuts}
                className="p-2 rounded-lg transition-all duration-200 group"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title="Keyboard shortcuts (?)"
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="h-5 w-5 group-hover:text-claude-orange transition-colors duration-200" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </button>
            )}

            {/* Export Menu */}
            <ExportMenu teams={teams || []} allInboxes={allInboxes || {}} />

            {/* Connection Status */}
            <ConnectionStatus isConnected={isConnected} error={error} />

            {/* Documentation Link */}
            <a
              href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 group"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.15) 100%)';
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = 'var(--text-heading)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
              <span>Docs</span>
            </a>
          </div>
        </div>
      </div>

      {/* Animated Bottom Orange Line (2px gradient) */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.5) 20%, rgba(251, 146, 60, 0.8) 50%, rgba(249, 115, 22, 0.5) 80%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'bottom-line-flow 4s linear infinite',
        }}
      />
    </header>
  );
}

Header.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onMenuToggle: PropTypes.func,
  isMenuOpen: PropTypes.bool,
  notificationPermission: PropTypes.oneOf(['default', 'granted', 'denied']),
  onRequestNotification: PropTypes.func,
  teams: PropTypes.array,
  allInboxes: PropTypes.object,
  theme: PropTypes.oneOf(['dark', 'light']),
  onToggleTheme: PropTypes.func,
  onNavigate: PropTypes.func,
  notifUnreadCount: PropTypes.number,
  onToggleNotifications: PropTypes.func,
  onToggleShortcuts: PropTypes.func,
};

Header.defaultProps = {
  onMenuToggle: () => {},
  isMenuOpen: false,
  notificationPermission: 'denied',
  onRequestNotification: () => {},
  teams: [],
  allInboxes: {},
  theme: 'dark',
  onToggleTheme: null,
  onNavigate: null,
  notifUnreadCount: 0,
  onToggleNotifications: null,
  onToggleShortcuts: null,
};
