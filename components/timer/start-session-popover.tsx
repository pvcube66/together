'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Layers, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStudyTimer } from '@/components/study-timer-provider';

type Area = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

export default function StartSessionPopover({
  open,
  onSelect,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onSelect: (areaId: string | null) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const {
    pomodoroEnabled,
    pomodoroFocusMinutes,
    pomodoroBreakMinutes,
    updatePomodoroSettings,
  } = useStudyTimer();

  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [localEnabled, setLocalEnabled] = useState(pomodoroEnabled);
  const [localFocus, setLocalFocus] = useState(pomodoroFocusMinutes);
  const [localBreak, setLocalBreak] = useState(pomodoroBreakMinutes);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sync pomodoro local state with provider when popover opens
  useEffect(() => {
    if (open) {
      setLocalEnabled(pomodoroEnabled);
      setLocalFocus(pomodoroFocusMinutes);
      setLocalBreak(pomodoroBreakMinutes);
    }
  }, [open, pomodoroEnabled, pomodoroFocusMinutes, pomodoroBreakMinutes]);

  // Fetch areas
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/areas', { cache: 'no-store' })
      .then((res) => res.json() as Promise<{ areas: Area[] }>)
      .then((json) => {
        if (!cancelled) {
          setAreas(json.areas ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  // Position popover relative to anchor — opens below if space permits, otherwise above
  const [position, setPosition] = useState({ top: 0, right: 0, bottom: 0 });
  const [openAbove, setOpenAbove] = useState(false);
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Estimate popover height for the threshold check
    const popoverEstimate = 380;
    const above = spaceBelow < popoverEstimate;
    setOpenAbove(above);
    setPosition({
      top: above ? 0 : rect.bottom + 6,
      bottom: above ? window.innerHeight - rect.top + 6 : 0,
      right: window.innerWidth - rect.right,
    });
  }, [open, anchorRef]);

  // Save pomodoro settings
  const savePomodoro = useCallback(() => {
    updatePomodoroSettings({
      pomodoroEnabled: localEnabled,
      pomodoroFocusMinutes: localFocus,
      pomodoroBreakMinutes: localBreak,
    });
  }, [localEnabled, localFocus, localBreak, updatePomodoroSettings]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        savePomodoro();
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef, savePomodoro]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        savePomodoro();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, savePomodoro]);

  const handleSelect = useCallback((areaId: string | null) => {
    savePomodoro();
    onSelect(areaId);
    onClose();
  }, [savePomodoro, onSelect, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: openAbove ? 4 : -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: openAbove ? 4 : -4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0, 0, 0.58, 1] }}
          style={{
            ...(openAbove
              ? { bottom: position.bottom, right: position.right }
              : { top: position.top, right: position.right }),
          }}
          className="fixed z-[200] w-64 overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-float,0_4px_20px_rgba(0,0,0,0.12))] backdrop-blur-md"
          key="start-session-popover"
        >
          {/* Header */}
          <div className="px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Start Session
            </div>
          </div>

          {/* Area selection */}
          <div className="max-h-48 overflow-y-auto px-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-cta" />
              </div>
            ) : areas.length === 0 ? (
              <div className="px-2 py-3 text-center">
                <p className="text-[11px] text-muted-foreground/60">
                  No areas yet — create one in
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(null);
                    router.push('/areas');
                  }}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cta hover:text-cta/80 transition-colors"
                >
                  <Plus size={11} />
                  Areas
                </button>
              </div>
            ) : (
              <div className="space-y-0.5 pb-1">
                <p className="px-2 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Focus Area
                </p>
                {areas.map((area) => (
                  <motion.button
                    key={area.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(area.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11.5px] text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: area.color }}
                    />
                    {area.icon && <span className="text-sm">{area.icon}</span>}
                    <span className="truncate">{area.name}</span>
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(null)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  <Layers size={13} strokeWidth={1.5} className="opacity-50" />
                  General (no area)
                </motion.button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/40" />

          {/* Pomodoro settings */}
          <div className="space-y-3 px-3 py-3">
            <div className="flex items-center gap-2">
              <Coffee size={12} strokeWidth={1.5} className="text-muted-foreground/60" />
              <span className="text-[10.5px] font-medium text-foreground/70">Pomodoro</span>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10.5px] text-muted-foreground/60">Auto break after focus</p>
              <button
                type="button"
                role="switch"
                aria-checked={localEnabled}
                onClick={() => setLocalEnabled((v) => !v)}
                className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                style={{
                  background: localEnabled ? 'var(--color-cta)' : 'oklch(0.82 0.005 75)',
                }}
              >
                <motion.span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                  animate={{ left: localEnabled ? 'calc(100% - 1rem)' : '0.125rem' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                />
              </button>
            </div>

            {/* Focus / Break inputs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground/50">Focus</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={localFocus}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(120, Number(e.target.value) || 25));
                    setLocalFocus(v);
                  }}
                  className="w-14 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] text-foreground text-center tabular-nums"
                />
                <span className="text-[9px] text-muted-foreground/50">min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground/50">Break</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={localBreak}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(30, Number(e.target.value) || 5));
                    setLocalBreak(v);
                  }}
                  className="w-14 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] text-foreground text-center tabular-nums"
                />
                <span className="text-[9px] text-muted-foreground/50">min</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
