'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adviseWines, parseNote, genericPairing, type AdviceResult } from '@/lib/sommelier';
import { drinkBadge, currentYear } from '@/lib/drinkwindow';
import type { Wine } from '@/lib/types';

const GEZELSCHAP = ['', 'Alleen', 'Partner', 'Vrienden', 'Familie', 'Zakelijk'];

export function AdviceForm({ wines }: { wines: Wine[] }) {
  const [gerecht, setGerecht] = useState('');
  const [gezelschap, setGezelschap] = useState('');
  const [gelegenheid, setGelegenheid] = useState('');
  const [result, setResult] = useState<AdviceResult | null>(null);

  const voorraad = wines.filter((w) => w.aantal > 0);

  if (!voorraad.length) {
    return (
      <div className="state-empty">
        <p className="display">Geen flessen op voorraad</p>
        <p style={{ marginBottom: 20 }}>Voeg eerst wijn toe, dan kan ik iets voorstellen.</p>
        <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(adviseWines(wines, { gerecht, gezelschap, gelegenheid }));
  }

  return (
    <>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 30 }}>
        <div className="field">
          <label htmlFor="gerecht">Wat eet je?</label>
          <textarea
            id="gerecht"
            value={gerecht}
            onChange={(e) => setGerecht(e.target.value)}
            style={{ minHeight: 74 }}
            placeholder="bijv. gestoofd rundvlees, of pasta met romige saus"
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="gezelschap">Gezelschap</label>
            <select id="gezelschap" value={gezelschap} onChange={(e) => setGezelschap(e.target.value)}>
              {GEZELSCHAP.map((g) => (
                <option key={g} value={g}>{g || 'Geen voorkeur'}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gelegenheid">Gelegenheid</label>
            <input
              id="gelegenheid"
              value={gelegenheid}
              onChange={(e) => setGelegenheid(e.target.value)}
              placeholder="bijv. verjaardag, doordeweeks"
            />
          </div>
        </div>
        <div>
          <button className="btn btn-primary" type="submit" disabled={!gerecht.trim() && !gelegenheid.trim()}>
            Zoek een fles
          </button>
        </div>
      </form>

      {result && <Result result={result} />}
    </>
  );
}

function Result({ result }: { result: AdviceResult }) {
  const year = currentYear();

  if (!result.hits.length) {
    return (
      <div className="notice warn">
        <p style={{ marginBottom: 8 }}>
          <strong>Geen fles die hier duidelijk bij past.</strong>
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          Ik geef liever geen willekeurige gok. Probeer een ander woord — het hoofdingrediënt, de
          saus of de bereidingswijze — of vul de &ldquo;Lekker bij&rdquo;-notitie van een wijn aan
          waarvan je weet dat &apos;ie hier goed bij past.
        </p>
      </div>
    );
  }

  return (
    <section>
      <p className="label" style={{ marginBottom: 12 }}>
        Aanbevolen bij {result.summary}
      </p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {result.hits.map(({ wine, label }) => {
          const badge = drinkBadge(wine, year);
          const sections = parseNote(wine.note);
          const lekkerBij = sections?.find((s) => s.label?.toLowerCase() === 'lekker bij');
          const meta = [wine.type, wine.regio, wine.druif].filter(Boolean).join(' · ');

          return (
            <li key={wine.id} className="panel" style={{ borderRadius: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <h3 className="row-name" style={{ fontSize: 21 }}>
                  <Link href={`/wijn/${wine.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {wine.naam}
                  </Link>
                  {wine.jaar && <span className="row-vintage">{wine.jaar}</span>}
                </h3>
                <span className="label" style={{ color: 'var(--oxblood)' }}>{label}</span>
              </div>

              <p className="row-meta" style={{ whiteSpace: 'normal', marginTop: 3 }}>
                {meta}
                {meta && <span className="sep">·</span>}
                <span className={`mark ${badge.status}`} style={{ fontSize: 10.5 }}>{badge.label}</span>
                <span className="sep">·</span>
                <span className="mono">{wine.aantal} fl.</span>
              </p>

              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', marginTop: 12 }}>
                {lekkerBij
                  ? lekkerBij.body
                  : wine.note
                    ? wine.note.split('\n').filter(Boolean)[0]
                    : `Geen eigen notitie — over het algemeen lekker bij ${genericPairing(wine.type)}.`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
