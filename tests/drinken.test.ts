import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const WORTEL = path.resolve(__dirname, '..');
const lees = (p: string) => fs.readFileSync(path.join(WORTEL, p), 'utf8');

/**
 * Bij de laatste fles kies je tussen "Bewaren als herinnering" en "Uit de kelder
 * halen". De keuze zat alleen in de naam en waarde van de knop, en die kwam niet
 * mee in het formulier dat bij de server aankwam (nagemeten in de browser). De
 * server las dan geen "ja", zette de voorraad op nul, en de wijn bleef met nul
 * flessen in de kelder staan.
 */
describe('uit de kelder halen bij de laatste fles', () => {
  const formulier = lees('src/app/wijn/[id]/WineActions.tsx');
  const acties = lees('src/lib/actions.ts');

  it('de keuze gaat mee in een verborgen veld, niet alleen op de knop', () => {
    expect(formulier).toMatch(/<input type="hidden" name="verwijderen"[^>]*ref=\{keuze\}/);
  });

  it('beide knoppen zetten hun keuze in dat veld', () => {
    expect(formulier).toContain("onClick={kies('ja')}");
    expect(formulier).toContain("onClick={kies('nee')}");
  });

  it('de server kijkt naar elke waarde, niet alleen de eerste', () => {
    // Het veld kan twee keer meekomen: verborgen veld én knop.
    expect(acties).toMatch(/form\.getAll\('verwijderen'\)/);
    expect(acties).not.toMatch(/form\.get\('verwijderen'\)/);
  });

  it('en haalt de wijn dan echt weg in plaats van op nul te zetten', () => {
    const start = acties.indexOf('export async function drinkBottle');
    const body = acties.slice(start, acties.indexOf('\nexport ', start + 10));
    expect(body).toMatch(/over === 0 && wilVerwijderen\(form\)\s*\?\s*await supabase\.from\('wines'\)\.update\(\{ deleted_at:/);
  });
});
