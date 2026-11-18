// Daily limits for AI features, kept in the DATA_DB database. Visitors are identified by a short hash of their
// IP address and the day, so no IP address is stored.

let ready: Promise<unknown> | null = null;
function ensureTable(db: D1Database) {
  ready ??= db
    .prepare('CREATE TABLE IF NOT EXISTS ai_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)')
    .run()
    .catch(error => {
      ready = null;
      throw error;
    });
  return ready;
}

export async function visitorKey(req: Request, day: string) {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${day}`));
  return [...new Uint8Array(digest)].slice(0, 12).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Counts one use under `key` and says whether it is still within `max` for the day.
export async function withinLimit(db: D1Database, key: string, max: number) {
  await ensureTable(db);
  const expires = Math.floor(Date.now() / 1000) + 2 * 86400;
  const row = await db
    .prepare('INSERT INTO ai_limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, expires)
    .first<{count: number}>();
  return Boolean(row && row.count <= max);
}
