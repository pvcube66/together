'use client';

import { motion } from 'motion/react';
import {
  Trophy,
  Flame,
  Clock,
  Brain,
  Footprints,
  Zap,
  Target,
  Gauge,
  Route,
  Sparkles,
} from 'lucide-react';

type RunRecord = {
  pace: number;
  distance: number;
  date: string;
  type: string;
};

export default function RecordsClient({
  longestStreak,
  currentStreak,
  bestDayMinutes,
  bestWeekMinutes,
  bestWeekLabel,
  fastestRun,
  longestRun,
  longestSessionMin,
  longestSessionDate,
  totalFocusMinutes,
  totalProblems,
  totalRuns,
  mostProblemsDay,
}: {
  longestStreak: number;
  currentStreak: number;
  bestDayMinutes: number;
  bestWeekMinutes: number;
  bestWeekLabel: string | null;
  fastestRun: RunRecord | null;
  longestRun: RunRecord | null;
  longestSessionMin: number;
  longestSessionDate: string | null;
  totalFocusMinutes: number;
  totalProblems: number;
  totalRuns: number;
  mostProblemsDay: { count: number; date: string } | null;
}) {
  function formatDuration(min: number): string {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatPace(pace: number): string {
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')} /km`;
  }

  const RUN_TYPE_LABELS: Record<string, string> = {
    EASY: 'Easy', TEMPO: 'Tempo', INTERVAL: 'Interval', LONG_RUN: 'Long Run', RACE: 'Race',
  };

  function RecordCard({
    icon,
    label,
    value,
    sub,
    date,
    color,
    index = 0,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    date?: string | null;
    color: string;
    index?: number;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="group relative overflow-hidden rounded-xl border border-border/45 bg-card/50 p-4 shadow-[0_1px_3px_rgba(17,24,39,0.04)] transition-all duration-200 hover:bg-card/70 hover:shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
      >
        <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
        />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: `${color}15`, color }}
            >
              {icon}
            </span>
          </div>
          <p className="text-[22px] font-semibold tabular-nums text-foreground leading-tight">{value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
          {date && (
            <p className="mt-1 text-[10px] tabular-nums text-muted-foreground/40">{date}</p>
          )}
        </div>
      </motion.div>
    );
  }

  function RunDetailCard({ record, title, icon, color, index }: {
    record: RunRecord;
    title: string;
    icon: React.ReactNode;
    color: string;
    index: number;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="rounded-xl border border-border/45 bg-card/50 p-4 hover:bg-card/70 transition-colors"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${color}15`, color }}>
            {icon}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{title}</span>
        </div>
        <p className="text-[18px] font-semibold tabular-nums text-foreground">{record.distance}km</p>
        <div className="mt-1 flex items-center gap-3 text-[10.5px] text-muted-foreground/70">
          <span>Pace: {formatPace(record.pace)}</span>
          <span>·</span>
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/90"
            style={{
              background:
                record.type === 'EASY' ? '#22c55e' :
                record.type === 'TEMPO' ? '#eab308' :
                record.type === 'INTERVAL' ? '#ef4444' :
                record.type === 'LONG_RUN' ? '#3b82f6' : '#a855f7'
            }}
          >
            {RUN_TYPE_LABELS[record.type] ?? record.type}
          </span>
        </div>
        <p className="mt-1 text-[10px] tabular-nums text-muted-foreground/40">{record.date}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-5xl flex-col space-y-6 pt-2">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <Trophy size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
          <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Personal Scoreboard</h1>
        </div>

        {/* Streak + Lifetime stats row */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <RecordCard
            icon={<Flame size={13} />}
            label="Longest streak"
            value={`${longestStreak} days`}
            sub={currentStreak > 0 ? `Current: ${currentStreak} days` : undefined}
            color="#f97316"
            index={0}
          />
          <RecordCard
            icon={<Clock size={13} />}
            label="Total focus time"
            value={formatDuration(totalFocusMinutes)}
            color="#6366f1"
            index={1}
          />
          <RecordCard
            icon={<Brain size={13} />}
            label="Total problems"
            value={`${totalProblems}`}
            sub={mostProblemsDay ? `Best day: ${mostProblemsDay.count}` : undefined}
            color="#22c55e"
            index={2}
          />
          <RecordCard
            icon={<Footprints size={13} />}
            label="Total runs"
            value={`${totalRuns}`}
            color="#3b82f6"
            index={3}
          />
        </div>

        {/* Focus records */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target size={13} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
            <h2 className="text-[12px] font-semibold text-foreground/80">Focus Records</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <RecordCard
              icon={<Clock size={13} />}
              label="Best study day"
              value={formatDuration(bestDayMinutes)}
              color="#6366f1"
              index={0}
            />
            <RecordCard
              icon={<Zap size={13} />}
              label="Best study week"
              value={`${bestWeekMinutes}h`}
              date={bestWeekLabel}
              color="#8b5cf6"
              index={1}
            />
            <RecordCard
              icon={<Sparkles size={13} />}
              label="Longest session"
              value={formatDuration(longestSessionMin)}
              date={longestSessionDate}
              color="#a855f7"
              index={2}
            />
          </div>
        </div>

        {/* Run records */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Route size={13} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
            <h2 className="text-[12px] font-semibold text-foreground/80">Run Records</h2>
          </div>
          {!fastestRun && !longestRun ? (
            <div className="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed border-border/60 text-center">
              <p className="px-6 text-[11px] text-muted-foreground">No runs logged yet. Log a run to see your records.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {fastestRun && (
                <RunDetailCard
                  record={fastestRun}
                  title="Fastest pace"
                  icon={<Gauge size={13} />}
                  color="#22c55e"
                  index={0}
                />
              )}
              {longestRun && (
                <RunDetailCard
                  record={longestRun}
                  title="Longest distance"
                  icon={<Route size={13} />}
                  color="#3b82f6"
                  index={1}
                />
              )}
            </div>
          )}
        </div>

        {/* Problems record */}
        {mostProblemsDay && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Brain size={13} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
              <h2 className="text-[12px] font-semibold text-foreground/80">Problem Records</h2>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              <RecordCard
                icon={<Brain size={13} />}
                label="Most problems in a day"
                value={`${mostProblemsDay.count}`}
                date={mostProblemsDay.date}
                color="#22c55e"
                index={0}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalFocusMinutes === 0 && totalProblems === 0 && totalRuns === 0 && (
          <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <div>
              <Trophy size={24} strokeWidth={1.2} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
                No records yet. Start studying, solving problems, and logging runs to build your scoreboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// — RecordsClient: personal scoreboard with all-time bests across study, problems, and runs.
