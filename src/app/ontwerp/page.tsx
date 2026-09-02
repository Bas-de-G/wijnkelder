import { notFound } from 'next/navigation';
import { AppHeader, Cijfers, PageHeader } from '../Masthead';
import { Ledger } from '../Ledger';
import { TabBar } from '../Nav';
import { Bars } from '../inzichten/Charts';
import { AanvulFlow } from '../aanvullen/AanvulFlow';
import { WijnKern } from '../WineFacts';
import { Tijdlijn } from '../tijdlijn/Tijdlijn';
import { AdviceForm } from '../advies/AdviceForm';
import { totals, countBy, kopCijfers } from '@/lib/insights';
import type { Wine, WineType } from '@/lib/types';

// Alleen tijdens ontwikkelen: het register met voorbeelddata, zodat je aan het
// ontwerp kunt werken zonder eerst een kelder te vullen.
export const metadata = { title: 'Ontwerpvoorbeeld · Wijnkelder' };

const w = (
  naam: string, type: WineType, jaar: number | null, from: number | null,
  to: number | null, aantal: number, regio: string, druif: string
): Wine => ({
  id: naam, cellar_id: 'demo', legacy_id: null, naam, type, regio, druif,
  producent: null, herkomst: null, locatie: null, jaar, aantal, prijs: 30,
  drink_from: from, drink_to: to, sterren: 4, note: null,
  created_at: '2026-01-01', updated_at: '2026-01-01', deleted_at: null,
});

const DEMO: Wine[] = [
  w('Barolo Riserva', 'Rood', 2016, 2026, 2040, 3, 'Piemonte', 'Nebbiolo'),
  w('Chablis Premier Cru', 'Wit', 2021, 2023, 2027, 6, 'Bourgogne', 'Chardonnay'),
  w('Rioja Gran Reserva', 'Rood', 2014, 2022, 2034, 2, 'Rioja', 'Tempranillo'),
  w('Sancerre', 'Wit', 2023, 2024, 2026, 4, 'Loire', 'Sauvignon Blanc'),
  w('Brunello di Montalcino', 'Rood', 2018, 2028, 2045, 1, 'Toscane', 'Sangiovese'),
  w('Beaujolais Villages', 'Rood', 2022, 2023, 2025, 0, 'Beaujolais', 'Gamay'),
  w('Champagne Brut Nature', 'Mousserend', null, null, null, 2, 'Champagne', 'Pinot Noir'),
  w('Provence Rosé', 'Rosé', 2024, 2025, 2026, 8, 'Provence', 'Cinsault'),
  w('Riesling Kabinett', 'Wit', 2019, 2021, 2035, 5, 'Mosel', 'Riesling'),
  w('Amarone della Valpolicella', 'Rood', 2017, 2025, 2037, 2, 'Veneto', 'Corvina'),
  w('Chateauneuf-du-Pape', 'Rood', 2019, 2026, 2038, 3, 'Rhône', 'Grenache, Syrah'),
  w('Gruner Veltliner', 'Wit', 2022, 2023, 2028, 6, 'Wachau', 'Grüner Veltliner'),
  w('Vinho Verde', 'Wit', 2024, 2024, 2026, 12, 'Minho', 'Alvarinho'),
  w('Zinfandel Old Vine', 'Rood', 2020, 2023, 2032, 2, 'Sonoma', 'Zinfandel'),
];

export default function OntwerpPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <>
      <AppHeader />
      <main className="shell">
      <Cijfers tally={kopCijfers(DEMO)} />
      <Ledger wines={DEMO} />

      <div style={{ marginTop: 60 }}>
        <div className="stats">
          <div className="stat">
            <span className="stat-n">{totals(DEMO).wijnen}</span>
            <span className="stat-l">Wijnen</span>
            <span className="stat-note">{totals(DEMO).flessen} flessen in totaal</span>
          </div>
          <div className="stat">
            <span className="stat-n">€ 930</span>
            <span className="stat-l">Aankoopwaarde</span>
            <span className="stat-note">alle wijnen hebben een prijs</span>
          </div>
          <div className="stat">
            <span className="stat-n">4<span className="unit"> / 5</span></span>
            <span className="stat-l">Gemiddeld</span>
            <span className="stat-note">over 9 beoordeelde wijnen</span>
          </div>
          <div className="stat">
            <span className="stat-n">4</span>
            <span className="stat-l">Op dronk</span>
            <span className="stat-note">2 over hoogtepunt</span>
          </div>
        </div>
        <Bars titel="Per type" slices={countBy(DEMO, 'type')} leeg="—" />
        <Bars titel="Per regio" slices={countBy(DEMO, 'regio', { limit: 8 })} leeg="—" />
        <Bars titel="Per druif" slices={countBy(DEMO, 'druif', { split: true, limit: 8 })} leeg="—" />
      </div>

      <div style={{ marginTop: 60 }}>
        <AanvulFlow totaal={14} onvolledig={5} />
      </div>

      <div style={{ marginTop: 60 }}>
        <p className="inleiding">De tijdlijn.</p>
        <Tijdlijn wines={DEMO} />
      </div>

      <div style={{ marginTop: 60 }}>
        <p className="inleiding">Zo begint de pagina van één wijn.</p>
        <WijnKern wine={DEMO[0]} />
      </div>

      <div style={{ marginTop: 60 }}>
        <AdviceForm wines={DEMO} />
      </div>
      </main>

      {/* Alle balken onder elkaar, zodat te zien is dat ze even hoog zijn. Een
          verschil hierin laat de hele pagina verspringen bij het wisselen van
          tabblad — dat was de klacht die deze proef bewaakt. */}
      <div className="shell" style={{ paddingBottom: 0 }}>
        <p className="label">Kopbalken — moeten allemaal even hoog zijn</p>
      </div>
      <div className="koppenproef">
        <PageHeader titel="Dagboek" />
        <PageHeader titel="Inzichten" />
        <PageHeader titel="Wat drink ik" cursief="vanavond" />
        <PageHeader titel="Nog te" cursief="proeven" />
        <PageHeader titel="Amarone della Valpolicella Classico Superiore" />
      </div>
      <TabBar />
    </>
  );
}
