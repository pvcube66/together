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
    activityLogs,
    tasksCompleted,
    areas,
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

    // Weekly Completed Tasks
    prisma.task.count({
      where: { userId, isCompleted: true, updatedAt: { gte: weekStart, lt: weekEnd } },
    }),

    // All user areas
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

  const totalStudyMinutes = focusSessions.reduce((s, f) => s + f.durationMin, 0);
  const totalActivities = activityLogs.length;

  const ratedLogs = activityLogs.filter((log) => log.rating !== null);
  const avgProductivity = ratedLogs.length > 0
    ? Math.round((ratedLogs.reduce((s, l) => s + (l.rating || 0), 0) / ratedLogs.length) * 10) / 10
    : 0;

  const totalActivityMinutes = activityLogs.reduce((s, l) => s + (l.durationMin || 0), 0);

  return NextResponse.json({
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    totalStudyMinutes,
    totalSessions: focusSessions.length,
    hoursByArea,
    totalActivities,
    avgProductivity,
    totalActivityMinutes,
    tasksCompleted,
  });
});
