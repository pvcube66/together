import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/periods";
import ReviewClient from "./review-client";

type AreaInfo = { id: string; name: string; color: string; icon: string | null };

export default async function ReviewPage() {
  const session = await requireSession();
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
    prisma.focusSession.findMany({
      where: { userId, completedAt: { gte: weekStart, lt: weekEnd } },
      select: { durationMin: true, areaId: true },
    }),
    prisma.problemLog.groupBy({
      by: ["difficulty"],
      where: { userId, solvedAt: { gte: weekStart, lt: weekEnd } },
      _count: true,
    }),
    prisma.runLog.aggregate({
      where: { userId, runDate: { gte: weekStart, lt: weekEnd } },
      _count: true,
      _sum: { distanceKm: true, durationMin: true },
    }),
    prisma.dailyCheckin.findMany({
      where: { userId, date: { gte: weekStart, lt: weekEnd } },
      select: { moodScore: true, energyScore: true, focusScore: true },
    }),
    prisma.task.count({
      where: { userId, isCompleted: true, updatedAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.area.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    }) as Promise<AreaInfo[]>,
  ]);

  // Hours by area
  const areaMinutesMap = new Map<string, number>();
  for (const s of focusSessions) {
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

  const problemsByDifficulty = {
    EASY: probCounts.find((p) => p.difficulty === "EASY")?._count ?? 0,
    MEDIUM: probCounts.find((p) => p.difficulty === "MEDIUM")?._count ?? 0,
    HARD: probCounts.find((p) => p.difficulty === "HARD")?._count ?? 0,
  };
  const totalProblems = problemsByDifficulty.EASY + problemsByDifficulty.MEDIUM + problemsByDifficulty.HARD;

  const totalStudyMinutes = focusSessions.reduce((s, f) => s + f.durationMin, 0);
  const avgMood = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.moodScore, 0) / checkins.length * 10) / 10
    : 0;
  const avgEnergy = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.energyScore, 0) / checkins.length * 10) / 10
    : 0;
  const avgFocus = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + c.focusScore, 0) / checkins.length * 10) / 10
    : 0;

  return (
    <ReviewClient
      weekStart={weekStart.toISOString().slice(0, 10)}
      weekEnd={weekEnd.toISOString().slice(0, 10)}
      totalStudyHours={Math.round((totalStudyMinutes / 60) * 10) / 10}
      totalStudyMinutes={totalStudyMinutes}
      totalSessions={focusSessions.length}
      hoursByArea={hoursByArea}
      problemsByDifficulty={problemsByDifficulty}
      totalProblems={totalProblems}
      totalRuns={runsAgg._count}
      totalDistance={Math.round((runsAgg._sum.distanceKm ?? 0) * 100) / 100}
      totalDuration={runsAgg._sum.durationMin ?? 0}
      checkinDays={checkins.length}
      avgMood={avgMood}
      avgEnergy={avgEnergy}
      avgFocus={avgFocus}
      tasksCompleted={tasksCompleted}
    />
  );
}

// — Weekly Review page: aggregates all data sources for the current week.
