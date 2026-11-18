import {env} from 'cloudflare:workers';
import {
  WORLD_DATA_VERSION, WORLD_PER_PAGE, buildCountriesUrl, buildRankUrl, buildWorldDetailUrl, buildWorldListUrl, parseWorldId,
  parseWorldQuery, toCountries, toWorldDetail, toWorldUniversity,
} from '../../world-lib';
import {UpstreamError, cached, fail, fetchJson, respond, upstreamFailure} from '../../server-cache';

// GET /api/universities?q=&country=&region=&sort=&page=&ids=  → a page of universities worldwide
// GET /api/universities?id=I200769079                         → one university, with its rank by citations
// GET /api/universities?countries=1                           → countries that have universities
// Data comes from OpenAlex (open data, CC0). Set the runtime Secret OPENALEX_API_KEY (free at
// openalex.org/settings/api): without it, list and rank requests share a tiny daily budget per IP address
// and fail most of the day on Cloudflare. Looking up one university by ID is free either way.

type ListResponse = {meta?: {count?: unknown}; results?: unknown; group_by?: unknown};

const rowsOf = (data: ListResponse): Record<string, unknown>[] =>
  Array.isArray(data.results) ? (data.results as Record<string, unknown>[]) : [];

function authHeaders(): Record<string, string> {
  const key = (env as unknown as Record<string, string | undefined>).OPENALEX_API_KEY;
  return key ? {Authorization: `Bearer ${key}`} : {};
}

async function countAbove(url: string): Promise<number> {
  const data = await fetchJson<ListResponse>(url, authHeaders());
  const count = Number(data.meta?.count);
  if (!Number.isFinite(count)) throw new UpstreamError(0);
  return count + 1;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const v = `w${WORLD_DATA_VERSION}`;
  try {
    if (params.has('countries')) {
      const body = await cached(`${v}:countries`, async () => {
        const data = await fetchJson<ListResponse>(buildCountriesUrl(), authHeaders());
        return JSON.stringify({countries: toCountries(data.group_by)});
      });
      return respond(body);
    }
    if (params.has('id')) {
      const id = parseWorldId(params.get('id'));
      if (!id) return fail('We could not find that university.', 400);
      const detail = await cached(`${v}:detail:${id}`, async () =>
        JSON.stringify(toWorldDetail(await fetchJson<Record<string, unknown>>(buildWorldDetailUrl(id), authHeaders()))));
      const university = JSON.parse(detail) as ReturnType<typeof toWorldDetail>;
      const citations = university.citations ?? 0;
      // Ranks are cached only when both counts arrive, so a failed count is retried on the next visit.
      const ranks = await cached(`${v}:ranks:${id}:${citations}`, async () => {
        const [country, world] = await Promise.all([
          university.countryCode ? countAbove(buildRankUrl(citations, university.countryCode)) : Promise.resolve(null),
          countAbove(buildRankUrl(citations)),
        ]);
        return JSON.stringify({country, world});
      }).catch(() => JSON.stringify({country: null, world: null}));
      const body = `{"university":${detail},"ranks":${ranks}}`;
      return respond(body);
    }
    const query = parseWorldQuery(params);
    const body = await cached(`${v}:list:${JSON.stringify(query)}`, async () => {
      const data = await fetchJson<ListResponse>(buildWorldListUrl(query), authHeaders());
      const total = Number(data.meta?.count);
      return JSON.stringify({total: Number.isFinite(total) ? total : 0, page: query.page, perPage: WORLD_PER_PAGE, results: rowsOf(data).map(toWorldUniversity)});
    });
    return respond(body);
  } catch (error) {
    return upstreamFailure(error, 'We could not find that university.');
  }
}
