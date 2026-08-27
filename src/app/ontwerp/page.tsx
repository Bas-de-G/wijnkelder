import { notFound } from 'next/navigation';
import { Masthead } from '../Masthead';
import { Ledger } from '../Ledger';
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
];

export default function OntwerpPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="shell">
      <Masthead tally={{ nu: 4, wachten: 1, voorbij: 2, flessen: 31 }} />
      <Ledger wines={DEMO} />
    </main>
  );
}
