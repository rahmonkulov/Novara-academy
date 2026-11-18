'use client';
import {useEffect, useState} from 'react';
import {ArrowLeft, ExternalLink, Info, Target} from 'lucide-react';
import {BRAND} from '../../brand';
import {SiteFooter, SiteHeader, useSessionSat} from '../../site-chrome';
import {
  OWNERSHIP_LABEL, TEST_POLICY_LABEL, chanceFor, formatCount, formatMoney, formatPercent, formatRate, formatSatRange, formatShare,
  parseId, parseSat, type CollegeDetail,
} from '../../colleges-lib';

function Metric({label, value, note}: {label: string; value: string; note?: string}) {
  return (
    <div className="cx-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function satSections(college: CollegeDetail): string | undefined {
  const {reading25, reading75, math25, math75} = college.sat;
  if (reading25 == null || reading75 == null || math25 == null || math75 == null) return undefined;
  return `Reading & writing ${reading25}–${reading75} · Math ${math25}–${math75}`;
}

export default function CollegePage() {
  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [error, setError] = useState('');
  const [satText, setSatText] = useSessionSat();
  const sat = parseSat(satText);

  useEffect(() => {
    const id = parseId(window.location.pathname.split('/').filter(Boolean).pop());
    if (!id) {
      setError('We could not find that college.');
      return;
    }
    const controller = new AbortController();
    fetch(`/api/colleges?id=${id}`, {signal: controller.signal})
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.college) throw new Error(body.error || 'College data is temporarily unavailable.');
        return body.college as CollegeDetail;
      })
      .then(result => {
        setCollege(result);
        document.title = `${result.name} · ${BRAND.name}`;
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'College data is temporarily unavailable.');
      });
    return () => controller.abort();
  }, []);

  const chance = college ? chanceFor(sat, college) : null;
  const ownership = college?.ownership != null ? OWNERSHIP_LABEL[college.ownership] : undefined;
  const place = college ? [college.city, college.state].filter(Boolean).join(', ') : '';
  const tuition = college ? college.tuitionOutOfState ?? college.tuitionInState : null;

  return (
    <div className="app-shell">
      <SiteHeader active="colleges" />
      <main className="cx-layout cx-detail">
        <a className="quiet cx-back" href="/colleges"><ArrowLeft size={16} /> All colleges</a>

        {error ? (
          <div className="form-error" role="alert">{error}</div>
        ) : !college ? (
          <div aria-busy="true">
            <div className="cx-skeleton cx-skel-title" />
            <div className="cx-metrics">{Array.from({length: 6}, (_, i) => <div className="cx-metric cx-skeleton cx-skel-metric" key={i} />)}</div>
          </div>
        ) : (
          <>
            <section className="cx-detail-head">
              <p className="eyebrow">{place.toUpperCase()}{ownership ? ` · ${ownership.toUpperCase()}` : ''}</p>
              <h1>{college.name}</h1>
              <div className="cx-links">
                {college.website && <a className="secondary" href={college.website} target="_blank" rel="noopener noreferrer">Official website <ExternalLink size={16} /></a>}
                {college.priceCalculator && <a className="secondary" href={college.priceCalculator} target="_blank" rel="noopener noreferrer">Net price calculator <ExternalLink size={16} /></a>}
              </div>
            </section>

            <section className="cx-detail-grid">
              <div className="cx-metrics">
                <Metric label="Acceptance rate" value={formatRate(college.admitRate)} note="Share of applicants admitted" />
                <Metric label="SAT middle 50%" value={formatSatRange(college.sat)} note={satSections(college)} />
                <Metric label="ACT middle 50%" value={college.act25 != null && college.act75 != null ? `${college.act25}–${college.act75}` : 'Not reported'} />
                <Metric label="Test scores" value={college.testPolicy != null ? TEST_POLICY_LABEL[college.testPolicy] ?? 'Not reported' : 'Not reported'} note="SAT/ACT policy for admission" />
                <Metric label="Undergraduates" value={formatCount(college.size)} />
                <Metric label="International students" value={formatShare(college.intlShare)} note="Share of undergraduates" />
                <Metric label="Cost of attendance" value={formatMoney(college.costOfAttendance)} note="Per year, before any aid" />
                <Metric label="Tuition" value={formatMoney(tuition)} note={college.ownership === 1 ? 'Per year, out-of-state rate' : 'Per year'} />
                <Metric label="Graduation rate" value={formatPercent(college.gradRate)} note="Within six years" />
                <Metric label="Median earnings" value={formatMoney(college.earnings)} note="10 years after starting" />
              </div>

              <aside className="cx-chance-box" aria-labelledby="chance-title">
                <span className="profile-icon"><Target size={22} /></span>
                <h2 id="chance-title">Where do you stand?</h2>
                <label className="cx-sat">
                  <span>Your SAT</span>
                  <input inputMode="numeric" value={satText} onChange={event => setSatText(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1450" />
                </label>
                {chance ? (
                  <div className="cx-chance-result">
                    <span className={`cx-chance ${chance.tone}`}>{chance.label}</span>
                    <p>{chance.reason}</p>
                  </div>
                ) : (
                  <p className="helper">{satText && !sat ? 'Enter a total SAT score between 400 and 1600.' : 'Enter your total SAT to compare it with this college’s middle 50%.'}</p>
                )}
                <p className="cx-fine">A rough guide that uses only your SAT and the admission rate. Essays, activities and whether you need financial aid matter too. International applicants who need aid often face lower odds than the overall rate.</p>
              </aside>
            </section>

            <div className="prototype-note cx-source">
              <Info size={18} />
              <p>Data: <strong>U.S. Department of Education College Scorecard</strong>, latest figures available. The SAT middle 50% adds the two section ranges. Median earnings cover students who received US federal aid. Coming next: early decision numbers and aid for international students from this college’s Common Data Set.</p>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
