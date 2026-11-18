// Reads a university's own website for admissions facts, so a free AI without web search can pull them out.
// Starts at the home page, follows the links most likely to hold admissions, fees and scholarships for
// international undergraduates, and returns their text. Only pages on the official domain are opened.
import {onDomain} from './admissions-ai';

export type Page = {url: string; text: string};

const KEYWORDS: [RegExp, number][] = [
  [/international|overseas|non-?local|foreign/i, 5],
  [/scholarship|financial[- ]aid|bursar|funding|grant/i, 5],
  [/admission|admit|enrol|enroll|prospective/i, 4],
  [/tuition|fees?\b|cost/i, 4],
  [/undergrad|bachelor|first[- ]year|freshm/i, 3],
  [/requirement|entry|eligib|qualification/i, 3],
  [/apply|application|deadline/i, 2],
  [/english|ielts|toefl|\bsat\b/i, 2],
];
const PENALTIES = /postgrad|graduate school|phd|doctor|master|mba|alumni|news|event|calendar|login|career|staff|faculty-profile|research-/i;
const SKIP = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|pptx?|mp4|mp3)(\?|$)/i;

export const MAX_PAGES = 9;
const PAGE_CHARS = 7000;
const TOTAL_CHARS = 48000;

export function scoreLink(url: string, label: string): number {
  const haystack = `${decodeURIComponent(url)} ${label}`;
  let score = 0;
  for (const [pattern, points] of KEYWORDS) if (pattern.test(haystack)) score += points;
  if (PENALTIES.test(haystack)) score -= 6;
  return score;
}

const ENTITIES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…'};

export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/tr|\/div|\/section|\/td|\/th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[ \t\f\v\r]+/g, ' ')
    .replace(/ *\n[ \n]*/g, '\n')
    .trim();
}

// Lines that carry facts: long sentences, or short ones with numbers, money, dates or key words.
export function keepUseful(text: string, max = PAGE_CHARS): string {
  const lines = text.split('\n').filter(line => line.length > 60 || /\d|scholar|tuition|fee|deadline|ielts|toefl|sat\b|apply/i.test(line));
  let out = '';
  for (const line of lines) {
    if (out.length + line.length + 1 > max) break;
    out += `${line}\n`;
  }
  return out.trim();
}

export function extractLinks(html: string, base: string, domain: string): {url: string; score: number}[] {
  const found = new Map<string, number>();
  const anchor = /<a\b[^>]*?href\s*=\s*["']([^"'#]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchor)) {
    let url: URL;
    try {
      url = new URL(match[1].trim(), base);
    } catch {
      continue;
    }
    url.hash = '';
    const href = url.href;
    if (!onDomain(href, domain) || SKIP.test(url.pathname)) continue;
    const label = htmlToText(match[2]).slice(0, 120);
    const score = scoreLink(href, label);
    if (score > 0) found.set(href, Math.max(found.get(href) ?? 0, score));
  }
  return [...found].map(([url, score]) => ({url, score})).sort((a, b) => b.score - a.score);
}

async function getPage(url: string, fetcher: typeof fetch): Promise<{html: string; url: string} | null> {
  try {
    const response = await fetcher(url, {
      headers: {'User-Agent': 'NovaraAcademyBot/1.0 (university admissions facts for students)', Accept: 'text/html,application/xhtml+xml'},
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok || !/html/i.test(response.headers.get('content-type') || 'text/html')) return null;
    return {html: (await response.text()).slice(0, 600000), url: response.url || url};
  } catch {
    return null;
  }
}

export async function readOfficialSite(domain: string, fetcher: typeof fetch = fetch): Promise<Page[]> {
  const start = (await getPage(`https://${domain}/`, fetcher)) ?? (await getPage(`https://www.${domain}/`, fetcher));
  if (!start) return [];
  const pages: Page[] = [{url: start.url, text: keepUseful(htmlToText(start.html), 2500)}];
  const seen = new Set([start.url, `https://${domain}/`, `https://www.${domain}/`]);
  let queue = extractLinks(start.html, start.url, domain);
  // Two rounds: the best links from the home page, then the best links found on those pages.
  for (let round = 0; round < 2 && pages.length < MAX_PAGES; round++) {
    const batch = queue.filter(link => !seen.has(link.url)).slice(0, round === 0 ? 5 : MAX_PAGES - pages.length);
    batch.forEach(link => seen.add(link.url));
    const results = await Promise.all(batch.map(link => getPage(link.url, fetcher)));
    const next: {url: string; score: number}[] = [];
    for (const result of results) {
      if (!result) continue;
      const text = keepUseful(htmlToText(result.html));
      if (text.length > 40) pages.push({url: result.url, text});
      next.push(...extractLinks(result.html, result.url, domain));
    }
    queue = next.sort((a, b) => b.score - a.score);
  }
  let total = 0;
  return pages.filter(page => (total += page.text.length) <= TOTAL_CHARS);
}
