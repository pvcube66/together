'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Timer, Flame, ArrowRight, Brain } from 'lucide-react';
import { useStudyTimer } from '@/components/study-timer-provider';
import { formatMinutesCompact } from '@/lib/study-time-format';
import { SPRING_HOVER } from '@/lib/ui-motion';
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
  const { active, todaySeconds } = useStudyTimer();
  const [data, setData] = useState(initialData);

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
      </motion.div>
    </div>
  );
}
