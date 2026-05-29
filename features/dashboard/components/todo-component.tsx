'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare2,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';
import { useSound } from '@/components/sound-provider';
import { SPRING_DRAG_RELEASE, SPRING_HOVER } from '@/lib/ui-motion';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type TaskType = 'DAILY' | 'YEARLY' | 'DEADLINE';
type TaskItem = {
  id: string;
  title: string;
  type: TaskType;
  deadline?: string;
  isCompleted: boolean;
};

const TYPE_COLOR: Record<TaskType, string> = {
  DAILY: 'oklch(0.56 0.10 250)', // Blue
  DEADLINE: 'oklch(0.58 0.11 45)', // Warm Clay/Orange
  YEARLY: 'oklch(0.55 0.12 320)', // Purple/Rose
};

const TYPE_LABEL: Record<TaskType, string> = {
  DAILY: 'Daily',
  DEADLINE: 'Deadline',
  YEARLY: 'Yearly',
};

export default function TodoComponent({
  initialTasks,
}: {
  initialTasks: TaskItem[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const pathname = usePathname();
  const { play } = useSound();
  const opSeqRef = useRef<Map<string, number>>(new Map());

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const dayNum = now.getDate();
  const monthName = MONTH_NAMES[now.getMonth()];

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzLabel = tz.replace(/_/g, ' ');

  // Refresh tasks on window focus or pathname navigation
  useEffect(() => {
    let aborted = false;

    async function refreshTodos() {
      try {
        const res = await fetch('/api/tasks?limit=100', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: TaskItem[] };
        if (!aborted && Array.isArray(data.items)) {
          setTasks(data.items);
        }
      } catch {
        // ignore
      }
    }

    const onFocus = () => void refreshTodos();
    window.addEventListener('focus', onFocus);

    return () => {
      aborted = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname]);

  const completedCount = useMemo(() => tasks.filter((t) => t.isCompleted).length, [tasks]);
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Format date deadline helper
  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return 'All Day';
    try {
      const d = new Date(deadlineStr);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  };

  // Determine status (Overdue, In Progress, Upcoming)
  const getTaskStatus = (task: TaskItem) => {
    if (task.isCompleted) return { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10' };
    if (!task.deadline) return { label: 'Active Today', color: 'text-blue-500 bg-blue-500/10' };
    
    try {
      const d = new Date(task.deadline);
      const isPast = d.getTime() < Date.now();
      if (isPast) return { label: 'Overdue', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
      
      // In progress if deadline is in the next 2 hours
      const diffHours = (d.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 2) {
        return { label: 'Due soon', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse' };
      }
    } catch {}
    
    return { label: 'Upcoming', color: 'text-muted-foreground bg-muted/60' };
  };

  const handleToggle = async (task: TaskItem) => {
    const previousCompleted = task.isCompleted;
    const nextCompleted = !previousCompleted;
    const nextSeq = (opSeqRef.current.get(task.id) ?? 0) + 1;
    opSeqRef.current.set(task.id, nextSeq);
    
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isCompleted: nextCompleted } : t
      )
    );
    play(previousCompleted ? 'toggleOff' : 'toggleOn');

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });
      if (!res.ok) {
        if (opSeqRef.current.get(task.id) !== nextSeq) return;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, isCompleted: previousCompleted } : t
          )
        );
        play('error');
      }
    } catch {
      if (opSeqRef.current.get(task.id) !== nextSeq) return;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, isCompleted: previousCompleted } : t
        )
      );
      play('error');
    }
  };

  return (
    <div className="h-full min-h-0 w-full min-w-0 pt-0.5 pb-2.5">
      <motion.div
        className="app-cursor-drag flex h-full w-full flex-col overflow-hidden border border-black/[0.045] bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.045] md:flex-row"
        style={{
          borderRadius: 22,
          boxShadow: [
            '0 1px 2px rgba(17,24,39,0.04)',
            '0 8px 26px rgba(17,24,39,0.03)',
            '3px 12px 36px rgba(17,24,39,0.05)',
          ].join(','),
        }}
        whileHover={{ y: -2 }}
        drag
        dragConstraints={{ top: -6, left: -6, right: 6, bottom: 6 }}
        dragElastic={0.06}
        dragTransition={SPRING_DRAG_RELEASE}
        transition={SPRING_HOVER}
      >
        {/* Left Side: Agenda view */}
        <div className="flex flex-1 flex-col min-h-0 border-b border-border/40 p-5 md:border-b-0 md:border-r md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cta/10 text-cta">
                <CheckSquare2 size={15} />
              </div>
              <h2 className="text-[14px] font-bold tracking-tight text-foreground">
                Today's Agenda
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>{completedCount} of {totalCount} completed</span>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 [scrollbar-width:thin] max-h-[24rem]"
            style={{ contentVisibility: 'auto' }}
          >
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const color = TYPE_COLOR[task.type];
                const status = getTaskStatus(task);
                
                return (
                  <motion.div
                    key={task.id}
                    layout="position"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card p-3 shadow-ambient-sm transition-[border-color,background-color] hover:border-border hover:bg-muted/20 dark:ring-white/[0.045]"
                    style={{
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox circle with premium micro-interaction */}
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/70 text-card transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: task.isCompleted ? color : 'transparent',
                          borderColor: task.isCompleted ? color : 'var(--border)',
                          boxShadow: task.isCompleted ? `0 2px 8px ${color}35` : 'none',
                        }}
                      >
                        {task.isCompleted && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-white"
                          >
                            <Check size={11} strokeWidth={3.5} />
                          </motion.span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[12.5px] font-semibold text-foreground/90 truncate leading-snug transition-all ${
                            task.isCompleted ? 'line-through text-muted-foreground/60' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground font-medium">
                            <Clock size={11} />
                            {formatDeadline(task.deadline)}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${color}12`,
                              color,
                            }}
                          >
                            {TYPE_LABEL[task.type]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="app-empty-atmosphere flex h-full min-h-[9rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60">
                <Sparkles size={18} className="text-cta animate-pulse" />
                <p className="text-[12px] font-semibold text-foreground/80">All caught up!</p>
                <p className="max-w-[15rem] text-center text-[10.5px] text-muted-foreground">
                  Your agenda is clear today. Add new tasks in the Todo Workspace to start tracking.
                </p>
                <Link
                  href="/dashboard/todo"
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-cta/15 px-2.5 py-1 text-[10.5px] font-semibold text-cta hover:bg-cta/25 transition-colors"
                >
                  Create Task
                  <Plus size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Focus Stats & calendar */}
        <div className="flex w-full flex-col justify-between p-5 bg-muted/30 dark:bg-card/25 md:w-[260px] md:shrink-0 md:p-6">
          {/* Calendar header with dark mode adaptive bg */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                {dayName}
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground leading-tight mt-0.5">
                {monthName} {dayNum}
              </h3>
            </div>
            <div className="rounded-lg bg-card border border-border/50 px-2.5 py-1 text-center shadow-ambient-sm">
              <span className="text-[14px] font-bold text-foreground tabular-nums leading-none">
                {dayNum}
              </span>
            </div>
          </div>

          {/* Progress Circular Gauge */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative flex items-center justify-center h-24 w-24">
              <svg className="absolute w-full h-full transform -rotate-90">
                {/* Track circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-muted dark:stroke-border/40 fill-none"
                  strokeWidth="6"
                />
                {/* Completed circle */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-cta fill-none"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 38}
                  initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - completionPercentage / 100) }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-foreground tracking-tight tabular-nums">
                  {completionPercentage}%
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  Focus
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-3 font-medium">
              {completedCount} of {totalCount} task{totalCount === 1 ? '' : 's'} done
            </p>
          </div>

          {/* Footer Actions */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between text-[9.5px] text-muted-foreground/80">
              <span className="font-semibold tracking-wider uppercase">Time Zone</span>
              <span className="font-medium truncate max-w-[120px]">{tzLabel}</span>
            </div>
            <Link
              href="/dashboard/todo"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-card border border-border/70 py-2 text-[11px] font-semibold text-foreground/90 shadow-ambient-sm transition-all hover:bg-muted hover:border-border active:scale-[0.98]"
            >
              <span>Todo Workspace</span>
              <ArrowUpRight size={13} className="text-muted-foreground/75" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// — Dashboard todo summary / quick list widget.
