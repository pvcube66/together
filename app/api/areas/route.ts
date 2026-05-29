import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().min(1).max(40).default("#6366f1"),
  icon: z.string().max(10).optional().nullable(),
});

export const GET = withApi(async () => {
  const session = await requireApiSession();
  await enforce(limiters.sessionsRead, session.user.id);

  const areas = await prisma.area.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      createdAt: true,
      _count: { select: { tasks: true, focusSessions: true, libraryItems: true, activityLogs: true } },
    },
  });

  return NextResponse.json({ areas });
});

export const POST = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);

  const body = await parseRequestJson(request, createSchema);
  if (!body.success) return body.response;

  const { name, color, icon } = body.data;

  const area = await prisma.area.create({
    data: {
      name,
      color,
      icon: icon || null,
      userId: session.user.id,
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

  return NextResponse.json(area, { status: 201 });
});

// — GET: list areas for current user; POST: create area.
