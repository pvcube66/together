import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

const createSchema = z.object({
  date: z.string().datetime(),
  moodScore: z.number().int().min(1).max(10),
  energyScore: z.number().int().min(1).max(10),
  focusScore: z.number().int().min(1).max(10),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  wins: z.string().trim().max(2000).optional().nullable(),
  blockers: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  areaId: z.string().optional().nullable(),
});

const LIST_SELECT = {
  id: true,
  date: true,
  moodScore: true,
  energyScore: true,
  focusScore: true,
  sleepHours: true,
  wins: true,
  blockers: true,
  notes: true,
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
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { limit, cursor } = parsed.data;

  const items = await prisma.dailyCheckin.findMany({
    where: {
      userId: session.user.id,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { date: "desc" },
    take: limit + 1,
    select: LIST_SELECT,
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

  const { date, moodScore, energyScore, focusScore, sleepHours, wins, blockers, notes, areaId } = body.data;
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const checkin = await prisma.dailyCheckin.upsert({
    where: { userId_date: { userId: session.user.id, date: dayStart } },
    update: { moodScore, energyScore, focusScore, sleepHours: sleepHours ?? null, wins: wins || null, blockers: blockers || null, notes: notes || null, areaId: areaId || null },
    create: { userId: session.user.id, date: dayStart, moodScore, energyScore, focusScore, sleepHours: sleepHours ?? null, wins: wins || null, blockers: blockers || null, notes: notes || null, areaId: areaId || null },
    select: LIST_SELECT,
  });

  return NextResponse.json({
    ...checkin,
    date: checkin.date.toISOString(),
    createdAt: checkin.createdAt.toISOString(),
    updatedAt: checkin.updatedAt.toISOString(),
  }, { status: 201 });
});

// — GET: list check-ins (paginated, most recent first); POST: upsert today's check-in.
