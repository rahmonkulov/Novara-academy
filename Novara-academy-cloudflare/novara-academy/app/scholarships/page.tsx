'use client';
import {Info} from 'lucide-react';
import {SiteFooter, SiteHeader} from '../site-chrome';
import {GovernmentScholarshipCards} from '../scholarship-cards';
import {GOVERNMENT_SCHOLARSHIPS} from '../government-scholarships';

export default function ScholarshipsPage() {
  return (
    <div className="app-shell">
      <SiteHeader active="scholarships" />
      <main className="cx-layout">
        <section className="cx-intro">
          <p className="eyebrow"><span className="tiny-star">✳</span> SCHOLARSHIPS</p>
          <h1>Government scholarships that <em>pay for everything.</em></h1>
          <p className="lead">Full tuition, a monthly allowance and housing, paid by governments for international students. Each one also appears on the pages of universities in that country, next to the university’s own scholarships.</p>
        </section>
        <GovernmentScholarshipCards items={GOVERNMENT_SCHOLARSHIPS} />
        <div className="prototype-note cx-source">
          <Info size={18} />
          <p>Checked by hand from official pages in November 2026. Amounts, quotas and deadlines change every year, so open the official page before you apply. Universities’ own scholarships are on each university page.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
