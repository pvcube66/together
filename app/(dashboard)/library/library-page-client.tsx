'use client';

import dynamic from 'next/dynamic';
import type { LibraryItemView } from '@/lib/library-item';

const DynamicLibraryClient = dynamic(
  () => import('@/components/library/library-client'),
  { ssr: false },
);

export default function LibraryPageClient({
  initialItems,
}: {
  initialItems: LibraryItemView[];
}) {
  return <DynamicLibraryClient initialItems={initialItems} />;
}
