import "dotenv/config";
import "./env-sanitize";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

let prismaInstance: PrismaClient;

if (!connectionString) {
  console.warn(
    "[database] Warning: DATABASE_URL is not defined in environment variables. Compile-time build will proceed, but database operations will fail at runtime if executed."
  );
  prismaInstance = new PrismaClient();
} else {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool as any);
  prismaInstance = new PrismaClient({ adapter });
}

export const prisma = prismaInstance;

// — db.ts: Shared Prisma client with standard pg adapter (Supabase and production compatible).
