'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Area = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

function AreaChip({
  area,
  onSelect,
  chipRef,
}: {
  area: Area;
  onSelect: (id: string) => void;
  chipRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <motion.button
      ref={chipRef}
      type="button"
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(area.id)}
      className="group relative flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-150 shrink-0"
      style={{
        borderColor: `${area.color}40`,
        backgroundColor: `${area.color}12`,
        color: `oklch(from ${area.color} calc(l * 0.35) calc(c * 0.6) h)`,
      }}
    >
      {/* Glow dot */}
      <span
        className="relative h-3 w-3 shrink-0 rounded-full"
        style={{
          background: area.color,
          boxShadow: `0 0 8px ${area.color}80`,
        }}
      />
      {area.icon && <span className="text-base shrink-0 leading-none">{area.icon}</span>}
      <span className="truncate max-w-[7rem]">{area.name}</span>

      {/* Hover accent ring */}
      <span
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1.5px ${area.color}50`,
        }}
      />
    </motion.button>
  );
}

export default function StartSessionPopover({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (areaId: string | null) => void;
  onClose: () => void;
}) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstChipRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

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
        if (!cancelled) {
          setAreas([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [open]);

  // Auto-focus first chip when modal opens
  useEffect(() => {
    if (open && firstChipRef.current) {
      firstChipRef.current.focus();
    }
  }, [open, loading]);

  // Simple focus trap: tab cycles through focusable elements inside modal
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

  // Close on backdrop click
  const onBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  const handleSelect = useCallback((areaId: string | null) => {
    onSelect(areaId);
    onClose();
  }, [onSelect, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={onBackdropClick}
        >
          {/* Backdrop — fully blocks underlying UI */}
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-lg dark:bg-black/60"
            aria-hidden="true"
          />

          {/* Modal card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
            className="relative flex max-h-[min(32rem,calc(100vh-8rem))] w-full max-w-[min(34rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/50
              bg-gradient-to-b from-card to-card/98
              shadow-[0_4px_16px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.4)_inset]
              dark:shadow-[0_4px_16px_rgba(0,0,0,0.24),0_32px_80px_rgba(0,0,0,0.32),0_1px_0_rgba(255,255,255,0.04)_inset]"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a focus area to start studying"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-150"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.8} />
            </button>

            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border/30 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta/10 ring-1 ring-cta/15">
                <Sparkles size={14} strokeWidth={1.8} className="text-cta" />
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-foreground">
                  Focus Area
                </span>
                <span className="text-[10.5px] text-muted-foreground/60 font-medium">
                  Pick an area to focus your session
                </span>
              </div>
            </div>

            {/* Chips — scrollable if content overflows */}
            <div className="overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-cta" />
                </div>
              ) : areas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-5">
                  <p className="text-[13px] text-muted-foreground/60">
                    No focus areas yet
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelect(null);
                      router.push('/areas');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-4 py-2 text-[12px] font-medium text-cta hover:text-cta/80 hover:border-cta/30 transition-colors"
                  >
                    <Plus size={13} />
                    Create one
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {areas.map((area, i) => (
                    <AreaChip
                      key={area.id}
                      area={area}
                      onSelect={handleSelect}
                      chipRef={i === 0 ? firstChipRef : undefined}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick start footer */}
            <div className="shrink-0 border-t border-border/20 px-5 py-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(null)}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium text-muted-foreground/60
                  hover:text-muted-foreground hover:bg-muted/50 transition-all duration-150"
              >
                <Play size={12} strokeWidth={1.8} className="fill-current" />
                Start without an area
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
