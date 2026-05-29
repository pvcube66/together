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
    longestSession,
    totalFocusMinutes,
    totalActivities,
    ratingAggregation,
    longestActivity,
    bestRatingActivity,
  ] = await Promise.all([
    // 1. Study streak
    prisma.streak.findUnique({
      where: { userId },
      select: { longestStreak: true, currentStreak: true },
    }),

    // 2. Best study day
    prisma.dailyStats.aggregate({
      where: { userId },
      _max: { totalMinutes: true },
    }),

    // 3. Longest focus session
    prisma.focusSession.findFirst({
      where: { userId },
      orderBy: { durationMin: "desc" },
      select: { durationMin: true, completedAt: true },
    }),

    // 4. Total focus minutes
    prisma.user.findUnique({
      where: { id: userId },
      select: { lifetimeFocusMinutes: true },
    }),

    // 5. Total activities
    prisma.activityLog.count({ where: { userId } }),

    // 6. Average rating
    prisma.activityLog.aggregate({
      where: { userId, rating: { not: null } },
      _avg: { rating: true },
    }),

    // 7. Longest logged activity
    prisma.activityLog.findFirst({
      where: { userId, durationMin: { not: null } },
      orderBy: { durationMin: "desc" },
      select: {
        durationMin: true,
        title: true,
        date: true,
        area: { select: { name: true, color: true } },
      },
    }),

    // 8. Best rated activity
    prisma.activityLog.findFirst({
      where: { userId, rating: { not: null } },
      orderBy: { rating: "desc" },
      select: {
        rating: true,
        title: true,
        date: true,
        area: { select: { name: true, color: true } },
      },
    }),
  ]);

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

  const averageRating = ratingAggregation._avg.rating
    ? Math.round(ratingAggregation._avg.rating * 10) / 10
    : 0;

  return NextResponse.json({
    longestStreak: streak?.longestStreak ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    bestDayMinutes: bestDay._max.totalMinutes ?? 0,
    bestWeekMinutes,
    bestWeekLabel,
    longestSessionMin: longestSession?.durationMin ?? 0,
    longestSessionDate: longestSession?.completedAt.toISOString().slice(0, 10) ?? null,
    totalFocusMinutes: totalFocusMinutes?.lifetimeFocusMinutes ?? 0,
    totalActivities,
    averageRating,
    longestActivity: longestActivity ? {
      durationMin: longestActivity.durationMin,
      title: longestActivity.title,
      date: longestActivity.date.toISOString(),
      areaName: longestActivity.area?.name ?? 'No area',
      areaColor: longestActivity.area?.color ?? '#6366f1',
    } : null,
    bestRatingActivity: bestRatingActivity ? {
      rating: bestRatingActivity.rating,
      title: bestRatingActivity.title,
      date: bestRatingActivity.date.toISOString(),
      areaName: bestRatingActivity.area?.name ?? 'No area',
      areaColor: bestRatingActivity.area?.color ?? '#6366f1',
    } : null,
  });
});
