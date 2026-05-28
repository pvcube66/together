'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[global-error]', error.message, error.digest ?? '');

  return (
    <html>
      <body className="grid min-h-screen place-items-center bg-[var(--background,#f7f5f2)] p-6 text-[var(--foreground,#1a1a1a)]">
        <div className="max-w-md space-y-3 text-center">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="text-sm opacity-70">
            Try again, and if it keeps happening, refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-[var(--border,#e0ddd5)] bg-[var(--card,#fff)] px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
