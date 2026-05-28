'use client';

import { Coffee, Menu, Play, Square } from 'lucide-react';
import { useServerUserSettings } from '@/components/server-user-settings';
import { motion, AnimatePresence } from 'motion/react';
import { useMobileNav } from '@/components/mobile-nav-context';
import { useSound } from '@/components/sound-provider';
import { useStudyTimer } from '@/components/study-timer-provider';
import SoundToggle from '@/components/sound-toggle';
import ThemeToggle from '@/components/theme-toggle';
import ProfileDropdown from '@/components/profileDropdown';

type UserLite = {
  name?: string | null;
  image?: string | null;
  email?: string | null;
};

export default function DashboardNavbar({ user }: { user: UserLite }) {
  const { openMobileNav, toggleMobileNav, mobileNavOpen } = useMobileNav();
  const { active, redisAvailable, busy, toggle, pomodoroPhase, pomodoroSecondsRemaining, pomodoroCycleCount, skipBreak } = useStudyTimer();
  const settings = useServerUserSettings();

  const ddayText = (() => {
    const date = settings?.todoDdayDate;
    if (!date) return null;
    const target = new Date(`${date}T12:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const today = new Date(now);
    today.setHours(12, 0, 0, 0);
    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / 86_400_000,
    );
    const formatted =
      diffDays >= 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
    return formatted;
  })();
  const { play } = useSound();

  return (
    <header className="relative z-[138] flex w-full shrink-0 items-center justify-between gap-2 px-3 pb-0 pt-1 sm:px-4 sm:pt-2 lg:z-50 lg:justify-end lg:gap-0">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => (mobileNavOpen ? toggleMobileNav() : openMobileNav())}
        className="-ml-0.5 flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card/92 text-foreground/80 shadow-float backdrop-blur-md transition-colors hover:bg-muted/55 lg:hidden"
        aria-expanded={mobileNavOpen}
        aria-controls="dashboard-sidebar"
        aria-label={
          mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'
        }
      >
        <Menu size={18} strokeWidth={1.7} />
      </motion.button>

      <motion.nav
        initial={false}
        id="dashboard-top-nav-controls"
        className="shadow-float relative z-[138] ml-auto flex w-fit max-w-[min(100%,20rem)] items-center gap-0.5 rounded-2xl border border-border/50 bg-card/92 py-1 pl-1 pr-1 backdrop-blur-md
          lg:ml-0"
      >
        {ddayText ? (
          <div
            className="hidden sm:flex items-center justify-center px-2.5 h-10 rounded-xl bg-transparent text-[11px] font-semibold tabular-nums text-muted-foreground"
            title="Days to your D-Day"
            aria-label={`D-Day countdown: ${ddayText}`}
          >
            {ddayText}
          </div>
        ) : null}

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          disabled={!redisAvailable || busy}
          aria-label={active ? 'Stop study timer' : 'Start study timer'}
          aria-pressed={active}
          title={
            !redisAvailable
              ? 'Study timer unavailable (Redis)'
              : active
                ? 'Stop study timer'
                : 'Start study timer'
          }
          onClick={() => {
            play('tap');
            void toggle();
          }}
          className="relative flex h-10 min-h-[40px] w-10 min-w-[40px] items-center justify-center rounded-xl border-0 bg-transparent text-foreground/80 shadow-none [box-shadow:none] transition-colors hover:bg-muted/50 disabled:opacity-45"
        >
          {active && (
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-cta/40"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
            />
          )}
          <motion.span
            animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={active ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : { duration: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {active ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.18, ease: [0, 0, 0.58, 1] }}
                >
                  <Square size={16} strokeWidth={2} fill="currentColor" />
                </motion.span>
              ) : (
                <motion.span
                  key="play"
                  initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  transition={{ duration: 0.18, ease: [0, 0, 0.58, 1] }}
                >
                  <Play size={16} strokeWidth={1.8} className="translate-x-[0.5px]" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        </motion.button>

        {/* Pomodoro break indicator */}
        {pomodoroPhase === 'break' && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0, y: 4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -4 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => skipBreak()}
            title={`Break: ${Math.floor(pomodoroSecondsRemaining / 60)}:${String(pomodoroSecondsRemaining % 60).padStart(2, '0')} — Click to skip`}
            aria-label={`Break time — ${Math.floor(pomodoroSecondsRemaining / 60)} minutes remaining. Click to skip.`}
            className="flex h-10 min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 text-amber-700 shadow-sm transition-colors dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300 dark:shadow-amber-950/20"
          >
            <Coffee size={14} strokeWidth={1.7} className="shrink-0" />
            <motion.span
              className="tabular-nums text-[11px] font-medium"
              key={Math.floor(pomodoroSecondsRemaining / 60) * 60 + (pomodoroSecondsRemaining % 60)}
            >
              {Math.floor(pomodoroSecondsRemaining / 60)}:{String(pomodoroSecondsRemaining % 60).padStart(2, '0')}
            </motion.span>
            {pomodoroCycleCount > 0 && (
              <span className="-ml-0.5 text-[10px] font-semibold opacity-50 tabular-nums">#{pomodoroCycleCount}</span>
            )}
          </motion.button>
        )}
        <SoundToggle className="border-0 bg-transparent shadow-none [box-shadow:none] hover:bg-muted/50" />
        <div className="h-4 w-px bg-border/60" aria-hidden />
        <ThemeToggle className="border-0 bg-transparent shadow-none [box-shadow:none] hover:bg-muted/50" />
        <div className="h-4 w-px bg-border/60" aria-hidden />
        <div className="pl-0.5 pr-0.5">
          <ProfileDropdown user={user} />
        </div>
      </motion.nav>
    </header>
  );
}

// — Top bar for dashboard: title slot, theme, sound, profile menu.
