'use client';

import { motion } from 'motion/react';
import { Maximize2, X, BookOpen, ArrowRight } from 'lucide-react';
import { SPRING_HOVER } from '@/lib/ui-motion';

type Props = {
  embedUrl: string | null;
  /** Library: fixed 16:9; dashboard: fills parent height. */
  large?: boolean;
  /** Shown when `large` and no URL (one line, no icon). */
  emptyHint?: string | null;
  onWatchLecture?: () => void;
  onClearLecture?: () => void;
  activeLabel?: string | null;
  /** Dashboard only: expands into fullscreen shell (iframe does not remount). */
  onEnterFocus?: () => void;
  focusMode?: boolean;
};

export default function YouTubeEmbedPanel({
  embedUrl,
  large = false,
  emptyHint = null,
  onWatchLecture,
  onClearLecture,
  activeLabel,
  onEnterFocus,
  focusMode = false,
}: Props) {
  const isLibraryLayout = large;
  const showDashboardLectureEmpty = !isLibraryLayout && !!onWatchLecture;

  return (
    <div
      className={
        isLibraryLayout
          ? 'flex w-full min-w-0 flex-col items-stretch'
          : 'flex h-full w-full min-h-0 min-w-0 max-w-[100vw] items-stretch justify-center pl-0 pr-0 pt-1.5 pb-3 sm:pl-2 sm:pr-1 sm:pt-2 sm:pb-4 lg:justify-end lg:pr-0.5'
      }
    >
      <motion.div
        className={
          'relative flex w-full flex-col border border-border/40 bg-card p-4 rounded-2xl shadow-ambient-md ' +
          (isLibraryLayout
            ? 'min-w-0 shrink-0'
            : 'h-full min-h-0 min-w-0 max-h-full w-full shrink-0 sm:max-w-[min(100%,94vw)] lg:w-[min(100%,90%)]')
        }
        whileHover={
          isLibraryLayout ? undefined : { y: -2, scale: 1.002 }
        }
        transition={SPRING_HOVER}
      >
        <div
          className={
            isLibraryLayout
              ? 'relative aspect-video w-full overflow-hidden bg-neutral-950 border border-border/10 rounded-xl'
              : 'relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-neutral-950 rounded-xl border border-border/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]'
          }
        >
          {embedUrl && onClearLecture && !focusMode && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onClearLecture}
              className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-white/18 bg-black/45 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
              aria-label="Clear lecture"
            >
              <X size={15} strokeWidth={1.9} />
            </motion.button>
          )}
          {embedUrl && onEnterFocus && !focusMode && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onEnterFocus}
              className="absolute left-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-white/18 bg-black/45 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
              aria-label="Focus mode — full screen lecture"
              title="Focus mode — full screen lecture"
            >
              <Maximize2 size={15} strokeWidth={1.9} />
            </motion.button>
          )}
          
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="YouTube player"
              className={
                isLibraryLayout
                  ? 'absolute inset-0 h-full w-full'
                  : 'h-full w-full'
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : showDashboardLectureEmpty ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center relative overflow-hidden min-h-[220px]">
              {/* Background radiant bloom using theme adaptive variables */}
              <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/30 to-card z-0" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--color-cta)_8%,transparent)_0%,transparent_75%)] animate-pulse z-0" style={{ animationDuration: '6s' }} />
              
              <div className="relative z-10 flex flex-col items-center max-w-[280px] sm:max-w-xs md:max-w-md">
                {/* Glowing Icon Frame matching rest of design */}
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cta/15 border border-cta/30 text-cta shadow-[0_0_15px_color-mix(in_oklch,var(--color-cta)_15%,transparent)]"
                >
                  <BookOpen size={24} className="animate-pulse" style={{ animationDuration: '3s' }} />
                </motion.div>

                <h3 className="text-[14px] sm:text-[15px] font-bold text-foreground tracking-tight text-balance leading-snug">
                  Start Your Next Study Session
                </h3>
                
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground text-pretty">
                  Select a lecture from the study library to track your focus hours and watch seamlessly right on your dashboard.
                </p>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onWatchLecture}
                  className="app-cta-surface mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold tracking-wide text-cta-foreground shadow-lg transition-transform"
                >
                  <span>Browse Library</span>
                  <ArrowRight size={12} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          ) : emptyHint ? (
            <p className="max-w-[20rem] px-4 text-center text-xs leading-snug text-muted-foreground/75 text-balance antialiased">
              {emptyHint}
            </p>
          ) : null}
          
          {embedUrl && activeLabel && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8 text-center">
              <p className="truncate text-[10.5px] text-white/90 font-medium font-sans">
                {activeLabel}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
