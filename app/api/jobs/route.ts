import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

const listQuerySchema = z.object({
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const createSchema = z.object({
  companyName: z.string().trim().min(1).max(300),
  role: z.string().trim().min(1).max(300),
  date: z.string().datetime().optional(),
  status: z.enum(["SAVED", "APPLIED", "PHONE_SCREEN", "TECHNICAL", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
  url: z.string().trim().url().max(2000).optional().nullable(),
});

const SELECT_FIELDS = {
  id: true,
  companyName: true,
  role: true,
  date: true,
  status: true,
  notes: true,
  url: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const GET = withApi(async (request: Request) => {
  const session = await requireApiSession();
  await enforce(limiters.statsRead, session.user.id);
  const url = new URL(request.url);

  const parsed = listQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { status, limit, cursor } = parsed.data;

  const items = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as any } : {}),
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

  const { companyName, role, date, status, notes, url } = body.data;

  const job = await prisma.jobApplication.create({
    data: {
      companyName,
      role,
      date: date ? new Date(date) : new Date(),
      status: (status ?? "SAVED") as any,
      notes: notes || null,
      url: url || null,
      userId: session.user.id,
    },
    select: SELECT_FIELDS,
  });

  return NextResponse.json({
    ...job,
    date: job.date.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }, { status: 201 });
});
