'use client';

import { motion } from 'motion/react';
import {
  Brain,
  Activity,
  Battery,
  Clock,
  Footprints,
  Beaker,
  CheckSquare,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';

type AreaBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  hours: number;
};

export default function ReviewClient({
  weekStart,
  weekEnd,
  totalStudyHours,
  totalStudyMinutes,
  totalSessions,
  hoursByArea,
  problemsByDifficulty,
  totalProblems,
  totalRuns,
  totalDistance,
  totalDuration,
  checkinDays,
  avgMood,
  avgEnergy,
  avgFocus,
  tasksCompleted,
}: {
  weekStart: string;
  weekEnd: string;
  totalStudyHours: number;
  totalStudyMinutes: number;
  totalSessions: number;
  hoursByArea: AreaBreakdown[];
  problemsByDifficulty: { EASY: number; MEDIUM: number; HARD: number };
  totalProblems: number;
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  checkinDays: number;
  avgMood: number;
  avgEnergy: number;
  avgFocus: number;
  tasksCompleted: number;
}) {
  const weekLabel = `${new Date(weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;

  function StatCard({
    icon,
    label,
    value,
    sub,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/45 bg-card/50 p-4 shadow-[0_1px_3px_rgba(17,24,39,0.04)] transition-colors hover:bg-card/70"
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={color ? { background: `${color}18`, color } : {}}
          >
            {icon}
          </span>
        </div>
        <p className="text-[22px] font-semibold tabular-nums text-foreground leading-tight">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </motion.div>
    );
  }

  function formatDuration(min: number): string {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatPace(paceMinPerKm: number): string {
    const min = Math.floor(paceMinPerKm);
    const sec = Math.round((paceMinPerKm - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')} /km`;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-5xl flex-col space-y-6 pt-2">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <BarChart3 size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
          <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Weekly Review</h1>
          <span className="ml-auto text-[10.5px] text-muted-foreground/70 tabular-nums">{weekLabel}</span>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-6">
          <StatCard
            icon={<Clock size={13} />}
            label="Study hours"
            value={totalStudyHours}
            sub={`${totalSessions} sessions`}
            color="#6366f1"
          />
          <StatCard
            icon={<Beaker size={13} />}
            label="Problems solved"
            value={totalProblems}
            sub={`${problemsByDifficulty.EASY}E · ${problemsByDifficulty.MEDIUM}M · ${problemsByDifficulty.HARD}H`}
            color="#22c55e"
          />
          <StatCard
            icon={<Footprints size={13} />}
            label="Runs"
            value={totalRuns}
            sub={totalRuns > 0 ? `${totalDistance}km · ${formatDuration(totalDuration)}` : undefined}
            color="#3b82f6"
          />
          <StatCard
            icon={<Sparkles size={13} />}
            label="Check-ins"
            value={checkinDays}
            sub="days this week"
            color="#f59e0b"
          />
          <StatCard
            icon={<CheckSquare size={13} />}
            label="Tasks done"
            value={tasksCompleted}
            color="#ec4899"
          />
          <StatCard
            icon={<Brain size={13} />}
            label="Avg mood"
            value={avgMood}
            sub={`${avgEnergy} energy · ${avgFocus} focus`}
            color="#a855f7"
          />
        </div>

        {/* Mood/Energy/Focus mini row */}
        {checkinDays > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Brain size={12} className="text-purple-500" />
                <span className="text-[10px] text-muted-foreground">Mood</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[18px] font-semibold tabular-nums text-foreground">{avgMood}</span>
                <span className="text-[11px] text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Battery size={12} className="text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Energy</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[18px] font-semibold tabular-nums text-foreground">{avgEnergy}</span>
                <span className="text-[11px] text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-blue-500" />
                <span className="text-[10px] text-muted-foreground">Focus</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[18px] font-semibold tabular-nums text-foreground">{avgFocus}</span>
                <span className="text-[11px] text-muted-foreground">/10</span>
              </div>
            </div>
          </div>
        )}

        {/* Hours by Area */}
        {hoursByArea.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Layers size={13} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
              <h2 className="text-[12px] font-semibold text-foreground/80">Study Hours by Area</h2>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {hoursByArea
                .sort((a, b) => b.hours - a.hours)
                .map((area, i) => (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-xs"
                      style={{ background: `${area.color}20`, color: area.color }}
                    >
                      {area.icon || <Layers size={12} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-medium text-foreground truncate">{area.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted/70 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((area.hours / Math.max(...hoursByArea.map((a) => a.hours))) * 100, 100)}%` }}
                            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
                            className="h-full rounded-full"
                            style={{ background: area.color }}
                          />
                        </div>
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground">
                          {area.hours}h
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Running detail row */}
        {totalRuns > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <span className="text-[10px] text-muted-foreground">Avg distance</span>
              <p className="text-[16px] font-semibold tabular-nums text-foreground">
                {totalRuns > 0 ? `${(totalDistance / totalRuns).toFixed(2)}km` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <span className="text-[10px] text-muted-foreground">Avg pace</span>
              <p className="text-[16px] font-semibold tabular-nums text-foreground">
                {totalDuration > 0 && totalDistance > 0
                  ? formatPace(Math.round((totalDuration / totalDistance) * 100) / 100)
                  : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2.5">
              <span className="text-[10px] text-muted-foreground">Avg duration</span>
              <p className="text-[16px] font-semibold tabular-nums text-foreground">
                {totalRuns > 0 ? formatDuration(Math.round(totalDuration / totalRuns)) : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Problems by difficulty bar */}
        {totalProblems > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Beaker size={13} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
              <h2 className="text-[12px] font-semibold text-foreground/80">Problems by Difficulty</h2>
            </div>
            <div className="flex h-7 w-full overflow-hidden rounded-md border border-border/40">
              {problemsByDifficulty.EASY > 0 && (
                <div
                  className="flex items-center justify-center text-[10px] font-medium text-white/90 transition-all"
                  style={{
                    width: `${(problemsByDifficulty.EASY / totalProblems) * 100}%`,
                    background: '#22c55e',
                  }}
                >
                  {problemsByDifficulty.EASY}
                </div>
              )}
              {problemsByDifficulty.MEDIUM > 0 && (
                <div
                  className="flex items-center justify-center text-[10px] font-medium text-white/90 transition-all"
                  style={{
                    width: `${(problemsByDifficulty.MEDIUM / totalProblems) * 100}%`,
                    background: '#eab308',
                  }}
                >
                  {problemsByDifficulty.MEDIUM}
                </div>
              )}
              {problemsByDifficulty.HARD > 0 && (
                <div
                  className="flex items-center justify-center text-[10px] font-medium text-white/90 transition-all"
                  style={{
                    width: `${(problemsByDifficulty.HARD / totalProblems) * 100}%`,
                    background: '#ef4444',
                  }}
                >
                  {problemsByDifficulty.HARD}
                </div>
              )}
            </div>
            <div className="mt-1.5 flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Easy</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Hard</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalStudyMinutes === 0 && totalProblems === 0 && totalRuns === 0 && tasksCompleted === 0 && (
          <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <div>
              <BarChart3 size={24} strokeWidth={1.2} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
                No data for this week yet. Start studying, solving problems, logging runs, and checking in to see your weekly review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// — ReviewClient: weekly review dashboard with stats cards, area breakdown, difficulty bar.
