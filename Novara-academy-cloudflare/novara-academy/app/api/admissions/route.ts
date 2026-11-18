import {env} from 'cloudflare:workers';
import {ADMISSIONS} from '../../admissions-data';
import {
  DEFAULT_DAILY_LIMIT, FAILED_RETRY_SECONDS, PER_VISITOR_DAILY_LIMIT, RESEARCH_TTL_DAYS, RUNNING_TIMEOUT_SECONDS,
  buildResearchRequest, officialDomain, outputText, toAdmissionsInfo, type ResearchState,
} from '../../admissions-ai';
import {fetchJson} from '../../server-cache';
import {buildWorldDetailUrl, parseWorldId, toWorldDetail} from '../../world-lib';

// GET  /api/admissions?id=I200769079  → admissions and money for one university, if known
// POST /api/admissions {id}            → have the AI read that university's official website and save the result
// Hand-checked entries (app/admissions-data.ts) always win. AI results are saved in the DATA_DB database, so each
// university is researched once and every later student sees it instantly. Limits: DEFAULT_DAILY_LIMIT new
// universities a day in total (ADMISSIONS_DAILY_LIMIT overrides it) and PER_VISITOR_DAILY_LIMIT per visitor.
// Set ADMISSIONS_AI to "off" to stop new research.

type Config = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ADMISSIONS_MODEL?: string;
  ADMISSIONS_AI?: string;
  ADMISSIONS_DAILY_LIMIT?: string;
  OPENALEX_API_KEY?: string;
  DATA_DB?: D1Database;
};
type Row = {status: string; data: string | null; error: string | null; domain: string | null; updated: number; started: number | null; failed: number | null; retry_after: number | null; detail: string | null};

const config = () => env as unknown as Config;
const now = () => Math.floor(Date.now() / 1000);
const reply = (body: ResearchState | {error: string}, status = 200) =>
  Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
const canResearch = (c: Config) => Boolean(c.OPENAI_API_KEY && c.DATA_DB && c.ADMISSIONS_AI !== 'off');

// "content" failures (the site does not publish the details) wait FAILED_RETRY_SECONDS before another try;
// "service" failures (the AI or data service had a problem) can be retried after SERVICE_RETRY_SECONDS.
const SERVICE_RETRY_SECONDS = 10 * 60;
class ResearchError extends Error {
  constructor(message: string, readonly detail = '', readonly kind: 'content' | 'service' = 'content') {
    super(message);
  }
}
// Error text from other services, kept for debugging without anything that looks like a key.
const cleanDetail = (text: string) => text.replace(/\b(sk|key|token)[-_a-z0-9]{8,}/gi, '[hidden]').slice(0, 300);

let tables: Promise<unknown> | null = null;
function ensureTables(db: D1Database) {
  tables ??= db
    .batch([
      db.prepare('CREATE TABLE IF NOT EXISTS admissions_ai (id TEXT PRIMARY KEY, status TEXT NOT NULL, data TEXT, error TEXT, domain TEXT, model TEXT, updated INTEGER NOT NULL DEFAULT 0, started INTEGER, failed INTEGER)'),
      db.prepare('CREATE TABLE IF NOT EXISTS ai_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)'),
    ])
    .then(async () => {
      // Columns added after the first release. "duplicate column" errors just mean they exist already.
      for (const column of ['retry_after INTEGER', 'detail TEXT']) {
        await db.prepare(`ALTER TABLE admissions_ai ADD COLUMN ${column}`).run().catch(() => undefined);
      }
    })
    .catch(error => {
      tables = null;
      throw error;
    });
  return tables;
}

function stateOf(row: Row | null, at: number, research: boolean): ResearchState & {stale?: boolean} {
  if (row?.started && at - row.started < RUNNING_TIMEOUT_SECONDS) return {status: 'running'};
  if (row?.status === 'ready' && row.data) {
    return {
      status: 'ready',
      source: 'ai',
      info: JSON.parse(row.data),
      collectedAt: new Date(row.updated * 1000).toISOString(),
      domain: row.domain || undefined,
      ...(at - row.updated > RESEARCH_TTL_DAYS * 86400 ? {stale: true} : {}),
    };
  }
  if (row?.status === 'failed' && row.retry_after && at < row.retry_after) {
    return {status: 'failed', error: row.error || 'We could not read this university’s website.', ...(row.detail ? {detail: row.detail} : {})} as ResearchState;
  }
  return {status: 'none', canResearch: research};
}

const readRow = (db: D1Database, id: string) =>
  db.prepare('SELECT status, data, error, domain, updated, started, failed, retry_after, detail FROM admissions_ai WHERE id = ?').bind(id).first<Row>();

async function withinLimit(db: D1Database, key: string, max: number, expires: number) {
  const row = await db
    .prepare('INSERT INTO ai_limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, expires)
    .first<{count: number}>();
  return Boolean(row && row.count <= max);
}

async function visitorKey(req: Request, day: string) {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${day}`));
  return [...new Uint8Array(digest)].slice(0, 12).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: Request) {
  const id = parseWorldId(new URL(req.url).searchParams.get('id'));
  if (!id) return reply({error: 'We could not find that university.'}, 400);
  if (ADMISSIONS[id]) return reply({status: 'ready', source: 'checked', info: ADMISSIONS[id]});
  const c = config();
  if (!c.DATA_DB) return reply({status: 'none', canResearch: false});
  try {
    await ensureTables(c.DATA_DB);
    return reply(stateOf(await readRow(c.DATA_DB, id), now(), canResearch(c)));
  } catch {
    return reply({status: 'none', canResearch: false});
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return reply({error: 'Not allowed.'}, 403);
  const body = (await req.json().catch(() => ({}))) as {id?: unknown};
  const id = parseWorldId(typeof body.id === 'string' ? body.id : null);
  if (!id) return reply({error: 'We could not find that university.'}, 400);
  if (ADMISSIONS[id]) return reply({status: 'ready', source: 'checked', info: ADMISSIONS[id]});
  const c = config();
  if (!canResearch(c)) return reply({error: 'Automatic research is not switched on yet.'}, 503);
  const db = c.DATA_DB!;
  await ensureTables(db);
  const started = now();
  const current = stateOf(await readRow(db, id), started, true);
  if (current.status === 'running' || current.status === 'failed' || (current.status === 'ready' && !current.stale)) return reply(current);

  const day = new Date(started * 1000).toISOString().slice(0, 10);
  const expires = started + 2 * 86400;
  const dailyLimit = Number(c.ADMISSIONS_DAILY_LIMIT) > 0 ? Math.floor(Number(c.ADMISSIONS_DAILY_LIMIT)) : DEFAULT_DAILY_LIMIT;
  if (!(await withinLimit(db, `visitor:${await visitorKey(req, day)}`, PER_VISITOR_DAILY_LIMIT, expires))) {
    return reply({error: `You have checked ${PER_VISITOR_DAILY_LIMIT} new universities today. You can check more tomorrow.`}, 429);
  }
  if (!(await withinLimit(db, `all:${day}`, dailyLimit, expires))) {
    return reply({error: 'Today’s new checks are used up. Please try again tomorrow.'}, 429);
  }
  // Only one research run per university at a time.
  const claimed = await db
    .prepare(`INSERT INTO admissions_ai (id, status, updated, started) VALUES (?, 'none', 0, ?)
      ON CONFLICT(id) DO UPDATE SET started = excluded.started
      WHERE admissions_ai.started IS NULL OR admissions_ai.started < ? RETURNING id`)
    .bind(id, started, started - RUNNING_TIMEOUT_SECONDS)
    .first();
  if (!claimed) return reply({status: 'running'});

  try {
    const headers: Record<string, string> = c.OPENALEX_API_KEY ? {Authorization: `Bearer ${c.OPENALEX_API_KEY}`} : {};
    const university = toWorldDetail(
      await fetchJson<Record<string, unknown>>(buildWorldDetailUrl(id), headers).catch(error => {
        throw new ResearchError('University data is temporarily unavailable. Please try again later.', String(error), 'service');
      }),
    );
    const domain = officialDomain(university.website);
    if (!domain) throw new ResearchError('This university has no official website on record, so there is nothing to read.');
    const model = c.ADMISSIONS_MODEL || c.OPENAI_MODEL || 'gpt-5.5';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {Authorization: `Bearer ${c.OPENAI_API_KEY}`, 'Content-Type': 'application/json'},
      signal: AbortSignal.timeout(150000),
      body: JSON.stringify(buildResearchRequest({model, name: university.name, country: university.country, domain, today: day})),
    });
    const payload = (await response.json().catch(() => ({}))) as {error?: {message?: string}};
    if (!response.ok) {
      throw new ResearchError(
        response.status === 429 ? 'The AI service is busy right now. Please try again later.' : 'The AI service could not do this right now. Please try again later.',
        `OpenAI ${response.status}: ${payload.error?.message || ''}`,
        'service',
      );
    }
    let raw: unknown = null;
    try {
      raw = JSON.parse(outputText(payload));
    } catch {
      raw = null;
    }
    const info = toAdmissionsInfo(raw, domain, new Date(started * 1000));
    if (!info) throw new ResearchError(`${domain} does not seem to publish admissions details for international students, or we could not find them.`);
    await db
      .prepare(`UPDATE admissions_ai SET status = 'ready', data = ?, error = NULL, domain = ?, model = ?, updated = ?, started = NULL, failed = NULL WHERE id = ?`)
      .bind(JSON.stringify(info), domain, model, started, id)
      .run();
    await db.prepare('DELETE FROM ai_limits WHERE expires < ?').bind(started).run().catch(() => undefined);
    return reply({status: 'ready', source: 'ai', info, collectedAt: new Date(started * 1000).toISOString(), domain});
  } catch (error) {
    const known = error instanceof ResearchError;
    const message = known ? error.message : 'We could not read this university’s website right now. Please try again later.';
    const detail = cleanDetail(known ? error.detail || error.message : String(error));
    const failedAt = now();
    const retryAfter = failedAt + (known && error.kind === 'content' ? FAILED_RETRY_SECONDS : SERVICE_RETRY_SECONDS);
    console.error('admissions research failed', id, detail);
    await db
      .prepare(`UPDATE admissions_ai SET status = CASE WHEN data IS NULL THEN 'failed' ELSE status END, error = ?, detail = ?, failed = ?, retry_after = ?, started = NULL WHERE id = ?`)
      .bind(message, detail, failedAt, retryAfter, id)
      .run()
      .catch(() => undefined);
    return reply({status: 'failed', error: message, detail} as ResearchState);
  }
}
