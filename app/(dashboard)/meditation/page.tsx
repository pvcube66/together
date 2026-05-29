'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Timer, Flower2 } from 'lucide-react';
import BreathingExercise from '@/components/meditation/breathing-exercise';
import MeditationTimer from '@/components/meditation/meditation-timer';

type Tab = 'timer' | 'breathing';

export default function MeditationPage() {
  const [tab, setTab] = useState<Tab>('timer');

  return (
    <div className="relative flex min-h-0 w-full flex-col overflow-hidden">
      {/* Calm background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 right-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-sky-500/6 to-blue-500/4 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-32 left-[5%] h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-violet-500/5 to-purple-500/3 blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] h-[200px] w-[200px] rounded-full bg-gradient-to-r from-amber-500/4 to-rose-500/3 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4 pt-6 sm:px-6 sm:pb-6 sm:pt-8 md:px-8 md:pb-8 md:pt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.58, 1] }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flower2 size={15} className="text-sky-500" />
              <h1 className="text-[14px] font-bold tracking-tight text-foreground">Meditation</h1>
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              Find calm and focus — guided breathing and timed sessions
            </p>
          </div>
        </motion.div>

        {/* Tab selector */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.58, 1], delay: 0.1 }}
          className="mb-6 flex gap-1.5 rounded-xl border border-border/30 bg-muted/40 p-1 w-fit"
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setTab('timer')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all ${
              tab === 'timer'
                ? 'text-foreground'
                : 'text-muted-foreground/70 hover:text-foreground/80'
            }`}
          >
            {tab === 'timer' && (
              <motion.div
                layoutId="med-tab-bg"
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Timer size={13} strokeWidth={1.6} className="relative z-10" />
            <span className="relative z-10">Timed session</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setTab('breathing')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all ${
              tab === 'breathing'
                ? 'text-foreground'
                : 'text-muted-foreground/70 hover:text-foreground/80'
            }`}
          >
            {tab === 'breathing' && (
              <motion.div
                layoutId="med-tab-bg"
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Wind size={13} strokeWidth={1.6} className="relative z-10" />
            <span className="relative z-10">Breathing exercises</span>
          </motion.button>
        </motion.div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/30 bg-card/50 p-4 backdrop-blur-sm sm:p-6">
          <AnimatePresence mode="wait">
            {tab === 'timer' ? (
              <motion.div
                key="timer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <MeditationTimer />
              </motion.div>
            ) : (
              <motion.div
                key="breathing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <BreathingExercise />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
