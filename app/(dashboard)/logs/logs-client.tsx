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
  Filter,
} from 'lucide-react';
import AreaSelector from '@/components/area-selector';
import AddLogModal from '@/components/logs/add-log-modal';
import { useSound } from '@/components/sound-provider';
import { AnimatedCounter } from '@/components/animated-counter';

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

  const filteredLogs = useMemo(() => {
    if (!filterAreaId) return logs;
    return logs.filter((l) => l.areaId === filterAreaId);
  }, [logs, filterAreaId]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setShowForm(true);
    play('modalOpen');
  }, [play]);

  const openEdit = useCallback((log: LogItem) => {
    setEditId(log.id);
    setShowForm(true);
    play('modalOpen');
  }, [play]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditId(null);
    setBusy(false);
    play('modalClose');
  }, [play]);

  async function handleSave(data: {
    title: string;
    notes: string;
    durationMin: string;
    rating: string;
    enableRating: boolean;
    areaId: string;
    dateStr: string;
  }) {
    if (!data.title.trim() || busy) return;
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/logs/${editId}` : '/api/logs';
      const body = {
        title: data.title.trim(),
        notes: data.notes.trim() || null,
        durationMin: data.durationMin ? parseInt(data.durationMin, 10) : null,
        rating: data.enableRating ? parseInt(data.rating, 10) : null,
        date: new Date(data.dateStr).toISOString(),
        areaId: data.areaId,
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
                        {log.area ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: log.area.color }} />
                            {log.area.icon && <span>{log.area.icon}</span>}
                            {log.area.name}
                          </>
                        ) : (
                          <span className="text-muted-foreground/60">No area</span>
                        )}
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

      {/* Full-blocking Add/Edit Log Modal */}
      <AddLogModal
        open={showForm}
        editLog={editId ? logs.find((l) => l.id === editId) ?? null : null}
        busy={busy}
        onClose={closeForm}
        onSave={(data) => { void handleSave(data); }}
      />
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
