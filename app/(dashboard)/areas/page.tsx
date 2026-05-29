import { requireSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import AreasClient from './areas-client';

export default async function AreasPage() {
  const session = await requireSession();

  const areas = await prisma.area.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      createdAt: true,
      _count: { select: { tasks: true, focusSessions: true, libraryItems: true, activityLogs: true } },
    },
  });

  return (
    <AreasClient
      initialAreas={areas.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}

// — Areas management page.
