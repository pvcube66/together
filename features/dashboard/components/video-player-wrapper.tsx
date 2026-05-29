"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import YouTubeEmbedPanel from "./youtube-embed-panel";
import {
  DASHBOARD_LECTURE_CHANGED_EVENT,
  clearDashboardLecture,
  readDashboardLecture,
} from "@/lib/dashboard-lecture";

export default function VideoPlayerWrapper() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState(() => readDashboardLecture());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const embedUrl = selection?.embedUrl ?? null;

  useEffect(() => {
    const sync = () => setSelection(readDashboardLecture());
    sync();

    if (!readDashboardLecture()) {
      fetch('/api/library')
        .then((res) => res.json())
        .then((data) => {
          if (data?.items && data.items.length > 0) {
            const latest = data.items[0];
            setSelection({
              id: latest.id,
              embedUrl: latest.embedUrl,
              url: latest.url,
              label: latest.title || `Video ${latest.videoId || ''}`,
            });
          }
        })
        .catch(() => {});
    }

    window.addEventListener(DASHBOARD_LECTURE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DASHBOARD_LECTURE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = embedUrl
    ? () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          containerRef.current?.requestFullscreen();
        }
      }
    : undefined;

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <YouTubeEmbedPanel
        embedUrl={embedUrl}
        activeLabel={selection?.label ?? null}
        onWatchLecture={() => router.push("/library")}
        onClearLecture={() => {
          clearDashboardLecture();
          setSelection(null);
        }}
        onEnterFocus={toggleFullscreen}
        focusMode={isFullscreen}
      />
    </div>
  );
}
