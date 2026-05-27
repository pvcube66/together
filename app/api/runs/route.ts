import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const createSchema = z.object({
  distanceKm: z.number().min(0).max(500),
  durationMin: z.number().int().min(0).max(1440),
  paceMinPerKm: z.number().min(0).max(120).optional().nullable(),
  runType: z.enum(["EASY", "TEMPO", "INTERVAL", "LONG_RUN", "RACE"]).default("EASY"),
  effort: z.number().int().min(1).max(10).optional().nullable(),
  routeName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  runDate: z.string().datetime().optional(),
  areaId: z.string().optional().nullable(),
});

const LIST_SELECT = {
  id: true, distanceKm: true, durationMin: true, paceMinPerKm: true,
  runType: true, effort: true, routeName: true, notes: true, runDate: true,
  areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
  createdAt: true, updatedAt: true,
} as const;

export const GET = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const url = new URL(request.url);

  const parsed = listQuerySchema.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { limit, cursor } = parsed.data;

  const items = await prisma.runLog.findMany({
    where: {
      userId: session.user.id,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { runDate: "desc" },
    take: limit + 1,
    select: LIST_SELECT,
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return NextResponse.json({
    items: page.map((item) => ({
      ...item,
      runDate: item.runDate.toISOString(),
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

  const { distanceKm, durationMin, paceMinPerKm, runType, effort, routeName, notes, runDate, areaId } = body.data;

  const log = await prisma.runLog.create({
    data: {
      distanceKm,
      durationMin,
      paceMinPerKm: paceMinPerKm ?? null,
      runType,
      effort: effort ?? null,
      routeName: routeName || null,
      notes: notes || null,
      runDate: runDate ? new Date(runDate) : new Date(),
      areaId: areaId || null,
      userId: session.user.id,
    },
    select: LIST_SELECT,
  });

  return NextResponse.json({
    ...log,
    runDate: log.runDate.toISOString(),
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  }, { status: 201 });
});

// — GET: list runs (paginated, most recent first); POST: log a run.
