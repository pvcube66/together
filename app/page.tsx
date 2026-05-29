'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowRight, Brain, Timer, CheckSquare2, Library, Music, Sparkles } from 'lucide-react';
import LandingCardStack from '@/components/landing-card-stack';

const FEATURES = [
  {
    icon: Timer,
    title: 'Focus Timer & Pomodoro',
    description: 'Track study sessions with a beautiful Pomodoro timer. Configurable focus and break intervals keep you in flow.',
    gradient: 'from-amber-500/20 to-orange-500/10',
    color: 'text-amber-600',
  },
  {
    icon: CheckSquare2,
    title: 'Smart Todo System',
    description: 'Organize tasks by area, set deadlines, track weekly and monthly goals. D-Day countdown for milestones.',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    color: 'text-blue-600',
  },
  {
    icon: Library,
    title: 'Study Library',
    description: 'Save YouTube lectures and playlists. Watch them in-app while your focus timer runs alongside.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    color: 'text-violet-600',
  },
  {
    icon: Music,
    title: 'Ambient Sounds',
    description: 'Boost concentration with curated soundscapes — ocean waves, cafe bustle, and more. Built right in.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    color: 'text-emerald-600',
  },
  {
    icon: Brain,
    title: 'Focus Analytics',
    description: 'Track daily, weekly, and monthly focus hours. View streaks, rate your sessions, and grow consistency.',
    gradient: 'from-rose-500/20 to-pink-500/10',
    color: 'text-rose-600',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f7f5f2] dark:bg-[var(--background)]">
      {/* Background bloom */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-amber-500/8 to-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-40 left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-500/6 to-violet-500/4 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta text-white text-sm font-bold">
            T
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">Together</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-border/60 bg-background/80 px-4 py-2 text-[13px] font-semibold text-foreground/85 backdrop-blur-sm transition-all hover:bg-accent hover:border-border"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="app-cta-surface inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold"
          >
            Get started
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-12 text-center">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.58, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <Sparkles size={12} />
              Study with intention
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.58, 1] }}
            className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your focused study
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
              companion
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0, 0, 0.58, 1] }}
            className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground"
          >
            A calm, beautiful space for focused study. Track sessions with the Pomodoro timer, organize tasks by area, save YouTube lectures, and review your progress.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0, 0, 0.58, 1] }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/signup"
              className="app-cta-surface inline-flex h-12 items-center gap-2 rounded-xl px-7 text-[14px] font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start studying free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-7 text-[14px] font-semibold text-foreground/85 backdrop-blur-sm transition-all hover:bg-accent/70 active:scale-[0.98]"
            >
              Sign in
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <section className="relative z-10 border-t border-border/30 bg-[#f5f3ef] px-6 py-24 dark:bg-[var(--muted)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Everything you need to stay focused
            </h2>
            <p className="mt-3 text-[14px] text-muted-foreground">
              A thoughtfully designed study companion — no distractions, just flow.
            </p>
          </div>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0, 0, 0.58, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-ambient-sm transition-all hover:shadow-ambient-md"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-40 transition-opacity group-hover:opacity-60`} />
                <div className="relative z-10">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/80 ${feature.color}`}>
                    <feature.icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-[13px] font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Stack Preview */}
      <section className="relative z-10 border-t border-border/20 bg-[#f4f2ee] px-6 py-24 dark:bg-[var(--card)]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Explore the experience
            </h2>
            <p className="mt-3 text-[14px] text-muted-foreground">
              Hover over a card to see it in detail.
            </p>
          </div>
          <LandingCardStack className="mx-auto h-[28rem] max-w-4xl" />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border/20 bg-[#f5f3ef] px-6 py-24 dark:bg-[var(--muted)]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to focus?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14px] text-muted-foreground">
            Join students who use Together to stay accountable and achieve their study goals.
          </p>
          <Link
            href="/signup"
            className="app-cta-surface mt-10 inline-flex h-12 items-center gap-2 rounded-xl px-8 text-[14px] font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started for free
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 bg-[#f4f2ee] px-6 py-8 dark:bg-[var(--card)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cta text-white text-[10px] font-bold">
              T
            </div>
            <span className="text-[12px] font-semibold text-muted-foreground">Together</span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Built on top of <a href="https://github.com/dexisback/curtus" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground/80">Curtus</a>. &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
