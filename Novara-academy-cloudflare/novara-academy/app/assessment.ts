// Shapes an AI's answer into the questionnaire report: known universities only, a valid category, and every
// requirement pointing to that university's official site (or, failing that, to its official admissions page).
import {schools} from './data';
import {aiReportSchema} from './ai-schema';
import {onDomain} from './admissions-ai';

const CATEGORIES = ['High reach', 'Reach', 'Potential match', 'Insufficient evidence'] as const;
const domainOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');

export function normalizeReport(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  const str = (value: unknown, max = 2400) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const seen = new Set<string>();
  const recommendations = list(data.recommendations)
    .map(item => item as Record<string, unknown>)
    .filter(item => {
      const id = str(item?.id, 40);
      if (!schools.some(school => school.id === id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, 6)
    .map(item => {
      const school = schools.find(entry => entry.id === str(item.id, 40))!;
      const domain = domainOf(school.url);
      const category = CATEGORIES.find(name => name.toLowerCase() === str(item.category, 40).toLowerCase()) ?? 'Insufficient evidence';
      const requirements = list(item.requirements)
        .map(entry => entry as Record<string, unknown>)
        .filter(entry => str(entry?.claim) && onDomain(entry.source, domain))
        .slice(0, 6)
        .map(entry => ({claim: str(entry.claim), source: str(entry.source, 500)}));
      return {
        id: school.id,
        category,
        explanation: str(item.explanation),
        academicAssessment: str(item.academicAssessment),
        financialAssessment: str(item.financialAssessment),
        requirements: requirements.length ? requirements : [{claim: 'Check the current requirements for international applicants on the official admissions page.', source: school.url}],
        uncertainties: list(item.uncertainties).map(entry => str(entry)).filter(Boolean).slice(0, 8),
      };
    });
  const parsed = aiReportSchema.safeParse({
    summary: str(data.summary),
    strengths: list(data.strengths).map(entry => str(entry)).filter(Boolean).slice(0, 8),
    gaps: list(data.gaps).map(entry => str(entry)).filter(Boolean).slice(0, 8),
    recommendations,
    roadmap: list(data.roadmap)
      .map(entry => entry as Record<string, unknown>)
      .filter(entry => str(entry?.title, 200) && str(entry?.action))
      .slice(0, 8)
      .map(entry => ({title: str(entry.title, 200), action: str(entry.action), timing: str(entry.timing, 250) || 'Soon'})),
  });
  return parsed.success && parsed.data.summary ? parsed.data : null;
}

