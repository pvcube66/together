'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useStudyTimer } from '@/components/study-timer-provider';
import { useSessionModal } from '@/components/timer/session-modal-provider';

export default function KeyboardShortcuts() {
  const router = useRouter();
  const { active, paused, busy, redisAvailable, pause, resume } = useStudyTimer();
  const { openSessionModal } = useSessionModal();

  const shortcuts = useMemo(() => ({
    ' ': {
      handler: () => {
        if (!busy && redisAvailable) {
          if (active && paused) {
            void resume();
          } else if (active) {
            void pause();
          } else {
            openSessionModal();
          }
        }
      },
      label: 'Toggle study timer',
    },
    t: {
      handler: () => router.push('/dashboard/todo'),
      label: 'Go to tasks',
    },
    d: {
      handler: () => router.push('/dashboard'),
      label: 'Go to dashboard',
    },
  }), [active, paused, busy, redisAvailable, resume, pause, router, openSessionModal]);

  useKeyboardShortcuts(shortcuts);

  return null;
}
