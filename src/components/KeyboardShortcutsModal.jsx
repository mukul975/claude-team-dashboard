import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';

const ShortcutKey = ({ keys }) => (
  <div className="flex items-center gap-1">
    {keys.map((key, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-gray-500 text-xs">+</span>}
        <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm">
          {key}
        </kbd>
      </React.Fragment>
    ))}
  </div>
);

const ShortcutRow = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
    <span className="text-gray-300 text-sm">{description}</span>
    <ShortcutKey keys={keys} />
  </div>
);

const ShortcutSection = ({ title, shortcuts }) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">{title}</h3>
    <div className="space-y-0.5">
      {shortcuts.map((shortcut, i) => (
        <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
      ))}
    </div>
  </div>
);

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigationShortcuts = [
    { keys: ['Ctrl', '1'], description: 'Go to Live Metrics' },
    { keys: ['Ctrl', '2'], description: 'Go to Teams & Tasks' },
    { keys: ['Ctrl', '3'], description: 'Go to Communication' },
    { keys: ['Ctrl', '4'], description: 'Go to Monitoring' },
    { keys: ['Ctrl', '5'], description: 'Go to History & Outputs' },
    { keys: ['Ctrl', '6'], description: 'Go to Archive' },
    { keys: ['Ctrl', '7'], description: 'Go to Inboxes' },
    { keys: ['Ctrl', '8'], description: 'Go to Analytics' },
    { keys: ['\u2190'], description: 'Previous tab (when tab focused)' },
    { keys: ['\u2192'], description: 'Next tab (when tab focused)' },
  ];

  const searchCommandShortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['/'], description: 'Open command palette' },
    { keys: ['Ctrl', 'F'], description: 'Focus search' },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Toggle auto-scroll (communication)' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modal / dialog' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-claude-orange/10 rounded-lg">
              <Keyboard className="h-5 w-5 text-claude-orange" />
            </div>
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-130px)]">
          <ShortcutSection title="Navigation" shortcuts={navigationShortcuts} />
          <ShortcutSection title="Search & Commands" shortcuts={searchCommandShortcuts} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700/50 bg-gray-800/30">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded">?</kbd> anytime to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
