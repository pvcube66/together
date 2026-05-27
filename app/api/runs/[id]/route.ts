import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  distanceKm: z.number().min(0).max(500).optional(),
  durationMin: z.number().int().min(0).max(1440).optional(),
  paceMinPerKm: z.number().min(0).max(120).optional().nullable(),
  runType: z.enum(["EASY", "TEMPO", "INTERVAL", "LONG_RUN", "RACE"]).optional(),
  effort: z.number().int().min(1).max(10).optional().nullable(),
  routeName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  runDate: z.string().datetime().optional(),
  areaId: z.string().optional().nullable(),
});

async function resolve(id: string, userId: string) {
  const log = await prisma.runLog.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!log || log.userId !== userId) return null;
  return log;
}

const LIST_SELECT = {
  id: true, distanceKm: true, durationMin: true, paceMinPerKm: true,
  runType: true, effort: true, routeName: true, notes: true, runDate: true,
  areaId: true, area: { select: { id: true, name: true, color: true, icon: true } },
  createdAt: true, updatedAt: true,
} as const;

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolve(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Run not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { distanceKm, durationMin, paceMinPerKm, runType, effort, routeName, notes, runDate, areaId } = body.data;

  const updated = await prisma.runLog.update({
    where: { id },
    data: {
      ...(distanceKm !== undefined ? { distanceKm } : {}),
      ...(durationMin !== undefined ? { durationMin } : {}),
      ...(paceMinPerKm !== undefined ? { paceMinPerKm } : {}),
      ...(runType !== undefined ? { runType } : {}),
      ...(effort !== undefined ? { effort } : {}),
      ...(routeName !== undefined ? { routeName } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(runDate !== undefined ? { runDate: new Date(runDate) } : {}),
      ...(areaId !== undefined ? { areaId: areaId || null } : {}),
    },
    select: LIST_SELECT,
  });

  return NextResponse.json({
    ...updated,
    runDate: updated.runDate.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export const DELETE = withApi(async (_request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const log = await resolve(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Run not found." }, { status: 404 });

  await prisma.runLog.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});

// — PATCH/DELETE: update or remove a run.
