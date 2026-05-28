import "dotenv/config";
import "./env-sanitize";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("[database] DATABASE_URL is not defined in environment variables.");
}

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

export const prisma = new PrismaClient({ adapter });

// — db.ts: Shared Prisma client with standard pg adapter (Supabase and production compatible).
