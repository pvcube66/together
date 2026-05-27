export function sanitizeEnv() {
  const keys = [
    "DATABASE_URL",
    "PRISMA_DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "BETTER_AUTH_SECRET",
    "REDIS_URL",
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "VERCEL_URL",
  ];
  for (const key of keys) {
    if (process.env[key]) {
      process.env[key] = process.env[key]!.trim();
    }
  }
}

// Automatically execute on load
sanitizeEnv();
