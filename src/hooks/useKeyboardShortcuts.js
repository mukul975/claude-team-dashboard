import { useEffect } from 'react';

export function useKeyboardShortcuts({ onNavigate, onToggleCommandPalette, onToggleSearch, onToggleShortcutsModal, onToggleAutoScroll }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Tab navigation: Ctrl+1 through Ctrl+8
      const tabs = ['overview', 'teams', 'communication', 'monitoring', 'history', 'archive', 'inboxes', 'analytics'];
      if (ctrl && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        onNavigate(tabs[parseInt(e.key) - 1]);
      }

      // Ctrl+K: command palette
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        onToggleCommandPalette?.();
      }

      // / key: also opens command palette (like GitHub, Slack)
      if (e.key === '/' && !ctrl && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onToggleCommandPalette?.();
      }

      // Ctrl+F: focus search
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        onToggleSearch?.();
      }

      // Ctrl+Shift+S: toggle auto-scroll in communication panels
      if (ctrl && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onToggleAutoScroll?.();
      }

      // ?: open keyboard shortcuts modal
      if (e.key === '?' && !ctrl && !e.altKey) {
        e.preventDefault();
        onToggleShortcutsModal?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNavigate, onToggleCommandPalette, onToggleSearch, onToggleShortcutsModal, onToggleAutoScroll]);
}
