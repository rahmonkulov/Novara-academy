import {env} from 'cloudflare:workers';
import {PER_PAGE, buildDetailUrl, buildListUrl, parseId, parseListQuery, toCollege, toDetail} from '../../colleges-lib';

// GET /api/colleges?q=&state=&sel=&size=&control=&sort=&page=  → a page of colleges
// GET /api/colleges?id=166027                                   → one college
// Data comes from the U.S. Department of Education College Scorecard. Set the runtime Secret
// SCORECARD_API_KEY (free from api.data.gov); DEMO_KEY is only good for a few test requests.

const config = () => env as unknown as Record<string, string | undefined>;
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000;
const EDGE_TTL_SECONDS = 12 * 60 * 60;
const memory = new Map<string, {at: number; body: string}>();

class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`College Scorecard responded with ${status}`);
  }
}

const respond = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-store'},
  });
const fail = (error: string, status: number) => respond(JSON.stringify({error}), status);

function remember(key: string, body: string) {
  if (memory.size >= 300) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, {at: Date.now(), body});
}

// Two cache layers: this Worker instance's memory, then Cloudflare's edge cache when it is available.
async function cached(key: string, load: () => Promise<string>): Promise<string> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < MEMORY_TTL_MS) return hit.body;
  const cacheKey = new Request(`https://college-data.cache/${encodeURIComponent(key)}`);
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
  const body = await load();
  remember(key, body);
  if (edge) {
    try {
      await edge.put(cacheKey, new Response(body, {headers: {'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${EDGE_TTL_SECONDS}`}}));
    } catch {
      // Ignore cache write problems.
    }
  }
  return body;
}

async function scorecard(url: string): Promise<{metadata?: {total?: unknown}; results?: unknown}> {
  const response = await fetch(url, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw new UpstreamError(response.status);
  return response.json();
}

const rowsOf = (data: {results?: unknown}): Record<string, unknown>[] =>
  Array.isArray(data.results) ? (data.results as Record<string, unknown>[]) : [];

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const apiKey = config().SCORECARD_API_KEY || 'DEMO_KEY';
  try {
    if (params.has('id')) {
      const id = parseId(params.get('id'));
      if (!id) return fail('We could not find that college.', 400);
      const body = await cached(`detail:${id}`, async () => {
        const [row] = rowsOf(await scorecard(buildDetailUrl(id, apiKey)));
        if (!row) throw new UpstreamError(404);
        return JSON.stringify({college: toDetail(row)});
      });
      return respond(body);
    }
    const query = parseListQuery(params);
    const body = await cached(`list:${JSON.stringify(query)}`, async () => {
      const data = await scorecard(buildListUrl(query, apiKey));
      const total = Number(data.metadata?.total);
      return JSON.stringify({total: Number.isFinite(total) ? total : 0, page: query.page, perPage: PER_PAGE, results: rowsOf(data).map(toCollege)});
    });
    return respond(body);
  } catch (error) {
    const status = error instanceof UpstreamError ? error.status : 0;
    if (status === 404) return fail('We could not find that college.', 404);
    if (status === 429) return fail('The college data service is busy right now. Please try again in a few minutes.', 503);
    return fail('College data is temporarily unavailable. Please try again shortly.', 502);
  }
}
