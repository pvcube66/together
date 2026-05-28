'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Wind, RotateCcw } from 'lucide-react';

type BreathingPattern = {
  name: string;
  description: string;
  phases: { label: string; duration: number; instruction: string }[];
  total: number;
  color: string;
  gradient: string;
};

const PATTERNS: BreathingPattern[] = [
  {
    name: 'Box Breathing',
    description: 'Equal parts — calm the mind, reduce stress',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly' },
      { label: 'Hold', duration: 4, instruction: 'Hold your breath' },
      { label: 'Exhale', duration: 4, instruction: 'Breathe out slowly' },
      { label: 'Hold', duration: 4, instruction: 'Hold empty' },
    ],
    total: 16,
    color: 'oklch(0.65 0.14 210)',
    gradient: 'from-sky-500/20 to-blue-500/10',
  },
  {
    name: '4-7-8 Breathing',
    description: 'The relaxing breath — deep calm in minutes',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Breathe in through your nose' },
      { label: 'Hold', duration: 7, instruction: 'Hold gently' },
      { label: 'Exhale', duration: 8, instruction: 'Breathe out through your mouth' },
    ],
    total: 19,
    color: 'oklch(0.65 0.16 280)',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
  {
    name: 'Relaxing Breath',
    description: 'Longer exhales activate the parasympathetic nervous system',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Slowly breathe in' },
      { label: 'Hold', duration: 2, instruction: 'Pause' },
      { label: 'Exhale', duration: 6, instruction: 'Slowly release' },
    ],
    total: 12,
    color: 'oklch(0.65 0.14 150)',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
];

function CircleGuide({
  pattern,
  phaseIndex,
  progress,
}: {
  pattern: BreathingPattern;
  phaseIndex: number;
  progress: number; // 0-1 within current phase
}) {
  const phase = pattern.phases[phaseIndex];
  if (!phase) return null;

  const isInhale = phase.label === 'Inhale';
  const isExhale = phase.label === 'Exhale';
  const isHold = phase.label === 'Hold';

  // Scale: inhale expands to 1, hold stays at 1, exhale contracts to 0.4, hold stays at 0.4
  let scale: number;
  if (isInhale) scale = 0.4 + progress * 0.6;
  else if (isHold) scale = phaseIndex === 1 ? 1 : 0.4; // first hold = expanded, second hold = contracted
  else if (isExhale) scale = 1 - progress * 0.6;
  else scale = 0.4;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${pattern.color}22 0%, transparent 70%)`,
        }}
        animate={{
          scale: isInhale ? [1, 1.15] : isExhale ? [1.15, 1] : 1,
          opacity: isHold ? 0.6 : 0.8,
        }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {/* Main circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 160,
          height: 160,
          background: `linear-gradient(135deg, ${pattern.color}33, ${pattern.color}15)`,
          border: `2px solid ${pattern.color}44`,
        }}
        animate={{
          scale,
        }}
        transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
      >
        {/* Inner pulsing dot */}
        <motion.div
          className="rounded-full"
          style={{
            width: 12,
            height: 12,
            background: pattern.color,
          }}
          animate={{
            scale: isInhale ? [0.8, 1.2] : isExhale ? [1.2, 0.8] : 1,
            opacity: isHold ? 0.5 : 0.9,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Phase label */}
      <motion.div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        key={phase.label}
      >
        <p className="text-[13px] font-bold tracking-wide" style={{ color: pattern.color }}>
          {phase.label}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          {phase.instruction}
        </p>
      </motion.div>

      {/* Progress ring around circle */}
      <svg
        className="absolute -rotate-90"
        width="180"
        height="180"
        viewBox="0 0 180 180"
      >
        <circle
          cx="90"
          cy="90"
          r="82"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border/30"
        />
        <motion.circle
          cx="90"
          cy="90"
          r="82"
          fill="none"
          stroke={pattern.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 82}
          animate={{
            strokeDashoffset: 2 * Math.PI * 82 * (1 - progress),
          }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
    </div>
  );
}

export default function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStartRef = useRef(Date.now());

  const startBreathing = useCallback(() => {
    setIsActive(true);
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCyclesCompleted(0);
    phaseStartRef.current = Date.now();
  }, []);

  const stopBreathing = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetBreathing = useCallback(() => {
    stopBreathing();
    setPhaseIndex(0);
    setPhaseProgress(0);
    setCyclesCompleted(0);
  }, [stopBreathing]);

  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const phase = selectedPattern.phases[phaseIndex];
      if (!phase) return;

      const elapsed = Date.now() - phaseStartRef.current;
      const phaseDurationMs = phase.duration * 1000;
      const progress = Math.min(1, elapsed / phaseDurationMs);
      setPhaseProgress(progress);

      if (progress >= 1) {
        const nextPhase = (phaseIndex + 1) % selectedPattern.phases.length;
        if (nextPhase === 0) {
          setCyclesCompleted((c) => c + 1);
        }
        setPhaseIndex(nextPhase);
        phaseStartRef.current = Date.now();
      }
    };

    timerRef.current = setInterval(tick, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phaseIndex, selectedPattern.phases]);

  const currentPhase = selectedPattern.phases[phaseIndex];

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
      {/* Pattern selector */}
      {!isActive && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {PATTERNS.map((p) => (
            <motion.button
              key={p.name}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedPattern(p)}
              className={`rounded-xl border px-3.5 py-2 text-[11px] font-medium transition-all ${
                selectedPattern.name === p.name
                  ? 'border-border/80 bg-card text-foreground shadow-sm'
                  : 'border-border/30 bg-transparent text-muted-foreground hover:border-border/60 hover:text-foreground'
              }`}
            >
              {p.name}
            </motion.button>
          ))}
        </div>
      )}

      {/* Description */}
      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.p
            key="desc"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8 text-center text-[12px] text-muted-foreground/80 max-w-xs"
          >
            {selectedPattern.description}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Circle guide */}
      <div className="relative mb-16">
        <AnimatePresence mode="wait">
          {isActive && currentPhase ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <CircleGuide
                pattern={selectedPattern}
                phaseIndex={phaseIndex}
                progress={phaseProgress}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center"
            >
              <div
                className="flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  border: `2px dashed ${selectedPattern.color}33`,
                  background: `radial-gradient(circle, ${selectedPattern.color}11, transparent)`,
                }}
              >
                <Wind size={28} strokeWidth={1.2} className="text-muted-foreground/40" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {isActive ? (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={stopBreathing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card text-foreground/80 hover:bg-muted transition-colors"
              aria-label="Stop breathing exercise"
            >
              <Square size={14} strokeWidth={2} fill="currentColor" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={resetBreathing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card text-foreground/50 hover:bg-muted transition-colors"
              aria-label="Reset"
            >
              <RotateCcw size={13} strokeWidth={1.5} />
            </motion.button>
          </>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={startBreathing}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold transition-all"
            style={{
              background: selectedPattern.color,
              color: 'white',
            }}
          >
            <Play size={14} strokeWidth={2.5} />
            Start breathing
          </motion.button>
        )}
      </div>

      {/* Cycle counter */}
      {isActive && cyclesCompleted > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-[10px] font-medium text-muted-foreground/60 tabular-nums"
        >
          {cyclesCompleted} {cyclesCompleted === 1 ? 'cycle' : 'cycles'} completed
        </motion.p>
      )}
    </div>
  );
}
