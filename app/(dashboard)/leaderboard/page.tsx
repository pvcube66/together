import {
  getGlobalDailyLeaderboardTop100Cached,
  getUserRankAndScore,
  rankFromLeaderboardEntries,
} from "@/lib/leaderboard";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import LeaderboardClient from "./leaderboard-client";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  let initialEntries: Awaited<ReturnType<typeof getGlobalDailyLeaderboardTop100Cached>> = [];
  let session: Awaited<ReturnType<typeof getServerSession>> = null;

  try {
    [session, initialEntries] = await Promise.all([
      getServerSession(),
      getGlobalDailyLeaderboardTop100Cached(),
    ]);
  } catch {
    // If DB/Redis is unreachable, render with empty data
  }

  let initialMe: { rank: number; totalMinutes: number } | null = null;
  let rooms: { id: string; name: string }[] = [];
  let currentUserName: string | null = session?.user.name ?? null;
  let currentUserImage: string | null = session?.user.image ?? null;
  if (session) {
    const fromList = rankFromLeaderboardEntries(initialEntries, session.user.id);
    try {
      const [meFallback, memberships, latestUser] = await Promise.all([
        fromList ? Promise.resolve(null) : getUserRankAndScore("daily", session.user.id),
        prisma.roomMember.findMany({
          where: { userId: session.user.id },
          orderBy: { joinedAt: "desc" },
          select: { room: { select: { id: true, name: true } } },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, image: true },
        }),
      ]);
      initialMe = fromList ?? meFallback;
      rooms = memberships.map((m) => m.room);
      currentUserName = latestUser?.name ?? currentUserName;
      currentUserImage = latestUser?.image ?? currentUserImage;
    } catch {
      // Gracefully degrade if DB queries fail
    }
  }

  return (
    <LeaderboardClient
      initialEntries={initialEntries}
      initialMe={initialMe}
      currentUserId={session?.user.id ?? null}
      currentUserName={currentUserName}
      currentUserImage={currentUserImage}
      rooms={rooms}
    />
  );
}
