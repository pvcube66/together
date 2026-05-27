import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { withObservedSpan } from '@/lib/observability';

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  try {
    return await withObservedSpan(
      'api.auth.handler.get',
      { 'http.method': 'GET', 'http.route': '/api/auth/[...all]' },
      () => handlers.GET(request),
    );
  } catch (err) {
    console.error("[Better Auth GET Error]: Failed to handle GET request.", err);
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    return await withObservedSpan(
      'api.auth.handler.post',
      { 'http.method': 'POST', 'http.route': '/api/auth/[...all]' },
      () => handlers.POST(request),
    );
  } catch (err) {
    console.error("[Better Auth POST Error]: Failed to handle POST request.", err);
    throw err;
  }
}

// — Better Auth HTTP adapter for this app (sign-in, session, callbacks).
