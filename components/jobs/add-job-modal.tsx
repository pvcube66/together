'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, X } from 'lucide-react';

type JobItem = {
  id: string;
  companyName: string;
  role: string;
  date: string;
  status: string;
  notes: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: 'SAVED', label: 'Saved' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
] as const;

type AddJobModalProps = {
  open: boolean;
  editJob: JobItem | null;
  onSave: (data: {
    companyName: string;
    role: string;
    status: string;
    notes: string;
    url: string;
    dateStr: string;
  }) => void;
  onClose: () => void;
  busy: boolean;
};

export default function AddJobModal({ open, editJob, onSave, onClose, busy }: AddJobModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('SAVED');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    if (editJob) {
      setCompanyName(editJob.companyName);
      setRole(editJob.role);
      setStatus(editJob.status);
      setNotes(editJob.notes ?? '');
      setUrl(editJob.url ?? '');
      setDateStr(editJob.date.slice(0, 10));
    } else {
      setCompanyName('');
      setRole('');
      setStatus('SAVED');
      setNotes('');
      setUrl('');
      setDateStr(new Date().toISOString().slice(0, 10));
    }
  }, [open, editJob]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && companyRef.current) {
      companyRef.current.focus();
    }
  }, [open]);

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
    if (!companyName.trim() || !role.trim() || busy) return;
    onSave({ companyName: companyName.trim(), role: role.trim(), status, notes, url, dateStr });
  }, [companyName, role, status, notes, url, dateStr, busy, onSave]);

  const canSave = companyName.trim().length > 0 && role.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={handleBackdropClick}>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-lg dark:bg-black/60"
            aria-hidden="true"
          />

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
            aria-label={editJob ? 'Edit Job Application' : 'Add Job Application'}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-150"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.8} />
            </button>

            <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta/10 ring-1 ring-cta/15">
                <Briefcase size={14} strokeWidth={1.8} className="text-cta" />
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-foreground">
                  {editJob ? 'Edit Job Application' : 'Track New Application'}
                </span>
                <span className="text-[10.5px] text-muted-foreground/60 font-medium">
                  {editJob ? 'Update your job application' : 'Log a new job application'}
                </span>
              </div>
            </div>

            <div className="max-h-[min(32rem,calc(100vh-12rem))] overflow-y-auto px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">
                    Company Name
                  </span>
                  <input
                    ref={companyRef}
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">
                    Role
                  </span>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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

              <label className="block">
                <span className="mb-1 block text-[10.5px] text-muted-foreground">
                  Job Posting URL (optional)
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                    focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10.5px] text-muted-foreground">
                  Notes (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes about the role, contact, interview process..."
                  className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground
                    focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                />
              </label>
            </div>

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
                {busy ? 'Saving...' : editJob ? 'Save' : 'Add Application'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
