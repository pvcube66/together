'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Footprints,
  Clock,
  Zap,
  Plus,
  Trash2,
  Route,
  Gauge,
} from 'lucide-react';
import AreaSelector from '@/components/area-selector';
import { useSound } from '@/components/sound-provider';

type RunLogItem = {
  id: string;
  distanceKm: number;
  durationMin: number;
  paceMinPerKm: number | null;
  runType: 'EASY' | 'TEMPO' | 'INTERVAL' | 'LONG_RUN' | 'RACE';
  effort: number | null;
  routeName: string | null;
  notes: string | null;
  runDate: string;
  areaId: string | null;
  area: { id: string; name: string; color: string; icon: string | null } | null;
};

const RUN_TYPES = ['EASY', 'TEMPO', 'INTERVAL', 'LONG_RUN', 'RACE'] as const;
const RUN_TYPE_LABELS: Record<string, string> = {
  EASY: 'Easy', TEMPO: 'Tempo', INTERVAL: 'Interval', LONG_RUN: 'Long Run', RACE: 'Race',
};
const RUN_TYPE_COLORS: Record<string, string> = {
  EASY: '#22c55e', TEMPO: '#eab308', INTERVAL: '#ef4444', LONG_RUN: '#3b82f6', RACE: '#a855f7',
};

function formatPace(pace: number | null): string {
  if (pace == null) return '—';
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function RunsClient({
  initialLogs,
  totalDistance,
  totalDuration,
  runCount,
}: {
  initialLogs: RunLogItem[];
  totalDistance: number;
  totalDuration: number;
  runCount: number;
}) {
  const router = useRouter();
  const { play } = useSound();
  const [logs, setLogs] = useState(initialLogs);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  // Form state
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [runType, setRunType] = useState<'EASY' | 'TEMPO' | 'INTERVAL' | 'LONG_RUN' | 'RACE'>('EASY');
  const [effort, setEffort] = useState('');
  const [routeName, setRouteName] = useState('');
  const [notes, setNotes] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [runDate, setRunDate] = useState(() => new Date().toISOString().slice(0, 10));

  function openCreate() {
    setEditId(null);
    setDistanceKm('');
    setDurationMin('');
    setRunType('EASY');
    setEffort('');
    setRouteName('');
    setNotes('');
    setAreaId(null);
    setRunDate(new Date().toISOString().slice(0, 10));
    setShowForm(true);
    play('modalOpen');
  }

  function openEdit(log: RunLogItem) {
    setEditId(log.id);
    setDistanceKm(log.distanceKm.toString());
    setDurationMin(log.durationMin.toString());
    setRunType(log.runType);
    setEffort(log.effort?.toString() ?? '');
    setRouteName(log.routeName ?? '');
    setNotes(log.notes ?? '');
    setAreaId(log.areaId);
    setRunDate(log.runDate.slice(0, 10));
    setShowForm(true);
    play('modalOpen');
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setBusy(false);
    play('modalClose');
  }

  async function handleSave() {
    const dist = parseFloat(distanceKm);
    const dur = parseInt(durationMin, 10);
    if (!distanceKm || isNaN(dist) || dist <= 0 || isNaN(dur) || dur <= 0 || busy) return;
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/runs/${editId}` : '/api/runs';
      const computedPace = dur > 0 && dist > 0 ? Math.round((dur / dist) * 100) / 100 : null;
      const body = {
        distanceKm: dist,
        durationMin: dur,
        paceMinPerKm: computedPace,
        runType,
        effort: effort ? parseInt(effort, 10) : null,
        routeName: routeName.trim() || null,
        notes: notes.trim() || null,
        runDate: new Date(runDate).toISOString(),
        areaId,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { play('error'); return; }
      const saved = (await res.json()) as RunLogItem;
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
    if (!window.confirm('Delete this run?')) return;
    setDeleteBusyId(id);
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
      if (!res.ok) { setLogs(snapshot); play('error'); return; }
      play('success');
      if (editId === id) closeForm();
      router.refresh();
    } catch {
      setLogs(snapshot);
      play('error');
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col space-y-5 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Footprints size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
            <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Run Log</h1>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1, scale: 1.04 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            onClick={openCreate}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border/70 bg-background text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
            aria-label="Log run"
          >
            <Plus size={14} />
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{runCount}</p>
            <p className="text-[10px] text-muted-foreground">Runs</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalDistance}km</p>
            <p className="text-[10px] text-muted-foreground">Distance</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{formatDuration(totalDuration)}</p>
            <p className="text-[10px] text-muted-foreground">Duration</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">
              {totalDuration > 0 && totalDistance > 0
                ? formatPace(Math.round((totalDuration / totalDistance) * 100) / 100)
                : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg pace</p>
          </div>
        </div>

        {/* List */}
        {logs.length === 0 ? (
          <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
              No runs logged yet. Log your first run to start tracking your fitness progress.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/50 bg-card/50 p-3.5 transition-colors hover:bg-card/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/90"
                          style={{ background: RUN_TYPE_COLORS[log.runType] }}
                        >
                          {RUN_TYPE_LABELS[log.runType]}
                        </span>
                        {log.routeName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Route size={10} /> {log.routeName}
                          </span>
                        )}
                        {log.area && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: log.area.color }} />
                            {log.area.icon && <span>{log.area.icon}</span>}
                            {log.area.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[13px] font-medium text-foreground">
                        <span>{log.distanceKm}km</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {formatDuration(log.durationMin)}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Gauge size={12} /> {formatPace(log.paceMinPerKm)}
                        </span>
                        {log.effort && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Zap size={12} /> {log.effort}/10
                            </span>
                          </>
                        )}
                      </div>
                      {log.notes && (
                        <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-[10.5px] text-muted-foreground/70 tabular-nums whitespace-nowrap">
                        {new Date(log.runDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                      </span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        disabled={deleteBusyId === log.id}
                        onClick={() => void handleDelete(log.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                      >
                        <Trash2 size={11} strokeWidth={1.6} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
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
              className="relative z-10 my-auto w-full max-w-lg rounded-xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(17,24,39,0.06),0_18px_40px_rgba(17,24,39,0.12)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">
                  {editId ? 'Edit run' : 'Log run'}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={busy}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Distance (km)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      placeholder="e.g. 5.2"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                      autoFocus
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Duration (min)</span>
                    <input
                      type="number"
                      min={0}
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Run type</span>
                    <select
                      value={runType}
                      onChange={(e) => setRunType(e.target.value as typeof runType)}
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    >
                      {RUN_TYPES.map((t) => (
                        <option key={t} value={t}>{RUN_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Effort (1-10)</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={effort}
                      onChange={(e) => setEffort(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Route name</span>
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="e.g. Riverside loop"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    />
                  </label>
                  <div>
                    <AreaSelector
                      value={areaId}
                      onChange={setAreaId}
                      label="Area (optional)"
                      allowNull
                      nullLabel="No area"
                    />
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Date</span>
                  <input
                    type="date"
                    value={runDate}
                    onChange={(e) => setRunDate(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did it feel? Weather conditions?"
                    rows={3}
                    className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                  />
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
                    disabled={busy || !distanceKm || parseFloat(distanceKm) <= 0 || !durationMin || parseInt(durationMin) <= 0}
                    className="app-cta-surface rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-cta-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Saving...' : editId ? 'Save' : 'Log run'}
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

// — RunsClient: log, list, edit, and delete run entries with stats.
