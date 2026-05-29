'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionValueEvent } from 'motion/react';
import Image from 'next/image';
import {
  Flame,
  Star,
  Frown,
  Meh,
  Smile,
  Sparkles,
} from 'lucide-react';

type AreaBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  minutes: number;
};

const MOOD_LEVELS = [
  { max: 2, icon: Frown, label: 'Distracted', color: '#f43f5e', hue: 0 },
  { max: 4, icon: Meh, label: 'Okay', color: '#f59e0b', hue: 30 },
  { max: 6, icon: Smile, label: 'Good', color: '#22c55e', hue: 120 },
  { max: 8, icon: Star, label: 'Great', color: '#3b82f6', hue: 210 },
  { max: 10, icon: Sparkles, label: 'Excellent', color: '#8b5cf6', hue: 270 },
];

function getMoodInfo(rating: number) {
  for (const m of MOOD_LEVELS) {
    if (rating <= m.max) return m;
  }
  return MOOD_LEVELS[MOOD_LEVELS.length - 1];
}

function AnimatedDuration({ minutes }: { minutes: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 40, damping: 12 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(rounded, 'change', (v) => setDisplay(v));

  useEffect(() => {
    mv.set(minutes);
  }, [minutes, mv]);

  const format = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <span className="text-[38px] font-extrabold tabular-nums tracking-tight text-foreground">
      {format(display)}
    </span>
  );
}

const formatMin = (min: number) => {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function TodayStatsCard({
  userImage,
  totalMinutes,
  currentStreak,
  areas,
  avgRating,
  ratingCount,
}: {
  userImage: string | null;
  totalMinutes: number;
  currentStreak: number;
  areas: AreaBreakdown[];
  avgRating: number;
  ratingCount: number;
}) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const maxMinutes = Math.max(...areas.map((a) => a.minutes), 1);
  const hasData = totalMinutes > 0 || areas.length > 0 || ratingCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-indigo-500/[0.04] via-card to-amber-500/[0.03] p-9 shadow-[var(--shadow-ambient-md)]"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-indigo-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-500/8 blur-[70px]" />

      <div className="relative">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">Today&apos;s Progress</h3>
            <p className="text-[10px] font-medium text-muted-foreground/50 mt-0.5">{dateStr}</p>
          </div>
          {userImage && (
            <Image
              src={userImage}
              alt=""
              width={72}
              height={72}
              className="rounded-full border-2 border-border/30 shrink-0"
            />
          )}
        </div>

        {!hasData ? (
          <div className="flex min-h-[6rem] items-center justify-center rounded-xl border border-dashed border-border/30 bg-muted/8 text-center py-4">
            <p className="text-[12px] text-muted-foreground/50">No activity logged today yet.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <AnimatedDuration minutes={totalMinutes} />
                <span className="text-[12px] font-medium text-muted-foreground/50">focused today</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-orange-500/15 bg-orange-500/8 px-2.5 py-1 text-[11px] font-semibold text-orange-500 tabular-nums">
                  <Flame size={12} />
                  {currentStreak}d streak
                </span>
              )}
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/15 bg-amber-500/8 px-2.5 py-1 text-[11px] font-semibold text-amber-600 tabular-nums">
                  {(() => {
                    const mood = getMoodInfo(avgRating);
                    const Icon = mood.icon;
                    return <Icon size={12} />;
                  })()}
                  {avgRating}/10 · {getMoodInfo(avgRating).label}
                </span>
              )}
              {areas.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-semibold text-emerald-500 tabular-nums">
                  {areas.length} area{areas.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {areas.length > 0 && (
              <div className="space-y-3 mb-6">
                {areas.map((area, i) => (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.03, duration: 0.25, ease: [0.2, 0, 0, 1] }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground/70 truncate max-w-[70%]">
                        {area.icon && <span className="text-[13px]">{area.icon}</span>}
                        {!area.icon && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: area.color }} />}
                        {area.name}
                      </span>
                      <span className="text-[12px] font-bold tabular-nums text-foreground/50">{formatMin(area.minutes)}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full bg-border/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((area.minutes / maxMinutes) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: 0.12 + i * 0.03 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${area.color}, ${area.color}bb)` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {avgRating > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 px-3 py-2.5">
                <Star size={11} className="text-amber-500/60 shrink-0" />
                <div className="flex flex-1 gap-[3px] max-w-[160px]">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = avgRating / 2 >= star;
                    const mood = getMoodInfo(avgRating);
                    return (
                      <div
                        key={star}
                        className="h-1.5 rounded-full flex-1"
                        style={{
                          background: filled
                            ? `hsl(${mood.hue}, 65%, ${58 - star * 4}%)`
                            : 'var(--color-border)',
                          opacity: filled ? 1 : 0.5,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground/50 tabular-nums shrink-0">
                  {getMoodInfo(avgRating).label}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
