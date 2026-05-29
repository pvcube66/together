import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).max(40).optional(),
  icon: z.string().max(10).optional().nullable(),
});

async function resolveArea(id: string, userId: string) {
  const area = await prisma.area.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!area || area.userId !== userId) return null;
  return area;
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const area = await resolveArea(id, session.user.id);
  if (!area) return NextResponse.json({ error: "Area not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { name, color, icon } = body.data;

  const updated = await prisma.area.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon } : {}),
    },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      createdAt: true,
      _count: { select: { tasks: true, focusSessions: true, libraryItems: true, activityLogs: true } },
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withApi(async (_request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const area = await resolveArea(id, session.user.id);
  if (!area) return NextResponse.json({ error: "Area not found." }, { status: 404 });

  const [taskCount, sessionCount, libraryCount, logCount] = await Promise.all([
    prisma.task.count({ where: { areaId: id } }),
    prisma.focusSession.count({ where: { areaId: id } }),
    prisma.libraryItem.count({ where: { areaId: id } }),
    prisma.activityLog.count({ where: { areaId: id } }),
  ]);

  if (taskCount + sessionCount + libraryCount + logCount > 0) {
    await prisma.$transaction([
      prisma.task.updateMany({ where: { areaId: id }, data: { areaId: null } }),
      prisma.focusSession.updateMany({ where: { areaId: id }, data: { areaId: null } }),
      prisma.libraryItem.updateMany({ where: { areaId: id }, data: { areaId: null } }),
      prisma.activityLog.updateMany({ where: { areaId: id }, data: { areaId: null } }),
      prisma.area.delete({ where: { id } }),
    ]);
  } else {
    await prisma.area.delete({ where: { id } });
  }
  return NextResponse.json({ deleted: true });
});

// — PATCH/DELETE: update or delete an area.
