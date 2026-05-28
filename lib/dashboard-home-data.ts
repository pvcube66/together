import { cache } from 'react';
import { prisma } from '@/lib/db';

/** Todo strip for `/dashboard`; cached per request. */
export const getDashboardHomeData = cache(async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 24,
    select: {
      id: true,
      title: true,
      type: true,
      isCompleted: true,
      deadline: true,
    },
  });

  return { tasks };
});
