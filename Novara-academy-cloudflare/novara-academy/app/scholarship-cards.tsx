'use client';
import {ExternalLink, Landmark} from 'lucide-react';
import type {GovernmentScholarship} from './government-scholarships';

// Cards for government scholarships that pay for (almost) everything.
export function GovernmentScholarshipCards({items}: {items: GovernmentScholarship[]}) {
  return (
    <div className="gs-grid">
      {items.map(item => (
        <article className="gs-card" key={item.id}>
          <div className="gs-head">
            <span className="gs-icon"><Landmark size={18} /></span>
            <div>
              <h4>{item.name}</h4>
              <p className="gs-sponsor">{item.country} · {item.sponsor}</p>
            </div>
          </div>
          <div className="gs-covers">{item.covers.map(cover => <span className="gs-cover" key={cover}>✓ {cover}</span>)}</div>
          {item.allowance && <p><strong>Allowance:</strong> {item.allowance}</p>}
          {item.notCovered && <p className="gs-not">{item.notCovered}</p>}
          <p><strong>How to apply:</strong> {item.howToApply}</p>
          <p><strong>When:</strong> {item.when}</p>
          {item.uzbekistan && <p><strong>Uzbekistan:</strong> {item.uzbekistan}</p>}
          <div className="gs-foot">
            <a className="inline-link" href={item.url} target="_blank" rel="noopener noreferrer">Official page <ExternalLink size={13} /></a>
            <span>Checked {item.checked}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
