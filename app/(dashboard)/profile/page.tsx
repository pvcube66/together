import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { getStudyDayStart, getWeekStart, getMonthStart } from '@/lib/periods';
import SessionsLoadMore from '@/components/sessions-load-more';
import FriendsPanel, {
  type FriendItem,
} from '@/components/profile/friends-panel';
import ProfileHeaderEditor from '@/components/profile/profile-header-editor';
import { ProfileStats } from '@/components/profile/profile-stats-client';
import {
  formatMinutesClock,
  formatMinutesCompact,
} from '@/lib/study-time-format';

function formatMin(min: number): string {
  return formatMinutesCompact(min);
}

export default async function ProfilePage() {
  const session = await requireSession();
  const userId = session.user.id;
  const now = new Date();

  const todayStart = getStudyDayStart(now);
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86_400_000);
  const thirtyFiveDaysAgo = new Date(todayStart.getTime() - 34 * 86_400_000);

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

  let user: {
    name: string | null;
    image: string | null;
    email: string | null;
    lifetimeFocusMinutes: number;
    createdAt: Date;
  } | null = null;
  let streakRow: { currentStreak: number; longestStreak: number } | null = null;
  let todayAgg: { _sum: { totalMinutes: number | null } } = {
    _sum: { totalMinutes: 0 },
  };
  let weekAgg: { _sum: { totalMinutes: number | null } } = {
    _sum: { totalMinutes: 0 },
  };
  let monthAgg: { _sum: { totalMinutes: number | null } } = {
    _sum: { totalMinutes: 0 },
  };
  let last7DaysRows: { date: Date; totalMinutes: number }[] = [];
  let last35DaysRows: { date: Date; totalMinutes: number }[] = [];
  let recentSessions: {
    id: string;
    durationMin: number;
    completedAt: Date;
    room: { code: string; name: string } | null;
  }[] = [];
  let relatedRoomMemberships: {
    room: { members: { user: { id: string; name: string | null } }[] };
  }[] = [];
  let pingRows: {
    createdAt: Date;
    fromUserId: string;
    toUserId: string;
    fromUser: {
      id: string;
      name: string | null;
      image: string | null;
      email: string | null;
    };
    toUser: {
      id: string;
      name: string | null;
      image: string | null;
      email: string | null;
    };
  }[] = [];

  try {
    [
      user,
      streakRow,
      todayAgg,
      weekAgg,
      monthAgg,
      last7DaysRows,
      last35DaysRows,
      recentSessions,
      relatedRoomMemberships,
      pingRows,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          image: true,
          email: true,
          lifetimeFocusMinutes: true,
          createdAt: true,
        },
      }),
      prisma.streak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true },
      }),
      prisma.dailyStats.aggregate({
        where: { userId, date: { gte: todayStart, lt: nextDay } },
        _sum: { totalMinutes: true },
      }),
      prisma.dailyStats.aggregate({
        where: { userId, date: { gte: weekStart, lt: nextWeek } },
        _sum: { totalMinutes: true },
      }),
      prisma.dailyStats.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonth } },
        _sum: { totalMinutes: true },
      }),
      prisma.dailyStats.findMany({
        where: { userId, date: { gte: sevenDaysAgo, lte: todayStart } },
        orderBy: { date: 'asc' },
        select: { date: true, totalMinutes: true },
      }),
      prisma.dailyStats.findMany({
        where: { userId, date: { gte: thirtyFiveDaysAgo, lte: todayStart } },
        orderBy: { date: 'asc' },
        select: { date: true, totalMinutes: true },
      }),
      prisma.focusSession.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          durationMin: true,
          completedAt: true,
          room: { select: { code: true, name: true } },
        },
      }),
      prisma.roomMember.findMany({
        where: { userId },
        select: {
          room: {
            select: {
              members: {
                select: { user: { select: { id: true, name: true } } },
              },
            },
          },
        },
        take: 8,
      }),
      prisma.ping.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          createdAt: true,
          fromUserId: true,
          toUserId: true,
          fromUser: {
            select: { id: true, name: true, image: true, email: true },
          },
          toUser: {
            select: { id: true, name: true, image: true, email: true },
          },
        },
      }),
    ]);
  } catch (err) {
    console.warn(
      '[profile] failed to load profile aggregates; rendering fallbacks',
      err,
    );
  }

  // Build a 7-slot strip with zero-fill for missing days
  const last7Days: { date: string; totalMinutes: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const row = last7DaysRows.find(
      (r) => r.date.toISOString().slice(0, 10) === iso,
    );
    last7Days.push({ date: iso, totalMinutes: row?.totalMinutes ?? 0 });
  }

  const maxMin = Math.max(...last7Days.map((d) => d.totalMinutes), 1);

  const today = todayAgg._sum.totalMinutes ?? 0;
  const thisWeek = weekAgg._sum.totalMinutes ?? 0;
  const thisMonth = monthAgg._sum.totalMinutes ?? 0;
  const lifetime = user?.lifetimeFocusMinutes ?? 0;

  const STATS = [
    { label: 'Today', value: formatMin(today) },
    { label: 'This Week', value: formatMin(thisWeek) },
    { label: 'This Month', value: formatMin(thisMonth) },
    { label: 'Lifetime', value: formatMin(lifetime) },
    { label: 'Current Streak', value: `${streakRow?.currentStreak ?? 0}d` },
    { label: 'Longest Streak', value: `${streakRow?.longestStreak ?? 0}d` },
  ];

  const collaboratorCandidates = relatedRoomMemberships.flatMap((membership) =>
    membership.room.members
      .map((member) => member.user)
      .filter((member) => member.id !== userId && member.name),
  );
  const collaboratorsMap = new Map<string, string>();
  for (const collaborator of collaboratorCandidates) {
    if (!collaboratorsMap.has(collaborator.id)) {
      collaboratorsMap.set(collaborator.id, collaborator.name as string);
    }
  }
  const collaborators = Array.from(collaboratorsMap.values()).slice(0, 4);
  const friendsMap = new Map<string, FriendItem>();
  for (const row of pingRows) {
    const other = row.fromUserId === userId ? row.toUser : row.fromUser;
    if (!other || friendsMap.has(other.id)) continue;
    friendsMap.set(other.id, {
      id: other.id,
      name: other.name ?? 'Unknown',
      email: other.email ?? '',
      image: other.image ?? null,
      connectedAt: row.createdAt.toISOString(),
    });
  }
  const initialFriends = Array.from(friendsMap.values()).slice(0, 8);

  const last35Map = new Map(
    last35DaysRows.map((row) => [
      row.date.toISOString().slice(0, 10),
      row.totalMinutes,
    ]),
  );
  const heatmap = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(thirtyFiveDaysAgo.getTime() + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    return last35Map.get(iso) ?? 0;
  });
  const heatmapMax = Math.max(1, ...heatmap);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-5 pt-2">
        {/* ── Header tile ── */}
        <ProfileHeaderEditor
          initialName={user?.name ?? 'Unknown'}
          initialEmail={user?.email ?? ''}
          initialImage={user?.image ?? null}
          joinedLabel={new Date(user?.createdAt ?? now).toLocaleDateString()}
        />

        {/* ── User stats with animated counters + heatmap ── */}
        <ProfileStats
          today={today}
          thisWeek={thisWeek}
          thisMonth={thisMonth}
          lifetime={lifetime}
          currentStreak={streakRow?.currentStreak ?? 0}
          longestStreak={streakRow?.longestStreak ?? 0}
          heatmap={heatmap}
          heatmapMax={heatmapMax}
          thirtyFiveDaysAgo={thirtyFiveDaysAgo}
          last7Days={last7Days}
          maxMin={maxMin}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <FriendsPanel
            initialFriends={initialFriends}
            fallbackNames={collaborators}
          />
          <div />
        </div>

        {/* ── Recent sessions ── */}
        <div
          className="bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] rounded-2xl border border-border/50 p-5
            shadow-[var(--panel-shadow-inner)]"
        >
          <p className="mb-4 text-[12px] font-semibold text-foreground">
            Recent sessions
          </p>
          <SessionsLoadMore
            initialItems={recentSessions.map((s) => ({
              id: s.id,
              durationMin: s.durationMin,
              completedAt: s.completedAt.toISOString(),
              roomCode: s.room?.code ?? null,
              roomName: s.room?.name ?? null,
            }))}
            initialNextCursor={
              recentSessions.length >= 20
                ? (recentSessions[recentSessions.length - 1]?.id ?? null)
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

// — Profile page: header editor, friends, stats.
