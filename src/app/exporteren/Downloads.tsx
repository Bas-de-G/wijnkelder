'use client';

import { useState } from 'react';

const BESTANDEN = [
  { pad: 'xlsx', naam: 'Excel', uitleg: 'Spreadsheet met alle velden en een filterrij' },
  { pad: 'csv', naam: 'CSV', uitleg: 'Universeel, opent overal' },
  { pad: 'pdf', naam: 'PDF', uitleg: 'Afdrukbaar overzicht op één rij per wijn' },
  { pad: 'json', naam: 'Back-up', uitleg: 'Alles: kelder, dagboek en verlanglijst' },
];

export function Downloads({ leeg }: { leeg: boolean }) {
  const [kopie, setKopie] = useState<'idle' | 'bezig' | 'klaar' | 'fout'>('idle');

  async function kopieer() {
    setKopie('bezig');
    try {
      const res = await fetch('/api/export/json');
      if (!res.ok) throw new Error('mislukt');
      await navigator.clipboard.writeText(await res.text());
      setKopie('klaar');
      setTimeout(() => setKopie('idle'), 4000);
    } catch {
      setKopie('fout');
    }
  }

  if (leeg) {
    return (
      <div className="notice warn" style={{ marginBottom: 34 }}>
        Je kelder is nog leeg, dus er valt nog niets te exporteren of te delen.
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="chart-hd">
        <h3>Downloaden</h3>
      </div>

      <div className="downloads">
        {BESTANDEN.map((b) => (
          <a key={b.pad} className="download" href={`/api/export/${b.pad}`} download>
            <span className="download-naam">{b.naam}</span>
            <span className="download-uitleg">{b.uitleg}</span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-quiet" onClick={kopieer} disabled={kopie === 'bezig'}>
          {kopie === 'bezig' ? 'Bezig…' : 'Back-up naar klembord'}
        </button>
        {kopie === 'klaar' && (
          <span style={{ fontSize: 13.5, color: 'var(--moss)' }}>
            Gekopieerd — plak het in een gesprek met Claude.
          </span>
        )}
        {kopie === 'fout' && (
          <span style={{ fontSize: 13.5, color: 'var(--oxblood)' }}>
            Kopiëren lukte niet. Gebruik dan de knop &ldquo;Back-up&rdquo; hierboven.
          </span>
        )}
      </div>

      <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: '62ch' }}>
        De back-up heeft hetzelfde formaat als dat van de oorspronkelijke app, dus je kunt hem
        aan Claude geven om druiven, drinkvensters en notities te laten aanvullen, en het
        resultaat weer importeren.
      </p>
    </section>
  );
}
