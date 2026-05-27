import { Redis as IORedis } from "ioredis";

const url = process.env.REDIS_URL;

if (!url) {
  console.warn(
    "[redis] REDIS_URL not set — " +
      "rate limiting and session cache will fall back to in-memory.",
  );
}

class UpstashCompat {
  private r: IORedis;
  private isConnected = false;

  constructor(connectionString: string) {
    this.r = new IORedis(connectionString, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500, // Fail fast on slow connections
      retryStrategy() {
        return null; // Stop retrying immediately to avoid serverless execution timeout
      },
      lazyConnect: true,
    });

    this.r.on("error", (err) => {
      console.warn("[redis] ioredis connection error caught:", err.message || err);
      this.isConnected = false;
    });

    this.r.on("connect", () => {
      this.isConnected = true;
    });

    this.r.on("end", () => {
      this.isConnected = false;
    });

    this.r.connect().catch((err) => {
      console.warn("[redis] connection request failed:", err.message || err);
      this.isConnected = false;
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const val = await this.r.get(key);
      if (val === null) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    } catch (err) {
      console.error("[redis] get failed:", err);
      return null;
    }
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<"OK" | null> {
    if (!this.isConnected) return null;
    try {
      if (opts?.ex) {
        return (await this.r.set(key, JSON.stringify(value), "EX", opts.ex)) as "OK";
      }
      return (await this.r.set(key, JSON.stringify(value))) as "OK";
    } catch (err) {
      console.error("[redis] set failed:", err);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.del(key);
    } catch (err) {
      console.error("[redis] del failed:", err);
      return 0;
    }
  }

  async getdel<T = unknown>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const val = await this.r.getdel(key);
      if (val === null) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    } catch (err) {
      console.error("[redis] getdel failed:", err);
      return null;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.incrby(key, increment);
    } catch (err) {
      console.error("[redis] incrby failed:", err);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.expire(key, seconds);
    } catch (err) {
      console.error("[redis] expire failed:", err);
      return 0;
    }
  }

  async ping(): Promise<string> {
    if (!this.isConnected) return "PONG_FALLBACK";
    try {
      return await this.r.ping();
    } catch (err) {
      console.error("[redis] ping failed:", err);
      return "PONG_FALLBACK";
    }
  }

  pipeline() {
    if (!this.isConnected) {
      return {
        del: () => {},
        zadd: () => {},
        rename: () => {},
        expire: () => {},
        exec: async () => [],
      };
    }
    const p = this.r.pipeline();
    const wrapper = {
      del: (key: string) => { p.del(key); },
      zadd: (key: string, ...args: (string | number | Record<string, unknown>)[]) => {
        const flatArgs: (string | number)[] = [];
        for (const arg of args) {
          if (typeof arg === "object" && arg !== null) {
            const { score, member } = arg as { score: number; member: string };
            flatArgs.push(score, member);
          } else {
            flatArgs.push(arg as string | number);
          }
        }
        p.zadd(key, ...flatArgs);
      },
      rename: (oldKey: string, newKey: string) => { p.rename(oldKey, newKey); },
      expire: (key: string, seconds: number) => { p.expire(key, seconds); },
      exec: async () => {
        try {
          const results = await p.exec();
          return results?.map(([err, res]: [Error | null, unknown]) => [err, res] as [Error | null, unknown]) ?? [];
        } catch (err) {
          console.error("[redis] pipeline exec failed:", err);
          return [];
        }
      },
    };
    return wrapper;
  }

  async zrange<T = unknown[]>(key: string, start: number, stop: number, opts?: { rev?: boolean; withScores?: boolean }): Promise<T | []> {
    if (!this.isConnected) return [];
    try {
      if (opts?.rev && opts?.withScores) {
        return (await this.r.zrange(key, start, stop, "REV", "WITHSCORES")) as T;
      }
      if (opts?.rev) {
        return (await this.r.zrange(key, start, stop, "REV")) as T;
      }
      if (opts?.withScores) {
        return (await this.r.zrange(key, start, stop, "WITHSCORES")) as T;
      }
      return (await this.r.zrange(key, start, stop)) as T;
    } catch (err) {
      console.error("[redis] zrange failed:", err);
      return [];
    }
  }

  async zincrby(key: string, increment: number, member: string): Promise<string | ""> {
    if (!this.isConnected) return "";
    try {
      return await this.r.zincrby(key, increment, member);
    } catch (err) {
      console.error("[redis] zincrby failed:", err);
      return "";
    }
  }

  async smembers<T = string[]>(key: string): Promise<T | []> {
    if (!this.isConnected) return [];
    try {
      return (await this.r.smembers(key)) as T;
    } catch (err) {
      console.error("[redis] smembers failed:", err);
      return [];
    }
  }

  async sadd(key: string, member: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.sadd(key, member);
    } catch (err) {
      console.error("[redis] sadd failed:", err);
      return 0;
    }
  }

  async srem(key: string, member: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.srem(key, member);
    } catch (err) {
      console.error("[redis] srem failed:", err);
      return 0;
    }
  }

  async sismember(key: string, member: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.sismember(key, member);
    } catch (err) {
      console.error("[redis] sismember failed:", err);
      return 0;
    }
  }

  async scard(key: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.r.scard(key);
    } catch (err) {
      console.error("[redis] scard failed:", err);
      return 0;
    }
  }

  async scan<T = string>(cursor: number, opts?: { match?: string; count?: number }): Promise<[string, T[]]> {
    if (!this.isConnected) return ["0", []];
    try {
      let result: [string, string[]];
      if (opts?.match && opts?.count) {
        result = await this.r.scan(cursor, "MATCH", opts.match, "COUNT", opts.count);
      } else if (opts?.match) {
        result = await this.r.scan(cursor, "MATCH", opts.match);
      } else if (opts?.count) {
        result = await this.r.scan(cursor, "COUNT", opts.count);
      } else {
        result = await this.r.scan(cursor);
      }
      return [String(result[0]), result[1] as T[]];
    } catch (err) {
      console.error("[redis] scan failed:", err);
      return ["0", []];
    }
  }
}

export const redis = url ? new UpstashCompat(url) : null;
