import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
  durationMin: z.number().int().min(0).max(1440).optional().nullable(),
  rating: z.number().int().min(1).max(10).optional().nullable(),
  date: z.string().datetime().optional(),
  areaId: z.string().optional(),
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

async function resolve(id: string, userId: string) {
  const log = await prisma.activityLog.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!log || log.userId !== userId) return null;
  return log;
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolve(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Log entry not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { title, notes, durationMin, rating, date, areaId } = body.data;

  const updated = await prisma.activityLog.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(durationMin !== undefined ? { durationMin } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(areaId !== undefined ? { areaId } : {}),
    },
    select: SELECT_FIELDS,
  });

  return NextResponse.json({
    ...updated,
    date: updated.date.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export const DELETE = withApi(async (_request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolve(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Log entry not found." }, { status: 404 });

  await prisma.activityLog.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});
