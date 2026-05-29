<div align="center">
  <h1>Together</h1>
  <p><strong>A calm, focused study companion.</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript" alt="TypeScript"></a>
  </p>
</div>

<br />

## About

Together is a personal study tool built for focused, distraction-free work. Track your study sessions with a Pomodoro timer, organize tasks by area, save YouTube lectures, and review your progress — all in one place.

This project is built on top of **[Curtus](https://github.com/dexisback/curtus)**, a polished open-source focus environment. I stripped out the collaborative features (study rooms, WebRTC video, real-time sockets) and kept what I actually use: the timer, tasks, library, sounds, and analytics.

---

## Features

- **Focus Timer** — Pomodoro-style timer with configurable focus and break intervals. Tracks every session automatically.
- **Smart Todo System** — Organize tasks by area, set deadlines, track weekly and monthly goals. D-Day countdown for milestones.
- **Study Library** — Save YouTube lectures and playlists. Watch them in-app while your focus timer runs alongside.
- **Ambient Sounds** — Built-in soundscapes (ocean waves, cafe bustle, etc.) to help you concentrate.
- **Focus Analytics** — Daily, weekly, and monthly focus hours. View streaks, rate your sessions, and track consistency.
- **Weekly Review** — Consolidated weekly analytics with all-time personal bests. Shareable daily progress card.
- **Areas** — Organize everything (tasks, sessions, library items) into custom areas with colors and emoji icons.
- **Configurable UI** — Light/dark themes, sound cues, and privacy controls.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Motion (Framer Motion)
- **Database**: Postgres + [Prisma v7 ORM](https://www.prisma.io/)
- **Auth**: Better-Auth
- **Caching**: Upstash Redis

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x`
- **Postgres Database** (local or hosted)
- **Redis** (local or Upstash)

### 1. Install

```bash
npm ci
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `UPSTASH_REDIS_URL`, and `UPSTASH_REDIS_TOKEN`.

### 3. Database

```bash
npx prisma generate
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Available Scripts

- `npm run dev` — Start the Next.js app in development mode.
- `npm run build` — Create a production build.
- `npm run start` — Run the compiled production build.
- `npm run check` — Run ESLint and TypeScript checks.
- `npm test` — Run Vitest tests.
- `npm run format` — Format code with Prettier.

---

## Credits

This project is built on top of **[Curtus](https://github.com/dexisback/curtus)** by [@dextertwts/amaan](https://github.com/dextertwts). Curtus was originally inspired by the [Yeolpumta (YPT)](https://www.yeolpumta.com/en/) app.

---

## License

AGPL-3.0. See [LICENSE](LICENSE) for details.
