import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { limiters, enforce } from "@/lib/ratelimit";

export const GET = withApi(async () => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
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
    // 1. Longest study streak
    prisma.streak.findUnique({
      where: { userId },
      select: { longestStreak: true, currentStreak: true },
    }),

    // 2. Best study day (most focus minutes)
    prisma.dailyStats.aggregate({
      where: { userId },
      _max: { totalMinutes: true },
    }),

    // 3. Fastest run (best pace)
    prisma.runLog.findFirst({
      where: { userId, paceMinPerKm: { not: null } },
      orderBy: { paceMinPerKm: "asc" },
      select: { paceMinPerKm: true, distanceKm: true, runDate: true, runType: true },
    }),

    // 4. Longest run (max distance)
    prisma.runLog.findFirst({
      where: { userId },
      orderBy: { distanceKm: "desc" },
      select: { distanceKm: true, paceMinPerKm: true, runDate: true, runType: true },
    }),

    // 5. Longest focus session
    prisma.focusSession.findFirst({
      where: { userId },
      orderBy: { durationMin: "desc" },
      select: { durationMin: true, completedAt: true, roomId: true },
    }),

    // 6. Total lifetime focus minutes
    prisma.user.findUnique({
      where: { id: userId },
      select: { lifetimeFocusMinutes: true },
    }),

    // 7. Total problems solved
    prisma.problemLog.count({ where: { userId } }),

    // 8. Total runs
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

  // All-time best week (focus minutes) — scan DailyStats, group by ISO week
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
      // Compute ISO week string
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

  return NextResponse.json({
    longestStreak: streak?.longestStreak ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    bestDayMinutes: bestDay._max.totalMinutes ?? 0,
    bestWeekMinutes,
    bestWeekLabel,
    fastestRun: fastestRun
      ? {
          pace: fastestRun.paceMinPerKm,
          distance: fastestRun.distanceKm,
          date: fastestRun.runDate.toISOString().slice(0, 10),
          type: fastestRun.runType,
        }
      : null,
    longestRun: longestRun
      ? {
          distance: longestRun.distanceKm,
          pace: longestRun.paceMinPerKm,
          date: longestRun.runDate.toISOString().slice(0, 10),
          type: longestRun.runType,
        }
      : null,
    longestSessionMin: longestSession?.durationMin ?? 0,
    longestSessionDate: longestSession?.completedAt.toISOString().slice(0, 10) ?? null,
    totalFocusMinutes: totalFocusMinutes?.lifetimeFocusMinutes ?? 0,
    totalProblems,
    totalRuns,
    mostProblemsDay,
  });
});

// — GET: personal records — streaks, best day/week, fastest/longest run, longest session.
