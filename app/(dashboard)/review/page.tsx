import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/periods";
import ReviewClient from "./review-client";

type AreaInfo = { id: string; name: string; color: string; icon: string | null };

export default async function ReviewAndRecordsPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const now = new Date();

  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

  const [
    // 1. Weekly Focus Sessions
    focusSessionsThisWeek,
    // 2. Weekly Activity Logs
    activityLogsThisWeek,
    // 3. Weekly Tasks completed
    tasksCompletedThisWeek,
    // 4. All user areas
    areas,
    // 5. All-Time Streak
    streak,
    // 6. All-Time Best study day
    bestDayStats,
    // 7. All-Time Longest focus session
    longestSession,
    // 8. All-Time Total focus minutes
    totalFocusMinutesData,
    // 9. All-Time Total activity count
    totalActivitiesCount,
    // 10. All-Time Average rating
    ratingAggregation,
    // 11. All-Time Longest logged activity
    longestActivity,
    // 12. All-Time Best rated activity
    bestRatingActivity,
  ] = await Promise.all([
    // Weekly Focus Sessions
    prisma.focusSession.findMany({
      where: { userId, completedAt: { gte: weekStart, lt: weekEnd } },
      select: { durationMin: true, areaId: true },
    }),

    // Weekly Activity Logs
    prisma.activityLog.findMany({
      where: { userId, date: { gte: weekStart, lt: weekEnd } },
      select: { durationMin: true, rating: true },
    }),

    // Weekly Tasks completed
    prisma.task.count({
      where: { userId, isCompleted: true, updatedAt: { gte: weekStart, lt: weekEnd } },
    }),

    // Areas
    prisma.area.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    }) as Promise<AreaInfo[]>,

    // Streak
    prisma.streak.findUnique({
      where: { userId },
      select: { longestStreak: true, currentStreak: true },
    }),

    // Best study day
    prisma.dailyStats.aggregate({
      where: { userId },
      _max: { totalMinutes: true },
    }),

    // Longest focus session
    prisma.focusSession.findFirst({
      where: { userId },
      orderBy: { durationMin: "desc" },
      select: { durationMin: true, completedAt: true },
    }),

    // Total focus minutes
    prisma.user.findUnique({
      where: { id: userId },
      select: { lifetimeFocusMinutes: true },
    }),

    // Total activity count
    prisma.activityLog.count({ where: { userId } }),

    // Average rating
    prisma.activityLog.aggregate({
      where: { userId, rating: { not: null } },
      _avg: { rating: true },
    }),

    // Longest logged activity
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

    // Best rated activity
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

  // Weekly stats compilation
  const weeklyStudyMinutes = focusSessionsThisWeek.reduce((s, f) => s + f.durationMin, 0);
  const weeklyActivitiesCount = activityLogsThisWeek.length;
  const weeklyActivityMinutes = activityLogsThisWeek.reduce((s, l) => s + (l.durationMin || 0), 0);
  
  const weeklyRatedLogs = activityLogsThisWeek.filter((log) => log.rating !== null);
  const weeklyAvgProductivity = weeklyRatedLogs.length > 0
    ? Math.round((weeklyRatedLogs.reduce((s, l) => s + (l.rating || 0), 0) / weeklyRatedLogs.length) * 10) / 10
    : 0;

  // Hours by area (weekly)
  const areaMinutesMap = new Map<string, number>();
  for (const s of focusSessionsThisWeek) {
    const key = s.areaId ?? "__none";
    areaMinutesMap.set(key, (areaMinutesMap.get(key) ?? 0) + s.durationMin);
  }

  const hoursByArea = areas.map((a) => ({
    ...a,
    hours: Math.round(((areaMinutesMap.get(a.id) ?? 0) / 60) * 10) / 10,
  }));

  const unassignedMinutes = areaMinutesMap.get("__none") ?? 0;
  if (unassignedMinutes > 0) {
    hoursByArea.push({
      id: "__none",
      name: "Unassigned",
      color: "#888",
      icon: null,
      hours: Math.round((unassignedMinutes / 60) * 10) / 10,
    });
  }

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

  const allTimeAvgRating = ratingAggregation._avg.rating
    ? Math.round(ratingAggregation._avg.rating * 10) / 10
    : 0;

  return (
    <ReviewClient
      // Weekly review data
      weekStart={weekStart.toISOString().slice(0, 10)}
      weekEnd={weekEnd.toISOString().slice(0, 10)}
      weeklyStudyHours={Math.round((weeklyStudyMinutes / 60) * 10) / 10}
      weeklyStudyMinutes={weeklyStudyMinutes}
      weeklySessions={focusSessionsThisWeek.length}
      hoursByArea={hoursByArea}
      weeklyActivities={weeklyActivitiesCount}
      weeklyAvgProductivity={weeklyAvgProductivity}
      weeklyActivityMinutes={weeklyActivityMinutes}
      tasksCompleted={tasksCompletedThisWeek}
      
      // All-time scoreboard data
      longestStreak={streak?.longestStreak ?? 0}
      currentStreak={streak?.currentStreak ?? 0}
      bestDayMinutes={bestDayStats._max.totalMinutes ?? 0}
      bestWeekMinutes={Math.round((bestWeekMinutes / 60) * 10) / 10}
      bestWeekLabel={bestWeekLabel}
      longestSessionMin={longestSession?.durationMin ?? 0}
      longestSessionDate={longestSession?.completedAt.toISOString().slice(0, 10) ?? null}
      totalFocusMinutes={totalFocusMinutesData?.lifetimeFocusMinutes ?? 0}
      totalActivities={totalActivitiesCount}
      allTimeAverageRating={allTimeAvgRating}
      longestActivity={longestActivity ? {
        durationMin: longestActivity.durationMin!,
        title: longestActivity.title,
        date: longestActivity.date.toISOString(),
        areaName: longestActivity.area?.name ?? 'No area',
        areaColor: longestActivity.area?.color ?? '#6366f1',
      } : null}
      bestRatingActivity={bestRatingActivity ? {
        rating: bestRatingActivity.rating!,
        title: bestRatingActivity.title,
        date: bestRatingActivity.date.toISOString(),
        areaName: bestRatingActivity.area?.name ?? 'No area',
        areaColor: bestRatingActivity.area?.color ?? '#6366f1',
      } : null}
    />
  );
}
