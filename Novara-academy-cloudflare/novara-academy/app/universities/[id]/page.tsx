'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, BookOpen, ExternalLink, GraduationCap, Info, MessageCircle, ShieldCheck, Sparkles, Target, Trophy} from 'lucide-react';
import {BRAND} from '../../brand';
import {ProfileNote, SaveButton, SiteFooter, SiteHeader, useProfileSummary, useSaved, type Saved} from '../../site-chrome';
import {loadJson} from '../../load-json';
import {parseIelts} from '../../profile-store';
import {parseSat} from '../../colleges-lib';
import {ADMISSIONS, type AdmissionsInfo} from '../../admissions-data';
import type {ResearchState} from '../../admissions-ai';
import {WORLD_DATA_VERSION, formatCompact, formatRank, parseWorldId, type WorldDetail, type WorldRanks} from '../../world-lib';

function Metric({label, value, note}: {label: string; value: string; note?: string}) {
  return (
    <div className="cx-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

type Check = {tone: 'likely' | 'reach' | 'unknown'; label: string; text: string};

// Compares saved scores with the minimums the university publishes. Never guesses where nothing is published.
function scoreChecks(info: AdmissionsInfo | undefined, saved: Saved): Check[] {
  if (!info) return [];
  const checks: Check[] = [];
  const ielts = parseIelts(saved.ielts);
  if (info.ieltsMin) {
    const min = info.ieltsMin.toFixed(1);
    checks.push(ielts == null
      ? {tone: 'unknown', label: 'IELTS', text: `Needs IELTS ${min} or an accepted equivalent. Add your IELTS to check.`}
      : ielts >= info.ieltsMin
        ? {tone: 'likely', label: 'IELTS', text: `Your ${ielts.toFixed(1)} meets the ${min} minimum.`}
        : {tone: 'reach', label: 'IELTS', text: `Your ${ielts.toFixed(1)} is below the ${min} minimum. Plan a retake or check accepted equivalents.`});
  }
  if (info.satMin) {
    const sat = parseSat(saved.sat);
    const note = info.satNote ? ` ${info.satNote}` : '';
    checks.push(sat == null
      ? {tone: 'unknown', label: 'SAT', text: `Reference score ${info.satMin}.${note} Add your SAT to check.`}
      : sat >= info.satMin
        ? {tone: 'likely', label: 'SAT', text: `Your ${sat} is at or above the ${info.satMin} reference.${note}`}
        : {tone: 'reach', label: 'SAT', text: `Your ${sat} is below the ${info.satMin} reference.${note}`});
  }
  return checks;
}

function ChanceBox({info, saved, onScores, name, canResearch, onResearch, busy, loading}: {info: AdmissionsInfo | undefined; saved: Saved; onScores: (patch: {sat?: string; ielts?: string}) => void; name: string; canResearch: boolean; onResearch: () => void; busy: boolean; loading: boolean}) {
  const checks = scoreChecks(info, saved);
  return (
    <aside className="cx-chance-box" aria-labelledby="chance-title">
      <span className="profile-icon"><Target size={22} /></span>
      <h2 id="chance-title">Your chances here</h2>
      <div className="wx-score-row">
        <label className="cx-sat">
          <span>Your IELTS</span>
          <input inputMode="decimal" value={saved.ielts} onChange={event => onScores({ielts: event.target.value.replace(/[^\d.]/g, '').slice(0, 3)})} placeholder="e.g. 7.0" />
        </label>
        <label className="cx-sat">
          <span>Your SAT</span>
          <input inputMode="numeric" value={saved.sat} onChange={event => onScores({sat: event.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="e.g. 1450" />
        </label>
      </div>
      <small className="cx-fine">Saved on this device and used on every university page, so you type them once.</small>
      {info ? (
        <>
          {checks.map(check => (
            <div className="cx-chance-result" key={check.label}>
              <span className={`cx-chance ${check.tone}`}>{check.label}: {check.tone === 'likely' ? 'meets' : check.tone === 'reach' ? 'below' : 'not added'}</span>
              <p>{check.text}</p>
            </div>
          ))}
          {info.chances && !/^not published\.?$/i.test(info.chances.trim()) && <p className="wx-chance-text">{info.chances}</p>}
          <p className="cx-fine">Meeting a minimum does not guarantee an offer. Grades, activities and your personal statement decide most decisions.</p>
        </>
      ) : (
        <div className="cx-chance-result">
          <span className="cx-chance unknown">{loading ? 'Loading' : 'Not checked yet'}</span>
          <p>{loading ? 'Looking for saved admissions details…' : busy ? `Reading ${name}’s website. Your scores are compared here as soon as its requirements are in.` : canResearch ? `Let our AI read ${name}’s official website, and your saved scores are compared with its requirements right here.` : `We have not verified ${name}’s entry requirements yet, so we will not guess. Your scores stay saved and will be compared here as soon as we add them.`}</p>
          {canResearch && !busy && <button type="button" className="primary wx-research-button" onClick={onResearch}><Sparkles size={18} /> Find admissions &amp; scholarships</button>}
        </div>
      )}
    </aside>
  );
}

const NOT_PUBLISHED = /^not published\.?$/i;

function AdmissionsSection({info: raw, ai, onRefresh}: {info: AdmissionsInfo; ai?: {domain?: string; stale?: boolean}; onRefresh?: () => void}) {
  // The AI only saw some pages, so "Not published" really means it was not on the pages it read.
  const show = (value: string) => (ai && NOT_PUBLISHED.test(value.trim()) ? 'Not found on the pages we read' : value);
  const info: AdmissionsInfo = {
    ...raw,
    tuition: show(raw.tuition),
    applicationFee: show(raw.applicationFee),
    english: show(raw.english),
    tests: show(raw.tests),
    rounds: raw.rounds.filter(round => !NOT_PUBLISHED.test(round.trim())),
    scholarships: raw.scholarships.map(item => ({...item, amount: show(item.amount)})),
    chances: raw.chances && !NOT_PUBLISHED.test(raw.chances.trim()) ? raw.chances : undefined,
  };
  return (
    <section className="wx-section" aria-labelledby="admissions-title">
      <div className="wx-section-head">
        <h2 id="admissions-title">Admissions and money for international students</h2>
        {ai ? (
          <span className="wx-checked wx-ai-label"><Sparkles size={15} /> Collected by AI · {info.checked} · {info.intake}</span>
        ) : (
          <span className="wx-checked"><ShieldCheck size={15} /> Checked by hand · {info.checked} · {info.intake}</span>
        )}
      </div>
      {ai && (
        <p className="wx-ai-note">
          Our AI read {ai.domain ? <strong>{ai.domain}</strong> : 'the official website'} and copied what it publishes. AI can misread a page, so open the links before you apply or pay anything.
          {ai.stale && <> This was collected over four months ago, and fees or deadlines may have changed. <button type="button" className="inline-link" onClick={onRefresh}>Check again</button></>}
        </p>
      )}
      <div className="cx-metrics wx-facts">
        <Metric label="Tuition" value={info.tuition} />
        {info.employment && (
          <div className="cx-metric wx-employment">
            <span>Jobs after graduation</span>
            <strong>{info.employment.headline}</strong>
            {info.employment.detail && <small>{info.employment.detail}</small>}
            <a className="inline-link" href={info.employment.url} target="_blank" rel="noopener noreferrer">Source <ExternalLink size={12} /></a>
          </div>
        )}
        {info.livingCost && <Metric label="Living costs" value={info.livingCost} />}
        <Metric label="Application fee" value={info.applicationFee} />
        <Metric label="English" value={info.english} />
        <Metric label="Tests and qualifications" value={info.tests} />
      </div>

      <h3 className="wx-subtitle">Application rounds</h3>
      {info.rounds.length ? (
        <ul className="wx-list">{info.rounds.map(round => <li key={round}>{round}</li>)}</ul>
      ) : (
        <p className="helper">Dates were not on the pages we read. Check the official site below.</p>
      )}

      <h3 className="wx-subtitle">Scholarships and grants</h3>
      {info.scholarships.length ? (
        <div className="wx-scholarships">
          {info.scholarships.map(item => (
            <article className="wx-scholarship" key={item.name}>
              <div className="wx-scholarship-head">
                <h4>{item.name}</h4>
                <span className={`wx-apply ${item.howToApply}`}>{item.howToApply === 'automatic' ? 'Considered automatically' : 'Separate application'}</span>
              </div>
              <p className="wx-amount">{item.amount}</p>
              <p>{item.details}</p>
              {item.deadline && <p className="wx-deadline">Deadline: {item.deadline}</p>}
              <a className="inline-link" href={item.url} target="_blank" rel="noopener noreferrer">Official page <ExternalLink size={13} /></a>
            </article>
          ))}
        </div>
      ) : (
        <p className="helper">This university does not list scholarships for international undergraduates on its official pages.</p>
      )}


      <div className="cx-links wx-apply-row">
        <a className="primary" href={info.applyUrl} target="_blank" rel="noopener noreferrer">Apply on the official site <ExternalLink size={16} /></a>
      </div>
      <p className="wx-sources">
        Sources:{' '}
        {info.sources.map((source, index) => (
          <span key={source.url}>{index ? ' · ' : ''}<a className="inline-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></span>
        ))}
      </p>
    </section>
  );
}

type Research = (ResearchState & {stale?: boolean}) | null;

function ResearchCard({research, name, website, onStart, busy}: {research: Research; name: string; website: string | null; onStart: () => void; busy: boolean}) {
  const domain = website ? website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '') : 'its official website';
  if (research === null) {
    return (
      <section className="wx-section wx-pending" aria-busy="true">
        <h2>Admissions and money for international students</h2>
        <p>Looking for saved admissions details…</p>
      </section>
    );
  }
  if (busy || research?.status === 'running') {
    return (
      <section className="wx-section wx-research" aria-live="polite">
        <h2>Admissions and money for international students</h2>
        <p className="wx-research-busy"><span className="wx-spinner" aria-hidden="true" /> Reading {domain}: tuition, deadlines, English requirements and scholarships…</p>
        <p className="helper">This usually takes under a minute. It is saved for everyone, so nobody waits for {name} again.</p>
      </section>
    );
  }
  if (research?.status === 'failed') {
    return (
      <section className="wx-section wx-pending">
        <h2>Admissions and money for international students</h2>
        <p>{research.error} Until then, the official website is the place to look.</p>
      </section>
    );
  }
  if (research?.status === 'none' && research.canResearch && website) {
    return (
      <section className="wx-section wx-research">
        <h2>Admissions and money for international students</h2>
        <p>Nobody has checked {name} yet. Our AI can read {domain} now and fill this in for you: tuition, application fee, deadlines, English and test requirements, and every scholarship, with a link to each official page.</p>
        <button type="button" className="primary wx-research-button" onClick={onStart}><Sparkles size={18} /> Find admissions &amp; scholarships</button>
        <p className="helper">Free. It is saved for every student, so you only wait once.</p>
      </section>
    );
  }
  return (
    <section className="wx-section wx-pending">
      <h2>Admissions and money for international students</h2>
      <p>We have not checked this university’s tuition, scholarships and deadlines yet. Until then, the official website is the place to look.</p>
    </section>
  );
}

export default function UniversityPage() {
  const [university, setUniversity] = useState<WorldDetail | null>(null);
  const [ranks, setRanks] = useState<WorldRanks>({country: null, world: null});
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const {saved, update: updateSaved, toggleUniversity} = useSaved();
  const profile = useProfileSummary();
  const [research, setResearch] = useState<Research>(null);
  const [busy, setBusy] = useState(false);
  const polls = useRef(0);

  useEffect(() => {
    const id = parseWorldId(window.location.pathname.split('/').filter(Boolean).pop());
    if (!id) {
      setError('We could not find that university.');
      return;
    }
    const controller = new AbortController();
    setError('');
    loadJson<{university?: WorldDetail; ranks?: WorldRanks}>(`/api/universities?id=${id}&v=${WORLD_DATA_VERSION}`, controller.signal, 'University data is temporarily unavailable.')
      .then(body => {
        if (!body.university) throw new Error('University data is temporarily unavailable.');
        return {university: body.university, ranks: body.ranks};
      })
      .then(body => {
        setUniversity(body.university);
        setRanks(body.ranks || {country: null, world: null});
        document.title = `${body.university.name} · ${BRAND.name}`;
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'University data is temporarily unavailable.');
      });
    return () => controller.abort();
  }, [attempt]);

  // Admissions details: hand-checked entries first, then anything the AI already collected.
  useEffect(() => {
    if (!university) return;
    if (ADMISSIONS[university.id]) {
      setResearch({status: 'ready', source: 'checked', info: ADMISSIONS[university.id]});
      return;
    }
    const controller = new AbortController();
    fetch(`/api/admissions?id=${university.id}`, {signal: controller.signal})
      .then(response => response.json() as Promise<Research>)
      .then(state => setResearch(state && 'status' in state ? state : {status: 'none', canResearch: false}))
      .catch(() => {
        if (!controller.signal.aborted) setResearch({status: 'none', canResearch: false});
      });
    return () => controller.abort();
  }, [university]);

  // While another visitor's research is running, check back every few seconds.
  useEffect(() => {
    if (!university || research?.status !== 'running' || busy) return;
    if ((polls.current ?? 0) >= 40) return;
    const timer = setTimeout(() => {
      polls.current = (polls.current ?? 0) + 1;
      fetch(`/api/admissions?id=${university.id}`)
        .then(response => response.json() as Promise<Research>)
        .then(state => setResearch(state))
        .catch(() => undefined);
    }, 5000);
    return () => clearTimeout(timer);
  }, [research, university, busy]);

  const startResearch = () => {
    if (!university || busy) return;
    setBusy(true);
    fetch('/api/admissions', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: university.id})})
      .then(async response => {
        const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (typeof body.status === 'string') setResearch(body as unknown as Research);
        else setResearch({status: 'failed', error: typeof body.error === 'string' ? body.error : 'We could not do this right now. Please try again later.'});
      })
      .catch(() => setResearch({status: 'failed', error: 'The connection dropped. Please try again.'}))
      .finally(() => setBusy(false));
  };

  const info = research?.status === 'ready' ? research.info : undefined;
  const place = university ? [...new Set([university.city, university.country].filter(Boolean))].join(', ') : '';

  return (
    <div className="app-shell">
      <SiteHeader active="universities" />
      <main className="cx-layout cx-detail">
        <a className="quiet cx-back" href="/universities"><ArrowLeft size={16} /> All universities</a>

        {error ? (
          <div className="form-error" role="alert">{error} <button type="button" className="inline-link" onClick={() => setAttempt(n => n + 1)}>Try again</button></div>
        ) : !university ? (
          <div aria-busy="true">
            <div className="cx-skeleton cx-skel-title" />
            <div className="cx-metrics">{Array.from({length: 4}, (_, i) => <div className="cx-metric cx-skeleton cx-skel-metric" key={i} />)}</div>
          </div>
        ) : (
          <>
            <section className="cx-detail-head">
              <p className="eyebrow">{place.toUpperCase()}{university.acronym ? ` · ${university.acronym}` : ''}</p>
              <h1>{university.name}</h1>
              {university.otherNames.length > 0 && <p className="wx-other-names">Also known as {university.otherNames.join(' · ')}</p>}
              <div className="cx-links">
                <SaveButton saved={saved.universities.includes(university.id)} onToggle={() => toggleUniversity(university.id)} />
                {university.website && <a className="secondary" href={university.website} target="_blank" rel="noopener noreferrer">Official website <ExternalLink size={16} /></a>}
                {university.wikipedia && <a className="secondary" href={university.wikipedia} target="_blank" rel="noopener noreferrer">Wikipedia <ExternalLink size={16} /></a>}
                {university.countryCode === 'US' && <a className="secondary" href={`/colleges?q=${encodeURIComponent(university.name)}`}><GraduationCap size={16} /> US admissions data</a>}
              </div>
            </section>

            {research?.status === 'ready' && research.info.rankings?.length ? (
              <section className="wx-rankings" aria-label="Rankings">
                <Trophy size={16} />
                {research.info.rankings.map(item => (
                  <a className="wx-ranking" key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"><strong>{item.rank}</strong> {item.name}</a>
                ))}
                <span className="wx-ranking-note">As the university states it</span>
              </section>
            ) : null}

            <section className="cx-detail-grid">
              <div>
                <div className="cx-metrics wx-metrics" aria-label="Research strength">
                  <Metric label={`Research rank in ${university.country || 'its country'}`} value={formatRank(ranks.country)} note="By research citations" />
                  <Metric label="Research rank worldwide" value={formatRank(ranks.world)} note="Among 30,000+ universities" />
                  <Metric label="Citations" value={formatCompact(university.citations)} note="Times its research was cited" />
                  <Metric label="Research papers" value={formatCompact(university.works)} />
                </div>
                <ProfileNote saved={saved} summary={profile} />
                {university.topics.length > 0 && (
                  <section className="wx-topics" aria-label="Research strengths">
                    <h3 className="wx-subtitle"><BookOpen size={16} /> Research strengths</h3>
                    <div className="cx-chips">{university.topics.map(topic => <span className="cx-chip wx-topic" key={topic}>{topic}</span>)}</div>
                  </section>
                )}
              </div>
              <ChanceBox info={info} saved={saved} onScores={updateSaved} name={university.name} canResearch={research?.status === 'none' && research.canResearch && Boolean(university.website)} onResearch={startResearch} busy={busy} loading={research === null} />
            </section>

            {research?.status === 'ready' && !busy ? (
              <AdmissionsSection info={research.info} ai={research.source === 'ai' ? {domain: research.domain, stale: research.stale} : undefined} onRefresh={startResearch} />
            ) : (
              <ResearchCard research={research} name={university.name} website={university.website} onStart={startResearch} busy={busy} />
            )}

            <section className="wx-students" aria-labelledby="students-title">
              <h3 className="wx-subtitle" id="students-title"><MessageCircle size={16} /> What students say</h3>
              <p className="helper">Reviews written by students on {BRAND.short} are coming. Until then, read what real students say about {university.name} on Reddit.</p>
              <a className="secondary" href={`https://www.reddit.com/search/?q=${encodeURIComponent(`"${university.name}"`)}`} target="_blank" rel="noopener noreferrer">Student discussions on Reddit <ExternalLink size={16} /></a>
            </section>

            {university.related.length > 0 && (
              <section className="wx-related" aria-label="Related campuses and universities">
                <h3 className="wx-subtitle">Related campuses and universities</h3>
                <div className="cx-chips">{university.related.map(item => <a className="cx-chip cx-chip-link" key={item.id} href={`/universities/${item.id}`}>{item.name}</a>)}</div>
              </section>
            )}

            <div className="prototype-note cx-source">
              <Info size={18} />
              <p>Research data: <strong>OpenAlex</strong> (open data, CC0). Ranks count how many universities have more research citations, so they show research strength, not teaching quality or how hard it is to get in. Admissions and scholarship details come from the university’s official pages, listed under Sources.</p>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
