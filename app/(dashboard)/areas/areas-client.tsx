'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useSound } from '@/components/sound-provider';

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
];

type AreaWithCounts = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
  _count: {
    tasks: number;
    focusSessions: number;
    libraryItems: number;
  };
};

export default function AreasClient({
  initialAreas,
}: {
  initialAreas: AreaWithCounts[];
}) {
  const router = useRouter();
  const { play } = useSound();
  const [areas, setAreas] = useState(initialAreas);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  function openCreate() {
    setEditId(null);
    setName('');
    setColor('#6366f1');
    setIcon('');
    setShowForm(true);
    play('modalOpen');
  }

  function openEdit(area: AreaWithCounts) {
    setEditId(area.id);
    setName(area.name);
    setColor(area.color);
    setIcon(area.icon ?? '');
    setShowForm(true);
    play('modalOpen');
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setName('');
    setColor('#6366f1');
    setIcon('');
    setBusy(false);
    play('modalClose');
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/areas/${editId}` : '/api/areas';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, color, icon: icon.trim() || null }),
      });
      if (!res.ok) {
        play('error');
        return;
      }
      const saved = (await res.json()) as AreaWithCounts;
      if (editId) {
        setAreas((prev) => prev.map((a) => (a.id === editId ? saved : a)));
      } else {
        setAreas((prev) => [...prev, saved]);
      }
      play('success');
      closeForm();
      router.refresh();
    } catch {
      play('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteBusyId) return;
    if (!window.confirm('Delete this area? Tasks, sessions, and library items will not be removed, but their area tag will be cleared.')) return;
    setDeleteBusyId(id);
    const snapshot = areas;
    setAreas((prev) => prev.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setAreas(snapshot);
        play('error');
        return;
      }
      play('success');
      if (editId === id) closeForm();
      router.refresh();
    } catch {
      setAreas(snapshot);
      play('error');
    } finally {
      setDeleteBusyId(null);
    }
  }

  const totalItems = useCallback(
    () => areas.reduce((sum, a) => sum + a._count.tasks + a._count.focusSessions + a._count.libraryItems, 0),
    [areas],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col space-y-6 pt-2">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Layers size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
            <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Areas</h1>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1, scale: 1.04 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            onClick={openCreate}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border/70 bg-background text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
            aria-label="Create area"
          >
            <Plus size={14} />
          </motion.button>
        </div>

        {areas.length === 0 ? (
          <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
              Create areas to organize your work — DSA, Backend, Fitness, Core CS, Aptitude, whatever you're grinding.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {areas.map((area) => (
              <motion.div
                key={area.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex flex-col gap-2 rounded-xl border border-border/50 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ background: area.color }}
                    />
                    {area.icon && <span className="text-sm">{area.icon}</span>}
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {area.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => openEdit(area)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted/60"
                        aria-label="Edit area"
                      >
                        <Pencil size={11} strokeWidth={1.6} />
                      </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={deleteBusyId === area.id}
                      onClick={() => void handleDelete(area.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-destructive/70 hover:bg-destructive/10"
                      aria-label="Delete area"
                    >
                      <Trash2 size={11} strokeWidth={1.6} />
                    </motion.button>
                  </div>
                </div>
                <div className="flex gap-3 text-[10.5px] text-muted-foreground">
                  <span>{area._count.tasks} tasks</span>
                  <span>{area._count.focusSessions} sessions</span>
                  <span>{area._count.libraryItems} library</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-[10.5px] text-muted-foreground/60 text-center">
          {areas.length} area{areas.length !== 1 ? 's' : ''} · {totalItems()} tagged items
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-[120] flex max-h-[100dvh] items-end justify-center overflow-y-auto overflow-x-hidden p-4 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget && !busy) closeForm(); }}
          >
            <div
              className="absolute inset-0 bg-background/25"
              style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ y: 8, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
              className="relative z-10 my-auto w-full max-w-md rounded-xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(17,24,39,0.06),0_18px_40px_rgba(17,24,39,0.12)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">
                  {editId ? 'Edit area' : 'Create area'}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={busy}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. DSA, Backend, Fitness"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Icon (emoji, optional)</span>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. 🏋️, 💻, 📚"
                    maxLength={10}
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-7 w-7 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground/40' : 'hover:scale-110'
                        }`}
                        style={{ background: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={closeForm}
                    disabled={busy}
                    className="rounded-[6px] border border-border/70 bg-background px-3 py-1.5 text-[11px] font-medium text-foreground"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => void handleSave()}
                    disabled={busy || !name.trim()}
                    className="app-cta-surface rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-cta-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Saving...' : 'Save'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// — AreasClient: CRUD for personal areas with color picker, emoji icon, item counts.
