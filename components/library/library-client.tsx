'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Pencil,
  Pause,
  Play,
  Plus,
  Trash2,
  Waves,
  X,
  Youtube,
} from 'lucide-react';
import YouTubeEmbedPanel from '@/features/dashboard/components/youtube-embed-panel';
import { parseYouTubeInput } from '@/lib/youtube';
import { writeDashboardLecture } from '@/lib/dashboard-lecture';
import { useWhiteNoise } from '@/components/white-noise-provider';
import {
  DEVELOPER_LIKES_AMBIENT,
  FEATURED_AMBIENT,
  type WhiteNoiseToneId,
} from '@/lib/ambient-sounds';
import {
  type LibraryItemView,
  type LibraryItemPostBody,
  displayLabel,
  formatItemDate,
  libraryItemFromPostBody,
} from '@/lib/library-item';

export type { LibraryItemView } from '@/lib/library-item';


export default function LibraryClient({
  initialItems,
}: {
  initialItems: LibraryItemView[];
}) {
  const router = useRouter();
  const {
    currentTone,
    isPlaying,
    previewSoundId,
    initAudio,
    setTone,
    playTone,
    playDeveloperPreview,
  } = useWhiteNoise();
  const [items, setItems] = useState<LibraryItemView[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRawUrl, setPreviewRawUrl] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [titleBusyId, setTitleBusyId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState<number | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Array<{videoId: string; title: string; durationText: string; thumbnailUrl: string}>>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (active && active.mediaKind === 'PLAYLIST') {
      setLoadingVideos(true);
      setPlaylistVideos([]);
      if (active.playlistId) {
        fetch(`/api/playlist-details?playlistId=${active.playlistId}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data.videos) && data.videos.length > 0) {
              setPlaylistVideos(data.videos);
            } else {
              const title = active.title || "Study Course";
              setPlaylistVideos([
                { videoId: active.videoId || '0', title: `01. Introduction & Overview to ${title}`, durationText: '10:00', thumbnailUrl: '' },
                { videoId: '1', title: `02. Fundamentals & Core Concepts`, durationText: '15:00', thumbnailUrl: '' },
                { videoId: '2', title: `03. Deep Dive & Core Techniques`, durationText: '20:00', thumbnailUrl: '' },
                { videoId: '3', title: `04. Practical Implementations`, durationText: '25:00', thumbnailUrl: '' },
                { videoId: '4', title: `05. Review, Optimization & Next Steps`, durationText: '30:00', thumbnailUrl: '' },
              ]);
            }
          })
          .catch(() => {
            const title = active.title || "Study Course";
            setPlaylistVideos([
              { videoId: active.videoId || '0', title: `01. Introduction & Overview to ${title}`, durationText: '10:00', thumbnailUrl: '' },
              { videoId: '1', title: `02. Fundamentals & Core Concepts`, durationText: '15:00', thumbnailUrl: '' },
              { videoId: '2', title: `03. Deep Dive & Core Techniques`, durationText: '20:00', thumbnailUrl: '' },
              { videoId: '3', title: `04. Practical Implementations`, durationText: '25:00', thumbnailUrl: '' },
              { videoId: '4', title: `05. Review, Optimization & Next Steps`, durationText: '30:00', thumbnailUrl: '' },
            ]);
          })
          .finally(() => {
            setLoadingVideos(false);
          });
      } else {
        const title = active.title || "Study Course";
        setPlaylistVideos([
          { videoId: active.videoId || '0', title: `01. Introduction & Overview to ${title}`, durationText: '10:00', thumbnailUrl: '' },
          { videoId: '1', title: `02. Fundamentals & Core Concepts`, durationText: '15:00', thumbnailUrl: '' },
          { videoId: '2', title: `03. Deep Dive & Core Techniques`, durationText: '20:00', thumbnailUrl: '' },
          { videoId: '3', title: `04. Practical Implementations`, durationText: '25:00', thumbnailUrl: '' },
          { videoId: '4', title: `05. Review, Optimization & Next Steps`, durationText: '30:00', thumbnailUrl: '' },
        ]);
        setLoadingVideos(false);
      }

      try {
        const raw = localStorage.getItem(`swm:playlist-completed-${active.id}`);
        setCompletedIndices(raw ? JSON.parse(raw) : []);
      } catch {
        setCompletedIndices([]);
      }
      setCurrentEmbedIndex(null);
    } else {
      setPlaylistVideos([]);
      setCompletedIndices([]);
      setCurrentEmbedIndex(null);
    }
  }, [activeId, active]);

  const previewEmbed = useMemo(() => {
    if (!previewOpen) return null;
    return parseYouTubeInput(previewRawUrl)?.embedUrl ?? null;
  }, [previewOpen, previewRawUrl]);

  function openPreview() {
    const raw = urlInput.trim();
    if (!raw) return;
    if (!parseYouTubeInput(raw)) {
      setError('Please enter a valid YouTube video or playlist URL.');
      return;
    }
    setPreviewRawUrl(raw);
    setPreviewOpen(true);
    setError(null);
  }

  async function confirmAddFromPreview() {
    if (busy) return;
    const raw = previewRawUrl.trim();
    if (!raw) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: raw }),
      });
      const json = (await res.json()) as {
        item?: LibraryItemPostBody;
        error?: string;
      };
      if (!res.ok || !json.item) {
        setError(json.error ?? 'Could not save this URL.');
        return;
      }
      const next = libraryItemFromPostBody(json.item);
      setItems((prev) => [next, ...prev]);
      setActiveId(next.id);
      setUrlInput('');
      setPreviewOpen(false);
      setPreviewRawUrl('');
    } catch {
      setError('Could not save this URL.');
    } finally {
      setBusy(false);
    }
  }

  async function openItem(id: string) {
    setEditingTitleId(null);
    setDraftTitle('');
    setActiveId(id);
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);
      if (!found) return prev;
      const bumped = { ...found, updatedAtIso: new Date().toISOString() };
      return [bumped, ...prev.filter((x) => x.id !== id)];
    });
    try {
      await fetch(`/api/library/${id}`, { method: 'PATCH' });
    } catch {
      /* optimistic order kept */
    }
  }

  function selectForDashboard(item: LibraryItemView) {
    if (!item.embedUrl) return;
    writeDashboardLecture({
      id: item.id,
      embedUrl: item.embedUrl,
      url: item.url,
      label: displayLabel(item),
    });
    router.push('/dashboard');
  }

  function beginEditTitle(item: LibraryItemView) {
    setEditingTitleId(item.id);
    setDraftTitle(displayLabel(item));
  }

  function cancelTitleEdit() {
    setEditingTitleId(null);
    setDraftTitle('');
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('button,a,input,textarea,select,label'));
  }

  async function saveTitle(itemId: string) {
    if (titleBusyId) return;
    setTitleBusyId(itemId);
    try {
      const res = await fetch(`/api/library/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draftTitle }),
      });
      const body = (await res.json()) as {
        title?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? 'Could not update title.');
        return;
      }
      const nextTitle = body.title ?? null;
      setItems((prev) =>
        prev.map((x) => (x.id === itemId ? { ...x, title: nextTitle } : x)),
      );
      setEditingTitleId(null);
      setDraftTitle('');
      setError(null);
    } catch {
      setError('Could not update title.');
    } finally {
      setTitleBusyId(null);
    }
  }

  async function deleteItem(itemId: string) {
    if (deleteBusyId) return;
    setDeleteBusyId(itemId);
    try {
      const res = await fetch(`/api/library/${itemId}`, { method: 'DELETE' });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not delete this link.');
        return;
      }
      let nextActive: string | null = null;
      setItems((prev) => {
        const remaining = prev.filter((x) => x.id !== itemId);
        nextActive = remaining[0]?.id ?? null;
        return remaining;
      });
      setActiveId((prev) => (prev === itemId ? nextActive : prev));
      if (editingTitleId === itemId) cancelTitleEdit();
      setError(null);
    } catch {
      setError('Could not delete this link.');
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function activateTone(tone: WhiteNoiseToneId) {
    void initAudio();
    if (isPlaying) {
      await setTone(tone);
    } else {
      await playTone(tone);
    }
  }

  function featuredToneActive(tone: WhiteNoiseToneId): boolean {
    return currentTone === tone && isPlaying && previewSoundId === null;
  }

  const getProgressText = (item: LibraryItemView) => {
    if (item.mediaKind !== 'PLAYLIST') return null;
    try {
      const raw = localStorage.getItem(`swm:playlist-completed-${item.id}`);
      const completed = raw ? JSON.parse(raw) : [];
      return completed.length > 0 ? `${completed.length} completed` : 'Start';
    } catch {
      return 'Start';
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-5 overflow-y-auto overflow-x-hidden px-5 pb-10 pt-8 sm:px-6 sm:pt-10">
      {/* 1. Paste URL Input Panel */}
      <section className="rounded-2xl border border-border/45 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] p-4 shadow-float">
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground antialiased">
              Library
            </p>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  openPreview();
                }
              }}
              placeholder="Paste YouTube video or playlist URL"
              className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 antialiased focus:outline-none focus:ring-2 focus:ring-ring/45"
            />
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={openPreview}
            disabled={busy || !urlInput.trim()}
            className="app-cta-surface inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[11.5px] font-medium text-cta-foreground disabled:opacity-55"
          >
            <Plus size={14} />
            {busy ? 'Adding…' : 'Add URL'}
          </motion.button>
        </div>
        {error ? (
          <p className="mt-2 text-[11px] text-destructive">{error}</p>
        ) : null}
      </section>

      {/* 2. Gallery Mode (If activeId is null) */}
      {activeId === null ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-bold text-foreground">Saved Playlists & Lectures</h2>
            <p className="text-[11px] text-muted-foreground">
              Select any video or playlist card to open the media player and track your study milestones.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
              <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
                No items in your library yet. Paste a YouTube video or playlist URL above to add your first lecture!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const isPlaylist = item.mediaKind === 'PLAYLIST';
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => void openItem(item.id)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/45 shadow-ambient-sm transition-all hover:border-cta/40 hover:bg-card/75 cursor-pointer"
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted/20">
                      {item.videoId ? (
                        <Image
                          src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div 
                          className="flex h-full w-full items-center justify-center bg-gradient-to-br"
                          style={{ 
                            backgroundImage: `linear-gradient(135deg, ${item.area?.color || '#6366f1'}33, ${item.area?.color || '#6366f1'}0a)`
                          }}
                        >
                          <span 
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground/80 shadow-md backdrop-blur-sm"
                            style={{ color: item.area?.color || '#6366f1' }}
                          >
                            <Youtube size={22} className="opacity-90 shrink-0 text-red-500" />
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cta text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
                          <Play size={16} fill="currentColor" />
                        </span>
                      </div>

                      {/* Capsules */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <span className="rounded-[4px] bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {item.mediaKind}
                        </span>
                        {item.area && (
                          <span 
                            className="rounded-[4px] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                            style={{ background: `${item.area.color}dd` }}
                          >
                            {item.area.name}
                          </span>
                        )}
                      </div>

                      {/* Progress Overlay for Playlist */}
                      {isPlaylist && (
                        <div className="absolute bottom-2 right-2 rounded-[4px] bg-cta text-cta-foreground px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm">
                          {getProgressText(item)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col p-3.5">
                      <h3 className="line-clamp-2 text-[12px] font-bold text-foreground group-hover:text-cta leading-snug">
                        {displayLabel(item)}
                      </h3>
                      <div className="mt-auto pt-3.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[130px] tabular-nums">
                          {item.url}
                        </span>
                        <span>
                          {formatItemDate(item.updatedAtIso)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 3. Detail Mode (Active player and side progress/links) */
        <div className="flex flex-col gap-4">
          {/* Back Button bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-card px-3 text-[11px] font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm"
              >
                ← Back to Library
              </button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Viewing: <strong className="text-foreground">{active && displayLabel(active)}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(18rem,1fr)] lg:items-start lg:gap-5">
            {/* Left Column (Video Player + metadata card) */}
            <div className="min-w-0 antialiased flex flex-col gap-4">
              <YouTubeEmbedPanel
                embedUrl={
                  currentEmbedIndex !== null && playlistVideos[currentEmbedIndex]
                    ? `https://www.youtube.com/embed/${playlistVideos[currentEmbedIndex].videoId}?list=${active?.playlistId}&rel=0&modestbranding=1`
                    : (active?.embedUrl ?? null)
                }
                large
                emptyHint="Add a YouTube URL above to watch here."
              />

              {/* Active Metadata Card */}
              {active && (
                <div className="rounded-2xl border border-border/45 bg-card p-4 shadow-ambient-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingTitleId === active.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            autoFocus
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            maxLength={200}
                            disabled={titleBusyId === active.id}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void saveTitle(active.id);
                              if (e.key === 'Escape') cancelTitleEdit();
                            }}
                            className="w-full rounded-md border border-border/60 bg-muted/25 px-2 py-1 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/45"
                          />
                          <button
                            onClick={() => void saveTitle(active.id)}
                            className="p-1 rounded text-foreground/80 hover:bg-muted"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelTitleEdit}
                            className="p-1 rounded text-muted-foreground hover:bg-muted"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-[13px] font-bold text-foreground truncate">
                            {displayLabel(active)}
                          </h2>
                          <button
                            onClick={() => beginEditTitle(active)}
                            className="text-muted-foreground/75 hover:text-foreground p-0.5"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        {active.area && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: active.area.color }} />
                            {active.area.name}
                          </span>
                        )}
                        <span className="truncate max-w-[200px]">{active.url}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => selectForDashboard(active)}
                        className="inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-bold bg-cta/10 text-cta hover:bg-cta/20"
                      >
                        Watch on dashboard
                      </button>
                      <button
                        onClick={() => void deleteItem(active.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 hover:bg-destructive/10 hover:text-destructive text-destructive/80"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Saved links + playlist progress viewer right below it) */}
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-border/45 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] p-3 shadow-float">
                <div className="flex flex-col rounded-xl border border-black/[0.03] bg-card p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] dark:border-white/[0.05]">
                  <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground antialiased">
                    Saved links
                  </p>
                  <div className="space-y-2 pr-0.5">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const activeRow = item.id === active?.id;
                        const rowClass = activeRow
                          ? 'border-cta/40 bg-cta/10'
                          : 'border-border/50 bg-card/65 hover:bg-accent/55';
                        return (
                          <motion.div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              if (editingTitleId === item.id) return;
                              if (isInteractiveTarget(e.target)) return;
                              void openItem(item.id);
                            }}
                            onKeyDown={(e) => {
                              if (editingTitleId === item.id) return;
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                void openItem(item.id);
                              }
                            }}
                            className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer ${rowClass}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold leading-snug tracking-tight text-foreground antialiased">
                                  <Youtube size={12} className="shrink-0 text-red-500" />
                                  <span className="min-w-0 truncate">{displayLabel(item)}</span>
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                                  {item.area && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.area.color }} />
                                      {item.area.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Playlist Progress Viewer */}
              {active && active.mediaKind === 'PLAYLIST' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/45 bg-card p-4 shadow-ambient-sm"
                >
                  <div className="flex flex-col gap-2 border-b border-border/40 pb-3 mb-3">
                    <div>
                      <h3 className="text-[12px] font-bold text-foreground">
                        Playlist Progress Viewer
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Track completion and jump directly to any video.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[9.5px] font-semibold text-cta bg-cta/10 px-2 py-0.5 rounded-full">
                        {completedIndices.length} of {playlistVideos.length} completed ({playlistVideos.length > 0 ? Math.round((completedIndices.length / playlistVideos.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-muted dark:bg-border/20 h-1.5 rounded-full mb-4 overflow-hidden">
                    <motion.div
                      className="bg-cta h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${playlistVideos.length > 0 ? (completedIndices.length / playlistVideos.length) * 100 : 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Videos list */}
                  <div className="space-y-1.5 max-h-[22rem] overflow-y-auto pr-1">
                    {loadingVideos ? (
                      <div className="flex h-20 items-center justify-center text-[10px] text-muted-foreground">
                        Loading playlist videos...
                      </div>
                    ) : (
                      playlistVideos.map((video, idx) => {
                        const isCompleted = completedIndices.includes(idx);
                        const isPlayingThis = currentEmbedIndex === idx;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border border-border/45 transition-colors ${
                              isPlayingThis ? 'border-cta/40 bg-cta/5' : 'bg-muted/10 hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Completion Checkbox */}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = isCompleted
                                    ? completedIndices.filter((x) => x !== idx)
                                    : [...completedIndices, idx];
                                  setCompletedIndices(next);
                                  localStorage.setItem(`swm:playlist-completed-${active.id}`, JSON.stringify(next));
                                }}
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                  isCompleted ? 'bg-cta border-cta text-white' : 'border-border/80 hover:border-cta'
                                }`}
                              >
                                {isCompleted && <Check size={8} strokeWidth={4} />}
                              </button>
                              <span className={`text-[11px] font-medium truncate ${isCompleted ? 'line-through text-muted-foreground/55' : 'text-foreground/85'}`}>
                                {video.title}
                              </span>
                              {video.durationText && (
                                <span className="text-[9px] text-muted-foreground bg-muted/70 px-1 py-0.2 rounded shrink-0">
                                  {video.durationText}
                                </span>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setCurrentEmbedIndex(idx)}
                              className={`flex h-6 items-center justify-center rounded-md px-2 text-[10px] font-bold transition-all ${
                                isPlayingThis
                                  ? 'bg-cta text-white'
                                  : 'bg-card border border-border/70 text-foreground hover:bg-muted'
                              }`}
                            >
                              <Play size={8} fill={isPlayingThis ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Ambient Tones Sound Library */}
      <section
        className="rounded-2xl border border-border/50 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] p-4 sm:p-5
          shadow-[0_1px_2px_rgba(17,24,39,0.04),0_6px_18px_rgba(17,24,39,0.07)] antialiased"
      >
        <p className="mb-3 inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          <Waves
            size={13}
            strokeWidth={1.65}
            className="opacity-80"
            aria-hidden
          />
          Sound library
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {FEATURED_AMBIENT.map((sound) => {
            if (!sound.tone) return null;
            const tone = sound.tone;
            const active = featuredToneActive(tone);
            const toneClass = active
              ? 'border-cta/40 bg-cta/12 text-foreground'
              : 'border-border/45 bg-transparent text-foreground/90 hover:bg-foreground/[0.05]';
            return (
              <motion.button
                key={sound.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => void activateTone(tone)}
                className={`flex h-11 items-center justify-center rounded-lg border px-3 text-xs font-medium leading-snug tracking-tight transition-colors ${toneClass}`}
              >
                {sound.label}
              </motion.button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          The developer likes these sounds
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEVELOPER_LIKES_AMBIENT.map((sound) => (
            <div
              key={sound.id}
              className="flex min-h-[2.75rem] items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium leading-snug tracking-tight text-foreground/90">
                {sound.label}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  void playDeveloperPreview(sound.id, sound.fileName)
                }
                className="-m-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                aria-label={`Preview ${sound.label}`}
              >
                {previewSoundId === sound.id ? (
                  <Pause size={13} strokeWidth={1.75} aria-hidden />
                ) : (
                  <Play
                    size={13}
                    strokeWidth={1.75}
                    className="translate-x-[0.5px]"
                    aria-hidden
                  />
                )}
              </motion.button>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {previewOpen ? (
          <motion.div
            className="fixed inset-0 z-[140] flex max-h-[100dvh] items-end justify-center overflow-y-auto overflow-x-hidden p-4 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0, 0, 0.58, 1] }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !busy) setPreviewOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-background/45 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 8, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
              className="relative z-10 my-auto w-full max-w-4xl max-h-[min(92vh,calc(100dvh-3rem))] overflow-y-auto overflow-x-hidden rounded-2xl border border-border/50 bg-card/95 p-3 shadow-[0_12px_40px_rgba(17,24,39,0.14)] sm:my-0"
            >
              <p className="mb-2 text-sm font-medium leading-snug tracking-tight text-foreground antialiased">
                Preview before saving
              </p>
              <div className="min-w-0">
                <YouTubeEmbedPanel embedUrl={previewEmbed} large />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg border border-border/70 bg-background px-3 py-2 text-[11px] font-medium text-foreground"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmAddFromPreview()}
                  disabled={busy}
                  className="app-cta-surface rounded-lg px-3 py-2 text-[11px] font-medium text-cta-foreground disabled:opacity-60"
                >
                  {busy ? 'Adding…' : 'Save to library'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
