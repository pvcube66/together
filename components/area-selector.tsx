'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

type Area = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

export default function AreaSelector({
  value,
  onChange,
  label,
  allowNull,
  nullLabel,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  allowNull?: boolean;
  nullLabel?: string;
}) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/areas', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { areas: Area[] };
        setAreas(data.areas);
        setLoaded(true);
      } catch {
        /* ignore */
      }
    }
    void load();
  }, []);

  // Re-fetch areas every time the dropdown opens (ensures fresh data)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch('/api/areas', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { areas: Area[] };
        setAreas(data.areas);
      } catch {
        /* ignore */
      }
    }
    void refresh();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = areas.find((a) => a.id === value);

  const handleSelect = useCallback(
    (id: string | null) => {
      onChange(id);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={ref} className="relative">
      {label && (
        <span className="mb-1 block text-[10.5px] text-muted-foreground">
          {label}
        </span>
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-border/70 bg-background px-3 text-[12px] text-foreground"
      >
        {selected ? (
          <>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: selected.color }}
            />
            {selected.icon && (
              <span className="text-xs">{selected.icon}</span>
            )}
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">
            {allowNull ? nullLabel || 'No area' : 'Select area'}
          </span>
        )}
      </motion.button>

      {open && loaded && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border/60 bg-card py-1 shadow-lg">
          {allowNull && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-[11.5px] text-muted-foreground hover:bg-muted/60"
            >
              {nullLabel || 'None'}
            </button>
          )}
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSelect(area.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-[11.5px] transition-colors hover:bg-muted/60 ${
                value === area.id ? 'bg-muted/40 font-medium text-foreground' : 'text-foreground/80'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: area.color }}
              />
              {area.icon && <span className="text-xs">{area.icon}</span>}
              <span>{area.name}</span>
            </button>
          ))}
          {areas.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">
              No areas yet. Create one in Areas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// — AreaSelector: dropdown to pick an area; loads from /api/areas.
