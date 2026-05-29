// — Leaderboard page: feature commented out.
// Original code:
// import { getGlobalDailyLeaderboardTop100Cached, getUserRankAndScore, rankFromLeaderboardEntries } from "@/lib/leaderboard";
// import { getServerSession } from "@/lib/session";
// import { prisma } from "@/lib/db";
// import LeaderboardClient from "./leaderboard-client";
// 
// export const dynamic = "force-dynamic";
// 
// export default async function LeaderboardPage() {
//   let initialEntries = [];
//   let session = null;
//   try {
//     [session, initialEntries] = await Promise.all([
//       getServerSession(),
//       getGlobalDailyLeaderboardTop100Cached(),
//     ]);
//   } catch {}
//   let initialMe = null;
//   let rooms = [];
//   let currentUserName = session?.user.name ?? null;
//   let currentUserImage = session?.user.image ?? null;
//   if (session) {
//     const fromList = rankFromLeaderboardEntries(initialEntries, session.user.id);
//     try {
//       const [meFallback, memberships, latestUser] = await Promise.all([
//         fromList ? Promise.resolve(null) : getUserRankAndScore("daily", session.user.id),
//         prisma.roomMember.findMany({ where: { userId: session.user.id }, ... }),
//         prisma.user.findUnique({ where: { id: session.user.id }, ... }),
//       ]);
//       initialMe = fromList ?? meFallback;
//       rooms = memberships.map((m) => m.room);
//       currentUserName = latestUser?.name ?? currentUserName;
//       currentUserImage = latestUser?.image ?? currentUserImage;
//     } catch {}
//   }
//   return <LeaderboardClient initialEntries={initialEntries} initialMe={initialMe} ... />;
// }

export default function LeaderboardPage() {
  return null;
}
