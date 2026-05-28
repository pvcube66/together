import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import LogsClient from "./logs-client";

export default async function LogsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      notes: true,
      durationMin: true,
      rating: true,
      date: true,
      areaId: true,
      area: { select: { id: true, name: true, color: true, icon: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  // Calculate statistics
  const totalEntries = logs.length;

  const ratedLogs = logs.filter((l) => l.rating !== null);
  const averageRating = ratedLogs.length > 0
    ? Math.round((ratedLogs.reduce((s, l) => s + (l.rating || 0), 0) / ratedLogs.length) * 10) / 10
    : 0;

  const totalMinutes = logs.reduce((s, l) => s + (l.durationMin || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <LogsClient
      initialLogs={logs.map((log) => ({
        ...log,
        date: log.date.toISOString(),
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      }))}
      totalEntries={totalEntries}
      averageRating={averageRating}
      totalHours={totalHours}
    />
  );
}
