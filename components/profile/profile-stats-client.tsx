'use client';

import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { AnimatedNumber } from '@/hooks/use-animated-number';
import { formatMinutesCompact, formatMinutesClock } from '@/lib/study-time-format';

export function ProfileStats({
  today,
  thisWeek,
  thisMonth,
  lifetime,
  currentStreak,
  longestStreak,
  heatmap,
  heatmapMax,
  thirtyFiveDaysAgo,
  last7Days,
  maxMin,
}: {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lifetime: number;
  currentStreak: number;
  longestStreak: number;
  heatmap: number[];
  heatmapMax: number;
  thirtyFiveDaysAgo: Date;
  last7Days: { date: string; totalMinutes: number }[];
  maxMin: number;
}) {
  const STATS = [
    { label: 'Today', value: today, suffix: '' },
    { label: 'This Week', value: thisWeek, suffix: '' },
    { label: 'This Month', value: thisMonth, suffix: '' },
    { label: 'Lifetime', value: lifetime, suffix: '' },
    { label: 'Current Streak', value: currentStreak, suffix: 'd' },
    { label: 'Longest Streak', value: longestStreak, suffix: 'd' },
  ];

  return (
    <>
      {/* User stats with animated counters */}
      <div className="bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] rounded-2xl border border-border/50 p-5 shadow-[var(--panel-shadow-inner)]">
        <p className="mb-4 text-[12px] font-semibold tracking-tight text-foreground">User stats</p>
        <motion.div
          className="grid grid-cols-1 divide-y divide-border/40 rounded-xl border border-border/50 bg-background/75 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
        >
          {STATS.map(({ label, value, suffix }, i) => (
            <motion.div
              key={label}
              className="px-4 py-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              <p className="text-[10.5px] text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-[22px] font-semibold tabular-nums tracking-tight text-foreground">
                {suffix === 'd' ? (
                  <>
                    <AnimatedNumber value={value} duration={500} />
                    {suffix}
                  </>
                ) : (
                  <AnimatedNumber
                    value={value}
                    duration={500}
                    formatter={(v) => formatMinutesCompact(Math.round(v))}
                  />
                )}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Calendar-style heatmap with entrance animation */}
      <div className="bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] rounded-2xl border border-border/50 p-5 shadow-[var(--panel-shadow-inner)]">
        <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <CalendarDays size={13} />
          Study calendar
        </p>
        <motion.div
          className="grid grid-cols-7 gap-1.5"
          initial="hidden"
          animate="visible"
        >
          {heatmap.map((minutes, i) => {
            const opacity = Math.max(0.08, Math.min(0.95, minutes / heatmapMax));
            const date = new Date(thirtyFiveDaysAgo.getTime() + i * 86_400_000);
            const iso = date.toISOString().slice(0, 10);
            return (
              <motion.div
                key={i}
                title={`${iso}: ${formatMinutesCompact(minutes)} (${formatMinutesClock(minutes)})`}
                className="aspect-square rounded-[4px] border border-border/40 bg-cta transition-transform hover:scale-125 hover:z-10 hover:shadow-md"
                style={{ opacity }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity, scale: 1 }}
                transition={{ delay: i * 0.006, duration: 0.2, ease: [0.2, 0, 0, 1] }}
              />
            );
          })}
        </motion.div>
        <div className="mt-2 grid grid-cols-7 text-center text-[9px] text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2" style={{ height: '82px' }}>
          {last7Days.map(({ date, totalMinutes }, i) => {
            const barH = Math.max(4, Math.round((totalMinutes / maxMin) * 64));
            const dayLabel = new Date(date + 'T12:00:00Z')
              .toLocaleDateString(undefined, { weekday: 'short' })
              .slice(0, 2);
            return (
              <motion.div
                key={date}
                className="flex flex-1 flex-col items-center gap-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <div className="relative flex w-full flex-1 items-end">
                  <motion.div
                    className="w-full rounded-sm bg-cta/70 transition-all hover:bg-cta/90 hover:shadow-sm"
                    initial={{ height: 4 }}
                    animate={{ height: `${barH}px` }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
                    title={`${date}: ${formatMinutesCompact(totalMinutes)} (${formatMinutesClock(totalMinutes)})`}
                  />
                </div>
                <span className="tabular-nums text-[10px] text-muted-foreground">{dayLabel}</span>
                <span className="tabular-nums text-[9px] text-muted-foreground/85">
                  {formatMinutesClock(totalMinutes)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
