'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useStudyTimer } from '@/components/study-timer-provider';
import { connectWithAuth } from '@/lib/socket';
import { mergeSelfStudyTimer, TIMER_POLL_INTERVAL_MS } from '@/lib/timer-sync';
import { SPRING_DRAG_RELEASE, SPRING_HOVER } from '@/lib/ui-motion';
import ProfileModal, { type ProfileModalUser } from './profile-modal';
import RoomLeaderboardCarousel, {
  type RoomTimerBoard,
} from './room-leaderboard-carousel';
import { useDashboardRoomVideo } from './use-dashboard-room-video';

const LB_OUTER = 22;
const LB_GAP = 14;
const LB_INNER = LB_OUTER - LB_GAP;
const LB_SHADOW = [
  '0 1px 3px rgba(22,25,37,0.05)',
  '0 12px 34px rgba(115,85,62,0.07)',
  'inset 0 1px 0 rgba(255,255,255,0.38)',
].join(',');

const RANK_COLORS: Record<number, string> = {
  1: 'oklch(0.65 0.12 55)',
  2: 'oklch(0.62 0.04 200)',
  3: 'oklch(0.60 0.09 45)',
};

function pseudoRankFromMinutes(minutes: number): number {
  if (minutes >= 100) return 1;
  if (minutes >= 80) return 2;
  return 3;
}

function toProfileUser(u: RoomTimerBoard['members'][number]): ProfileModalUser {
  const pseudoRank = pseudoRankFromMinutes(u.todayMinutes);
  return {
    id: u.id,
    name: u.name,
    initials: u.initials,
    rank: pseudoRank,
    hours: u.todayMinutes / 60,
    accentColor: RANK_COLORS[pseudoRank] ?? 'oklch(0.62 0.06 75)',
  };
}

export default function Leaderboard({
  boards: initialBoards,
  currentUserId,
}: {
  boards: RoomTimerBoard[];
  currentUserId: string;
}) {
  const allowPanelDrag = useMediaQuery('(min-width: 1024px)');
  const { active, startedAtMs, todaySeconds } = useStudyTimer();
  const [boards, setBoards] = useState(initialBoards);
  const [selected, setSelected] = useState<ProfileModalUser | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(
    initialBoards[0]?.id ?? null,
  );
  const [activeVideoEnabledUserIds, setActiveVideoEnabledUserIds] = useState<
    string[]
  >([]);

  const displayBoards = useMemo(
    () =>
      mergeSelfStudyTimer(boards, currentUserId, {
        active,
        startedAtMs,
        todaySeconds,
      }),
    [boards, currentUserId, active, startedAtMs, todaySeconds],
  );

  const activeBoard =
    displayBoards.find((board) => board.id === activeBoardId) ??
    displayBoards[0] ??
    null;
  const { streamForMember, hasVideoForMember } = useDashboardRoomVideo({
    roomId: activeBoard?.id ?? null,
    videoEnabledUserIds: activeVideoEnabledUserIds,
    currentUserId,
  });

  useEffect(() => {
    setBoards(initialBoards);
  }, [initialBoards]);

  useEffect(() => {
    if (displayBoards.length === 0) {
      setActiveBoardId(null);
      return;
    }
    if (
      !activeBoardId ||
      !displayBoards.some((board) => board.id === activeBoardId)
    ) {
      setActiveBoardId(displayBoards[0].id);
    }
  }, [activeBoardId, displayBoards]);

  useEffect(() => {
    setActiveVideoEnabledUserIds([]);
  }, [activeBoardId]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let inFlight = false;
    let queued = false;

    async function pull() {
      if (inFlight) {
        queued = true;
        return;
      }
      inFlight = true;
      try {
        const res = await fetch('/api/room-boards?mode=dashboard', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { boards?: RoomTimerBoard[] };
        if (data.boards) setBoards(data.boards);
      } catch {
        /* ignore */
      } finally {
        inFlight = false;
        if (!cancelled && queued) {
          queued = false;
          void pull();
        }
      }
    }

    function clearPoll() {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    }

    function startPollIfVisible() {
      clearPoll();
      if (
        typeof document === 'undefined' ||
        document.visibilityState !== 'visible'
      )
        return;
      intervalId = setInterval(() => void pull(), TIMER_POLL_INTERVAL_MS);
    }

    const onStats = () => void pull();
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void pull();
        startPollIfVisible();
      } else {
        clearPoll();
      }
    };

    startPollIfVisible();
    window.addEventListener('study-stats-changed', onStats);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearPoll();
      window.removeEventListener('study-stats-changed', onStats);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!activeBoardId) return;

    let socket: any = null;
    const onPresence = (payload: {
      roomId: string;
      memberIds: string[];
      studyingUserIds: string[];
      videoEnabledUserIds: string[];
      todayMinutes: Record<string, number>;
      todaySeconds: Record<string, number>;
      sessionStartedAt: Record<string, string | null>;
    }) => {
      if (payload.roomId !== activeBoardId) return;
      setActiveVideoEnabledUserIds(payload.videoEnabledUserIds);
    };

    connectWithAuth().then((s) => {
      socket = s;
      if (!socket) return;
      socket.on('presence', onPresence);
      if (socket.connected) {
        socket.emit('presence:refresh');
      }
    });

    return () => {
      if (socket) {
        socket.off('presence', onPresence);
      }
    };
  }, [activeBoardId]);

  const openProfile = useCallback((u: RoomTimerBoard['members'][number]) => {
    setSelected(toProfileUser(u));
  }, []);

  const onProfileExited = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-[100vw] items-stretch justify-start pl-0.5 pr-0 pt-1 pb-2">
        <motion.div
          className={
            (allowPanelDrag ? 'app-cursor-drag ' : '') +
            'relative h-full min-h-0 w-full min-w-0 max-w-full rounded-2xl border border-border/40 bg-card p-4 shadow-ambient-md transition-shadow'
          }
          whileHover={allowPanelDrag ? { y: -2 } : undefined}
          drag={allowPanelDrag}
          dragConstraints={
            allowPanelDrag ? { top: -6, left: -6, right: 6, bottom: 6 } : false
          }
          dragElastic={allowPanelDrag ? 0.08 : 0}
          dragTransition={allowPanelDrag ? SPRING_DRAG_RELEASE : undefined}
          transition={SPRING_HOVER}
        >
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1 px-0.5 py-0.5">
              {displayBoards.length > 0 ? (
                <RoomLeaderboardCarousel
                  boards={displayBoards}
                  compact
                  currentUserId={currentUserId}
                  onMemberClick={openProfile}
                  onBoardChange={(board) => setActiveBoardId(board.id)}
                  streamForMember={streamForMember}
                  hasVideoForMember={hasVideoForMember}
                />
              ) : (
                <div className="app-empty-atmosphere mx-1.5 mb-1.5 mt-1 flex h-full min-h-[7.5rem] items-center justify-center rounded-[14px] px-4">
                  <p className="max-w-[13rem] text-balance text-center text-[10px] leading-relaxed text-muted-foreground">
                    Join a room to view room leaderboard activity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {selected && (
        <ProfileModal
          key={selected.id}
          user={selected}
          onExited={onProfileExited}
          viewerIsHost={false}
        />
      )}
    </>
  );
}

// — Dashboard leaderboard strip / card list.
