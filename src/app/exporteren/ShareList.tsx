'use client';

import { useState } from 'react';
import { createShare, revokeShare } from '@/lib/actions';
import type { Deellink } from './page';

export function ShareList({ links, heeftWijnen }: { links: Deellink[]; heeftWijnen: boolean }) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function maak() {
    setBezig(true);
    setFout(null);
    const r = await createShare();
    if (r.error) setFout(r.error);
    setBezig(false);
  }

  return (
    <section>
      <div className="chart-hd">
        <h3>Kelder delen</h3>
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: '62ch', marginBottom: 18 }}>
        Een deel-link laat iemand meekijken zonder account en zonder iets te kunnen wijzigen.
        Anders dan een gedownload bestand blijft hij vanzelf actueel — en je kunt hem intrekken
        wanneer je wilt. Prijzen worden nooit meegedeeld.
      </p>

      {fout && <div className="notice" role="alert" style={{ marginBottom: 16 }}>{fout}</div>}

      {links.length > 0 && (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
          {links.map((l) => (
            <ShareRow key={l.id} link={l} />
          ))}
        </ul>
      )}

      <button className="btn btn-primary" onClick={maak} disabled={bezig || !heeftWijnen}>
        {bezig ? 'Bezig…' : links.length ? 'Nog een link maken' : 'Deel-link maken'}
      </button>
    </section>
  );
}

function ShareRow({ link }: { link: Deellink }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const [bevestig, setBevestig] = useState(false);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(link.url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 3000);
    } catch {
      // Klembord geweigerd; de link staat zichtbaar op het scherm, dus die is
      // altijd nog met de hand te selecteren.
    }
  }

  return (
    <li className="share">
      <div className="share-qr" dangerouslySetInnerHTML={{ __html: link.qr }} />
      <div className="share-main">
        <a className="share-url mono" href={link.url} target="_blank" rel="noreferrer">
          {link.url.replace(/^https?:\/\//, '')}
        </a>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
          Gemaakt op {link.aangemaakt}
        </p>
        <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-quiet btn-sm" onClick={kopieer}>
            {gekopieerd ? 'Gekopieerd' : 'Link kopiëren'}
          </button>
          {bevestig ? (
            <>
              <form action={revokeShare.bind(null, link.id)}>
                <button className="btn btn-sm" type="submit">Intrekken</button>
              </form>
              <button className="btn btn-quiet btn-sm" onClick={() => setBevestig(false)}>
                Toch niet
              </button>
            </>
          ) : (
            <button className="btn btn-quiet btn-sm" onClick={() => setBevestig(true)}>
              Intrekken
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
