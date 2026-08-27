import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { drinkBadge, currentYear } from '@/lib/drinkwindow';
import { buildAxis, windowSpan, tickPosition } from '@/lib/axis';
import type { Wine } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Gedeelde wijnkelder',
  // Een deel-link hoort niet in zoekmachines te belanden.
  robots: { index: false, follow: false },
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
  const asWijnen = wijnen as unknown as Wine[];
  const as = buildAxis(asWijnen, jaar);

  return (
    <main className="shell" style={{ maxWidth: 880 }}>
      <div className="masthead">
        <h1 className="wordmark">
          Wijn<em>kelder</em>
        </h1>
        <span className="label">Gedeeld · alleen lezen</span>
      </div>
      <div className="masthead-sub">
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          {wijnen.length} wijnen · {flessen} flessen
        </span>
      </div>

      <div className="ledger">
        <div className="ledger-head">
          <span className="label">Wijn</span>
          <div className="axis-scale" aria-hidden="true">
            {as.ticks.map((t) => (
              <span key={t} className="axis-tick" style={{ left: `${tickPosition(t, as) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>
          <span className="label" style={{ textAlign: 'right' }}>Voorraad</span>
        </div>

        <div className="ledger-overlay" aria-hidden="true">
          <div />
          <div className="axis-col">
            <span className="ledger-now" style={{ ['--now' as string]: as.now }} />
          </div>
          <div />
        </div>

        <ul>
          {wijnen.map((w, i) => {
            const badge = drinkBadge(w, jaar);
            const span = windowSpan(w as unknown as Wine, as);
            const meta = [w.type, w.regio, w.druif, w.producent].filter(Boolean).join(' · ');
            const spanClass = badge.status === 'vb' ? 'past'
              : badge.status === 'wt' ? 'waiting' : badge.closing ? 'closing' : '';

            return (
              <li key={`${w.naam}-${i}`} className={`row${badge.status === 'vb' ? ' past' : ''}`}>
                <div className="row-main">
                  <h3 className="row-name">
                    {w.naam}
                    {w.jaar && <span className="row-vintage">{w.jaar}</span>}
                    <span className={`mark ${badge.status}`}>{badge.label}</span>
                  </h3>
                  {meta && <p className="row-meta">{meta}</p>}
                </div>
                <div className="window">
                  <span className="window-track" />
                  {span ? (
                    <span
                      className={`window-span ${spanClass}`}
                      style={{ ['--from' as string]: span.from, ['--to' as string]: span.to }}
                    />
                  ) : (
                    <span className="window-none" />
                  )}
                  <span className="window-now" style={{ ['--now' as string]: as.now }} aria-hidden="true" />
                  <span className="window-years" aria-hidden="true">
                    <span>{as.min}</span><span>{as.max}</span>
                  </span>
                </div>
                <div className="row-stock">
                  <span className="n">{w.aantal}</span> fl.
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p style={{ marginTop: 30, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        Dit is een alleen-lezen weergave van iemands wijnkelder. Prijzen worden niet gedeeld, en
        de eigenaar kan deze link op elk moment intrekken.
      </p>
    </main>
  );
}
