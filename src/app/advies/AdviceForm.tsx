'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  adviseWines, parseNote, genericPairing, sommAdvies, SOMM_VRAGEN,
  type AdviceResult, type AdviceHit, type SommAntwoorden, type SommVraag,
} from '@/lib/sommelier';
import { drinkBadge, currentYear } from '@/lib/drinkwindow';
import type { Wine } from '@/lib/types';

const GEZELSCHAP = ['', 'Alleen', 'Partner', 'Vrienden', 'Familie', 'Zakelijk'];

type Modus = 'vrij' | 'stappen';

export function AdviceForm({ wines }: { wines: Wine[] }) {
  const [modus, setModus] = useState<Modus>('vrij');
  const [gerecht, setGerecht] = useState('');
  const [gezelschap, setGezelschap] = useState('');
  const [gelegenheid, setGelegenheid] = useState('');
  const [result, setResult] = useState<AdviceResult | null>(null);

  // Number() omdat een aantal uit een import of een oude back-up als tekst kan
  // binnenkomen; "1" > 0 klopt toevallig, maar "" > 0 en null > 0 niet.
  const voorraad = wines.filter((w) => Number(w.aantal) > 0);

  if (!voorraad.length) {
    // Een kelder zonder wijnen vraagt om iets anders dan een kelder waarin alle
    // flessen op zijn. Dat laatste kwam eerder als "voeg eerst wijn toe" op het
    // scherm, wat verwarrend is als je je wijnen wél ziet staan.
    const leeg = wines.length === 0;
    return (
      <div className="state-empty">
        <p className="display">{leeg ? 'Je kelder is nog leeg' : 'Alle flessen zijn op'}</p>
        <p style={{ marginBottom: 20, maxWidth: '44ch', marginLeft: 'auto', marginRight: 'auto' }}>
          {leeg ? (
            'Voeg eerst wijn toe, dan kan ik iets voorstellen.'
          ) : (
            <>
              Je hebt {wines.length} {wines.length === 1 ? 'wijn' : 'wijnen'} in je register, maar
              van geen enkele staat er nog een fles. Wijnen op nul flessen blijven als herinnering
              staan; vul het aantal aan bij een wijn die je opnieuw hebt gekocht.
            </>
          )}
        </p>
        <Link className="btn btn-primary" href={leeg ? '/toevoegen' : '/'}>
          {leeg ? 'Wijn toevoegen' : 'Naar mijn kelder'}
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(adviseWines(wines, { gerecht, gezelschap, gelegenheid }));
  }

  return (
    <>
      <div className="auth-tabs" role="tablist" aria-label="Manier van kiezen">
        <button role="tab" aria-selected={modus === 'vrij'}
          className={`auth-tab${modus === 'vrij' ? ' on' : ''}`}
          onClick={() => { setModus('vrij'); setResult(null); }}>
          Typ zelf
        </button>
        <button role="tab" aria-selected={modus === 'stappen'}
          className={`auth-tab${modus === 'stappen' ? ' on' : ''}`}
          onClick={() => { setModus('stappen'); setResult(null); }}>
          Stap voor stap
        </button>
      </div>

      {modus === 'stappen' ? (
        <Stappen wines={wines} />
      ) : (
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
      )}
    </>
  );
}

/** Drie vragen, en dan een fles uit je eigen kelder. */
function Stappen({ wines }: { wines: Wine[] }) {
  const [stap, setStap] = useState(0);
  const [antwoorden, setAntwoorden] = useState<SommAntwoorden>({});

  function kies(key: SommVraag['key'], waarde: string) {
    setAntwoorden((a) => ({ ...a, [key]: waarde }));
    setStap((s) => s + 1);
  }

  function opnieuw() {
    setStap(0);
    setAntwoorden({});
  }

  if (stap >= SOMM_VRAGEN.length) {
    const hits = sommAdvies(wines, antwoorden);
    return (
      <section>
        <p className="label" style={{ marginBottom: 12 }}>Mijn voorstel</p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
          {hits.map((h) => <Kaart key={h.wine.id} hit={h} />)}
        </ul>
        <button className="btn btn-quiet" onClick={opnieuw}>Opnieuw beginnen</button>
      </section>
    );
  }

  const vraag = SOMM_VRAGEN[stap];
  return (
    <section>
      <div className="stappen-punten" aria-hidden="true">
        {SOMM_VRAGEN.map((_, i) => (
          <span key={i} className={`punt${i <= stap ? ' on' : ''}`} />
        ))}
      </div>
      <p className="label" style={{ marginBottom: 4 }}>
        Vraag {stap + 1} van {SOMM_VRAGEN.length}
      </p>
      <h2 className="display" style={{ fontSize: 24, marginBottom: 18 }}>{vraag.vraag}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vraag.opties.map((o) => (
          <button key={o.value} className="keuze" onClick={() => kies(vraag.key, o.value)}>
            {o.label}
          </button>
        ))}
      </div>

      {stap > 0 && (
        <button className="btn btn-quiet btn-sm" style={{ marginTop: 16 }}
          onClick={() => setStap((s) => Math.max(0, s - 1))}>
          Vorige vraag
        </button>
      )}
    </section>
  );
}

function Kaart({ hit }: { hit: AdviceHit }) {
  const { wine, label } = hit;
  const year = currentYear();
  const badge = drinkBadge(wine, year);
  const sections = parseNote(wine.note);
  const lekkerBij = sections?.find((s) => s.label?.toLowerCase() === 'lekker bij');
  const meta = [wine.type, wine.regio, wine.druif].filter(Boolean).join(' · ');

  // De rang staat op een eigen regel bóven de naam. Naast de naam paste hij bij
  // een korte wijn wel en bij een lange niet, en dan zijn de twee kaarten
  // verschillend van vorm.
  return (
    <li className="panel advies-kaart">
      <p className="label advies-rang">{label}</p>
      <h3 className="row-name advies-naam">
        <Link href={`/wijn/${wine.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          {wine.naam}
        </Link>
        {wine.jaar && <span className="row-vintage">{wine.jaar}</span>}
      </h3>
      <p className="row-meta advies-meta">
        {meta}
        {meta && <span className="sep">·</span>}
        <span className={`merk ${badge.status}`}>{badge.label}</span>
        <span className="sep">·</span>
        <span className="mono">{wine.aantal} fl.</span>
      </p>
      <p className="advies-reden">
        {lekkerBij ? lekkerBij.body
          : wine.note ? wine.note.split('\n').filter(Boolean)[0]
          : `Geen eigen notitie — over het algemeen lekker bij ${genericPairing(wine.type)}.`}
      </p>
    </li>
  );
}

function Result({ result }: { result: AdviceResult }) {
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
        {result.hits.map((h) => <Kaart key={h.wine.id} hit={h} />)}
      </ul>
    </section>
  );
}
