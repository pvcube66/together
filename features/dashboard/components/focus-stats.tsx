'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Timer, Flame, TrendingUp, Calendar, Clock, ArrowRight, Brain, Target, Zap } from 'lucide-react';
import { useStudyTimer } from '@/components/study-timer-provider';
import { formatMinutesCompact } from '@/lib/study-time-format';
import { SPRING_HOVER } from '@/lib/ui-motion';

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
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#sparkline-fill)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-cta)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (() => {
        const lastX = w;
        const lastY = h - (data[data.length - 1] / max) * h;
        return (
          <circle cx={lastX} cy={lastY} r="2.5" fill="var(--color-cta)" stroke="var(--color-card)" strokeWidth="1" />
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
          {formatMinutesCompact(value)}
          <span className="text-muted-foreground/60 font-normal"> / {formatMinutesCompact(max)}</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 70%, white 30%))` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0, 0, 0.58, 1] }}
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

  // Refresh stats on mount and window focus
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/stats/me', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json() as FocusStatsData;
        if (!cancelled) setData(json);
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
    const localTodaySeconds = todaySeconds;
    return Math.max(base, Math.floor(localTodaySeconds / 60));
  }, [data?.today, todaySeconds]);

  const weekGoalMinutes = weeklyGoal * 60; // weeklyGoal is in number of tasks, but let's use it as hours for focus time
  const monthGoalMinutes = monthlyGoal * 60;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get day labels for the last 7 days
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
        <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/30 p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-cta/10 text-cta'}`}>
              <Timer size={16} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Today</p>
              <p className="text-lg font-bold tabular-nums text-foreground leading-tight mt-0.5">
                {formatMinutesCompact(displayTodayMinutes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Flame size={16} strokeWidth={1.5} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Streak</p>
              <p className="text-lg font-bold tabular-nums text-foreground leading-tight mt-0.5">
                {data?.streak.currentStreak ?? 0}
                <span className="text-[11px] font-medium text-muted-foreground/70 ml-0.5">days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Weekly / Monthly Progress */}
        <div className="space-y-3 mb-3">
          <ProgressBar value={displayTodayMinutes} max={60 * 8} label="Daily" color="var(--color-cta)" />
          <ProgressBar value={data?.thisWeek ?? 0} max={weekGoalMinutes} label="Weekly" color="oklch(0.55 0.12 250)" />
          <ProgressBar value={data?.thisMonth ?? 0} max={monthGoalMinutes} label="Monthly" color="oklch(0.55 0.12 320)" />
        </div>

        {/* 7-Day Sparkline */}
        {(data?.last7Days && data.last7Days.length > 0) && (
          <div className="rounded-xl border border-border/30 bg-muted/30 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Last 7 days</span>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {formatMinutesCompact(data.last7Days.reduce((s, d) => s + d.totalMinutes, 0))} total
              </span>
            </div>
            <Sparkline data={data.last7Days.map(d => d.totalMinutes)} />
            <div className="flex justify-between mt-1 px-0.5">
              {data.last7Days.map((d, i) => (
                <span key={d.date} className="text-[8px] font-medium text-muted-foreground/50 tabular-nums">
                  {getDayLabel(d.date)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {(data?.recentSessions && data.recentSessions.length > 0) && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={10} className="text-muted-foreground/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recent sessions</span>
            </div>
            <div className="space-y-1.5">
              {data.recentSessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/30 px-2.5 py-1.5"
                >
                  <span className="text-[11px] font-medium text-foreground/80 truncate max-w-[120px]">
                    {s.roomName ?? 'Solo focus'}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {formatMinutesCompact(s.durationMin)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lifetime Stats */}
        {data && (
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <Zap size={10} />
              Lifetime: {formatMinutesCompact(data.lifetimeFocusMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />
              Best streak: {data.streak.longestStreak} days
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
