import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import ProblemsClient from "./problems-client";

export default async function ProblemsPage() {
  const session = await requireSession();

  const [logs, stats] = await Promise.all([
    prisma.problemLog.findMany({
      where: { userId: session.user.id },
      orderBy: [{ solvedAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        platform: true,
        problemTitle: true,
        problemUrl: true,
        difficulty: true,
        topic: true,
        timeTakenMinutes: true,
        hintsUsed: true,
        notes: true,
        solvedAt: true,
        areaId: true,
        area: { select: { id: true, name: true, color: true, icon: true } },
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.problemLog.groupBy({
      by: ["difficulty"],
      where: { userId: session.user.id },
      _count: { id: true },
    }),
  ]);

  const statsMap = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  };
  for (const row of stats) {
    statsMap[row.difficulty] = row._count.id;
  }

  return (
    <ProblemsClient
      initialLogs={logs.map((log) => ({
        ...log,
        solvedAt: log.solvedAt.toISOString(),
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      }))}
      totalEasy={statsMap.EASY}
      totalMedium={statsMap.MEDIUM}
      totalHard={statsMap.HARD}
    />
  );
}

// — Problems page: tracks DSA/competitive programming problems solved.
