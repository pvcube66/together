export type TimerPayload = {
  active?: boolean;
  paused?: boolean;
  startedAt?: string | null;
  todaySeconds?: number;
  todayMinutes?: number;
  dayKey?: string | null;
  redisAvailable?: boolean;
};

export type NormalizedTimerClientState = {
  active: boolean;
  paused: boolean;
  startedAtMs: number | null;
  todaySeconds: number;
  todayMinutes: number;
  dayKey: string | null;
  redisAvailable: boolean;
};

function parseStartedAtMs(startedAt: string | null | undefined): number | null {
  if (!startedAt) return null;
  const parsed = Date.parse(startedAt);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTodaySeconds(value: unknown): number {
  return Math.max(0, Math.floor(Number(value ?? 0)));
}

export function normalizeTimerPayload(
  payload: TimerPayload | null | undefined,
): NormalizedTimerClientState {
  return {
    active: Boolean(payload?.active),
    paused: Boolean(payload?.paused),
    startedAtMs: parseStartedAtMs(payload?.startedAt ?? null),
    todaySeconds: normalizeTodaySeconds(payload?.todaySeconds),
    todayMinutes: normalizeTodaySeconds(payload?.todayMinutes),
    dayKey: payload?.dayKey ?? null,
    redisAvailable: payload?.redisAvailable !== false,
  };
}

export function reconcileTodaySeconds(params: {
  previousDayKey: string | null;
  previousTodaySeconds: number;
  incomingDayKey: string | null;
  incomingTodaySeconds: number;
}): number {
  const prev = normalizeTodaySeconds(params.previousTodaySeconds);
  const incoming = normalizeTodaySeconds(params.incomingTodaySeconds);
  if (
    params.previousDayKey &&
    params.incomingDayKey &&
    params.previousDayKey === params.incomingDayKey
  ) {
    return Math.max(prev, incoming);
  }
  return incoming;
}
