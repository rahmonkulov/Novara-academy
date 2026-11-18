import {env} from 'cloudflare:workers';
import {DATA_VERSION, PER_PAGE, buildDetailUrl, buildListUrl, parseId, parseListQuery, toCollege, toDetail} from '../../colleges-lib';
import {UpstreamError, cached, fail, fetchJson, respond, upstreamFailure} from '../../server-cache';

// GET /api/colleges?q=&state=&sel=&size=&control=&sort=&page=&ids=  → a page of US colleges
// GET /api/colleges?id=166027                                         → one college
// Data comes from the U.S. Department of Education College Scorecard. Set the runtime Secret
// SCORECARD_API_KEY (free from api.data.gov); DEMO_KEY is only good for a few test requests.

const config = () => env as unknown as Record<string, string | undefined>;
type ScorecardResponse = {metadata?: {total?: unknown}; results?: unknown};

const rowsOf = (data: ScorecardResponse): Record<string, unknown>[] =>
  Array.isArray(data.results) ? (data.results as Record<string, unknown>[]) : [];

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const apiKey = config().SCORECARD_API_KEY || 'DEMO_KEY';
  try {
    if (params.has('id')) {
      const id = parseId(params.get('id'));
      if (!id) return fail('We could not find that college.', 400);
      const body = await cached(`v${DATA_VERSION}:detail:${id}`, async () => {
        const [row] = rowsOf(await fetchJson<ScorecardResponse>(buildDetailUrl(id, apiKey)));
        if (!row) throw new UpstreamError(404);
        return JSON.stringify({college: toDetail(row)});
      });
      return respond(body);
    }
    const query = parseListQuery(params);
    const body = await cached(`v${DATA_VERSION}:list:${JSON.stringify(query)}`, async () => {
      const data = await fetchJson<ScorecardResponse>(buildListUrl(query, apiKey));
      const total = Number(data.metadata?.total);
      return JSON.stringify({total: Number.isFinite(total) ? total : 0, page: query.page, perPage: PER_PAGE, results: rowsOf(data).map(toCollege)});
    });
    return respond(body);
  } catch (error) {
    return upstreamFailure(error, 'We could not find that college.');
  }
}
