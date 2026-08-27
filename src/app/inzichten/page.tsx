import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCellarWithWines } from '@/lib/cellar';
import { totals, countBy, countByStatus } from '@/lib/insights';
import { currentYear } from '@/lib/drinkwindow';
import { Nav } from '../Nav';
import { Bars } from './Charts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inzichten · Wijnkelder' };

const euro = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default async function InzichtenPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const { wines } = data;
  const t = totals(wines);
  const status = countByStatus(wines, currentYear());

  if (!wines.length) {
    return (
      <main className="shell" style={{ maxWidth: 820 }}>
        <div className="masthead">
          <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>Inzichten</h1>
        </div>
        <Nav />
        <div className="state-empty">
          <p className="display">Nog niets te tellen</p>
          <p style={{ marginBottom: 20 }}>Voeg wijnen toe, dan verschijnen hier de verhoudingen.</p>
          <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell" style={{ maxWidth: 820 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>Inzichten</h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          Tellingen gaan over flessen, niet over regels — zes flessen van dezelfde wijn tellen
          zes keer.
        </p>
      </div>
      <Nav />

      <div className="stats">
        <div className="stat">
          <span className="stat-n">{t.wijnen}</span>
          <span className="stat-l">Wijnen</span>
          <span className="stat-note">{t.flessen} flessen in totaal</span>
        </div>
        <div className="stat">
          <span className="stat-n">{euro(t.waarde)}</span>
          <span className="stat-l">Aankoopwaarde</span>
          <span className="stat-note">
            {t.metPrijs === t.wijnen
              ? 'alle wijnen hebben een prijs'
              : `${t.wijnen - t.metPrijs} zonder prijs, niet meegerekend`}
          </span>
        </div>
        <div className="stat">
          <span className="stat-n">
            {t.gemiddeldeScore ?? '—'}
            {t.gemiddeldeScore && <span className="unit"> / 5</span>}
          </span>
          <span className="stat-l">Gemiddeld</span>
          <span className="stat-note">
            {t.beoordeeld ? `over ${t.beoordeeld} beoordeelde wijnen` : 'nog niets beoordeeld'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-n">{status.nu}</span>
          <span className="stat-l">Op dronk</span>
          <span className="stat-note">
            {status.vb ? `${status.vb} over hoogtepunt` : 'niets over hoogtepunt'}
          </span>
        </div>
      </div>

      <Bars titel="Per type" slices={countBy(wines, 'type')} leeg="Geen typen ingevuld." />
      <Bars
        titel="Per regio"
        slices={countBy(wines, 'regio', { limit: 8 })}
        leeg="Nog geen regio's ingevuld. Vul ze aan bij een wijn, dan verschijnt hier de verdeling."
      />
      <Bars
        titel="Per druif"
        slices={countBy(wines, 'druif', { split: true, limit: 8 })}
        leeg="Nog geen druiven ingevuld. Claude kan die aanvullen — zie de instructie in de handleiding."
      />
    </main>
  );
}
