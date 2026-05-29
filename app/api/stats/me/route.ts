import { NextResponse } from "next/server";
import { requireApiSession, withApi } from "@/lib/api-session";
import { limiters, enforce } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";
import { readTodaySeconds } from "@/lib/study-live-session";
import {
  getStudyDayStart,
  getWeekStart,
  getMonthStart,
} from "@/lib/periods";

//returns lifetime, today/week/month totals, 7-day strip, last 10 sessions
export const GET = withApi(async () => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const userId = session.user.id;
  const now = new Date();

  const todayStart = getStudyDayStart(now);
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86_400_000);

  const nextDay = new Date(todayStart.getTime() + 86_400_000);
  const nextWeek = new Date(weekStart.getTime() + 7 * 86_400_000);
  const nextMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1,
    monthStart.getHours(),
    0,
    0,
    0,
  );
  let user: { lifetimeFocusMinutes: number; name: string | null; image: string | null } | null = null;
  let streak: { currentStreak: number; longestStreak: number; lastActiveDate: Date | null } | null = null;
  let todayFocusAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let todayActivityAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let weekFocusAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let weekActivityAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let monthFocusAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let monthActivityAgg: { _sum: { durationMin: number | null } } = { _sum: { durationMin: 0 } };
  let last7DaysRows: { date: Date; totalMinutes: number }[] = [];
  let recentSessions: {
    id: string;
    durationMin: number;
    completedAt: Date;
    room: { code: string; name: string } | null;
  }[] = [];

  try {
    [
      user,
      streak,
      todayFocusAgg,
      todayActivityAgg,
      weekFocusAgg,
      weekActivityAgg,
      monthFocusAgg,
      monthActivityAgg,
      last7DaysRows,
      recentSessions,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { lifetimeFocusMinutes: true, name: true, image: true },
      }),
      prisma.streak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId, completedAt: { gte: todayStart, lt: nextDay } },
        _sum: { durationMin: true },
      }),
      prisma.activityLog.aggregate({
        where: { userId, date: { gte: todayStart, lt: nextDay } },
        _sum: { durationMin: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId, completedAt: { gte: weekStart, lt: nextWeek } },
        _sum: { durationMin: true },
      }),
      prisma.activityLog.aggregate({
        where: { userId, date: { gte: weekStart, lt: nextWeek } },
        _sum: { durationMin: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId, completedAt: { gte: monthStart, lt: nextMonth } },
        _sum: { durationMin: true },
      }),
      prisma.activityLog.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonth } },
        _sum: { durationMin: true },
      }),
      // Daily totals for the last-7-days strip — use focusSession + activityLog
      (async () => {
        const focusRows = await prisma.focusSession.findMany({
          where: { userId, completedAt: { gte: sevenDaysAgo, lte: todayStart } },
          select: { durationMin: true, completedAt: true },
        });
        const activityRows = await prisma.activityLog.findMany({
          where: { userId, date: { gte: sevenDaysAgo, lte: todayStart } },
          select: { durationMin: true, date: true },
        });
        const dayMap = new Map<string, number>();
        for (const f of focusRows) {
          const key = f.completedAt.toISOString().slice(0, 10);
          dayMap.set(key, (dayMap.get(key) ?? 0) + f.durationMin);
        }
        for (const a of activityRows) {
          const key = a.date.toISOString().slice(0, 10);
          dayMap.set(key, (dayMap.get(key) ?? 0) + (a.durationMin ?? 0));
        }
        return Array.from(dayMap.entries()).map(([iso, totalMinutes]) => ({
          date: new Date(iso + 'T00:00:00.000Z'),
          totalMinutes,
        }));
      })(),
      prisma.focusSession.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 10,
        select: {
          id: true,
          durationMin: true,
          completedAt: true,
          room: { select: { code: true, name: true } },
        },
      }),
    ]);
  } catch (err) {
    console.warn("[stats/me] failed to load aggregates; returning safe defaults", err);
  }

  // Fill in zero-minute days for the last-7-days strip
  const last7Days: { date: string; totalMinutes: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const row = last7DaysRows.find((r) => r.date.toISOString().slice(0, 10) === iso);
    last7Days.push({ date: iso, totalMinutes: row?.totalMinutes ?? 0 });
  }

  const todaySeconds = await readTodaySeconds(userId);

  const today = (todayFocusAgg._sum.durationMin ?? 0) + (todayActivityAgg._sum.durationMin ?? 0);
  const thisWeek = (weekFocusAgg._sum.durationMin ?? 0) + (weekActivityAgg._sum.durationMin ?? 0);
  const thisMonth = (monthFocusAgg._sum.durationMin ?? 0) + (monthActivityAgg._sum.durationMin ?? 0);

  return NextResponse.json({
    name: user?.name ?? null,
    image: user?.image ?? null,
    lifetimeFocusMinutes: user?.lifetimeFocusMinutes ?? 0,
    streak: streak
      ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: streak.lastActiveDate?.toISOString() ?? null,
        }
      : { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
    today,
    todaySeconds,
    thisWeek,
    thisMonth,
    last7Days,
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      durationMin: s.durationMin,
      completedAt: s.completedAt.toISOString(),
      roomCode: s.room?.code ?? null,
      roomName: s.room?.name ?? null,
    })),
  });
});

// — GET: aggregates (focus minutes, streak) for dashboard.
