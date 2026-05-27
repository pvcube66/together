'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Activity,
  Battery,
  Moon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import AreaSelector from '@/components/area-selector';
import { useSound } from '@/components/sound-provider';

type CheckinItem = {
  id: string;
  date: string;
  moodScore: number;
  energyScore: number;
  focusScore: number;
  sleepHours: number | null;
  wins: string | null;
  blockers: string | null;
  notes: string | null;
  areaId: string | null;
  area: { id: string; name: string; color: string; icon: string | null } | null;
};

export default function CheckinsClient({
  initialCheckins,
  todayCheckin,
  averages,
  totalDays,
}: {
  initialCheckins: CheckinItem[];
  todayCheckin: Pick<CheckinItem, 'id' | 'moodScore' | 'energyScore' | 'focusScore' | 'sleepHours' | 'wins' | 'blockers' | 'notes' | 'areaId' | 'area'> | null;
  averages: { avgMood: number; avgEnergy: number; avgFocus: number };
  totalDays: number;
}) {
  const router = useRouter();
  const { play } = useSound();
  const [checkins, setCheckins] = useState(initialCheckins);
  const [moodScore, setMoodScore] = useState(todayCheckin?.moodScore ?? 7);
  const [energyScore, setEnergyScore] = useState(todayCheckin?.energyScore ?? 7);
  const [focusScore, setFocusScore] = useState(todayCheckin?.focusScore ?? 7);
  const [sleepHours, setSleepHours] = useState(todayCheckin?.sleepHours?.toString() ?? '');
  const [wins, setWins] = useState(todayCheckin?.wins ?? '');
  const [blockers, setBlockers] = useState(todayCheckin?.blockers ?? '');
  const [notes, setNotes] = useState(todayCheckin?.notes ?? '');
  const [areaId, setAreaId] = useState<string | null>(todayCheckin?.areaId ?? null);
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const isUpdate = todayCheckin != null && todayCheckin.id != null;
      const method = isUpdate ? 'PATCH' : 'POST';
      const url = isUpdate ? `/api/checkins/${todayCheckin!.id}` : '/api/checkins'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          moodScore,
          energyScore,
          focusScore,
          sleepHours: sleepHours ? parseFloat(sleepHours) : null,
          wins: wins.trim() || null,
          blockers: blockers.trim() || null,
          notes: notes.trim() || null,
          areaId,
        }),
      });
      if (!res.ok) { play('error'); return; }
      const saved = (await res.json()) as CheckinItem;
      setCheckins((prev) => {
        const filtered = prev.filter((c) => c.date.slice(0, 10) !== saved.date.slice(0, 10));
        return [saved, ...filtered];
      });
      play('success');
      router.refresh();
    } catch {
      play('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteBusyId) return;
    if (!window.confirm('Delete this check-in?')) return;
    setDeleteBusyId(id);
    const snapshot = checkins;
    setCheckins((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/checkins/${id}`, { method: 'DELETE' });
      if (!res.ok) { setCheckins(snapshot); play('error'); return; }
      play('success');
      router.refresh();
    } catch {
      setCheckins(snapshot);
      play('error');
    } finally {
      setDeleteBusyId(null);
    }
  }

  function ScoreSlider({ label, value, onChange, icon }: {
    label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode;
  }) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          {icon}
        </span>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium text-foreground/80">{label}</span>
            <span className="text-[11px] font-semibold tabular-nums text-foreground">{value}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none bg-muted/70 accent-[var(--color-cta)] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cta [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col space-y-5 pt-2">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <Sparkles size={14} strokeWidth={1.6} className="text-muted-foreground opacity-70" />
          <h1 className="text-[14px] font-semibold tracking-tight text-foreground">Daily Check-in</h1>
        </div>

        {/* Averages */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{totalDays}</p>
            <p className="text-[10px] text-muted-foreground">Days logged</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{averages.avgMood}</p>
            <p className="text-[10px] text-muted-foreground">Avg mood</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{averages.avgEnergy}</p>
            <p className="text-[10px] text-muted-foreground">Avg energy</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
            <p className="text-[20px] font-semibold tabular-nums text-foreground">{averages.avgFocus}</p>
            <p className="text-[10px] text-muted-foreground">Avg focus</p>
          </div>
        </div>

        {/* Today's Check-in */}
        <div className="rounded-xl border border-border/45 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] p-4 shadow-float">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Today&apos;s check-in
          </p>
          <div className="space-y-3">
            <ScoreSlider label="Mood" value={moodScore} onChange={setMoodScore} icon={<Brain size={13} />} />
            <ScoreSlider label="Energy" value={energyScore} onChange={setEnergyScore} icon={<Battery size={13} />} />
            <ScoreSlider label="Focus" value={focusScore} onChange={setFocusScore} icon={<Activity size={13} />} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                <Moon size={11} /> Sleep (hours)
              </span>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g. 8"
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

          <label className="mt-3 block">
            <span className="mb-1 block text-[10.5px] text-muted-foreground">Wins — what went well?</span>
            <input
              type="text"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="Finished that DP problem, had a good run..."
              className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-[10.5px] text-muted-foreground">Blockers — what didn't?</span>
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Struggled with focus, got distracted..."
              className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-[10.5px] text-muted-foreground">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any other thoughts..."
              className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-[12px] text-foreground"
            />
          </label>

          <div className="mt-3 flex justify-end">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => void handleSave()}
              disabled={busy}
              className="app-cta-surface rounded-[6px] px-4 py-2 text-[11.5px] font-medium text-cta-foreground disabled:opacity-60"
            >
              {busy ? 'Saving...' : todayCheckin ? 'Update check-in' : 'Save check-in'}
            </motion.button>
          </div>
        </div>

        {/* History */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            History
          </p>
          {checkins.length === 0 ? (
            <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-border/60 text-center">
              <p className="px-6 text-[11px] text-muted-foreground">No check-ins yet. Start today!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <AnimatePresence initial={false}>
                {checkins.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="group relative flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-3"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground/70 w-8">
                        {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Brain size={10} className="text-muted-foreground" /> {c.moodScore}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Battery size={10} className="text-muted-foreground" /> {c.energyScore}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Activity size={10} className="text-muted-foreground" /> {c.focusScore}
                        </span>
                        {c.sleepHours != null && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Moon size={10} /> {c.sleepHours}h
                          </span>
                        )}
                        {c.area && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.area.color }} />
                            {c.area.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={deleteBusyId === c.id}
                      onClick={() => void handleDelete(c.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                    >
                      <Trash2 size={11} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// — CheckinsClient: today's check-in form with sliders + historical list.
