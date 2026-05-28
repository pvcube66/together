'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Star,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Filter,
} from 'lucide-react';
import AreaSelector from '@/components/area-selector';
import { useSound } from '@/components/sound-provider';
import { AnimatedCounter } from '@/components/animated-counter';

type LogItem = {
  id: string;
  title: string;
  notes: string | null;
  durationMin: number | null;
  rating: number | null;
  date: string;
  areaId: string;
  area: { id: string; name: string; color: string; icon: string | null };
  createdAt: string;
  updatedAt: string;
};

type LogsClientProps = {
  initialLogs: LogItem[];
  totalEntries: number;
  averageRating: number;
  totalHours: number;
};

function LogsDashboard({
  initialLogs,
  totalEntries,
  averageRating,
  totalHours,
}: LogsClientProps) {
  const router = useRouter();
  const { play } = useSound();
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [filterAreaId, setFilterAreaId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [rating, setRating] = useState('7');
  const [enableRating, setEnableRating] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredLogs = useMemo(() => {
    if (!filterAreaId) return logs;
    return logs.filter((l) => l.areaId === filterAreaId);
  }, [logs, filterAreaId]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setTitle('');
    setNotes('');
    setDurationMin('');
    setRating('7');
    setEnableRating(false);
    setAreaId(null);
    setDateStr(new Date().toISOString().slice(0, 10));
    setShowForm(true);
    play('modalOpen');
  }, [play]);

  const openEdit = useCallback((log: LogItem) => {
    setEditId(log.id);
    setTitle(log.title);
    setNotes(log.notes ?? '');
    setDurationMin(log.durationMin?.toString() ?? '');
    setRating(log.rating?.toString() ?? '7');
    setEnableRating(log.rating !== null);
    setAreaId(log.areaId);
    setDateStr(log.date.slice(0, 10));
    setShowForm(true);
    play('modalOpen');
  }, [play]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setBusy(false);
    play('modalClose');
  }, [play]);

  async function handleSave() {
    if (!title.trim() || busy) return;
    if (!areaId) {
      alert('Please select an Area before saving.');
      return;
    }
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/logs/${editId}` : '/api/logs';
      const body = {
        title: title.trim(),
        notes: notes.trim() || null,
        durationMin: durationMin ? parseInt(durationMin, 10) : null,
        rating: enableRating ? parseInt(rating, 10) : null,
        date: new Date(dateStr).toISOString(),
        areaId,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        play('error');
        return;
      }
      const saved = (await res.json()) as LogItem;
      if (editId) {
        setLogs((prev) => prev.map((l) => (l.id === editId ? saved : l)));
      } else {
        setLogs((prev) => [saved, ...prev]);
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
    if (!window.confirm('Delete this log entry?')) return;
    setDeleteBusyId(id);
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setLogs(snapshot);
        play('error');
        return;
      }
      play('success');
      router.refresh();
    } catch {
      setLogs(snapshot);
      play('error');
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <div className="relative flex w-full max-w-[100vw] flex-col gap-5 overflow-x-hidden px-4 pb-6 pt-4 sm:px-5 sm:pb-8 sm:pt-6 md:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[16px] font-bold tracking-tight text-foreground sm:text-[18px]">
            Activity Logs
          </h1>
          <p className="text-[11.5px] text-muted-foreground">
            A single, generic logger to track study, fitness, and daily check-ins mapped to your respective Areas.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="app-cta-surface inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12px] font-medium text-cta-foreground self-start sm:self-center"
        >
          <Plus size={14} />
          Add Log Entry
        </motion.button>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-sky-500/10 to-blue-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={totalEntries} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Total Entries</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            {averageRating > 0 ? (
              <><AnimatedCounter value={averageRating} /><span className="text-[11px] text-muted-foreground">/10</span></>
            ) : (
              <span className="text-muted-foreground/60">—</span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Avg Productivity</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={totalHours} suffix="h" />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Hours Tracked</p>
        </motion.div>
      </motion.div>

      {/* Filter and Content Panel */}
      <div className="flex flex-col gap-4">
        {/* Area Filter Selector */}
        <div className="flex items-center gap-3 border-b border-border/30 pb-3">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Filter size={11} /> Filter by Area:
          </span>
          <div className="w-[180px]">
            <AreaSelector
              value={filterAreaId}
              onChange={setFilterAreaId}
              allowNull
              nullLabel="All Areas"
            />
          </div>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="flex min-h-[16rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
              No entries logged yet. Create your first generic log entry to start tracking!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/50 bg-card/50 p-3.5 transition-all hover:bg-card/85"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: log.area.color }} />
                        {log.area.icon && <span>{log.area.icon}</span>}
                        {log.area.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Calendar size={10} />
                        {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEdit(log)}
                        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={deleteBusyId === log.id}
                        onClick={() => void handleDelete(log.id)}
                        className="p-1 rounded text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Title and Badges */}
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {log.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {log.durationMin !== null && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                          <Clock size={10} />
                          {log.durationMin}m
                        </span>
                      )}
                      {log.rating !== null && (
                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-cta/10 px-1.5 py-0.5 text-[10px] font-bold text-cta">
                          <Star size={10} fill="currentColor" />
                          {log.rating}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {log.notes && (
                    <p className="text-[11.5px] text-muted-foreground bg-muted/20 rounded-md p-2 mt-1 whitespace-pre-wrap antialiased">
                      {log.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Single Generic Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-[150] flex max-h-[100dvh] items-end justify-center overflow-y-auto overflow-x-hidden p-4 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.58, 1] }}
            onClick={(e) => { if (e.target === e.currentTarget && !busy) closeForm(); }}
          >
            <div className="absolute inset-0 bg-background/25 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 8, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.58, 1] }}
              className="relative z-10 my-auto w-full max-w-lg rounded-xl border border-border/60 bg-card p-4 shadow-[var(--panel-shadow-modal)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">
                  {editId ? 'Edit Log Entry' : 'Log New Activity'}
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

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {/* Title */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">What did you do? (Title)</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Solved 3 LeetCode, Ran 5km, Meditated..."
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                </label>

                {/* Area Dropdown Selector */}
                <div>
                  <AreaSelector
                    value={areaId}
                    onChange={setAreaId}
                    label="Area (Required)"
                    allowNull={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Duration */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Duration (minutes)</span>
                    <input
                      type="number"
                      min={0}
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
                    />
                  </label>

                  {/* Date */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Date</span>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
                    />
                  </label>
                </div>

                {/* Rating score slider */}
                <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableRating}
                        onChange={(e) => setEnableRating(e.target.checked)}
                        className="rounded border-border/70 text-cta focus:ring-cta"
                      />
                      Add Productivity / Effort Rating (1-10)
                    </label>
                  </div>
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
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cta"
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Notes / Reflections (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Reflections, wins, blockers..."
                    className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
                  />
                </label>

                {/* Form Buttons */}
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
                    disabled={busy || !title.trim()}
                    className="app-cta-surface rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-cta-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Saving...' : editId ? 'Save' : 'Log entry'}
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

export default function LogsClient(props: LogsClientProps) {
  return (
    <Suspense fallback={
      <div className="flex h-[200px] items-center justify-center text-[12px] text-muted-foreground">
        Loading logs...
      </div>
    }>
      <LogsDashboard {...props} />
    </Suspense>
  );
}
