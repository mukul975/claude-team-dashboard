import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3, Users, MessageSquare, Settings, History, Archive, Inbox, Search } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const commands = [
  { id: 'overview', label: 'Navigate to Overview', shortcut: 'Ctrl+1', icon: BarChart3, tab: 'overview' },
  { id: 'teams', label: 'Navigate to Teams & Tasks', shortcut: 'Ctrl+2', icon: Users, tab: 'teams' },
  { id: 'communication', label: 'Navigate to Communication', shortcut: 'Ctrl+3', icon: MessageSquare, tab: 'communication' },
  { id: 'monitoring', label: 'Navigate to Monitoring', shortcut: 'Ctrl+4', icon: Settings, tab: 'monitoring' },
  { id: 'history', label: 'Navigate to History & Outputs', shortcut: 'Ctrl+5', icon: History, tab: 'history' },
  { id: 'archive', label: 'Navigate to Archive', shortcut: 'Ctrl+6', icon: Archive, tab: 'archive' },
  { id: 'inboxes', label: 'Navigate to Inboxes', shortcut: 'Ctrl+7', icon: Inbox, tab: 'inboxes' },
];

const kbdStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
};

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const trapRef = useFocusTrap(isOpen);

  const filtered = query.trim() === ''
    ? commands
    : commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.tab.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const rafId = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((tab) => {
    onNavigate(tab);
  }, [onNavigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].tab);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filtered, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={trapRef}
      className="flex items-start"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        paddingTop: '20vh',
        justifyContent: 'center'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }} />

      <div
        className="animate-fadeIn overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '512px',
          margin: '0 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--card-shadow)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Search className="h-5 w-5" style={{ flexShrink: 0, color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 text-sm"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none',
              border: 'none'
            }}
            aria-label="Search commands"
            aria-activedescendant={filtered[selectedIndex] ? `cmd-${filtered[selectedIndex].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
          />
          <kbd style={kbdStyle}>ESC</kbd>
        </div>

        <ul
          ref={listRef}
          id="command-list"
          role="listbox"
          className="overflow-y-auto"
          style={{ maxHeight: '288px', padding: '8px 0' }}
        >
          {filtered.length === 0 ? (
            <li className="px-4 text-center text-sm" style={{ padding: '32px 16px', color: 'var(--text-muted)' }}>
              No matching commands
            </li>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              return (
                <li
                  key={cmd.id}
                  id={`cmd-${cmd.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className="flex items-center gap-3 rounded-lg transition-colors"
                  style={{
                    padding: '10px 16px',
                    margin: '0 8px',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--text-heading)' : 'var(--text-secondary)',
                    background: isSelected ? 'rgba(232,117,10,0.2)' : 'transparent'
                  }}
                  onClick={() => handleSelect(cmd.tab)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ flexShrink: 0, color: isSelected ? '#f97316' : 'var(--text-muted)' }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-sm">{cmd.label}</span>
                  <kbd style={kbdStyle}>{cmd.shortcut}</kbd>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center gap-4 px-4 text-xs" style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <kbd style={kbdStyle}>{'\u2191\u2193'}</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd style={kbdStyle}>{'\u21B5'}</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd style={kbdStyle}>esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
