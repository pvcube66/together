import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  areaId: z.string().nullable().optional(),
});

async function resolve(id: string, userId: string) {
  const session = await prisma.focusSession.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!session || session.userId !== userId) return null;
  return session;
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const focusSession = await resolve(id, session.user.id);
  if (!focusSession) return NextResponse.json({ error: "Focus session not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { areaId } = body.data;

  const updated = await prisma.focusSession.update({
    where: { id },
    data: { areaId: areaId ?? null },
    select: { id: true, areaId: true },
  });

  return NextResponse.json(updated);
});

// — PATCH: update a focus session's area (used by feedback modal to sync area changes).
