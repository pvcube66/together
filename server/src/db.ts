import "dotenv/config";
import "../../lib/env-sanitize";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL for socket server.");
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool as any);

declare global {
  var studyWithMeSocketPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.studyWithMeSocketPrisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.studyWithMeSocketPrisma = prisma;
}

// — db.ts: Prisma + pg adapter for the socket server process (dev singleton on global).
