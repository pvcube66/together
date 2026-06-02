'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Brain, Frown, Meh, Smile, Star, X, PenLine, Sparkles, SendHorizontal, Calendar, Clock, LayoutGrid } from 'lucide-react';

const MOODS = [
  { value: 1, icon: Frown, label: 'Distracted', color: 'text-rose-500', bg: 'bg-rose-500/10', borderSelected: 'border-rose-300/50' },
  { value: 3, icon: Meh, label: 'Okay', color: 'text-amber-500', bg: 'bg-amber-500/10', borderSelected: 'border-amber-300/50' },
  { value: 5, icon: Smile, label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderSelected: 'border-emerald-300/50' },
  { value: 7, icon: Star, label: 'Great', color: 'text-blue-500', bg: 'bg-blue-500/10', borderSelected: 'border-blue-300/50' },
  { value: 9, icon: Sparkles, label: 'Excellent', color: 'text-violet-500', bg: 'bg-violet-500/10', borderSelected: 'border-violet-300/50' },
];

type AreaOption = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

type SessionFeedbackData = {
  sessionDurationSec: number;
  sessionDurationMin: number;
  logId?: string;
  focusSessionId?: string;
  areaId?: string | null;
};

export function useSessionFeedback() {
  const [feedback, setFeedback] = useState<SessionFeedbackData | null>(null);

  const open = useCallback((data: SessionFeedbackData) => {
    setFeedback(data);
  }, []);

  const close = useCallback(() => {
    setFeedback(null);
  }, []);

  return { feedback, open, close };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SessionFeedbackModal({
  data,
  onClose,
}: {
  data: SessionFeedbackData;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState('Focus session');
  const [areaId, setAreaId] = useState<string | null>(data.areaId ?? null);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleId = useId();
  const todayStr = new Date().toISOString();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    fetch('/api/areas', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (json.areas) setAreas(json.areas);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  const handleSave = useCallback(async () => {
    if (saving || mood === null) return;
    setSaving(true);
    try {
      const logId = data.logId;
      if (logId) {
        await fetch(`/api/logs/${logId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Focus session',
            rating: mood,
            notes: notes.trim() || null,
            areaId: areaId ?? null,
          }),
        });
      }
      // Sync area change to the FocusSession if the user changed it
      if (data.focusSessionId && areaId !== (data.areaId ?? null)) {
        await fetch(`/api/sessions/${data.focusSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areaId: areaId ?? null }),
        });
      }
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => {
      setSaving(false);
      handleClose();
    }, 600);
  }, [saving, mood, notes, title, areaId, data, handleClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !saving) handleClose();
  }, [saving, handleClose]);

  if (!mounted) return null;

  const durationStr = data.sessionDurationMin >= 60
    ? `${Math.floor(data.sessionDurationMin / 60)}h ${data.sessionDurationMin % 60}m`
    : `${data.sessionDurationMin}m`;

  const selectedArea = areas.find((a) => a.id === areaId);

  return createPortal(
    <AnimatePresence initial={false} onExitComplete={onClose}>
      {open && (
        <motion.div
          key="feedback-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[300] flex items-end justify-center p-4 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          onClick={handleBackdrop}
        >
          <div className="absolute inset-0 bg-background/25" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />

          <motion.div
            className="relative z-10 my-auto w-full max-w-sm sm:my-0"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.58, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-float">
              <div className="p-5">
                {saved ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mb-4"
                    >
                      <Brain size={24} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-[15px] font-bold text-foreground">Session logged</h3>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {title} · {durationStr} · {mood && `Rated ${mood}/10`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 id={titleId} className="text-[14px] font-bold text-foreground">Log your session</h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Close"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <PenLine size={12} />
                        What did you do?
                      </p>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Solved 3 LeetCode, Ran 5km, Meditated..."
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-border/70"
                      />
                    </div>

                    {/* Duration + Date row */}
                    <div className="mb-3 flex gap-2">
                      <div className="flex-1 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5">
                        <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                          <Clock size={10} />
                          Duration
                        </p>
                        <p className="text-[13px] font-semibold text-foreground tabular-nums">{durationStr}</p>
                      </div>
                      <div className="flex-1 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5">
                        <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                          <Calendar size={10} />
                          Date
                        </p>
                        <p className="text-[13px] font-semibold text-foreground tabular-nums">{formatDate(todayStr)}</p>
                      </div>
                    </div>

                    {/* Area */}
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <LayoutGrid size={12} />
                        Area
                      </p>
                      <select
                        value={areaId ?? ''}
                        onChange={(e) => setAreaId(e.target.value || null)}
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-[12px] text-foreground focus:outline-none focus:border-border/70 appearance-none"
                      >
                        <option value="">No area</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      {!selectedArea && areaId && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{areaId}</p>
                      )}
                    </div>

                    {/* Mood picker */}
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-2.5 flex items-center gap-1.5">
                        <Star size={12} />
                        How was your session?
                      </p>
                      <div className="flex justify-between gap-2">
                        {MOODS.map((m) => {
                          const selected = mood === m.value;
                          const Icon = m.icon;
                          return (
                            <motion.button
                              key={m.value}
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setMood(m.value)}
                              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all min-w-0 flex-1 ${
                                selected
                                  ? `${m.bg} ${m.color} ${m.borderSelected}`
                                  : 'border-border/40 text-muted-foreground/60 hover:border-border/70 hover:text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              <Icon size={16} strokeWidth={selected ? 2 : 1.5} />
                              <span className={`text-[7px] font-semibold uppercase tracking-wider ${selected ? '' : 'text-muted-foreground/50'}`}>
                                {m.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <div className="relative">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes / Reflections (optional)..."
                          rows={2}
                          className="w-full resize-none rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-border/70"
                        />
                      </div>
                    </div>

                    {/* Save button */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      disabled={mood === null || saving}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold transition-all ${
                        mood !== null
                          ? 'app-cta-surface'
                          : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                      }`}
                    >
                      {saving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <SendHorizontal size={14} strokeWidth={2.5} />
                          Log session
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-2 w-full text-center text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
                    >
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
