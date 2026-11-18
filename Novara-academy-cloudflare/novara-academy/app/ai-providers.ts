// One place that talks to the AI companies. Each provider takes a system and a user message and returns the
// model's text, which should be a JSON object. Which providers run depends on which keys the site has:
// Cloudflare Workers AI needs no key (the AI binding), Gemini and Groq have free keys, OpenAI is paid.

export type ProviderId = 'gemini' | 'workers-ai' | 'groq' | 'openai';

export type AiEnv = {
  AI?: {run(model: string, input: Record<string, unknown>): Promise<unknown>};
  WORKERS_AI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

export const PROVIDER_NAMES: Record<ProviderId, string> = {
  gemini: 'Gemini (Google)',
  'workers-ai': 'Llama (Cloudflare)',
  groq: 'Groq',
  openai: 'ChatGPT (OpenAI)',
};

export function availableProviders(env: AiEnv): ProviderId[] {
  const list: ProviderId[] = [];
  if (env.GEMINI_API_KEY) list.push('gemini');
  if (env.AI) list.push('workers-ai');
  if (env.GROQ_API_KEY) list.push('groq');
  if (env.OPENAI_API_KEY) list.push('openai');
  return list;
}

export class ProviderError extends Error {
  constructor(readonly provider: ProviderId, readonly status: number, message: string) {
    super(`${PROVIDER_NAMES[provider]} ${status}: ${message}`.slice(0, 300));
  }
}

export type Prompt = {system: string; user: string; maxTokens: number};

// The first JSON object in a model's answer, even when wrapped in ```json fences or a sentence.
export function parseJsonText(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function openAiCompatible(provider: ProviderId, url: string, key: string, model: string, prompt: Prompt, fetcher: typeof fetch) {
  const response = await fetcher(url, {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model,
      messages: [{role: 'system', content: prompt.system}, {role: 'user', content: prompt.user}],
      response_format: {type: 'json_object'},
      ...(provider === 'openai' ? {max_completion_tokens: prompt.maxTokens} : {max_tokens: prompt.maxTokens, temperature: 0.2}),
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {error?: {message?: string}; choices?: {message?: {content?: string}}[]};
  if (!response.ok) throw new ProviderError(provider, response.status, body.error?.message || '');
  return body.choices?.[0]?.message?.content || '';
}

export async function askJson(provider: ProviderId, env: AiEnv, request: Prompt, fetcher: typeof fetch = fetch): Promise<{text: string; model: string}> {
  // Gemini and OpenAI models may "think" first, and thinking counts toward the token limit, so leave room.
  // Only tokens actually used are billed.
  const prompt = provider === 'gemini' || provider === 'openai' ? {...request, maxTokens: Math.max(request.maxTokens, 4096)} : request;
  if (provider === 'gemini') {
    // Google's free models are sometimes "experiencing high demand" (503) or rate-limited (429):
    // then the lighter Flash-Lite model gets one try.
    const models = env.GEMINI_MODEL ? [env.GEMINI_MODEL] : ['gemini-flash-latest', 'gemini-flash-lite-latest'];
    let lastError: ProviderError | null = null;
    for (const model of models) {
      const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {'x-goog-api-key': env.GEMINI_API_KEY || '', 'Content-Type': 'application/json'},
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify({
          systemInstruction: {parts: [{text: prompt.system}]},
          contents: [{role: 'user', parts: [{text: prompt.user}]}],
          generationConfig: {responseMimeType: 'application/json', maxOutputTokens: prompt.maxTokens, temperature: 0.2},
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {error?: {message?: string}; candidates?: {content?: {parts?: {text?: string}[]}}[]};
      if (response.ok) return {text: (body.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join(''), model};
      lastError = new ProviderError('gemini', response.status, body.error?.message || '');
      if (response.status !== 503 && response.status !== 429) break;
    }
    throw lastError ?? new ProviderError('gemini', 0, 'no answer');
  }
  if (provider === 'workers-ai') {
    if (!env.AI) throw new ProviderError('workers-ai', 0, 'not connected');
    const model = env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    let result: unknown;
    try {
      result = await env.AI.run(model, {
        messages: [{role: 'system', content: prompt.system}, {role: 'user', content: prompt.user}],
        max_tokens: prompt.maxTokens,
        temperature: 0.2,
      });
    } catch (error) {
      throw new ProviderError('workers-ai', 0, error instanceof Error ? error.message : String(error));
    }
    const answer = (result as {response?: unknown})?.response;
    return {text: typeof answer === 'string' ? answer : answer ? JSON.stringify(answer) : '', model};
  }
  if (provider === 'groq') {
    const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return {text: await openAiCompatible('groq', 'https://api.groq.com/openai/v1/chat/completions', env.GROQ_API_KEY || '', model, prompt, fetcher), model};
  }
  const model = env.OPENAI_MODEL || 'gpt-5.5';
  return {text: await openAiCompatible('openai', 'https://api.openai.com/v1/chat/completions', env.OPENAI_API_KEY || '', model, prompt, fetcher), model};
}
