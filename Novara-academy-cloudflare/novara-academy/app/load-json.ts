// Browser-side fetch for our own data API. When the outside data service hiccups (a 5xx answer or a
// dropped connection), it waits a moment and tries once more before showing the student an error.
// A "not found" or a bad request is final and is not retried.

export const RETRY_DELAY_MS = 1200;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, {once: true});
  });
}

export async function loadJson<T>(url: string, signal: AbortSignal, fallback: string, fetcher: typeof fetch = fetch): Promise<T> {
  let lastError = new Error(fallback);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await wait(RETRY_DELAY_MS, signal);
    let response: Response;
    try {
      response = await fetcher(url, {signal});
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = new Error(fallback);
      continue;
    }
    const body = (await response.json().catch(() => ({}))) as {error?: unknown};
    if (response.ok) return body as T;
    lastError = new Error(typeof body.error === 'string' && body.error ? body.error : fallback);
    if (response.status < 500) break;
  }
  throw lastError;
}
