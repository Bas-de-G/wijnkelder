import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { drinkBadge, drinkProgress, currentYear } from '@/lib/drinkwindow';
import { parseNote } from '@/lib/sommelier';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Gedeelde wijnkelder',
  // Een deel-link hoort niet in zoekmachines te belanden.
  robots: { index: false, follow: false },
};

/** Zelfde streepje per type als in het register. */
const ACCENT: Record<string, string> = {
  Rood: 'rood', Wit: 'wit', 'Rosé': 'rose', Mousserend: 'mousserend', Overig: 'overig',
};

interface GedeeldeWijn {
  naam: string; type: string; regio: string | null; druif: string | null;
  producent: string | null; jaar: number | null; aantal: number;
  drink_from: number | null; drink_to: number | null; sterren: number | null;
  note: string | null;
}

export default async function DeelPagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Bewust geen sessie-client: deze pagina is voor bezoekers zonder account.
  // shared_cellar() draait als security definer en geeft alleen de kolommen
  // terug die gedeeld mogen worden — prijzen zitten er niet bij.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await supabase.rpc('shared_cellar', { share_token: token });
  if (error || !data || data.length === 0) notFound();

  const wijnen = data as GedeeldeWijn[];
  const jaar = currentYear();
  const flessen = wijnen.reduce((t, w) => t + (w.aantal || 0), 0);

  return (
    <>
      <header className="kop kop-slank">
        <div className="kop-binnen">
          <div className="kop-rij">
            <span className="kop-merk">Wijn<em>kelder</em></span>
            <span className="kop-datum mono" style={{ display: 'block' }}>
              {wijnen.length} wijnen · {flessen} flessen
            </span>
          </div>
          <p className="kop-sub">Gedeeld — alleen lezen</p>
        </div>
      </header>

      <main className="shell" style={{ maxWidth: 880 }}>
        {/* Dezelfde kaart als in het register, maar zonder uitklappen en zonder
            knoppen: hier valt niets te bedienen. */}
        <div className="kaarten" role="list">
          {wijnen.map((w, i) => {
            const badge = drinkBadge(w, jaar);
            const p = drinkProgress(w, jaar);
            const sub = [w.type, w.jaar, w.druif].filter(Boolean).join(' · ');
            const secties = parseNote(w.note);
            const sterren = w.sterren ?? 0;

            return (
              <article key={`${w.naam}-${i}`} className="kaart" role="listitem">
                <span className={`kaart-accent t-${ACCENT[w.type] ?? 'overig'}`} aria-hidden="true" />

                <div className="kaart-kop kaart-kop-stil">
                  <span className="kaart-naam">{w.naam}</span>
                  <span className="kaart-voorraad"><b>{w.aantal}</b> fl.</span>
                  <span className="kaart-regel">
                    <span className={`merk ${badge.status}`}>{badge.label}</span>
                    {sub && <span className="kaart-sub">{sub}</span>}
                  </span>
                </div>

                <div className="kaart-meer open">
                  <div className="kaart-binnen">
                    {(w.regio || w.producent) && (
                      <ul className="kaart-chips">
                        {w.regio && <li className="feit">{w.regio}</li>}
                        {w.producent && <li className="feit">{w.producent}</li>}
                      </ul>
                    )}

                    {sterren > 0 && (
                      <p className="kaart-sterren" aria-label={`${sterren} van 5 sterren`}>
                        <span aria-hidden="true">{'★'.repeat(sterren)}</span>
                        <span className="leeg" aria-hidden="true">{'★'.repeat(5 - sterren)}</span>
                      </p>
                    )}

                    {p && (
                      <div className="venster">
                        <p className="venster-kop">
                          <span className="mono">{w.drink_from}–{w.drink_to}</span>
                          <span>{p.pct}% van venster</span>
                        </p>
                        <div className="venster-baan">
                          <span className={`venster-vul ${badge.status}`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    )}

                    {secties
                      ? secties.map((sec, j) => (
                          <div key={j} className="kaart-notitie">
                            {sec.label && <p className="label">{sec.label}</p>}
                            <p>{sec.body}</p>
                          </div>
                        ))
                      : w.note && <div className="kaart-notitie"><p>{w.note}</p></div>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p style={{ marginTop: 30, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          Dit is een alleen-lezen weergave van iemands wijnkelder. Prijzen worden niet gedeeld, en
          de eigenaar kan deze link op elk moment intrekken.
        </p>
      </main>
    </>
  );
}
