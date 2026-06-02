'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const SessionFeedbackModal = dynamic(
  () => import('@/components/session-feedback-modal'),
  { ssr: false },
);

type SessionData = {
  durationSec: number;
  durationMin: number;
  logId?: string;
  focusSessionId?: string;
  areaId?: string | null;
};

export default function SessionFeedbackWrapper() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const modalKeyRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as SessionData;
      if (detail && detail.durationSec > 0) {
        modalKeyRef.current++;
        setSessionData(detail);
      }
    };
    window.addEventListener('session-complete', handler);
    return () => window.removeEventListener('session-complete', handler);
  }, []);

  const handleClose = useCallback(() => {
    setSessionData(null);
  }, []);

  if (!sessionData) return null;

  return (
    <SessionFeedbackModal
      key={modalKeyRef.current}
      data={{
        sessionDurationSec: sessionData.durationSec,
        sessionDurationMin: sessionData.durationMin,
        logId: sessionData.logId,
        focusSessionId: sessionData.focusSessionId,
        areaId: sessionData.areaId ?? null,
      }}
      onClose={handleClose}
    />
  );
}
