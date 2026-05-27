import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const listQuerySchema = z.object({
  platform: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  areaId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createSchema = z.object({
  platform: z.string().trim().min(1).max(60),
  problemTitle: z.string().trim().min(1).max(300),
  problemUrl: z.string().trim().max(1000).optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.string().trim().max(100).optional().nullable(),
  timeTakenMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  hintsUsed: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  solvedAt: z.string().datetime().optional(),
  areaId: z.string().optional().nullable(),
});

export const GET = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const url = new URL(request.url);

  const parsed = listQuerySchema.safeParse({
    platform: url.searchParams.get("platform") ?? undefined,
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    areaId: url.searchParams.get("areaId") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { platform, difficulty, areaId, cursor, limit } = parsed.data;

  const items = await prisma.problemLog.findMany({
    where: {
      userId: session.user.id,
      ...(platform ? { platform } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(areaId ? { areaId } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: [{ solvedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      platform: true,
      problemTitle: true,
      problemUrl: true,
      difficulty: true,
      topic: true,
      timeTakenMinutes: true,
      hintsUsed: true,
      notes: true,
      solvedAt: true,
      areaId: true,
      area: { select: { id: true, name: true, color: true, icon: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return NextResponse.json({
    items: page.map((item) => ({
      ...item,
      solvedAt: item.solvedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    nextCursor,
  });
});

export const POST = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);

  const body = await parseRequestJson(request, createSchema);
  if (!body.success) return body.response;

  const { platform, problemTitle, problemUrl, difficulty, topic, timeTakenMinutes, hintsUsed, notes, solvedAt, areaId } = body.data;

  const log = await prisma.problemLog.create({
    data: {
      platform,
      problemTitle,
      problemUrl: problemUrl || null,
      difficulty,
      topic: topic || null,
      timeTakenMinutes: timeTakenMinutes ?? null,
      hintsUsed: hintsUsed ?? null,
      notes: notes || null,
      solvedAt: solvedAt ? new Date(solvedAt) : new Date(),
      areaId: areaId || null,
      userId: session.user.id,
    },
    select: {
      id: true,
      platform: true,
      problemTitle: true,
      problemUrl: true,
      difficulty: true,
      topic: true,
      timeTakenMinutes: true,
      hintsUsed: true,
      notes: true,
      solvedAt: true,
      areaId: true,
      area: { select: { id: true, name: true, color: true, icon: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      ...log,
      solvedAt: log.solvedAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    },
    { status: 201 },
  );
});

// — GET: list problem logs with filtering; POST: log a solved problem.
