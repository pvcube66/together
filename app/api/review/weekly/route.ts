import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { getWeekStart } from "@/lib/periods";
import { limiters, enforce } from "@/lib/ratelimit";

export const GET = withApi(async () => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const userId = session.user.id;
  const now = new Date();

  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

  const [
    focusSessions,
    probCounts,
    runsAgg,
    checkins,
    tasksCompleted,
    areas,
  ] = await Promise.all([
    // Focus minutes by area this week
    prisma.focusSession.findMany({
      where: { userId, completedAt: { gte: weekStart, lt: weekEnd } },
      select: { durationMin: true, areaId: true, area: { select: { id: true, name: true, color: true, icon: true } } },
    }),

    // Problems solved this week by difficulty
    prisma.problemLog.groupBy({
      by: ["difficulty"],
      where: { userId, solvedAt: { gte: weekStart, lt: weekEnd } },
      _count: true,
    }),

    // Run stats for the week
    prisma.runLog.aggregate({
      where: { userId, runDate: { gte: weekStart, lt: weekEnd } },
      _count: true,
      _sum: { distanceKm: true, durationMin: true },
    }),

    // Check-ins for the week
    prisma.dailyCheckin.findMany({
      where: { userId, date: { gte: weekStart, lt: weekEnd } },
      select: { moodScore: true, energyScore: true, focusScore: true },
    }),

    // Tasks completed this week
    prisma.task.count({
      where: { userId, isCompleted: true, updatedAt: { gte: weekStart, lt: weekEnd } },
    }),

    // All user areas for display
    prisma.area.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    }),
  ]);

  // Hours by area
  const areaMinutesMap = new Map<string, number>();
  for (const s of focusSessions) {
    const key = s.areaId ?? "__none";
    areaMinutesMap.set(key, (areaMinutesMap.get(key) ?? 0) + s.durationMin);
  }

  const hoursByArea = areas.map((a) => ({
    id: a.id,
    name: a.name,
    color: a.color,
    icon: a.icon,
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

  // Problems by difficulty
  const problemsByDifficulty = {
    EASY: probCounts.find((p) => p.difficulty === "EASY")?._count ?? 0,
    MEDIUM: probCounts.find((p) => p.difficulty === "MEDIUM")?._count ?? 0,
    HARD: probCounts.find((p) => p.difficulty === "HARD")?._count ?? 0,
  };
  const totalProblems = problemsByDifficulty.EASY + problemsByDifficulty.MEDIUM + problemsByDifficulty.HARD;

  // Run stats
  const totalRuns = runsAgg._count;
  const totalDistance = Math.round((runsAgg._sum.distanceKm ?? 0) * 100) / 100;
  const totalDuration = runsAgg._sum.durationMin ?? 0;

  // Check-in averages
  const avgMood = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.moodScore, 0) / checkins.length * 10) / 10
    : 0;
  const avgEnergy = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.energyScore, 0) / checkins.length * 10) / 10
    : 0;
  const avgFocus = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.focusScore, 0) / checkins.length * 10) / 10
    : 0;

  // Weekly total study minutes
  const totalStudyMinutes = focusSessions.reduce((s, f) => s + f.durationMin, 0);

  return NextResponse.json({
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    totalStudyMinutes,
    totalSessions: focusSessions.length,
    hoursByArea,
    problemsByDifficulty,
    totalProblems,
    totalRuns,
    totalDistance,
    totalDuration,
    checkinDays: checkins.length,
    avgMood,
    avgEnergy,
    avgFocus,
    tasksCompleted,
  });
});

// — GET: weekly aggregates for focus sessions, problems, runs, check-ins, and tasks.
