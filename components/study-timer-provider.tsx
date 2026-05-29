'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { requestPresenceRefresh } from '@/lib/socket';
import { TIMER_POLL_INTERVAL_MS } from '@/lib/timer-sync';
import {
  normalizeTimerPayload,
  reconcileTodaySeconds,
  type TimerPayload,
} from '@/lib/timer-client-state';

type StudyTimerState = {
  active: boolean;
  paused: boolean;
  startedAtMs: number | null;
  todaySeconds: number;
  todayMinutes: number;
  dayKey: string | null;
  redisAvailable: boolean;
  elapsedSeconds: number;
  busy: boolean;
  toggle: (areaId?: string | null) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  refresh: () => Promise<void>;
};

const StudyTimerContext = createContext<StudyTimerState | null>(null);

export function StudyTimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [redisAvailable, setRedisAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/timer-state', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        timer?: TimerPayload;
      };
      const next = normalizeTimerPayload(data.timer);
      setRedisAvailable(next.redisAvailable);
      setActive(next.active);
      setPaused(next.paused);
      setStartedAtMs(next.startedAtMs);
      setTodayMinutes(next.todayMinutes);
      setDayKey((prevDayKey) => {
        setTodaySeconds((prevSeconds) =>
          reconcileTodaySeconds({
            previousDayKey: prevDayKey,
            previousTodaySeconds: prevSeconds,
            incomingDayKey: next.dayKey,
            incomingTodaySeconds: next.todaySeconds,
          }),
        );
        return next.dayKey;
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;

    function clearPoll() {
      if (id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    }

    function startPollIfVisible() {
      clearPoll();
      if (
        typeof document === 'undefined' ||
        document.visibilityState !== 'visible'
      )
        return;
      id = setInterval(() => void refresh(), TIMER_POLL_INTERVAL_MS);
    }

    startPollIfVisible();

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        startPollIfVisible();
      } else {
        clearPoll();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearPoll();
    };
  }, [refresh]);

  // Tick the clock every second for elapsed time
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [frozenElapsed, setFrozenElapsed] = useState(0);

  const elapsedSeconds = useMemo(() => {
    if (!active || startedAtMs === null) return 0;
    if (paused) return frozenElapsed;
    return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  }, [active, paused, startedAtMs, nowMs, frozenElapsed]);

  const toggle = useCallback(async (areaId?: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      const action = active ? 'stop' : 'start';
      const res = await fetch('/api/study-timer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, areaId: action === 'start' ? (areaId ?? null) : undefined }),
      });
      const data = (await res.json()) as {
        error?: string;
        timer?: TimerPayload;
        session?: {
          durationSec?: number;
          durationMin?: number;
          logId?: string;
          areaId?: string | null;
        };
      };
      if (!res.ok) {
        console.warn('[study-timer]', data.error ?? res.status);
        await refresh();
        return;
      }
      const next = normalizeTimerPayload(data.timer);
      if (data.timer) {
        setActive(next.active);
        setPaused(next.paused);
        setStartedAtMs(next.startedAtMs);
        if (action === 'stop') {
          const durationSec = Math.max(
            0,
            Math.floor(data.session?.durationSec ?? 0),
          );
          setTodaySeconds((prev) =>
            Math.max(next.todaySeconds, prev + durationSec),
          );
          const minutes = Math.floor(durationSec / 60);
          toast('Session complete', {
            description: minutes > 0
              ? `You studied for ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : 'Focus session ended',
            duration: 4000,
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('session-complete', {
                detail: {
                  durationSec,
                  durationMin: minutes,
                  logId: data.session?.logId,
                  areaId: data.session?.areaId ?? null,
                },
              }),
            );
          }
        } else {
          toast('Timer started', {
            description: 'Focus session is now active',
            duration: 2000,
          });
          setTodaySeconds(next.todaySeconds);
        }
        setDayKey(next.dayKey);
        setRedisAvailable(next.redisAvailable);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('study-stats-changed'));
      }
      requestPresenceRefresh();
    } finally {
      setBusy(false);
    }
  }, [active, busy, refresh]);

  const pause = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      setFrozenElapsed(elapsedSeconds);
      const res = await fetch('/api/study-timer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });
      const data = (await res.json()) as { error?: string; timer?: TimerPayload };
      if (!res.ok) {
        console.warn('[study-timer pause]', data.error ?? res.status);
        await refresh();
        return;
      }
      if (data.timer) {
        const next = normalizeTimerPayload(data.timer);
        setActive(next.active);
        setPaused(next.paused);
        setStartedAtMs(next.startedAtMs);
        setDayKey(next.dayKey);
      }
      toast('Timer paused', { duration: 2000 });
    } finally {
      setBusy(false);
    }
  }, [busy, elapsedSeconds, refresh]);

  const resume = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/study-timer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      const data = (await res.json()) as { error?: string; timer?: TimerPayload };
      if (!res.ok) {
        console.warn('[study-timer resume]', data.error ?? res.status);
        await refresh();
        return;
      }
      if (data.timer) {
        const next = normalizeTimerPayload(data.timer);
        setActive(next.active);
        setPaused(next.paused);
        setStartedAtMs(next.startedAtMs);
        setDayKey(next.dayKey);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, refresh]);

  const value = useMemo(
    () =>
      ({
        active,
        paused,
        startedAtMs,
        todaySeconds,
        todayMinutes,
        dayKey,
        redisAvailable,
        elapsedSeconds,
        busy,
        toggle,
        pause,
        resume,
        refresh,
      }) satisfies StudyTimerState,
    [
      active,
      paused,
      startedAtMs,
      todaySeconds,
      todayMinutes,
      dayKey,
      redisAvailable,
      elapsedSeconds,
      busy,
      toggle,
      pause,
      resume,
      refresh,
    ],
  );

  return (
    <StudyTimerContext.Provider value={value}>
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const ctx = useContext(StudyTimerContext);
  if (!ctx)
    throw new Error('useStudyTimer must be used within StudyTimerProvider');
  return ctx;
}
