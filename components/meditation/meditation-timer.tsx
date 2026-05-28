'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Bell, Music, Volume2, Timer } from 'lucide-react';
import { useSound } from '@/components/sound-provider';
import { useWhiteNoise } from '@/components/white-noise-provider';
import type { WhiteNoiseToneId } from '@/lib/ambient-sounds';

const DURATIONS = [5, 10, 15, 20, 30];
const INTERVALS = [0, 5, 10, 15]; // 0 = no interval bells

const TONES: { id: WhiteNoiseToneId; label: string; emoji: string }[] = [
  { id: 'river', label: 'Soft Waves', emoji: '🌊' },
  { id: 'beach', label: 'Ocean', emoji: '🏖️' },
  { id: 'paris-cafe', label: 'Cafe', emoji: '☕' },
];

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MeditationTimer() {
  const { play } = useSound();
  const { currentTone, isPlaying, toggle, setTone } = useWhiteNoise();

  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(10); // minutes
  const [intervalMins, setIntervalMins] = useState(5); // bell every N minutes
  const [remaining, setRemaining] = useState(0);
  const [selectedTone, setSelectedTone] = useState<WhiteNoiseToneId>(currentTone);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);
  const lastBellRef = useRef(0);

  const startMeditation = useCallback(() => {
    const totalSec = duration * 60;
    setRemaining(totalSec);
    setCompleted(false);
    setIsActive(true);
    endTimeRef.current = Date.now() + totalSec * 1000;
    lastBellRef.current = Date.now();

    // Start ambient sound — setTone handles switching if needed
    if (selectedTone !== currentTone) {
      void setTone(selectedTone);
    }
    if (!isPlaying) {
      void toggle();
    }

    play('success');
  }, [duration, selectedTone, currentTone, isPlaying, setTone, toggle, play]);

  const stopMeditation = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    play('modalClose');
  }, [play]);

  const resetMeditation = useCallback(() => {
    stopMeditation();
    setRemaining(0);
    setCompleted(false);
  }, [stopMeditation]);

  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((endTimeRef.current - now) / 1000));
      setRemaining(left);

      // Interval bell
      if (intervalMins > 0) {
        const elapsedSec = Math.floor((now - lastBellRef.current) / 1000);
        if (elapsedSec >= intervalMins * 60) {
          lastBellRef.current = now;
          play('success');
        }
      }

      if (left <= 0) {
        setIsActive(false);
        setCompleted(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        play('success');
      }
    };

    timerRef.current = setInterval(tick, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, intervalMins, play]);

  const progress = useMemo(() => {
    if (remaining <= 0 || duration <= 0) return 0;
    return 1 - remaining / (duration * 60);
  }, [remaining, duration]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
      {/* Completed state */}
      <AnimatePresence mode="wait">
        {completed && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center mb-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mb-4">
              <Bell size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-bold text-foreground">Meditation complete</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              You meditated for {duration} minutes
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={resetMeditation}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cta px-4 py-2 text-[11px] font-bold text-white"
            >
              <Play size={12} strokeWidth={2.5} />
              Meditate again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active timer */}
      {isActive ? (
        <div className="flex flex-col items-center">
          {/* Progress ring */}
          <div className="relative mb-8">
            <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
              <circle
                cx="90"
                cy="90"
                r="82"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-border/20"
              />
              <motion.circle
                cx="90"
                cy="90"
                r="82"
                fill="none"
                stroke="oklch(0.65 0.14 210)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 82}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 82 * (1 - progress),
                }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-foreground tracking-tight">
                  {formatCountdown(remaining)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">remaining</p>
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={stopMeditation}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-5 py-2.5 text-[12px] font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            <Square size={14} strokeWidth={2} fill="currentColor" />
            End session
          </motion.button>

          <p className="mt-3 text-[10px] text-muted-foreground/50">
            {intervalMins > 0 ? `Bell every ${intervalMins} min` : 'No interval bells'}
          </p>
        </div>
      ) : !completed ? (
        <>
          {/* Duration selector */}
          <div className="mb-6 w-full max-w-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
              <Timer size={11} />
              Duration
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {DURATIONS.map((d) => (
                <motion.button
                  key={d}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDuration(d)}
                  className={`rounded-lg border py-2 text-[12px] font-semibold tabular-nums transition-all ${
                    duration === d
                      ? 'border-sky-400/50 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                  }`}
                >
                  {d}
                </motion.button>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-1 text-center">minutes</p>
          </div>

          {/* Bell interval */}
          <div className="mb-6 w-full max-w-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
              <Bell size={11} />
              Interval bells
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {INTERVALS.map((i) => (
                <motion.button
                  key={i}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIntervalMins(i)}
                  className={`rounded-lg border py-2 text-[11px] font-medium transition-all ${
                    intervalMins === i
                      ? 'border-amber-400/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                  }`}
                >
                  {i === 0 ? 'Off' : `${i}m`}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Ambient sound selector */}
          <div className="mb-8 w-full max-w-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1.5">
              <Music size={11} />
              Background sound
            </p>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <motion.button
                  key={t.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTone(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-medium transition-all ${
                    selectedTone === t.id
                      ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={startMeditation}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3 text-[13px] font-bold text-white shadow-lg transition-all hover:shadow-xl active:shadow-md"
          >
            <Play size={15} strokeWidth={2.5} />
            Meditate for {duration} min
          </motion.button>
        </>
      ) : null}
    </div>
  );
}
