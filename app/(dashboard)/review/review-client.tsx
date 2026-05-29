'use client';

import { motion } from 'motion/react';
import {
  Trophy,
  Flame,
  Clock,
  Zap,
  Sparkles,
  ClipboardList,
  Star,
  Activity,
  Award,
  Layers,
  BarChart3,
} from 'lucide-react';

type AreaBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  hours: number;
};

type ActivityRecord = {
  durationMin: number;
  title: string;
  date: string;
  areaName: string;
  areaColor: string;
};

type RatingRecord = {
  rating: number;
  title: string;
  date: string;
  areaName: string;
  areaColor: string;
};

export default function ReviewClient({
  // Weekly Review Props
  weekStart,
  weekEnd,
  weeklyStudyHours,
  weeklyStudyMinutes,
  weeklySessions,
  hoursByArea,
  weeklyActivities,
  weeklyAvgProductivity,
  weeklyActivityMinutes,
  tasksCompleted,

  // All-time Scoreboard Props
  longestStreak,
  currentStreak,
  bestDayMinutes,
  bestWeekMinutes,
  bestWeekLabel,
  longestSessionMin,
  longestSessionDate,
  totalFocusMinutes,
  totalActivities,
  allTimeAverageRating,
  longestActivity,
  bestRatingActivity,
}: {
  weekStart: string;
  weekEnd: string;
  weeklyStudyHours: number;
  weeklyStudyMinutes: number;
  weeklySessions: number;
  hoursByArea: AreaBreakdown[];
  weeklyActivities: number;
  weeklyAvgProductivity: number;
  weeklyActivityMinutes: number;
  tasksCompleted: number;

  longestStreak: number;
  currentStreak: number;
  bestDayMinutes: number;
  bestWeekMinutes: number;
  bestWeekLabel: string | null;
  longestSessionMin: number;
  longestSessionDate: string | null;
  totalFocusMinutes: number;
  totalActivities: number;
  allTimeAverageRating: number;
  longestActivity: ActivityRecord | null;
  bestRatingActivity: RatingRecord | null;
}) {
  const weekLabel = `${new Date(weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;

  function formatDuration(min: number): string {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function OverviewCard({
    icon,
    label,
    value,
    sub,
    color,
    index = 0,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    color: string;
    index?: number;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className="group relative overflow-hidden rounded-xl border border-border/45 bg-card/40 p-4 transition-all duration-200 hover:bg-card/75 hover:shadow-[var(--shadow-ambient-sm)] hover:-translate-y-0.5"
      >
        <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full opacity-[0.03]"
          style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
        />
        <div className="relative flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold tabular-nums text-foreground leading-tight">{value}</p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{label}</p>
            {sub && <p className="text-[9.5px] text-muted-foreground/60 leading-none mt-0.5">{sub}</p>}
          </div>
        </div>
      </motion.div>
    );
  }

  function BestRecordCard({
    icon,
    label,
    value,
    date,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    date?: string | null;
    color: string;
  }) {
    return (
      <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-3 hover:bg-card/50 transition-[background-color,box-shadow] duration-200 hover:shadow-[var(--shadow-ambient-sm)]"
    >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs" style={{ background: `${color}15`, color }}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-medium text-muted-foreground leading-none">{label}</p>
            {date && <p className="text-[9.5px] text-muted-foreground/45 mt-0.5 tabular-nums">{date}</p>}
          </div>
        </div>
        <p className="text-[13px] font-bold tabular-nums text-foreground shrink-0 pl-2">{value}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-5xl flex-col space-y-6 pt-2">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/30 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-cta" />
              <h1 className="text-[16px] font-bold tracking-tight text-foreground sm:text-[18px]">
                Review & Records
              </h1>
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              Your consolidated dashboard for weekly analytics and all-time personal bests.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground tabular-nums">
              <BarChart3 size={11} className="text-cta/80" />
              {weekLabel}
            </span>
          </div>
        </div>

        {/* 1. High-Level Summary Overview (All-Time Highlights) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          <OverviewCard
            icon={<Flame size={13} />}
            label="Current Streak"
            value={`${currentStreak} days`}
            sub={`Best: ${longestStreak} days`}
            color="#f97316"
            index={0}
          />
          <OverviewCard
            icon={<Clock size={13} />}
            label="Lifetime Focus"
            value={formatDuration(totalFocusMinutes)}
            color="#6366f1"
            index={1}
          />
          <OverviewCard
            icon={<ClipboardList size={13} />}
            label="Total Logs"
            value={`${totalActivities}`}
            color="#22c55e"
            index={2}
          />
          <OverviewCard
            icon={<Star size={13} />}
            label="All-Time Avg rating"
            value={allTimeAverageRating > 0 ? `${allTimeAverageRating}/10` : '—'}
            color="#eab308"
            index={3}
          />
          <OverviewCard
            icon={<Activity size={13} />}
            label="Active Focus Time"
            value={formatDuration(weeklyStudyMinutes + weeklyActivityMinutes)}
            sub="Focus + Logs (This Week)"
            color="#a855f7"
            index={4}
          />
        </div>

        {/* 2. Main Dashboard Split Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Left Column: Weekly Review */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/30 pb-2">
              <BarChart3 size={14} className="text-muted-foreground opacity-80" />
              <h2 className="text-[13px] font-semibold text-foreground/90">This Week&apos;s Review</h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border/40 bg-card/25 p-3.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Focus</span>
                <p className="text-[20px] font-bold tabular-nums text-foreground mt-1">{weeklyStudyHours}h</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{weeklySessions} focus sessions</p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/25 p-3.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Logs</span>
                <p className="text-[20px] font-bold tabular-nums text-foreground mt-1">{weeklyActivities}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {weeklyActivities > 0 ? `${formatDuration(weeklyActivityMinutes)} active duration` : 'No logs'}
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/25 p-3.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Avg Rating</span>
                <p className="text-[20px] font-bold tabular-nums text-foreground mt-1">
                  {weeklyAvgProductivity > 0 ? `${weeklyAvgProductivity}/10` : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Productivity / effort score</p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/25 p-3.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Tasks Completed</span>
                <p className="text-[20px] font-bold tabular-nums text-foreground mt-1">{tasksCompleted}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Todos completed</p>
              </div>
            </div>

            {/* Study Hours by Area */}
            {hoursByArea.length > 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/25 p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Layers size={12} className="text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-foreground/80">Weekly Focus Hours by Area</span>
                </div>
                
                <div className="space-y-2.5">
                  {hoursByArea
                    .sort((a, b) => b.hours - a.hours)
                    .map((area) => (
                      <div key={area.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[70%]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: area.color }} />
                            {area.name}
                          </span>
                          <span className="font-bold tabular-nums text-foreground">{area.hours}h</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/65 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((area.hours / Math.max(...hoursByArea.map((a) => a.hours), 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                            className="h-full rounded-full"
                            style={{ background: area.color }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-border/60 text-center p-4">
                <p className="text-[11px] text-muted-foreground">No focus hours logged by area this week.</p>
              </div>
            )}
          </div>

          {/* Right Column: Personal Scoreboard (All-Time Bests) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/30 pb-2">
              <Trophy size={14} className="text-muted-foreground opacity-80" />
              <h2 className="text-[13px] font-semibold text-foreground/90">All-Time Scoreboard Bests</h2>
            </div>

            <div className="space-y-2.5">
              <BestRecordCard
                icon={<Clock size={12} />}
                label="Best Study Day"
                value={formatDuration(bestDayMinutes)}
                color="#6366f1"
              />
              <BestRecordCard
                icon={<Zap size={12} />}
                label="Best Study Week"
                value={`${bestWeekMinutes}h`}
                date={bestWeekLabel ? `Week of ${bestWeekLabel}` : null}
                color="#8b5cf6"
              />
              <BestRecordCard
                icon={<Sparkles size={12} />}
                label="Longest Focus Session"
                value={formatDuration(longestSessionMin)}
                date={longestSessionDate ? `Achieved on ${new Date(longestSessionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : null}
                color="#a855f7"
              />
            </div>

            {/* Logged Activity Bests Detail Cards */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {longestActivity ? (
                <div className="rounded-xl border border-border/40 bg-card/25 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
                    <Clock size={12} className="text-blue-500" />
                    <span>Longest Logged Activity</span>
                  </div>
                  <p className="text-[12px] font-semibold text-foreground truncate leading-snug">{longestActivity.title}</p>
                  <p className="text-[16px] font-bold tabular-nums text-foreground">{formatDuration(longestActivity.durationMin)}</p>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1 py-0.5">
                      <span className="h-1 w-1 rounded-full" style={{ background: longestActivity.areaColor }} />
                      {longestActivity.areaName}
                    </span>
                    <span className="tabular-nums">{new Date(longestActivity.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-[7.5rem] items-center justify-center rounded-xl border border-dashed border-border/60 text-center p-3 text-[10px] text-muted-foreground">
                  No activity duration logged yet.
                </div>
              )}

              {bestRatingActivity ? (
                <div className="rounded-xl border border-border/40 bg-card/25 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
                    <Award size={12} className="text-yellow-500" />
                    <span>Highest Rated Activity</span>
                  </div>
                  <p className="text-[12px] font-semibold text-foreground truncate leading-snug">{bestRatingActivity.title}</p>
                  <p className="text-[16px] font-bold tabular-nums text-foreground">{bestRatingActivity.rating}/10 Rating</p>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1 py-0.5">
                      <span className="h-1 w-1 rounded-full" style={{ background: bestRatingActivity.areaColor }} />
                      {bestRatingActivity.areaName}
                    </span>
                    <span className="tabular-nums">{new Date(bestRatingActivity.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-[7.5rem] items-center justify-center rounded-xl border border-dashed border-border/60 text-center p-3 text-[10px] text-muted-foreground">
                  No activity rating logged yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
