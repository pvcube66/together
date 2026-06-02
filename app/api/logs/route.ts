import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const listQuerySchema = z.object({
  areaId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(5000).optional().nullable(),
  durationMin: z.number().int().min(0).max(1440).optional().nullable(),
  rating: z.number().int().min(1).max(10).optional().nullable(),
  date: z.string().datetime().optional(),
  areaId: z.string().min(1).optional().nullable(),
});

const SELECT_FIELDS = {
  id: true,
  title: true,
  notes: true,
  durationMin: true,
  rating: true,
  date: true,
  areaId: true,
  area: { select: { id: true, name: true, color: true, icon: true } },
  createdAt: true,
  updatedAt: true,
} as const;

export const GET = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const url = new URL(request.url);

  const parsed = listQuerySchema.safeParse({
    areaId: url.searchParams.get("areaId") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { areaId, limit, cursor } = parsed.data;

  const items = await prisma.activityLog.findMany({
    where: {
      userId: session.user.id,
      ...(areaId ? { areaId } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { date: "desc" },
    take: limit + 1,
    select: SELECT_FIELDS,
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return NextResponse.json({
    items: page.map((item) => ({
      ...item,
      date: item.date.toISOString(),
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

  const { title, notes, durationMin, rating, date, areaId } = body.data;

  const log = await prisma.activityLog.create({
    data: {
      title,
      notes: notes || null,
      durationMin: durationMin ?? null,
      rating: rating ?? null,
      date: date ? new Date(date) : new Date(),
      areaId: areaId ?? null,
      userId: session.user.id,
    },
    select: SELECT_FIELDS,
  });

  return NextResponse.json({
    ...log,
    date: log.date.toISOString(),
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  }, { status: 201 });
});
