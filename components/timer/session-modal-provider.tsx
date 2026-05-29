'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import StartSessionPopover from '@/components/timer/start-session-popover';
import { useStudyTimer } from '@/components/study-timer-provider';

type SessionModalContextValue = {
  openSessionModal: () => void;
  closeSessionModal: () => void;
  isSessionModalOpen: boolean;
};

const SessionModalContext = createContext<SessionModalContextValue | null>(null);

export function SessionModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toggle } = useStudyTimer();

  const openSessionModal = useCallback(() => setIsOpen(true), []);
  const closeSessionModal = useCallback(() => setIsOpen(false), []);

  const handleSelect = useCallback(
    (areaId: string | null) => {
      void toggle(areaId);
      closeSessionModal();
    },
    [toggle, closeSessionModal],
  );

  const value = useMemo(
    () => ({ openSessionModal, closeSessionModal, isSessionModalOpen: isOpen }),
    [openSessionModal, closeSessionModal, isOpen],
  );

  return (
    <SessionModalContext.Provider value={value}>
      {children}
      <StartSessionPopover
        open={isOpen}
        onSelect={handleSelect}
        onClose={closeSessionModal}
      />
    </SessionModalContext.Provider>
  );
}

export function useSessionModal() {
  const ctx = useContext(SessionModalContext);
  if (!ctx) throw new Error('useSessionModal must be used within SessionModalProvider');
  return ctx;
}
