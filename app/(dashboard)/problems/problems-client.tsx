'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Beaker,
  CheckCircle,
  Clock,
  ExternalLink,
  Lightbulb,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import AreaSelector from '@/components/area-selector';
import { useSound } from '@/components/sound-provider';

type ProblemLogItem = {
  id: string;
  platform: string;
  problemTitle: string;
  problemUrl: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string | null;
  timeTakenMinutes: number | null;
  hintsUsed: number | null;
  notes: string | null;
  solvedAt: string;
  areaId: string | null;
  area: { id: string; name: string; color: string; icon: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank', 'Other'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
const DIFFICULTY_COLORS = {
  EASY: '#22c55e',
  MEDIUM: '#eab308',
  HARD: '#ef4444',
};

const TOPICS = [
  'Arrays', 'Strings', 'Hash Table', 'Linked List', 'Stack', 'Queue',
  'Binary Tree', 'BST', 'Graph', 'DP', 'Greedy', 'Binary Search',
  'Two Pointers', 'Sliding Window', 'Recursion', 'Backtracking',
  'Sorting', 'Heap', 'Trie', 'Union Find', 'Segment Tree', 'Bit Manipulation',
  'Math', 'Geometry', 'Combinatorics', 'Number Theory', 'Other',
];

export default function ProblemsClient({
  initialLogs,
  totalEasy,
  totalMedium,
  totalHard,
}: {
  initialLogs: ProblemLogItem[];
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
}) {
  const router = useRouter();
  const { play } = useSound();
  const [logs, setLogs] = useState(initialLogs);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  // Form state
  const [platform, setPlatform] = useState('LeetCode');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemUrl, setProblemUrl] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [topic, setTopic] = useState('');
  const [timeTakenMinutes, setTimeTakenMinutes] = useState('');
  const [hintsUsed, setHintsUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [solvedDate, setSolvedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const totalSolved = totalEasy + totalMedium + totalHard;
  const filteredLogs = filterDifficulty
    ? logs.filter((l) => l.difficulty === filterDifficulty)
    : logs;

  function openCreate() {
    setEditId(null);
    setPlatform('LeetCode');
    setProblemTitle('');
    setProblemUrl('');
    setDifficulty('MEDIUM');
    setTopic('');
    setTimeTakenMinutes('');
    setHintsUsed('');
    setNotes('');
    setAreaId(null);
    setSolvedDate(new Date().toISOString().slice(0, 10));
    setShowForm(true);
    play('modalOpen');
  }

  function openEdit(log: ProblemLogItem) {
    setEditId(log.id);
    setPlatform(log.platform);
    setProblemTitle(log.problemTitle);
    setProblemUrl(log.problemUrl ?? '');
    setDifficulty(log.difficulty);
    setTopic(log.topic ?? '');
    setTimeTakenMinutes(log.timeTakenMinutes?.toString() ?? '');
    setHintsUsed(log.hintsUsed?.toString() ?? '');
    setNotes(log.notes ?? '');
    setAreaId(log.areaId);
    setSolvedDate(log.solvedAt.slice(0, 10));
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
    if (!problemTitle.trim() || busy) return;
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const url = editId ? `/api/problem-logs/${editId}` : '/api/problem-logs';
      const body = {
        platform,
        problemTitle: problemTitle.trim(),
        problemUrl: problemUrl.trim() || null,
        difficulty,
        topic: topic || null,
        timeTakenMinutes: timeTakenMinutes ? parseInt(timeTakenMinutes, 10) : null,
        hintsUsed: hintsUsed ? parseInt(hintsUsed, 10) : null,
        notes: notes.trim() || null,
        areaId,
        solvedAt: new Date(solvedDate).toISOString(),
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
      const saved = (await res.json()) as ProblemLogItem;
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
    if (!window.confirm('Delete this problem log?')) return;
    setDeleteBusyId(id);
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/problem-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setLogs(snapshot);
        play('error');
        return;
      }
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
            <Beaker size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
            <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Problem Log</h1>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1, scale: 1.04 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            onClick={openCreate}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border/70 bg-background text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
            aria-label="Log problem"
          >
            <Plus size={14} />
          </motion.button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalSolved}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <button
            type="button"
            onClick={() => setFilterDifficulty(filterDifficulty === 'EASY' ? null : 'EASY')}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
              filterDifficulty === 'EASY'
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-border/40 bg-card/60 hover:bg-accent/50'
            }`}
          >
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalEasy}</p>
            <p className="text-[10px] text-muted-foreground">Easy</p>
          </button>
          <button
            type="button"
            onClick={() => setFilterDifficulty(filterDifficulty === 'MEDIUM' ? null : 'MEDIUM')}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
              filterDifficulty === 'MEDIUM'
                ? 'border-yellow-500/40 bg-yellow-500/10'
                : 'border-border/40 bg-card/60 hover:bg-accent/50'
            }`}
          >
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalMedium}</p>
            <p className="text-[10px] text-muted-foreground">Medium</p>
          </button>
          <button
            type="button"
            onClick={() => setFilterDifficulty(filterDifficulty === 'HARD' ? null : 'HARD')}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
              filterDifficulty === 'HARD'
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-border/40 bg-card/60 hover:bg-accent/50'
            }`}
          >
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalHard}</p>
            <p className="text-[10px] text-muted-foreground">Hard</p>
          </button>
        </div>

        {/* List */}
        {filteredLogs.length === 0 ? (
          <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
              {filterDifficulty
                ? `No ${filterDifficulty.toLowerCase()} problems logged yet.`
                : 'No problems logged yet. Log your first DSA problem to start tracking your progress.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log) => (
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
                        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {log.platform}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/90"
                          style={{ background: DIFFICULTY_COLORS[log.difficulty] }}
                        >
                          {log.difficulty === 'EASY' ? 'Easy' : log.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
                        </span>
                        {log.topic && (
                          <span className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {log.topic}
                          </span>
                        )}
                        {log.area && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: log.area.color }}
                            />
                            {log.area.icon && <span>{log.area.icon}</span>}
                            {log.area.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-foreground leading-snug">
                        {log.problemUrl ? (
                          <a
                            href={log.problemUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            {log.problemTitle}
                            <ExternalLink size={10} className="opacity-60" />
                          </a>
                        ) : (
                          log.problemTitle
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => openEdit(log)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted/60"
                        aria-label="Edit"
                      >
                        <Lightbulb size={11} strokeWidth={1.6} />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        disabled={deleteBusyId === log.id}
                        onClick={() => void handleDelete(log.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-destructive/70 hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 size={11} strokeWidth={1.6} />
                      </motion.button>
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                      {log.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground/70">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(log.solvedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </span>
                    {log.timeTakenMinutes != null && (
                      <span>{log.timeTakenMinutes}m</span>
                    )}
                    {log.hintsUsed != null && (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle size={10} />
                        {log.hintsUsed} hint{log.hintsUsed !== 1 ? 's' : ''}
                      </span>
                    )}
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
                  {editId ? 'Edit problem' : 'Log problem'}
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
                <div className="grid grid-cols-2 gap-3">
                  {/* Platform */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Platform</span>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  {/* Difficulty */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Difficulty</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Problem Title */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Problem title</span>
                  <input
                    type="text"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="e.g. Two Sum"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    autoFocus
                  />
                </label>

                {/* Problem URL */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">URL (optional)</span>
                  <input
                    type="url"
                    value={problemUrl}
                    onChange={(e) => setProblemUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/two-sum"
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Topic */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Topic</span>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    >
                      <option value="">None</option>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>

                  {/* Area */}
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

                <div className="grid grid-cols-2 gap-3">
                  {/* Time taken */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Time (minutes)</span>
                    <input
                      type="number"
                      min={0}
                      max={1440}
                      value={timeTakenMinutes}
                      onChange={(e) => setTimeTakenMinutes(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    />
                  </label>

                  {/* Hints used */}
                  <label className="block">
                    <span className="mb-1 block text-[10.5px] text-muted-foreground">Hints used</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hintsUsed}
                      onChange={(e) => setHintsUsed(e.target.value)}
                      placeholder="e.g. 0"
                      className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                    />
                  </label>
                </div>

                {/* Solved date */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Date solved</span>
                  <input
                    type="date"
                    value={solvedDate}
                    onChange={(e) => setSolvedDate(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
                  />
                </label>

                {/* Notes */}
                <label className="block">
                  <span className="mb-1 block text-[10.5px] text-muted-foreground">Notes (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key takeaway, approach used, etc."
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
                    disabled={busy || !problemTitle.trim()}
                    className="app-cta-surface rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-cta-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Saving...' : editId ? 'Save' : 'Log problem'}
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

// — ProblemsClient: list, log, edit, and delete problem entries with difficulty stats and filtering.
