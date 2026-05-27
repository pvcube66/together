import { redis } from "./redis.js";

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h)$/);
  if (!match) throw new Error(`Invalid window: ${window}`);
  const num = parseInt(match[1]!, 10);
  const unit = match[2]!;
  if (unit === "s") return num * 1000;
  if (unit === "m") return num * 60 * 1000;
  return num * 60 * 60 * 1000;
}

function make(window: string, max: number): { limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number; pending: Promise<void> }> } {
  const windowMs = parseWindow(window);

  return {
    limit: async (key: string) => {
      const now = Date.now();
      const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
      try {
        const count = await redis.incrby(windowKey, 1);
        if (count === 1) {
          await redis.expire(windowKey, Math.ceil(windowMs / 1000));
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

export const socketLimiters = {
  chatSend: make("10 s", 20),
  pingSend: make("60 s", 10),
  roomJoin: make("60 s", 30),
  sessionStarted: make("60 s", 6),
  presenceRefresh: make("10 s", 30),
};

export async function socketAllow(
  limiter: { limit: (key: string) => Promise<{ success: boolean }> },
  key: string,
): Promise<boolean> {
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return true;
  }
}

// — ratelimit.ts: Fixed-window rate limiter via ioredis for socket events; socketAllow fails open.
