import "dotenv/config";
import "./env-sanitize";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn(
        "[database] Warning: DATABASE_URL is not defined in environment variables. Instantiating PrismaClient with a dummy string."
      );
    }
    
    const pool = new Pool({
      connectionString: connectionString || "postgresql://dummy:dummy@localhost:5432/dummy",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const adapter = new PrismaPg(pool as any); // PrismaPg expects pg.Pool, keep cast for type compat
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (typeof prop === "symbol" || prop === "then") {
      return Reflect.get(target, prop, receiver);
    }
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// — db.ts: Shared Prisma client with standard pg adapter (Supabase and production compatible).
