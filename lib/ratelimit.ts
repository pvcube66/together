import { redis } from "./redis";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<void>;
};

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h)$/);
  if (!match) throw new Error(`Invalid window: ${window}`);
  const num = parseInt(match[1]!, 10);
  const unit = match[2]!;
  if (unit === "s") return num * 1000;
  if (unit === "m") return num * 60 * 1000;
  return num * 60 * 60 * 1000;
}

const noop: { limit: (key: string) => Promise<LimitResult> } = {
  limit: async () => ({
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
    pending: Promise.resolve(),
  }),
};

function make(window: string, max: number): { limit: (key: string) => Promise<LimitResult> } {
  const client = redis;
  if (!client) return noop;
  const windowMs = parseWindow(window);

  return {
    limit: async (key: string): Promise<LimitResult> => {
      const now = Date.now();
      const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
      try {
        const count = await client.incrby(windowKey, 1);
        if (count === 1) {
          await client.expire(windowKey, Math.ceil(windowMs / 1000));
        }
        const remaining = Math.max(0, max - count);
        const reset = Math.ceil((Math.floor(now / windowMs) + 1) * windowMs / 1000);
        return {
          success: count <= max,
          limit: max,
          remaining,
          reset,
          pending: Promise.resolve(),
        };
      } catch {
        return { success: true, limit: max, remaining: 1, reset: 0, pending: Promise.resolve() };
      }
    },
  };
}

export const limiters = {
  studyTimer: make("1 m", 45),
  roomsCreate: make("1 h", 10),
  roomsJoin: make("1 m", 30),
  roomsList: make("1 m", 60),
  roomsRead: make("1 m", 120),
  leaderboardRead: make("1 m", 120),
  statsRead: make("1 m", 60),
  tasksWrite: make("1 m", 30),
  profileWrite: make("1 m", 10),
  libraryWrite: make("1 m", 60),
  settingsWrite: make("1 m", 30),
  membersRead: make("1 m", 60),
  sessionsRead: make("1 m", 60),
  messagesRead: make("1 m", 60),
};

export async function enforce(
  limiter: { limit: (key: string) => Promise<LimitResult> },
  key: string,
): Promise<Record<string, string>> {
  const result = await limiter.limit(key);
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.reset),
  };
  if (!result.success) {
    const { ApiRateLimitError } = await import("./api-session");
    throw new ApiRateLimitError();
  }
  return headers;
}

// — ratelimit.ts: Fixed-window rate limiter via ioredis; fails open when Redis absent.
