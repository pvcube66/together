'use client';

import { useRef, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Flower2,
  Library,
  Play,
  ScrollText,
  Square,
  Timer,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSound } from '@/components/sound-provider';
import { useStudyTimer } from '@/components/study-timer-provider';
import StartSessionPopover from '@/components/timer/start-session-popover';
import { computeSelfTimerTotalSeconds } from '@/lib/timer-sync';

type DockItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
};

const DOCK_LINKS: DockItem[] = [
  {
    id: 'library',
    label: 'Library',
    href: '/dashboard',
    icon: Library,
  },
  {
    id: 'logs',
    label: 'Logs',
    href: '/logs',
    icon: ScrollText,
  },
  {
    id: 'meditation',
    label: 'Meditation',
    href: '/meditation',
    icon: Flower2,
  },
];

function DockIcon({
  item,
  mouseX,
  onAction,
  hoverEnabled,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onAction: (item: DockItem) => void;
  hoverEnabled: boolean;
}) {
  const internalRef = useRef<HTMLButtonElement>(null);
  const ref = internalRef;

  const distance = useTransform(mouseX, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 140;
    return x - (rect.left + rect.width / 2);
  });

  const size = useSpring(
    useTransform(
      distance,
      [-140, 0, 140],
      hoverEnabled ? [46, 60, 46] : [42, 42, 42],
    ),
    {
      stiffness: 350,
      damping: 22,
      mass: 0.3,
    },
  );

  const y = useSpring(useTransform(distance, [-140, 0, 140], [0, -10, 0]), {
    stiffness: 350,
    damping: 22,
    mass: 0.3,
  });

  const Icon = item.icon;
  return (
    <motion.button
      ref={ref}
      type="button"
      style={{ width: size, height: size, y }}
      whileTap={{ scale: 0.96 }}
      className="group relative flex items-center justify-center rounded-2xl border border-border/60 bg-card/92 text-foreground/75
        shadow-[var(--shadow-ambient-sm),inset_0_1px_0_rgb(255_255_255/0.42)] backdrop-blur-md transition-all duration-200
        hover:text-foreground hover:shadow-[var(--shadow-ambient-md),inset_0_1px_0_rgb(255_255_255/0.48)] hover:bg-card/98
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60
        dark:shadow-[0_1px_3px_rgb(0_0_0/0.24),0_12px_30px_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.05)]"
      aria-label={item.label}
      onClick={() => onAction(item)}
    >
      <span
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md border border-border/60
          bg-popover/95 px-2 py-1 text-[11px] leading-none text-foreground/85 opacity-0
          shadow-[0_1px_2px_rgba(17,24,39,0.08)] backdrop-blur-sm
          transition-[opacity,transform] duration-200
          [transition-timing-function:cubic-bezier(0.2,0,0,0.1)]
          group-hover:-translate-y-0.5 group-hover:opacity-100
          dark:shadow-md"
      >
        {item.label}
      </span>
      <motion.span
        whileHover={{ rotate: [0, -8, 8, -4, 0] }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <Icon size={18} strokeWidth={1.7} className="opacity-85" />
      </motion.span>
    </motion.button>
  );
}

/** Running session: mm:ss under 1 hour, else show hours field. */
function formatElapsed(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Completed focus today in seconds (`HH:MM:SS`) to match card/leaderboard timers. */
function formatTodayClock(totalSeconds: number): string {
  return formatElapsed(totalSeconds);
}

function StudyTimerDockControl() {
  const { active, elapsedSeconds, todaySeconds, redisAvailable, busy, toggle, pomodoroEnabled, pomodoroPhase, pomodoroSecondsRemaining, pomodoroCycleCount, pomodoroFocusMinutes } =
    useStudyTimer();
  const { play } = useSound();
  const hoverEnabled = useMediaQuery('(min-width: 640px)');
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const idleLabel = formatTodayClock(todaySeconds);

  /** Running: continue from today's logged minutes + current session (not a fresh 00:00 session). */
  const activeTotalSeconds = computeSelfTimerTotalSeconds({
    active,
    todaySeconds,
    elapsedSeconds,
  });

  if (pomodoroPhase === 'break') {
    const mins = Math.floor(pomodoroSecondsRemaining / 60);
    const secs = pomodoroSecondsRemaining % 60;
    return (
      <div className="mr-1 flex items-center gap-1.5 border-r border-border/50 pr-2">
        <span className="tabular-nums text-[11px] font-medium text-amber-600 dark:text-amber-400">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1 rounded-xl border border-amber-200/60 bg-amber-50/80 px-2 py-1 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300" style={{ width: hoverEnabled ? 46 : 42, height: hoverEnabled ? 46 : 42 }}>
          <Timer size={15} strokeWidth={1.7} className="mx-auto" />
        </div>
        {pomodoroCycleCount > 0 && (
          <span className="text-[10px] text-muted-foreground opacity-60">#{pomodoroCycleCount}</span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mr-1 flex items-center gap-1.5 border-r border-border/50 pr-2">
        {/* Pomodoro focus indicator during active session */}
        {active && pomodoroEnabled && (
          <div className="flex items-center gap-1 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-2 py-1 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300" style={{ height: hoverEnabled ? 46 : 42 }}>
            <Timer size={13} strokeWidth={1.7} />
            <span className="tabular-nums text-[10px] font-medium whitespace-nowrap">{pomodoroFocusMinutes}m</span>
          </div>
        )}
        <span
          className="min-w-[2.75rem] tabular-nums text-[11px] font-medium text-muted-foreground"
          aria-live="polite"
        >
          {active ? formatElapsed(activeTotalSeconds) : idleLabel}
        </span>
        <motion.button
          ref={startBtnRef}
          type="button"
          style={{
            width: hoverEnabled ? 46 : 42,
            height: hoverEnabled ? 46 : 42,
          }}
          whileTap={{ scale: 0.96 }}
          disabled={!redisAvailable || busy}
          title={
            !redisAvailable
              ? 'Study timer unavailable (Redis)'
              : active
                ? 'Stop study timer'
                : 'Start study timer'
          }
          aria-label={active ? 'Stop study timer' : 'Start study timer'}
          aria-pressed={active}
          onClick={() => {
            play('tap');
            if (active) {
              void toggle();
            } else {
              setStartPopoverOpen(true);
            }
          }}
          className="group relative flex shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/92 text-foreground/85
            shadow-[var(--shadow-ambient-sm),inset_0_1px_0_rgb(255_255_255/0.42)] backdrop-blur-md transition-[color,background-color,opacity,box-shadow] duration-200
            hover:text-foreground hover:shadow-[var(--shadow-ambient-md),inset_0_1px_0_rgb(255_255_255/0.48)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-ring/60 disabled:pointer-events-none disabled:opacity-45 dark:shadow-[0_1px_3px_rgb(0_0_0/0.24),0_12px_30px_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.05)]"
        >
          <span
            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60
              bg-popover/95 px-2 py-1 text-[11px] leading-none text-foreground/85 opacity-0
              shadow-[0_1px_2px_rgba(17,24,39,0.08)] backdrop-blur-sm
              transition-[opacity,transform] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,0.1)]
              group-hover:-translate-y-0.5 group-hover:opacity-100
              dark:shadow-md"
          >
            {active ? 'Stop timer' : 'Start timer'}
          </span>
          {active ? (
            <Square
              size={15}
              strokeWidth={2}
              fill="currentColor"
              className="opacity-90"
            />
          ) : (
            <Play
              size={17}
              strokeWidth={1.75}
              className="translate-x-[1px] opacity-90"
            />
          )}
        </motion.button>
      </div>
      <StartSessionPopover
        open={startPopoverOpen}
        onClose={() => setStartPopoverOpen(false)}
        onSelect={(areaId) => { void toggle(areaId); }}
        anchorRef={startBtnRef}
      />
    </>
  );
}

function DockNavLinks({
  mouseX,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const router = useRouter();
  const { play } = useSound();
  const hoverEnabled = useMediaQuery('(min-width: 640px)');

  const onAction = (item: DockItem) => {
    play('tap');
    router.push(item.href);
  };

  return (
    <>
      {DOCK_LINKS.map((item) => (
        <DockIcon
          key={item.id}
          item={item}
          mouseX={mouseX}
          onAction={onAction}
          hoverEnabled={hoverEnabled}
        />
      ))}
    </>
  );
}

export default function FloatingDock() {
  const mouseX = useMotionValue<number>(Infinity);
  const hoverEnabled = useMediaQuery('(min-width: 640px)');

  return (
    <motion.div
      initial={false}
      onMouseMove={
        hoverEnabled ? (event) => mouseX.set(event.clientX) : undefined
      }
      onMouseLeave={hoverEnabled ? () => mouseX.set(Infinity) : undefined}
      className="pointer-events-auto"
    >
      <div
        className="shadow-float flex h-[66px] w-full max-w-[min(calc(100vw-1rem),34rem)] items-end justify-center gap-1.5 overflow-visible rounded-3xl border border-border/45 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-2 pb-2 pt-2 ring-1 ring-inset ring-black/[0.035]
          dark:border-border/50 dark:shadow-[0_2px_4px_rgb(0_0_0/0.24),0_18px_44px_rgb(0_0_0/0.28),inset_0_1px_0_rgb(255_255_255/0.045)] dark:ring-white/[0.05]"
      >
        <StudyTimerDockControl />
        <DockNavLinks mouseX={mouseX} />
      </div>
    </motion.div>
  );
}

// — Floating action dock (navigation shortcuts + unified start/pomodoro).
