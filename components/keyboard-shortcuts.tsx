'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useStudyTimer } from '@/components/study-timer-provider';

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { toggle, busy, redisAvailable } = useStudyTimer();

  const shortcuts = useMemo(() => ({
    ' ': {
      handler: () => {
        if (!busy && redisAvailable) {
          void toggle();
        }
      },
      label: 'Toggle study timer',
    },
    t: {
      handler: () => router.push('/dashboard/todo'),
      label: 'Go to tasks',
    },
    r: {
      handler: () => router.push('/rooms'),
      label: 'Go to rooms',
    },
    d: {
      handler: () => router.push('/dashboard'),
      label: 'Go to dashboard',
    },
    l: {
      handler: () => router.push('/leaderboard'),
      label: 'Go to leaderboard',
    },
  }), [busy, redisAvailable, toggle, router]);

  useKeyboardShortcuts(shortcuts);

  return null;
}
