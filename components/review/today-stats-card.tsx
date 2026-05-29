'use client';

import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Flame, Star, Share2, Check, Frown, Meh, Smile, Sparkles } from 'lucide-react';

type AreaBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  minutes: number;
};

const MOOD_LEVELS = [
  { max: 2, icon: Frown, label: 'Distracted', color: '#f43f5e' },
  { max: 4, icon: Meh, label: 'Okay', color: '#f59e0b' },
  { max: 6, icon: Smile, label: 'Good', color: '#22c55e' },
  { max: 8, icon: Star, label: 'Great', color: '#3b82f6' },
  { max: 10, icon: Sparkles, label: 'Excellent', color: '#8b5cf6' },
];

function getMoodInfo(rating: number) {
  for (const m of MOOD_LEVELS) {
    if (rating <= m.max) return m;
  }
  return MOOD_LEVELS[MOOD_LEVELS.length - 1];
}

export default function TodayStatsCard({
  totalMinutes,
  currentStreak,
  areas,
  avgRating,
  ratingCount,
}: {
  totalMinutes: number;
  currentStreak: number;
  areas: AreaBreakdown[];
  avgRating: number;
  ratingCount: number;
}) {
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const maxMinutes = Math.max(...areas.map((a) => a.minutes), 1);
  const hasData = totalMinutes > 0 || areas.length > 0 || ratingCount > 0;

  const shareText = [
    `📊 Today's Progress — ${dateStr}`,
    '',
    `⏱ Focus Time: ${formatDuration(totalMinutes)}`,
    currentStreak > 0 ? `🔥 Streak: ${currentStreak} day${currentStreak > 1 ? 's' : ''}` : null,
    avgRating > 0 ? `⭐ Mood: ${avgRating}/10 (${getMoodInfo(avgRating).label})` : null,
    '',
    ...areas.map((a) => `  ${a.icon ?? '•'} ${a.name}: ${formatDuration(a.minutes)}`),
    '',
    '— from Curtus',
  ]
    .filter(Boolean)
    .join('\n');

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Today's Progress", text: shareText });
        return;
      } catch {
        // user cancelled
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-amber-500/[0.03] p-5 shadow-[var(--shadow-ambient-md)]"
    >
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-amber-500/6 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/12 text-indigo-500">
                <Clock size={13} />
              </span>
              <h3 className="text-[13px] font-bold text-foreground">Today&apos;s Progress</h3>
            </div>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground/70">{dateStr}</p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground/70 transition-colors hover:border-border/60 hover:text-foreground hover:bg-card/80"
            aria-label="Share progress"
            title="Share progress"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
          </motion.button>
        </div>

        {!hasData ? (
          <div className="mt-6 flex min-h-[6rem] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/15 text-center p-4">
            <p className="text-[11px] text-muted-foreground/60">No activity logged today yet.</p>
          </div>
        ) : (
          <>
            {/* Hero: Total Focus Time */}
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold tabular-nums tracking-tight text-foreground">
                {formatDuration(totalMinutes)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/60">focused today</span>
            </div>

            {/* Streak + Mood row */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {currentStreak > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/8 px-2.5 py-1">
                  <Flame size={11} className="text-orange-500" />
                  <span className="text-[10px] font-bold tabular-nums text-orange-500">{currentStreak} day{currentStreak > 1 ? 's' : ''}</span>
                  <span className="text-[8px] text-muted-foreground/50">streak</span>
                </div>
              )}
              {avgRating > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1">
                  {(() => {
                    const mood = getMoodInfo(avgRating);
                    const MoodIcon = mood.icon;
                    return <MoodIcon size={11} className="text-amber-600" />;
                  })()}
                  <span className="text-[10px] font-bold tabular-nums text-amber-600">{avgRating}/10</span>
                  <span className="text-[8px] text-muted-foreground/50">{getMoodInfo(avgRating).label}</span>
                </div>
              )}
            </div>

            {/* Areas breakdown */}
            {areas.length > 0 && (
              <div className="mt-5 space-y-2.5 border-t border-border/30 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Areas</p>
                {areas.map((area) => (
                  <div key={area.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground truncate max-w-[65%]">
                        {area.icon && <span className="text-[10px]">{area.icon}</span>}
                        {!area.icon && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: area.color }} />}
                        {area.name}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums text-foreground/80">{formatDuration(area.minutes)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((area.minutes / maxMinutes) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${area.color}, ${area.color}cc)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Star rating visualization */}
            {avgRating > 0 && (
              <div className="mt-4 flex items-center gap-1.5 border-t border-border/30 pt-3.5">
                <Star size={10} className="text-amber-500/70 shrink-0" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="h-1.5 w-4 rounded-full transition-colors"
                      style={{
                        background: avgRating / 2 >= star
                          ? `hsl(${45 + star * 8}, 85%, ${55 - star * 4}%)`
                          : 'var(--color-muted-foreground)',
                        opacity: avgRating / 2 >= star ? 1 : 0.15,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground/60 ml-auto">
                  {ratingCount} rating{ratingCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
