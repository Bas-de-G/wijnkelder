'use client';

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { previewImport, runImport, type ImportPreview, type ImportResult } from '@/lib/import-actions';

const NO_PREVIEW: ImportPreview = {};
const NO_RESULT: ImportResult = {};

export function ImportPanel() {
  const [preview, previewAction, previewing] = useActionState(previewImport, NO_PREVIEW);
  const [result, importAction, importing] = useActionState(runImport, NO_RESULT);
  const [payload, setPayload] = useState('');
  const [bestand, setBestand] = useState<string | null>(null);
  const [leesFout, setLeesFout] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function kies(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeesFout(null);
    try {
      const text = await file.text();
      setPayload(text);
      setBestand(file.name);
      // Meteen doorrekenen: de gebruiker wil zien wat er gebeurt, niet nog een knop.
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    } catch {
      setLeesFout('Dit bestand kon niet gelezen worden. Probeer het opnieuw te downloaden uit de oude app.');
    }
  }

  if (result.klaar) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="notice good" role="status">
          <strong>Overgenomen.</strong> {result.toegevoegd} wijn(en) toegevoegd
          {result.bijgewerkt ? `, ${result.bijgewerkt} bijgewerkt` : ''}.
        </div>
        <div>
          <Link className="btn btn-primary" href="/">Naar je kelder</Link>
        </div>
      </div>
    );
  }

  const heeftVoorbeeld = preview.nieuw !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form ref={formRef} action={previewAction}>
        <input type="hidden" name="payload" value={payload} />
        <div className="field">
          <label htmlFor="bestand">Back-upbestand</label>
          <input id="bestand" type="file" accept="application/json,.json" onChange={kies} />
          <span className="hint">
            In de oude app: <strong>Export → Back-up downloaden</strong>. Bestanden van vóór en ná
            de laatste update werken allebei.
          </span>
        </div>
      </form>

      {leesFout && <div className="notice" role="alert">{leesFout}</div>}
      {previewing && <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>Bezig met doorrekenen…</p>}
      {preview.error && <div className="notice" role="alert">{preview.error}</div>}

      {heeftVoorbeeld && (
        <div className="panel">
          <p className="label" style={{ marginBottom: 14 }}>
            Wat er gebeurt {bestand && <span style={{ textTransform: 'none', letterSpacing: 0 }}>— {bestand}</span>}
          </p>

          <div className="tally" style={{ marginBottom: 18 }}>
            <div className="tally-item">
              <span className="tally-n">{preview.nieuw}</span>
              <span className="tally-l">Nieuw</span>
            </div>
            <div className="tally-item">
              <span className="tally-n">{preview.bijgewerkt}</span>
              <span className="tally-l">Bijgewerkt</span>
            </div>
            <div className="tally-item">
              <span className="tally-n">{preview.ongewijzigd}</span>
              <span className="tally-l">Ongewijzigd</span>
            </div>
            {!!preview.logRegels && (
              <div className="tally-item">
                <span className="tally-n">{preview.logRegels}</span>
                <span className="tally-l">Dagboek</span>
              </div>
            )}
            {!!preview.wensen && (
              <div className="tally-item">
                <span className="tally-n">{preview.wensen}</span>
                <span className="tally-l">Verlanglijst</span>
              </div>
            )}
          </div>

          {!!preview.voorbeeld?.length && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>
                Bijvoorbeeld:
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {preview.voorbeeld.map((v, i) => (
                  <li key={i} style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
                    <strong style={{ fontWeight: 600 }}>{v.naam}</strong>
                    <span style={{ color: 'var(--ink-3)' }}> — {v.velden.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 18, lineHeight: 1.6 }}>
            Bestaande wijnen worden aangevuld, niet vervangen: een leeg veld in de back-up laat
            staan wat je al had. Je kunt dit bestand later nog eens importeren zonder duplicaten.
          </p>

          {result.error && <div className="notice" role="alert" style={{ marginBottom: 16 }}>{result.error}</div>}

          <form action={importAction}>
            <input type="hidden" name="payload" value={payload} />
            <button className="btn btn-primary" type="submit" disabled={importing}>
              {importing ? 'Bezig…' : 'Overnemen in mijn kelder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
