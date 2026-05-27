import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import RecordsClient from "./records-client";

export default async function RecordsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [
    streak,
    bestDay,
    fastestRun,
    longestRun,
    longestSession,
    totalFocusMinutes,
    totalProblems,
    totalRuns,
  ] = await Promise.all([
    prisma.streak.findUnique({
      where: { userId },
      select: { longestStreak: true, currentStreak: true },
    }),
    prisma.dailyStats.aggregate({
      where: { userId },
      _max: { totalMinutes: true },
    }),
    prisma.runLog.findFirst({
      where: { userId, paceMinPerKm: { not: null } },
      orderBy: { paceMinPerKm: "asc" },
      select: { paceMinPerKm: true, distanceKm: true, runDate: true, runType: true },
    }),
    prisma.runLog.findFirst({
      where: { userId },
      orderBy: { distanceKm: "desc" },
      select: { distanceKm: true, paceMinPerKm: true, runDate: true, runType: true },
    }),
    prisma.focusSession.findFirst({
      where: { userId },
      orderBy: { durationMin: "desc" },
      select: { durationMin: true, completedAt: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lifetimeFocusMinutes: true },
    }),
    prisma.problemLog.count({ where: { userId } }),
    prisma.runLog.count({ where: { userId } }),
  ]);

  // Most problems in a day
  const problemsByDay = await prisma.problemLog.groupBy({
    by: ["solvedAt"],
    where: { userId },
    _count: true,
    orderBy: { _count: { solvedAt: "desc" } },
    take: 1,
  });

  const mostProblemsDay = problemsByDay.length > 0
    ? { count: problemsByDay[0]._count, date: problemsByDay[0].solvedAt.toISOString().slice(0, 10) }
    : null;

  // All-time best week (focus minutes)
  const allDailyStats = await prisma.dailyStats.findMany({
    where: { userId },
    select: { date: true, totalMinutes: true },
    orderBy: { date: "asc" },
  });

  let bestWeekMinutes = 0;
  let bestWeekLabel: string | null = null;

  if (allDailyStats.length > 0) {
    const weekMap = new Map<string, number>();
    for (const row of allDailyStats) {
      const d = new Date(row.date);
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + yearStart.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      weekMap.set(key, (weekMap.get(key) ?? 0) + row.totalMinutes);
    }
    for (const [week, mins] of weekMap) {
      if (mins > bestWeekMinutes) {
        bestWeekMinutes = mins;
        bestWeekLabel = week;
      }
    }
  }

  return (
    <RecordsClient
      longestStreak={streak?.longestStreak ?? 0}
      currentStreak={streak?.currentStreak ?? 0}
      bestDayMinutes={bestDay._max.totalMinutes ?? 0}
      bestWeekMinutes={Math.round((bestWeekMinutes / 60) * 10) / 10}
      bestWeekLabel={bestWeekLabel}
      fastestRun={fastestRun ? {
        pace: fastestRun.paceMinPerKm!,
        distance: fastestRun.distanceKm,
        date: fastestRun.runDate.toISOString().slice(0, 10),
        type: fastestRun.runType,
      } : null}
      longestRun={longestRun ? {
        distance: longestRun.distanceKm,
        pace: longestRun.paceMinPerKm ?? 0,
        date: longestRun.runDate.toISOString().slice(0, 10),
        type: longestRun.runType,
      } : null}
      longestSessionMin={longestSession?.durationMin ?? 0}
      longestSessionDate={longestSession?.completedAt.toISOString().slice(0, 10) ?? null}
      totalFocusMinutes={totalFocusMinutes?.lifetimeFocusMinutes ?? 0}
      totalProblems={totalProblems}
      totalRuns={totalRuns}
      mostProblemsDay={mostProblemsDay}
    />
  );
}

// — Records page: personal scoreboard with all-time bests across all tracked activities.
