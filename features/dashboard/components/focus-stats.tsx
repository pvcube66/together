'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Timer, Flame, TrendingUp, Clock, ArrowRight, Brain, Zap } from 'lucide-react';
import { useStudyTimer } from '@/components/study-timer-provider';
import { formatMinutesCompact } from '@/lib/study-time-format';
import { SPRING_HOVER, SPRING_SNAP } from '@/lib/ui-motion';
import { AnimatedNumber } from '@/hooks/use-animated-number';

type FocusStatsData = {
  lifetimeFocusMinutes: number;
  streak: { currentStreak: number; longestStreak: number; lastActiveDate: string | null };
  today: number;
  todaySeconds: number;
  thisWeek: number;
  thisMonth: number;
  last7Days: { date: string; totalMinutes: number }[];
  recentSessions: { id: string; durationMin: number; completedAt: string; roomCode: string | null; roomName: string | null }[];
};

function Sparkline({ data, className = '' }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data);
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-8 ${className}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-cta)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-cta)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkline-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke="var(--color-cta)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0, 0, 0.58, 1] }}
      />
      {data.length > 0 && (() => {
        const lastX = w;
        const lastY = h - (data[data.length - 1] / max) * h;
        return (
          <motion.circle
            cx={lastX} cy={lastY} r="2.5"
            fill="var(--color-cta)" stroke="var(--color-card)" strokeWidth="1"
            initial={{ r: 0 }} animate={{ r: 2.5 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          />
        );
      })()}
    </svg>
  );
}

function ProgressBar({ value, max, label, color = 'var(--color-cta)' }: { value: number; max: number; label: string; color?: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">
          <AnimatedNumber value={value} formatter={(v) => formatMinutesCompact(Math.round(v))} duration={500} />
          <span className="text-muted-foreground/60 font-normal"> / {formatMinutesCompact(max)}</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 70%, white 30%))` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
        />
      </div>
      <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
        {pct}% complete
      </p>
    </div>
  );
}

export default function FocusStats({
  initialData,
  weeklyGoal,
  monthlyGoal,
}: {
  initialData: FocusStatsData | null;
  weeklyGoal: number;
  monthlyGoal: number;
}) {
  const { active, startedAtMs, todaySeconds } = useStudyTimer();
  const [data, setData] = useState(initialData);
  const mountedRef = useRef(false);

  // Refresh stats on mount and window focus
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/stats/me', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json() as FocusStatsData;
        if (!cancelled) {
          setData(json);
          mountedRef.current = true;
        }
      } catch { /* ignore */ }
    };
    void load();

    const onFocus = () => void load();
    const onStats = () => void load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('study-stats-changed', onStats);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('study-stats-changed', onStats);
    };
  }, []);

  // Merge local timer state into displayed today time
  const displayTodayMinutes = useMemo(() => {
    const base = data?.today ?? 0;
    return Math.max(base, Math.floor(todaySeconds / 60));
  }, [data?.today, todaySeconds]);

  const weekGoalMinutes = weeklyGoal * 60;
  const monthGoalMinutes = monthlyGoal * 60;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDayLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00Z');
      return dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1];
    } catch { return ''; }
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-[100vw] items-stretch justify-start pl-0.5 pr-0 pt-1 pb-2">
      <motion.div
        className="relative h-full min-h-0 w-full min-w-0 max-w-full rounded-2xl border border-border/40 bg-card p-4 shadow-ambient-md transition-shadow overflow-y-auto"
        transition={SPRING_HOVER}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cta/10 text-cta">
              <Brain size={14} />
            </div>
            <h3 className="text-[13px] font-bold tracking-tight text-foreground">Focus Stats</h3>
          </div>
          <Link
            href="/review"
            className="text-[10px] font-semibold text-cta hover:text-cta/80 transition-colors inline-flex items-center gap-1"
          >
            Details
            <ArrowRight size={10} />
          </Link>
        </div>

        {/* Today + Streak Row */}
        <motion.div
          className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/30 p-3 mb-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-cta/10 text-cta'}`}
              animate={active ? {
                scale: [1, 1.04, 1],
                transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
              } : {}}
            >
              <Timer size={16} strokeWidth={1.5} />
            </motion.div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Today</p>
              <p className="text-lg font-bold tabular-nums text-foreground leading-tight mt-0.5">
                <AnimatedNumber value={displayTodayMinutes} formatter={(v) => formatMinutesCompact(Math.round(v))} duration={500} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <motion.div
                animate={data?.streak.currentStreak && data.streak.currentStreak > 0
                  ? { scale: [1, 1.06, 1], transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }
                  : {}}
              >
                <Flame size={16} strokeWidth={1.5} />
              </motion.div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Streak</p>
              <p className="text-lg font-bold tabular-nums text-foreground leading-tight mt-0.5">
                <AnimatedNumber value={data?.streak.currentStreak ?? 0} duration={400} />
                <span className="text-[11px] font-medium text-muted-foreground/70 ml-0.5">days</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Weekly / Monthly Progress */}
        <motion.div
          className="space-y-3 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <ProgressBar value={displayTodayMinutes} max={60 * 8} label="Daily" color="var(--color-cta)" />
          <ProgressBar value={data?.thisWeek ?? 0} max={weekGoalMinutes} label="Weekly" color="oklch(0.55 0.12 250)" />
          <ProgressBar value={data?.thisMonth ?? 0} max={monthGoalMinutes} label="Monthly" color="oklch(0.55 0.12 320)" />
        </motion.div>

        {/* 7-Day Sparkline */}
        {(data?.last7Days && data.last7Days.length > 0) && (
          <motion.div
            className="rounded-xl border border-border/30 bg-muted/30 p-3 mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Last 7 days</span>
              <motion.span
                className="text-[10px] font-semibold tabular-nums text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedNumber
                  value={data.last7Days.reduce((s, d) => s + d.totalMinutes, 0)}
                  formatter={(v) => formatMinutesCompact(Math.round(v))}
                  duration={600}
                /> total
              </motion.span>
            </div>
            <Sparkline data={data.last7Days.map(d => d.totalMinutes)} />
            <div className="flex justify-between mt-1 px-0.5">
              {data.last7Days.map((d, i) => (
                <span key={d.date} className="text-[8px] font-medium text-muted-foreground/50 tabular-nums">
                  {getDayLabel(d.date)}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Sessions */}
        {(data?.recentSessions && data.recentSessions.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={10} className="text-muted-foreground/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recent sessions</span>
            </div>
            <div className="space-y-1.5">
              {data.recentSessions.slice(0, 5).map((s, i) => (
                <motion.div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/30 px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.2 }}
                >
                  <span className="text-[11px] font-medium text-foreground/80 truncate max-w-[120px]">
                    {s.roomName ?? 'Solo focus'}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {formatMinutesCompact(s.durationMin)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lifetime Stats */}
        {data && (
          <motion.div
            className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <span className="flex items-center gap-1">
              <Zap size={10} />
              Lifetime:{' '}
              <AnimatedNumber value={data.lifetimeFocusMinutes} formatter={(v) => formatMinutesCompact(Math.round(v))} duration={700} />
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />
              Best streak: <AnimatedNumber value={data.streak.longestStreak} duration={500} /> days
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
