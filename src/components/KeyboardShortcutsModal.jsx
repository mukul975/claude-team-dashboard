import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ShortcutKey = ({ keys }) => (
  <div className="flex items-center gap-1">
    {keys.map((key, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>+</span>}
        <kbd
          className="inline-flex items-center justify-center text-xs font-semibold"
          style={{
            minWidth: 28,
            height: 28,
            padding: '0 8px',
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            boxShadow: 'var(--card-shadow)',
            fontFamily: 'inherit',
          }}
        >
          {key}
        </kbd>
      </React.Fragment>
    ))}
  </div>
);

const ShortcutRow = ({ keys, description }) => (
  <div
    className="flex items-center justify-between rounded-lg transition-colors"
    style={{ padding: '8px 12px' }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--tab-inactive-bg)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</span>
    <ShortcutKey keys={keys} />
  </div>
);

const ShortcutSection = ({ title, shortcuts }) => (
  <div style={{ marginBottom: 20 }}>
    <h3
      className="text-xs font-semibold uppercase"
      style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 8, padding: '0 12px' }}
    >
      {title}
    </h3>
    <div>
      {shortcuts.map((shortcut, i) => (
        <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
      ))}
    </div>
  </div>
);

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    { keys: ['←'], description: 'Previous tab (when tab focused)' },
    { keys: ['→'], description: 'Next tab (when tab focused)' },
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
      ref={trapRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }} />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          boxShadow: 'var(--card-hover-shadow)',
          width: '100%',
          maxWidth: 512,
          margin: '0 16px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--footer-border)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              padding: 8,
              background: 'rgba(232,117,10,0.12)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Keyboard style={{ width: 20, height: 20, color: '#e8750a' }} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            aria-label="Close shortcuts modal"
            style={{
              padding: '6px',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-heading)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          <ShortcutSection title="Navigation" shortcuts={navigationShortcuts} />
          <ShortcutSection title="Search & Commands" shortcuts={searchCommandShortcuts} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--footer-border)',
          background: 'var(--footer-bg)',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Press{' '}
            <kbd style={{
              padding: '2px 6px',
              fontSize: 11,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              color: 'var(--text-primary)',
            }}>?</kbd>
            {' '}anytime to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
