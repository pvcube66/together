'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Brain, Frown, Meh, Smile, Star, X, PenLine, Sparkles, SendHorizontal } from 'lucide-react';

const MOODS = [
  { value: 1, icon: Frown, label: 'Distracted', color: 'text-rose-500', bg: 'bg-rose-500/10', borderSelected: 'border-rose-300/50' },
  { value: 3, icon: Meh, label: 'Okay', color: 'text-amber-500', bg: 'bg-amber-500/10', borderSelected: 'border-amber-300/50' },
  { value: 5, icon: Smile, label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderSelected: 'border-emerald-300/50' },
  { value: 7, icon: Star, label: 'Great', color: 'text-blue-500', bg: 'bg-blue-500/10', borderSelected: 'border-blue-300/50' },
  { value: 9, icon: Sparkles, label: 'Excellent', color: 'text-violet-500', bg: 'bg-violet-500/10', borderSelected: 'border-violet-300/50' },
];

type SessionFeedbackData = {
  sessionDurationSec: number;
  sessionDurationMin: number;
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

export default function SessionFeedbackModal({
  data,
  onClose,
}: {
  data: SessionFeedbackData;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [mood, setMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleId = useId();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
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
      // Try to save as an activity log entry
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Focus session${mood >= 7 ? ' 🎯' : mood >= 4 ? ' ✓' : ''}`,
          notes: notes.trim() || `Rated ${mood}/10`,
          durationMin: Math.round(data.sessionDurationMin),
          rating: mood,
          areaId: 'default', // This may fail if there's no default area, so we wrap in try/catch
        }),
      }).catch(() => { /* area might not exist */ });
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => {
      setSaving(false);
      handleClose();
    }, 600);
  }, [saving, mood, notes, data, handleClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !saving) handleClose();
  }, [saving, handleClose]);

  if (!mounted) return null;

  const durationStr = data.sessionDurationMin >= 60
    ? `${Math.floor(data.sessionDurationMin / 60)}h ${data.sessionDurationMin % 60}m`
    : `${data.sessionDurationMin}m`;

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
                      {durationStr} · {mood && `Rated ${mood}/10`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 id={titleId} className="text-[14px] font-bold text-foreground">Session complete</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {durationStr} of focused study
                        </p>
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

                    {/* Mood picker */}
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
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
                              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all min-w-0 flex-1 ${
                                selected
                                  ? `${m.bg} ${m.color} ${m.borderSelected}`
                                  : 'border-border/40 text-muted-foreground/60 hover:border-border/70 hover:text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              <Icon size={18} strokeWidth={selected ? 2 : 1.5} />
                              <span className={`text-[8px] font-semibold uppercase tracking-wider ${selected ? '' : 'text-muted-foreground/50'}`}>
                                {m.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional note */}
                    <div className="mb-4">
                      <div className="relative">
                        <PenLine size={12} className="absolute left-3 top-3 text-muted-foreground/40" />
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add a note (optional)..."
                          rows={2}
                          className="w-full resize-none rounded-xl border border-border/40 bg-muted/30 pl-8 pr-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-border/70"
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
