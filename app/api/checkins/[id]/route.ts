import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  moodScore: z.number().int().min(1).max(10).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
  focusScore: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  wins: z.string().trim().max(2000).optional().nullable(),
  blockers: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  areaId: z.string().optional().nullable(),
});

async function resolve(id: string, userId: string) {
  const checkin = await prisma.dailyCheckin.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!checkin || checkin.userId !== userId) return null;
  return checkin;
}

const LIST_SELECT = {
  id: true, date: true, moodScore: true, energyScore: true, focusScore: true,
  sleepHours: true, wins: true, blockers: true, notes: true,
  areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
  createdAt: true, updatedAt: true,
} as const;

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const checkin = await resolve(id, session.user.id);
  if (!checkin) return NextResponse.json({ error: "Check-in not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { moodScore, energyScore, focusScore, sleepHours, wins, blockers, notes, areaId } = body.data;

  const updated = await prisma.dailyCheckin.update({
    where: { id },
    data: {
      ...(moodScore !== undefined ? { moodScore } : {}),
      ...(energyScore !== undefined ? { energyScore } : {}),
      ...(focusScore !== undefined ? { focusScore } : {}),
      ...(sleepHours !== undefined ? { sleepHours } : {}),
      ...(wins !== undefined ? { wins } : {}),
      ...(blockers !== undefined ? { blockers } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(areaId !== undefined ? { areaId: areaId || null } : {}),
    },
    select: LIST_SELECT,
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

  const checkin = await resolve(id, session.user.id);
  if (!checkin) return NextResponse.json({ error: "Check-in not found." }, { status: 404 });

  await prisma.dailyCheckin.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});

// — PATCH/DELETE: update or remove a check-in.
