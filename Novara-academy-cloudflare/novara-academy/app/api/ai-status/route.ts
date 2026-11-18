import {env} from 'cloudflare:workers';
import {PROVIDER_NAMES, ProviderError, askJson, availableProviders, parseJsonText, type AiEnv, type ProviderId} from '../../ai-providers';

// GET /api/ai-status → which AI providers answer right now, so the owner can check keys after adding them.
// Each check is a tiny prompt. Answers are reused for five minutes so the page cannot be used to burn quota.

type Status = {provider: ProviderId; name: string; model?: string; ok: boolean; error?: string; ms: number};
const REUSE_MS = 5 * 60 * 1000;
let last: {at: number; body: string} | null = null;

// Other services' error text, without anything that looks like a key.
const clean = (text: string) => text.replace(/\b(sk|key|token|AIza)[-_a-z0-9*]{8,}/gi, '[hidden]').slice(0, 160);

export async function GET() {
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'};
  if (last && Date.now() - last.at < REUSE_MS) return new Response(last.body, {headers});
  const c = env as unknown as AiEnv;
  const providers: Status[] = await Promise.all(
    availableProviders(c).map(async provider => {
      const started = Date.now();
      try {
        const answer = await askJson(provider, c, {system: 'You are a health check. Reply with JSON only.', user: 'Return exactly this JSON object: {"ok": true}', maxTokens: 50, timeoutMs: 15000});
        const ok = (parseJsonText(answer.text) as {ok?: unknown} | null)?.ok === true;
        return {provider, name: PROVIDER_NAMES[provider], model: answer.model, ok, ...(ok ? {} : {error: 'Answered, but not with the expected JSON.'}), ms: Date.now() - started};
      } catch (error) {
        const message = error instanceof ProviderError ? error.message : String(error);
        return {provider, name: PROVIDER_NAMES[provider], ok: false, error: clean(message), ms: Date.now() - started};
      }
    }),
  );
  const body = JSON.stringify({checkedAt: new Date().toISOString(), providers}, null, 2);
  last = {at: Date.now(), body};
  return new Response(body, {headers});
}
