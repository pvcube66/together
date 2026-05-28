import { NextResponse } from 'next/server';
import { fetchPlaylistVideos } from '@/lib/youtube-playlist';
import { requireApiSession, withApi } from '@/lib/api-session';

export const GET = withApi(async (request: Request) => {
  await requireApiSession();

  const url = new URL(request.url);
  const playlistId = url.searchParams.get('playlistId');
  if (!playlistId) {
    return NextResponse.json({ error: 'playlistId is required.' }, { status: 400 });
  }

  const videos = await fetchPlaylistVideos(playlistId);
  return NextResponse.json({ videos });
});
