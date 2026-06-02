'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import AddJobModal from '@/components/jobs/add-job-modal';
import { useSound } from '@/components/sound-provider';
import { AnimatedCounter } from '@/components/animated-counter';

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

type JobsClientProps = {
  initialJobs: JobItem[];
  totalApps: number;
  activeApps: number;
  offers: number;
  rejected: number;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All', color: '' },
  { value: 'SAVED', label: 'Saved', color: 'bg-gray-400' },
  { value: 'APPLIED', label: 'Applied', color: 'bg-blue-500' },
  { value: 'PHONE_SCREEN', label: 'Phone', color: 'bg-indigo-500' },
  { value: 'TECHNICAL', label: 'Technical', color: 'bg-purple-500' },
  { value: 'INTERVIEW', label: 'Interview', color: 'bg-amber-500' },
  { value: 'OFFER', label: 'Offer', color: 'bg-emerald-500' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-slate-400' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  PHONE_SCREEN: 'Phone Screen',
  TECHNICAL: 'Technical',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLOR: Record<string, string> = {
  SAVED: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  APPLIED: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  PHONE_SCREEN: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  TECHNICAL: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  INTERVIEW: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  OFFER: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  REJECTED: 'text-red-500 bg-red-500/10 border-red-500/20',
  WITHDRAWN: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

function JobsDashboard({
  initialJobs,
  totalApps,
  activeApps,
  offers,
  rejected,
}: JobsClientProps) {
  const router = useRouter();
  const { play } = useSound();
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    if (!filterStatus) return jobs;
    return jobs.filter((j) => j.status === filterStatus);
  }, [jobs, filterStatus]);

  const openCreate = useCallback(() => {
    setEditId(null);
    setShowForm(true);
    play('modalOpen');
  }, [play]);

  const openEdit = useCallback((job: JobItem) => {
    setEditId(job.id);
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
    companyName: string;
    role: string;
    status: string;
    notes: string;
    url: string;
    dateStr: string;
  }) {
    if (!data.companyName.trim() || !data.role.trim() || busy) return;
    setBusy(true);
    try {
      const method = editId ? 'PATCH' : 'POST';
      const urlStr = editId ? `/api/jobs/${editId}` : '/api/jobs';
      const body = {
        companyName: data.companyName.trim(),
        role: data.role.trim(),
        status: data.status,
        notes: data.notes.trim() || null,
        url: data.url.trim() || null,
        date: new Date(data.dateStr).toISOString(),
      };
      const res = await fetch(urlStr, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        play('error');
        return;
      }
      const saved = (await res.json()) as JobItem;
      if (editId) {
        setJobs((prev) => prev.map((j) => (j.id === editId ? saved : j)));
      } else {
        setJobs((prev) => [saved, ...prev]);
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
    if (!window.confirm('Delete this job application?')) return;
    setDeleteBusyId(id);
    const snapshot = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setJobs(snapshot);
        play('error');
        return;
      }
      play('success');
      router.refresh();
    } catch {
      setJobs(snapshot);
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
            Job Applications
          </h1>
          <p className="text-[11.5px] text-muted-foreground">
            Track your job applications, interviews, and offers.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="app-cta-surface inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12px] font-medium text-cta-foreground self-start sm:self-center"
        >
          <Plus size={14} />
          Add Job
        </motion.button>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-4 gap-2 sm:gap-3"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-sky-500/10 to-blue-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={totalApps} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Total Apps</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={activeApps} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Active</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={offers} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Offers</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.58, 1] } } }}
          className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-2.5 transition-all hover:bg-card/85 hover:shadow-[var(--shadow-ambient-sm)]"
        >
          <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-red-500/10 to-rose-500/5 opacity-60" />
          <p className="text-[20px] font-semibold tabular-nums text-foreground relative">
            <AnimatedCounter value={rejected} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 relative">Rejected</p>
        </motion.div>
      </motion.div>

      {/* Filter and Content Panel */}
      <div className="flex flex-col gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-3 overflow-x-auto">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground shrink-0">
            <Filter size={11} /> Filter:
          </span>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setFilterStatus(opt.value === 'ALL' ? null : opt.value);
                  play('tap');
                }}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-all ${
                  (opt.value === 'ALL' && !filterStatus) || filterStatus === opt.value
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="flex min-h-[16rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[color:var(--panel-texture-bg)] bg-[image:var(--panel-texture-image)] bg-[length:340px_340px] px-6 text-center">
            <p className="max-w-md text-[13px] font-medium text-muted-foreground [text-wrap:pretty]">
              No job applications yet. Add your first one to start tracking!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence initial={false}>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/50 bg-card/50 p-3.5 transition-all hover:bg-card/85"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <Calendar size={10} />
                        {new Date(job.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEdit(job)}
                        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={deleteBusyId === job.id}
                        onClick={() => void handleDelete(job.id)}
                        className="p-1 rounded text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Company and Role */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                        {job.companyName}
                      </h3>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {job.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLOR[job.status] || ''}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_OPTIONS.find(o => o.value === job.status)?.color || ''}`} />
                        {STATUS_LABEL[job.status] || job.status}
                      </span>
                    </div>
                  </div>

                  {/* URL and Notes */}
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10.5px] text-blue-500 hover:text-blue-400 transition-colors w-fit"
                    >
                      <ExternalLink size={10} />
                      View posting
                    </a>
                  )}
                  {job.notes && (
                    <p className="text-[11.5px] text-muted-foreground bg-muted/20 rounded-md p-2 mt-1 whitespace-pre-wrap antialiased">
                      {job.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Job Modal */}
      <AddJobModal
        open={showForm}
        editJob={editId ? jobs.find((j) => j.id === editId) ?? null : null}
        busy={busy}
        onClose={closeForm}
        onSave={(data) => { void handleSave(data); }}
      />
    </div>
  );
}

export default function JobsClient(props: JobsClientProps) {
  return (
    <Suspense fallback={
      <div className="flex h-[200px] items-center justify-center text-[12px] text-muted-foreground">
        Loading jobs...
      </div>
    }>
      <JobsDashboard {...props} />
    </Suspense>
  );
}
