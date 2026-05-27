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

  constructor(connectionString: string) {
    this.r = new IORedis(connectionString, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    this.r.connect().catch(() => {});
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const val = await this.r.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<"OK"> {
    if (opts?.ex) {
      return (await this.r.set(key, JSON.stringify(value), "EX", opts.ex)) as "OK";
    }
    return (await this.r.set(key, JSON.stringify(value))) as "OK";
  }

  async del(key: string): Promise<number> {
    return this.r.del(key);
  }

  async getdel<T = unknown>(key: string): Promise<T | null> {
    const val = await this.r.getdel(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    return this.r.incrby(key, increment);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.r.expire(key, seconds);
  }

  async ping(): Promise<string> {
    return this.r.ping();
  }

  pipeline() {
    const p = this.r.pipeline();
    const wrapper: {
      del: (key: string) => void;
      zadd: (key: string, ...args: (string | number | Record<string, unknown>)[]) => void;
      rename: (oldKey: string, newKey: string) => void;
      expire: (key: string, seconds: number) => void;
      exec: () => Promise<[Error | null, unknown][]>;
    } = {
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
        const results = await p.exec();
        return results?.map(([err, res]: [Error | null, unknown]) => [err, res] as [Error | null, unknown]) ?? [];
      },
    };
    return wrapper;
  }

  async zrange<T = unknown[]>(key: string, start: number, stop: number, opts?: { rev?: boolean; withScores?: boolean }): Promise<T> {
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
  }

  async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.r.zincrby(key, increment, member);
  }

  async smembers<T = string[]>(key: string): Promise<T> {
    return (await this.r.smembers(key)) as T;
  }

  async sadd(key: string, member: string): Promise<number> {
    return this.r.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.r.srem(key, member);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.r.sismember(key, member);
  }

  async scard(key: string): Promise<number> {
    return this.r.scard(key);
  }

  async scan<T = string>(cursor: number, opts?: { match?: string; count?: number }): Promise<[string, T[]]> {
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
  }
}

export const redis = url ? new UpstashCompat(url) : null;

// — redis.ts: ioredis wrapper; null when REDIS_URL not set (in-memory fallbacks elsewhere).
