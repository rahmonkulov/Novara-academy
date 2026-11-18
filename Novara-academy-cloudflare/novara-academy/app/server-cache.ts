// Shared response cache for the data API routes: this Worker instance's memory first,
// then Cloudflare's edge cache when it is available. Cache problems never block a request.
// When the outside data service fails, a copy up to a week old is served instead of an error.

const MEMORY_TTL_MS = 6 * 60 * 60 * 1000;
const EDGE_TTL_SECONDS = 12 * 60 * 60;
const STALE_TTL_SECONDS = 7 * 24 * 60 * 60;
const MEMORY_LIMIT = 400;
const ATTEMPT_TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 700;
const memory = new Map<string, {at: number; body: string}>();

export class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`Upstream data service responded with ${status}`);
  }
}

function remember(key: string, body: string) {
  if (memory.size >= MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, {at: Date.now(), body});
}

export async function cached(key: string, load: () => Promise<string>): Promise<string> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < MEMORY_TTL_MS) return hit.body;
  const cacheKey = new Request(`https://college-data.cache/${encodeURIComponent(key)}`);
  const staleKey = new Request(`https://college-data.cache/stale/${encodeURIComponent(key)}`);
  let edge: Cache | undefined;
  try {
    edge = (globalThis as unknown as {caches?: {default?: Cache}}).caches?.default;
  } catch {
    edge = undefined;
  }
  if (edge) {
    try {
      const stored = await edge.match(cacheKey);
      if (stored) {
        const body = await stored.text();
        remember(key, body);
        return body;
      }
    } catch {
      // Cache read problems should never block the page.
    }
  }
  let body: string;
  try {
    body = await load();
  } catch (error) {
    // The data service failed: an older copy is better than an error page.
    if (hit) return hit.body;
    if (edge) {
      try {
        const stale = await edge.match(staleKey);
        if (stale) return await stale.text();
      } catch {
        // Fall through to the original error.
      }
    }
    throw error;
  }
  remember(key, body);
  if (edge) {
    const store = (maxAge: number) => new Response(body, {headers: {'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${maxAge}`}});
    try {
      await Promise.all([edge.put(cacheKey, store(EDGE_TTL_SECONDS)), edge.put(staleKey, store(STALE_TTL_SECONDS))]);
    } catch {
      // Ignore cache write problems.
    }
  }
  return body;
}

export const respond = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=600' : 'no-store'},
  });

export const fail = (error: string, status: number) => respond(JSON.stringify({error}), status);

// One retry after a short pause for timeouts, dropped connections, 5xx and 429 answers.
export async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  let lastError: unknown = new UpstreamError(0);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    try {
      const response = await fetch(url, {headers: {Accept: 'application/json', ...headers}, signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)});
      if (response.ok) return (await response.json()) as T;
      lastError = new UpstreamError(response.status);
      // Other 4xx answers (not found, bad request) will not change on a retry.
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function upstreamFailure(error: unknown, notFound: string) {
  const status = error instanceof UpstreamError ? error.status : 0;
  if (status === 404) return fail(notFound, 404);
  if (status === 429) return fail('The data service is busy right now. Please try again in a few minutes.', 503);
  return fail('This data is temporarily unavailable. Please try again shortly.', 502);
}
