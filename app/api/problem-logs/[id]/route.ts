import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  platform: z.string().trim().min(1).max(60).optional(),
  problemTitle: z.string().trim().min(1).max(300).optional(),
  problemUrl: z.string().trim().max(1000).optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  topic: z.string().trim().max(100).optional().nullable(),
  timeTakenMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  hintsUsed: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  solvedAt: z.string().datetime().optional(),
  areaId: z.string().optional().nullable(),
});

async function resolveLog(id: string, userId: string) {
  const log = await prisma.problemLog.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!log || log.userId !== userId) return null;
  return log;
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolveLog(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Problem log not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { platform, problemTitle, problemUrl, difficulty, topic, timeTakenMinutes, hintsUsed, notes, solvedAt, areaId } = body.data;

  const updated = await prisma.problemLog.update({
    where: { id },
    data: {
      ...(platform !== undefined ? { platform } : {}),
      ...(problemTitle !== undefined ? { problemTitle } : {}),
      ...(problemUrl !== undefined ? { problemUrl } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(topic !== undefined ? { topic } : {}),
      ...(timeTakenMinutes !== undefined ? { timeTakenMinutes } : {}),
      ...(hintsUsed !== undefined ? { hintsUsed } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(solvedAt !== undefined ? { solvedAt: new Date(solvedAt) } : {}),
      ...(areaId !== undefined ? { areaId: areaId || null } : {}),
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

  return NextResponse.json({
    ...updated,
    solvedAt: updated.solvedAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export const DELETE = withApi(async (_request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolveLog(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Problem log not found." }, { status: 404 });

  await prisma.problemLog.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});

// — PATCH: update a problem log; DELETE: remove a problem log.
