'use client';

import { useEffect } from 'react';

type ShortcutMap = Record<
  string,
  { handler: () => void; label: string; preventDefault?: boolean }
>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      const key = e.key.toLowerCase();

      // Don't fire shortcuts when typing in inputs (except Escape)
      if (isInput && key !== 'escape') return;

      const shortcut = shortcuts[key];
      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// — Global keyboard shortcuts hook; skips when focused on input elements.
