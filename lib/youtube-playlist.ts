export type PlaylistVideo = {
  videoId: string;
  title: string;
  durationText: string;
  thumbnailUrl: string;
};

export async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) return [];
    const html = await res.text();

    const match = html.match(/(?:window\["ytInitialData"\]|var ytInitialData)\s*=\s*({.+?});/);
    if (!match) return [];

    const data = JSON.parse(match[1]);

    const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

    if (!Array.isArray(contents)) return [];

    const videos: PlaylistVideo[] = [];
    for (const item of contents) {
      const v = item?.playlistVideoRenderer;
      if (!v || !v.videoId) continue;

      const title = v.title?.runs?.[0]?.text ?? "Untitled Video";
      const durationText = v.lengthText?.simpleText ?? "";
      const thumbnailUrl = v.thumbnail?.thumbnails?.[0]?.url ?? "";

      videos.push({
        videoId: v.videoId,
        title,
        durationText,
        thumbnailUrl,
      });
    }

    return videos;
  } catch (err) {
    console.error('[youtube-playlist] Failed to fetch playlist:', err);
    return [];
  }
}
