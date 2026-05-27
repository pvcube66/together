import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import RunsClient from "./runs-client";

export default async function RunsPage() {
  const session = await requireSession();

  const logs = await prisma.runLog.findMany({
    where: { userId: session.user.id },
    orderBy: { runDate: "desc" },
    take: 60,
    select: {
      id: true, distanceKm: true, durationMin: true, paceMinPerKm: true,
      runType: true, effort: true, routeName: true, notes: true, runDate: true,
      areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
      createdAt: true, updatedAt: true,
    },
  });

  const totalDistance = logs.reduce((s, l) => s + l.distanceKm, 0);
  const totalDuration = logs.reduce((s, l) => s + l.durationMin, 0);
  const runCount = logs.length;

  return (
    <RunsClient
      initialLogs={logs.map((l) => ({
        ...l,
        runDate: l.runDate.toISOString(),
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }))}
      totalDistance={Math.round(totalDistance * 100) / 100}
      totalDuration={totalDuration}
      runCount={runCount}
    />
  );
}

// — Runs page: log running sessions with distance, pace, effort.
