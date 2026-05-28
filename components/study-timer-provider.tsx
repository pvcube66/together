'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

type PomodoroPhase = 'focus' | 'break' | null;

type StudyTimerState = {
  active: boolean;
  startedAtMs: number | null;
  todaySeconds: number;
  dayKey: string | null;
  redisAvailable: boolean;
  elapsedSeconds: number;
  busy: boolean;
  toggle: () => Promise<void>;
  refresh: () => Promise<void>;
  // Pomodoro
  pomodoroEnabled: boolean;
  pomodoroPhase: PomodoroPhase;
  pomodoroEndAtMs: number | null;
  pomodoroCycleCount: number;
  pomodoroSecondsRemaining: number;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  skipBreak: () => void;
  updatePomodoroSettings: (settings: {
    pomodoroEnabled: boolean;
    pomodoroFocusMinutes: number;
    pomodoroBreakMinutes: number;
  }) => void;
};

const StudyTimerContext = createContext<StudyTimerState | null>(null);

export function StudyTimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [redisAvailable, setRedisAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  // Pomodoro state
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [pomodoroFocusMinutes, setPomodoroFocusMinutes] = useState(25);
  const [pomodoroBreakMinutes, setPomodoroBreakMinutes] = useState(5);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>(null);
  const [pomodoroEndAtMs, setPomodoroEndAtMs] = useState<number | null>(null);
  const [pomodoroCycleCount, setPomodoroCycleCount] = useState(0);
  const pomodoroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load pomodoro settings from localStorage on mount
  useEffect(() => {
    try {
      const enabled = localStorage.getItem('swm:pomodoro-enabled');
      const focus = localStorage.getItem('swm:pomodoro-focus-minutes');
      const brk = localStorage.getItem('swm:pomodoro-break-minutes');
      if (enabled !== null) setPomodoroEnabled(enabled === '1');
      if (focus !== null) setPomodoroFocusMinutes(Number(focus) || 25);
      if (brk !== null) setPomodoroBreakMinutes(Number(brk) || 5);
    } catch {}
  }, []);

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
      setStartedAtMs(next.startedAtMs);
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

  const elapsedSeconds = useMemo(() => {
    if (!active || startedAtMs === null) return 0;
    return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  }, [active, startedAtMs, nowMs]);

  // Pomodoro break countdown tick
  useEffect(() => {
    if (pomodoroPhase !== 'break' || pomodoroEndAtMs === null) {
      if (pomodoroTimerRef.current) {
        clearInterval(pomodoroTimerRef.current);
        pomodoroTimerRef.current = null;
      }
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((pomodoroEndAtMs - Date.now()) / 1000));
      if (remaining <= 0) {
        setPomodoroPhase(null);
        setPomodoroEndAtMs(null);
        if (pomodoroTimerRef.current) {
          clearInterval(pomodoroTimerRef.current);
          pomodoroTimerRef.current = null;
        }
        toast('Break over!', {
          description: 'Ready for another focus session?',
          duration: 5000,
        });
      }
    };
    tick();
    pomodoroTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (pomodoroTimerRef.current) {
        clearInterval(pomodoroTimerRef.current);
        pomodoroTimerRef.current = null;
      }
    };
  }, [pomodoroPhase, pomodoroEndAtMs]);

  // Put the nowMs tick on always so pomodoro countdown stays accurate
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const pomodoroSecondsRemaining = useMemo(() => {
    if (pomodoroEndAtMs === null) return 0;
    return Math.max(0, Math.floor((pomodoroEndAtMs - Date.now()) / 1000));
  }, [pomodoroEndAtMs, nowMs]);

  const skipBreak = useCallback(() => {
    setPomodoroPhase(null);
    setPomodoroEndAtMs(null);
    if (pomodoroTimerRef.current) {
      clearInterval(pomodoroTimerRef.current);
      pomodoroTimerRef.current = null;
    }
  }, []);

  const updatePomodoroSettings = useCallback((settings: {
    pomodoroEnabled: boolean;
    pomodoroFocusMinutes: number;
    pomodoroBreakMinutes: number;
  }) => {
    setPomodoroEnabled(settings.pomodoroEnabled);
    setPomodoroFocusMinutes(settings.pomodoroFocusMinutes);
    setPomodoroBreakMinutes(settings.pomodoroBreakMinutes);
  }, []);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const action = active ? 'stop' : 'start';
      const res = await fetch('/api/study-timer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        error?: string;
        timer?: TimerPayload;
        session?: {
          durationSec?: number;
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
        setStartedAtMs(next.startedAtMs);
        // Stop responses can occasionally race with redis read-after-write.
        // Reconcile locally using authoritative returned durationSec so UI never regresses.
        if (action === 'stop') {
          const durationSec = Math.max(
            0,
            Math.floor(data.session?.durationSec ?? 0),
          );
          setTodaySeconds((prev) =>
            Math.max(next.todaySeconds, prev + durationSec),
          );
          const minutes = Math.floor(durationSec / 60);
          if (minutes > 0) {
            toast('Session complete', {
              description: `You studied for ${minutes} minute${minutes !== 1 ? 's' : ''}`,
              duration: 4000,
            });
            // Dispatch session feedback event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('session-complete', {
                  detail: { durationSec, durationMin: minutes },
                }),
              );
            }
          }
          // Auto-enter break mode if pomodoro is enabled and session was long enough
          if (pomodoroEnabled && minutes >= pomodoroFocusMinutes && pomodoroPhase !== 'break') {
            const breakMs = pomodoroBreakMinutes * 60 * 1000;
            setPomodoroPhase('break');
            setPomodoroEndAtMs(Date.now() + breakMs);
            setPomodoroCycleCount((c) => c + 1);
            toast('Pomodoro complete!', {
              description: `Take a ${pomodoroBreakMinutes}-minute break`,
              duration: 5000,
            });
          }
        } else {
          toast('Timer started', {
            description: 'Focus session is now active',
            duration: 2000,
          });
          setTodaySeconds(next.todaySeconds);
          // Clear any lingering pomodoro break phase
          if (pomodoroPhase === 'break') {
            skipBreak();
          }
        }
        setDayKey(next.dayKey);
        setRedisAvailable(next.redisAvailable);
      }
      // Avoid immediate re-read clobbering newer local state; periodic/focus refresh still converges.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('study-stats-changed'));
      }
      requestPresenceRefresh();
    } finally {
      setBusy(false);
    }
  }, [active, busy, refresh, pomodoroEnabled, pomodoroFocusMinutes, pomodoroBreakMinutes, pomodoroPhase, skipBreak]);

  const value = useMemo(
    () =>
      ({
        active,
        startedAtMs,
        todaySeconds,
        dayKey,
        redisAvailable,
        elapsedSeconds,
        busy,
        toggle,
        refresh,
        pomodoroEnabled,
        pomodoroPhase,
        pomodoroEndAtMs,
        pomodoroCycleCount,
        pomodoroSecondsRemaining,
        pomodoroFocusMinutes,
        pomodoroBreakMinutes,
        skipBreak,
        updatePomodoroSettings,
      }) satisfies StudyTimerState,
    [
      active,
      startedAtMs,
      todaySeconds,
      dayKey,
      redisAvailable,
      elapsedSeconds,
      busy,
      toggle,
      refresh,
      pomodoroEnabled,
      pomodoroPhase,
      pomodoroEndAtMs,
      pomodoroCycleCount,
      pomodoroSecondsRemaining,
      pomodoroFocusMinutes,
      pomodoroBreakMinutes,
      skipBreak,
      updatePomodoroSettings,
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
