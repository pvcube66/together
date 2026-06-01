import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, withApi } from "@/lib/api-session";
import { parseRequestJson } from "@/lib/api";
import { limiters, enforce } from "@/lib/ratelimit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  companyName: z.string().trim().min(1).max(300).optional(),
  role: z.string().trim().min(1).max(300).optional(),
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

async function resolve(id: string, userId: string) {
  const job = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!job || job.userId !== userId) return null;
  return job;
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const session = await requireApiSession();
  await enforce(limiters.tasksWrite, session.user.id);
  const { id } = await params;

  const job = await resolve(id, session.user.id);
  if (!job) return NextResponse.json({ error: "Job application not found." }, { status: 404 });

  const body = await parseRequestJson(request, patchSchema);
  if (!body.success) return body.response;

  const { companyName, role, date, status, notes, url } = body.data;

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(companyName !== undefined ? { companyName } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(status !== undefined ? { status: status as any } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(url !== undefined ? { url } : {}),
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

  const job = await resolve(id, session.user.id);
  if (!job) return NextResponse.json({ error: "Job application not found." }, { status: 404 });

  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});
