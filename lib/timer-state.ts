import { getDailyKey } from "@/lib/periods";

export type TimerState = {
  active: boolean;
  paused: boolean;
  startedAt: string | null;
  todaySeconds: number;
  todayMinutes: number;
  dayKey: string;
  redisAvailable: boolean;
};

export function buildTimerState(params: {
  active: boolean;
  paused?: boolean;
  startedAt: string | null;
  todaySeconds: number;
  todayMinutes?: number;
  redisAvailable?: boolean;
  now?: Date;
}): TimerState {
  const now = params.now ?? new Date();
  return {
    active: params.active,
    paused: params.paused ?? false,
    startedAt: params.startedAt,
    todaySeconds: Math.max(0, Math.floor(params.todaySeconds)),
    todayMinutes: Math.max(0, Math.floor(params.todayMinutes ?? 0)),
    dayKey: getDailyKey(now),
    redisAvailable: params.redisAvailable !== false,
  };
}

