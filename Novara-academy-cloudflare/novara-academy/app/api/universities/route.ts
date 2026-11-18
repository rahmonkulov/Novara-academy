import {
  WORLD_DATA_VERSION, WORLD_PER_PAGE, buildCountriesUrl, buildRankUrl, buildWorldDetailUrl, buildWorldListUrl, parseWorldId,
  parseWorldQuery, toCountries, toWorldDetail, toWorldUniversity,
} from '../../world-lib';
import {cached, fail, fetchJson, respond, upstreamFailure} from '../../server-cache';

// GET /api/universities?q=&country=&region=&sort=&page=&ids=  → a page of universities worldwide
// GET /api/universities?id=I200769079                         → one university, with its rank by citations
// GET /api/universities?countries=1                           → countries that have universities
// Data comes from OpenAlex (open data, CC0). No key is needed.

type ListResponse = {meta?: {count?: unknown}; results?: unknown; group_by?: unknown};

const rowsOf = (data: ListResponse): Record<string, unknown>[] =>
  Array.isArray(data.results) ? (data.results as Record<string, unknown>[]) : [];

async function countAbove(url: string): Promise<number | null> {
  try {
    const data = await fetchJson<ListResponse>(url);
    const count = Number(data.meta?.count);
    return Number.isFinite(count) ? count + 1 : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const v = `w${WORLD_DATA_VERSION}`;
  try {
    if (params.has('countries')) {
      const body = await cached(`${v}:countries`, async () => {
        const data = await fetchJson<ListResponse>(buildCountriesUrl());
        return JSON.stringify({countries: toCountries(data.group_by)});
      });
      return respond(body);
    }
    if (params.has('id')) {
      const id = parseWorldId(params.get('id'));
      if (!id) return fail('We could not find that university.', 400);
      const body = await cached(`${v}:detail:${id}`, async () => {
        const row = await fetchJson<Record<string, unknown>>(buildWorldDetailUrl(id));
        const university = toWorldDetail(row);
        const citations = university.citations ?? 0;
        const [country, world] = await Promise.all([
          university.countryCode ? countAbove(buildRankUrl(citations, university.countryCode)) : Promise.resolve(null),
          countAbove(buildRankUrl(citations)),
        ]);
        return JSON.stringify({university, ranks: {country, world}});
      });
      return respond(body);
    }
    const query = parseWorldQuery(params);
    const body = await cached(`${v}:list:${JSON.stringify(query)}`, async () => {
      const data = await fetchJson<ListResponse>(buildWorldListUrl(query));
      const total = Number(data.meta?.count);
      return JSON.stringify({total: Number.isFinite(total) ? total : 0, page: query.page, perPage: WORLD_PER_PAGE, results: rowsOf(data).map(toWorldUniversity)});
    });
    return respond(body);
  } catch (error) {
    return upstreamFailure(error, 'We could not find that university.');
  }
}
