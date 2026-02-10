import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    function handleKeyPress(e) {
      const shortcut = shortcuts[e.key];
      if (shortcut && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shortcut();
      }
    }

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}
