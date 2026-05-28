'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Flower2, Sparkles, ArrowRight } from 'lucide-react';
import { SPRING_HOVER } from '@/lib/ui-motion';

export default function MeditationCard() {
  const router = useRouter();

  return (
    <motion.div
      className="h-full min-h-0"
      transition={SPRING_HOVER}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/meditation')}
        className="relative flex h-full min-h-[5rem] w-full items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card p-4 text-left shadow-ambient-sm transition-shadow hover:shadow-ambient-md"
      >
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/8 via-blue-500/5 to-violet-500/8" />

        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-400">
          <Flower2 size={18} strokeWidth={1.5} />
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-foreground">Meditation</p>
            <Sparkles size={10} className="text-sky-500" />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
            Guided breathing, timed sessions, and ambient sounds
          </p>
        </div>

        <div className="relative z-10 shrink-0 text-muted-foreground/40">
          <ArrowRight size={14} strokeWidth={1.5} />
        </div>
      </motion.button>
    </motion.div>
  );
}
