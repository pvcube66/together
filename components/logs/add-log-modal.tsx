'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import AreaSelector from '@/components/area-selector';

type LogItem = {
  id: string;
  title: string;
  notes: string | null;
  durationMin: number | null;
  rating: number | null;
  date: string;
  areaId: string | null;
  area: { id: string; name: string; color: string; icon: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

type AddLogModalProps = {
  open: boolean;
  editLog: LogItem | null;
  onSave: (data: {
    title: string;
    notes: string;
    durationMin: string;
    rating: string;
    enableRating: boolean;
    areaId: string;
    dateStr: string;
  }) => void;
  onClose: () => void;
  busy: boolean;
};

export default function AddLogModal({ open, editLog, onSave, onClose, busy }: AddLogModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [rating, setRating] = useState('7');
  const [enableRating, setEnableRating] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  // Reset form when opening
  useEffect(() => {
    if (!open) return;
    if (editLog) {
      setTitle(editLog.title);
      setNotes(editLog.notes ?? '');
      setDurationMin(editLog.durationMin?.toString() ?? '');
      setRating(editLog.rating?.toString() ?? '7');
      setEnableRating(editLog.rating !== null);
      setAreaId(editLog.areaId);
      setDateStr(editLog.date.slice(0, 10));
    } else {
      setTitle('');
      setNotes('');
      setDurationMin('');
      setRating('7');
      setEnableRating(false);
      setAreaId(null);
      setDateStr(new Date().toISOString().slice(0, 10));
    }
  }, [open, editLog]);

  // Body scroll lock + focus preservation
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Auto-focus title input
  useEffect(() => {
    if (open && titleRef.current) {
      titleRef.current.focus();
    }
  }, [open]);

  // Simple focus trap
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && !busy) {
      onClose();
    }
  }, [onClose, busy]);

  const handleSave = useCallback(() => {
    if (!title.trim() || busy) return;
    if (!areaId) {
      alert('Please select an Area before saving.');
      return;
    }
    onSave({ title, notes, durationMin, rating, enableRating, areaId, dateStr });
  }, [title, notes, durationMin, rating, enableRating, areaId, dateStr, busy, onSave]);

  const canSave = title.trim().length > 0 && areaId !== null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={handleBackdropClick}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-lg dark:bg-black/60"
            aria-hidden="true"
          />

          {/* Modal card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/50
              bg-gradient-to-b from-card to-card/98
              shadow-[0_4px_16px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.4)_inset]
              dark:shadow-[0_4px_16px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.32),0_1px_0_rgba(255,255,255,0.04)_inset]"
            role="dialog"
            aria-modal="true"
            aria-label={editLog ? 'Edit Log Entry' : 'Log New Activity'}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-150"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.8} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta/10 ring-1 ring-cta/15">
                <Sparkles size={14} strokeWidth={1.8} className="text-cta" />
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-foreground">
                  {editLog ? 'Edit Log Entry' : 'Log New Activity'}
                </span>
                <span className="text-[10.5px] text-muted-foreground/60 font-medium">
                  {editLog ? 'Update your activity log' : 'Log what you worked on'}
                </span>
              </div>
            </div>

            {/* Form body — scrollable if content overflows */}
            <div className="max-h-[min(32rem,calc(100vh-12rem))] overflow-y-auto px-5 py-4 space-y-3">
              {/* Title */}
              <label className="block">
                <span className="mb-1 block text-[10.5px] text-muted-foreground">
                  What did you do? (Title)
                </span>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solved 3 LeetCode, Ran 5km, Meditated..."
                  className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                    focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                />
              </label>

              {/* Area */}
              <div>
                <AreaSelector
                  value={areaId}
                  onChange={setAreaId}
                  label="Area (Required)"
                  allowNull={false}
                />
              </div>

              {/* Duration + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">
                    Duration (minutes)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">
                    Date
                  </span>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  />
                </label>
              </div>

              {/* Rating */}
              <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground select-none cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={enableRating}
                    onChange={(e) => setEnableRating(e.target.checked)}
                    className="rounded border-border/70 text-cta focus:ring-cta"
                  />
                  Add Productivity / Effort Rating (1-10)
                </label>
                {enableRating && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-muted-foreground">Score</span>
                      <span className="text-foreground font-bold">{rating}/10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none bg-muted/80 accent-cta cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cta"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <label className="block">
                <span className="mb-1 block text-[10.5px] text-muted-foreground">
                  Notes / Reflections (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Reflections, wins, blockers..."
                  className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                    focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                />
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border/20 px-5 py-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                disabled={busy}
                className="rounded-[6px] border border-border/70 bg-background px-3 py-1.5 text-[11px] font-medium text-foreground
                  hover:bg-muted/50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={busy || !canSave}
                className="app-cta-surface rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-cta-foreground
                  disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
              >
                {busy ? 'Saving...' : editLog ? 'Save' : 'Log entry'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
