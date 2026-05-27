import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import CheckinsClient from "./checkins-client";

export default async function CheckinsPage() {
  const session = await requireSession();

  const [checkins, todayCheckin] = await Promise.all([
    prisma.dailyCheckin.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 60,
      select: {
        id: true, date: true, moodScore: true, energyScore: true, focusScore: true,
        sleepHours: true, wins: true, blockers: true, notes: true,
        areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.dailyCheckin.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: new Date(new Date().toISOString().slice(0, 10)),
        },
      },
      select: {
        id: true, moodScore: true, energyScore: true, focusScore: true,
        sleepHours: true, wins: true, blockers: true, notes: true,
        areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
  ]);

  const averages = checkins.length > 0
    ? {
        avgMood: Math.round(checkins.reduce((s, c) => s + c.moodScore, 0) / checkins.length * 10) / 10,
        avgEnergy: Math.round(checkins.reduce((s, c) => s + c.energyScore, 0) / checkins.length * 10) / 10,
        avgFocus: Math.round(checkins.reduce((s, c) => s + c.focusScore, 0) / checkins.length * 10) / 10,
      }
    : { avgMood: 0, avgEnergy: 0, avgFocus: 0 };

  return (
    <CheckinsClient
      initialCheckins={checkins.map((c) => ({
        ...c,
        date: c.date.toISOString(),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))}
      todayCheckin={todayCheckin ? {
        ...todayCheckin,
      } : null}
      averages={averages}
      totalDays={checkins.length}
    />
  );
}

// — Check-ins page: daily log of mood, energy, focus, sleep, wins & blockers.
