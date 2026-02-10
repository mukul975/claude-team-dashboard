import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const shortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 't', description: 'Focus task search' },
    { key: 'a', description: 'Focus agent search' },
    { key: 'Esc', description: 'Close modal/dialog' },
  ];


  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        aria-describedby="keyboard-shortcuts-desc"
        className="modal-content relative w-full max-w-md rounded-2xl bg-gray-800/95 border border-gray-600 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2
            id="keyboard-shortcuts-title"
            className="text-xl font-bold text-white mb-2"
          >
            Keyboard Shortcuts
          </h2>
          <p id="keyboard-shortcuts-desc" className="sr-only">
            List of available keyboard shortcuts for this dashboard.
          </p>

          <table className="w-full shortcuts-table border-collapse mt-4">
            <thead>
              <tr className="border-b border-gray-600">
                <th
                  scope="col"
                  className="text-left py-2 pr-4 text-gray-400 font-medium text-sm"
                >
                  Key
                </th>
                <th
                  scope="col"
                  className="text-left py-2 text-gray-400 font-medium text-sm"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {shortcuts.map((s) => (
                <tr key={s.key} className="border-b border-gray-700/80">
                  <td className="py-3 pr-4">
                    <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-mono bg-gray-700 text-gray-200 rounded border border-gray-600">
                      {s.key}
                    </kbd>
                  </td>
                  <td className="py-3">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-claude-orange hover:bg-orange-600 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Close keyboard shortcuts"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
