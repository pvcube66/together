'use client';

import { type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flower2,
  Library,
  Pause,
  Play,
  ScrollText,
  Square,
} from 'lucide-react';
import { useSound } from '@/components/sound-provider';
import { useStudyTimer } from '@/components/study-timer-provider';
import { useSessionModal } from '@/components/timer/session-modal-provider';
import { computeSelfTimerTotalSeconds } from '@/lib/timer-sync';

const BTN_SIZE = 44;

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
    href: '/library',
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

function DockButton({
  label,
  icon: Icon,
  onClick,
  tooltip,
  disabled,
  ariaLabel,
  ariaPressed,
}: {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      {...(ariaPressed !== undefined ? { 'aria-pressed': ariaPressed } : {})}
      onClick={onClick}
      className="group relative flex shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/92 text-foreground/75
        shadow-[var(--shadow-ambient-sm),inset_0_1px_0_rgb(255_255_255/0.42)] backdrop-blur-md
        hover:text-foreground hover:shadow-[var(--shadow-ambient-md),inset_0_1px_0_rgb(255_255_255/0.48)] hover:bg-card/98
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60
        disabled:pointer-events-none disabled:opacity-45
        dark:shadow-[0_1px_3px_rgb(0_0_0/0.24),0_12px_30px_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.05)]"
      style={{ width: BTN_SIZE, height: BTN_SIZE }}
    >
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60
        bg-popover/95 px-2 py-1 text-[11px] leading-none text-foreground/85 opacity-0
        shadow-[0_1px_2px_rgba(17,24,39,0.08)] backdrop-blur-sm
        group-hover:opacity-100 dark:shadow-md"
      >
        {tooltip ?? label}
      </span>
      <Icon size={17} strokeWidth={1.7} className="opacity-85" />
    </button>
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
  const { active, paused, elapsedSeconds, todaySeconds, redisAvailable, busy, toggle, pause, resume } =
    useStudyTimer();
  const { play } = useSound();
  const { openSessionModal } = useSessionModal();
  const idleLabel = formatTodayClock(todaySeconds);

  /** Running: continue from today's logged minutes + current session (not a fresh 00:00 session). */
  const activeTotalSeconds = computeSelfTimerTotalSeconds({
    active,
    todaySeconds,
    elapsedSeconds,
  });

  return (
    <div className="mr-1 flex items-center gap-1.5 border-r border-border/50 pr-2">
      <span
        className="min-w-[2.75rem] tabular-nums text-[11px] font-medium text-muted-foreground"
        aria-live="polite"
      >
        {active ? (paused ? 'Paused' : formatElapsed(activeTotalSeconds)) : idleLabel}
      </span>

      {active && (
        <DockButton
          label="Pause timer"
          ariaLabel={paused ? 'Resume timer' : 'Pause timer'}
          tooltip={paused ? 'Resume timer' : 'Pause timer'}
          icon={paused ? Play : Pause}
          disabled={!redisAvailable || busy}
          onClick={() => {
            play('tap');
            if (paused) { void resume(); } else { void pause(); }
          }}
        />
      )}

      <DockButton
        label={active ? 'Stop study timer' : 'Start study timer'}
        ariaLabel={active ? 'Stop study timer' : 'Start study timer'}
        tooltip={!redisAvailable ? 'Study timer unavailable (Redis)' : active ? 'Stop timer' : 'Start timer'}
        icon={active ? Square : Play}
        disabled={!redisAvailable || busy}
        ariaPressed={active}
        onClick={() => {
          play('tap');
          if (active) { void toggle(); } else { openSessionModal(); }
        }}
      />
    </div>
  );
}

function DockNavLinks() {
  const router = useRouter();
  const { play } = useSound();

  return (
    <>
      {DOCK_LINKS.map((item) => (
        <DockButton
          key={item.id}
          label={item.label}
          icon={item.icon}
          tooltip={item.label}
          onClick={() => {
            play('tap');
            router.push(item.href);
          }}
        />
      ))}
    </>
  );
}

export default function FloatingDock() {
  return (
    <div className="pointer-events-auto">
      <div
        className="shadow-float flex h-[66px] w-full max-w-[min(calc(100vw-1rem),34rem)] items-end justify-center gap-1.5 overflow-visible rounded-3xl border border-border/45 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-2 pb-2 pt-2 ring-1 ring-inset ring-black/[0.035]
          dark:border-border/50 dark:shadow-[0_2px_4px_rgb(0_0_0/0.24),0_18px_44px_rgb(0_0_0/0.28),inset_0_1px_0_rgb(255_255_255/0.045)] dark:ring-white/[0.05]"
      >
        <StudyTimerDockControl />
        <DockNavLinks />
      </div>
    </div>
  );
}

// — Floating action dock (navigation shortcuts + unified start).
