'use client';

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { ENRICH_PROMPT } from '@/lib/enrich-prompt';
import { previewImport, runImport, type ImportPreview, type ImportResult } from '@/lib/import-actions';

const NO_PREVIEW: ImportPreview = {};
const NO_RESULT: ImportResult = {};

export function AanvulFlow({ totaal, onvolledig }: { totaal: number; onvolledig: number }) {
  const [preview, previewAction, previewing] = useActionState(previewImport, NO_PREVIEW);
  const [result, importAction, importing] = useActionState(runImport, NO_RESULT);
  const [payload, setPayload] = useState('');
  const [plakveld, setPlakveld] = useState('');
  const [promptGekopieerd, setPromptGekopieerd] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function kopieerPrompt() {
    try {
      await navigator.clipboard.writeText(ENRICH_PROMPT);
      setPromptGekopieerd(true);
      setTimeout(() => setPromptGekopieerd(false), 4000);
    } catch {
      // Klembord geweigerd; de tekst staat zichtbaar op het scherm.
    }
  }

  function verstuur(tekst: string) {
    setPayload(tekst);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  async function kiesBestand(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) verstuur(await file.text());
  }

  if (totaal === 0) {
    return (
      <div className="state-empty">
        <p className="display">Nog geen wijnen om aan te vullen</p>
        <p style={{ marginBottom: 20 }}>Voeg eerst wat flessen toe.</p>
        <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
      </div>
    );
  }

  if (result.klaar) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="notice good" role="status">
          <strong>Aangevuld.</strong> {result.bijgewerkt} wijn(en) bijgewerkt
          {result.toegevoegd ? `, ${result.toegevoegd} toegevoegd` : ''}.
        </div>
        <div>
          <Link className="btn btn-primary" href="/">Naar je kelder</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stappenlijst">
      {/* ── 1 ── */}
      <section className="stap">
        <span className="stap-nr">1</span>
        <div>
          <h2>Stuur je wijnen mee</h2>
          <p>
            {onvolledig > 0 ? (
              <>
                {onvolledig} van je {totaal} wijnen mist nog een druif, drinkvenster of notitie.
                Alleen die meesturen gaat sneller en levert een korter antwoord op.
              </>
            ) : (
              <>Al je wijnen hebben een druif, drinkvenster en notitie. Je kunt ze alsnog
                meesturen om de bestaande gegevens te laten controleren.</>
            )}
          </p>
          <div className="knoprij" style={{ marginTop: 12 }}>
            {onvolledig > 0 && (
              <a className="btn btn-primary" href="/api/export/json?onvolledig=1" download>
                Alleen wat ontbreekt ({onvolledig})
              </a>
            )}
            <a className={`btn ${onvolledig > 0 ? 'btn-quiet' : 'btn-primary'}`}
               href="/api/export/json" download>
              Hele kelder ({totaal})
            </a>
          </div>
        </div>
      </section>

      {/* ── 2 ── */}
      <section className="stap">
        <span className="stap-nr">2</span>
        <div>
          <h2>Geef Claude deze opdracht</h2>
          <p>
            Open een gesprek met Claude, upload het bestand en plak de tekst hieronder erbij. De
            eerste keer is genoeg — daarna onthoudt Claude het binnen hetzelfde gesprek.
          </p>
          <div className="prompt-wrap">
            <pre className="prompt">{ENRICH_PROMPT}</pre>
          </div>
          <button className="btn btn-quiet" onClick={kopieerPrompt}>
            {promptGekopieerd ? 'Gekopieerd' : 'Opdracht kopiëren'}
          </button>
        </div>
      </section>

      {/* ── 3 ── */}
      <section className="stap">
        <span className="stap-nr">3</span>
        <div>
          <h2>Zet het antwoord terug</h2>
          <p>
            Claude antwoordt meestal met JSON in het gesprek zelf. Plak dat hieronder. Krijg je
            een bestand terug, kies het dan met de knop eronder.
          </p>

          <form ref={formRef} action={previewAction}>
            <input type="hidden" name="payload" value={payload} />
          </form>

          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="plak">Antwoord van Claude</label>
            <textarea
              id="plak"
              value={plakveld}
              onChange={(e) => setPlakveld(e.target.value)}
              placeholder={'{\n  "update_wines": [ … ]\n}'}
              style={{ minHeight: 130, fontFamily: 'var(--mono)', fontSize: 12.5 }}
            />
          </div>

          <div className="knoprij">
            <button
              className="btn btn-primary"
              onClick={() => verstuur(plakveld)}
              disabled={!plakveld.trim() || previewing}
            >
              {previewing ? 'Bezig…' : 'Nakijken'}
            </button>
            <label className="btn btn-quiet" style={{ cursor: 'pointer' }}>
              Bestand kiezen
              <input type="file" accept="application/json,.json" onChange={kiesBestand}
                style={{ display: 'none' }} />
            </label>
          </div>

          {preview.error && (
            <div className="notice" role="alert" style={{ marginTop: 14 }}>{preview.error}</div>
          )}

          {preview.nieuw !== undefined && (
            <Voorbeeld preview={preview} payload={payload} action={importAction}
              importing={importing} fout={result.error} />
          )}
        </div>
      </section>
    </div>
  );
}

function Voorbeeld({
  preview, payload, action, importing, fout,
}: {
  preview: ImportPreview;
  payload: string;
  action: (formData: FormData) => void;
  importing: boolean;
  fout?: string;
}) {
  const soortTekst = {
    aanvulling: 'Een aanvulling: bestaande wijnen worden bijgewerkt, er komt niets nieuws bij.',
    toevoeging: 'Nieuwe wijnen om toe te voegen.',
    volledig: 'Een volledige back-up: bestaande wijnen worden aangevuld, onbekende toegevoegd.',
  }[preview.soort ?? 'volledig'];

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <p className="label" style={{ marginBottom: 6 }}>Wat er gebeurt</p>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>{soortTekst}</p>

      <div className="tally" style={{ marginBottom: 16 }}>
        <div className="tally-item">
          <span className="tally-n">{preview.bijgewerkt}</span>
          <span className="tally-l">Bijgewerkt</span>
        </div>
        {!!preview.nieuw && (
          <div className="tally-item">
            <span className="tally-n">{preview.nieuw}</span>
            <span className="tally-l">Nieuw</span>
          </div>
        )}
        <div className="tally-item">
          <span className="tally-n">{preview.ongewijzigd}</span>
          <span className="tally-l">Ongewijzigd</span>
        </div>
      </div>

      {!!preview.voorbeeld?.length && (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {preview.voorbeeld.map((v, i) => (
            <li key={i} style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
              <strong style={{ fontWeight: 600 }}>{v.naam}</strong>
              <span style={{ color: 'var(--ink-3)' }}> — {v.velden.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}

      {!!preview.onbekend?.length && (
        <div className="notice warn" style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 6 }}>
            <strong>{preview.onbekend.length} wijn(en) uit dit antwoord staan niet in je kelder</strong>
            {' '}en worden overgeslagen:
          </p>
          <p style={{ fontSize: 13.5 }}>{preview.onbekend.slice(0, 8).join(', ')}</p>
          <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            Meestal komt dat doordat de naam iets anders is geschreven. Loop ze na of pas ze met
            de hand aan.
          </p>
        </div>
      )}

      {preview.bijgewerkt === 0 && preview.nieuw === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
          Er valt niets bij te werken — alles wat hier staat, staat al zo in je kelder.
        </p>
      ) : (
        <>
          {fout && <div className="notice" role="alert" style={{ marginBottom: 14 }}>{fout}</div>}
          <form action={action}>
            <input type="hidden" name="payload" value={payload} />
            <button className="btn btn-primary" type="submit" disabled={importing}>
              {importing ? 'Bezig…' : 'Overnemen in mijn kelder'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
