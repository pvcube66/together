import "dotenv/config";

import { Redis as IORedis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL for socket server.");
}

class UpstashCompatServer {
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
    this.r.connect().catch((err) => {
      console.error("[redis] Failed to connect to Redis:", err);
      process.exit(1);
    });
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

  async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.r.zincrby(key, increment, member);
  }
}

export const redis = new UpstashCompatServer(redisUrl);

// — redis.ts: ioredis wrapper for socket server; throws if REDIS_URL missing.
