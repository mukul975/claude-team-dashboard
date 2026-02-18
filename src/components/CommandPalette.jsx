import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart3, Users, MessageSquare, Settings, History, Archive, Inbox, Search, Command } from 'lucide-react';

const commands = [
  { id: 'overview', label: 'Navigate to Overview', shortcut: 'Ctrl+1', icon: BarChart3, tab: 'overview' },
  { id: 'teams', label: 'Navigate to Teams & Tasks', shortcut: 'Ctrl+2', icon: Users, tab: 'teams' },
  { id: 'communication', label: 'Navigate to Communication', shortcut: 'Ctrl+3', icon: MessageSquare, tab: 'communication' },
  { id: 'monitoring', label: 'Navigate to Monitoring', shortcut: 'Ctrl+4', icon: Settings, tab: 'monitoring' },
  { id: 'history', label: 'Navigate to History & Outputs', shortcut: 'Ctrl+5', icon: History, tab: 'history' },
  { id: 'archive', label: 'Navigate to Archive', shortcut: 'Ctrl+6', icon: Archive, tab: 'archive' },
  { id: 'inboxes', label: 'Navigate to Inboxes', shortcut: 'Ctrl+7', icon: Inbox, tab: 'inboxes' },
];

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = query.trim() === ''
    ? commands
    : commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.tab.toLowerCase().includes(query.toLowerCase())
      );

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure the modal is rendered before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Clamp selectedIndex when filtered results change
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Scroll selected item into view
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            aria-label="Search commands"
            aria-activedescendant={filtered[selectedIndex] ? `cmd-${filtered[selectedIndex].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands list */}
        <ul
          ref={listRef}
          id="command-list"
          role="listbox"
          className="max-h-72 overflow-y-auto py-2"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
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
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-claude-orange/20 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => handleSelect(cmd.tab)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-claude-orange' : 'text-gray-500'}`} />
                  <span className="flex-1 text-sm">{cmd.label}</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded font-mono">
                    {cmd.shortcut}
                  </kbd>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-700 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
