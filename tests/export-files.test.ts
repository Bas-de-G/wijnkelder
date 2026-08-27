import { describe, it, expect } from 'vitest';
import { buildPdf, winAnsi } from '../src/lib/export-pdf';
import { buildWorkbook } from '../src/lib/export-excel';
import type { Wine, WineType } from '../src/lib/types';

const w = (p: Partial<Wine> & { naam: string }): Wine => ({
  id: p.naam, cellar_id: 'c', legacy_id: null, type: 'Rood' as WineType, regio: null,
  druif: null, producent: null, herkomst: null, locatie: null, jaar: null, aantal: 1,
  prijs: null, drink_from: null, drink_to: null, sterren: 0, note: null,
  created_at: '', updated_at: '', deleted_at: null, ...p,
} as Wine);

describe('winAnsi', () => {
  // De ingebouwde PDF-lettertypen kennen alleen WinAnsi. Eén teken daarbuiten
  // brak vroeger de hele generatie af, dus dit is geen cosmetische kwestie.
  it('laat gewone accenten staan', () => {
    expect(winAnsi('Rosé Château Grüner')).toBe('Rosé Château Grüner');
  });

  it('vervangt typografische tekens door hun gewone variant', () => {
    expect(winAnsi('2020–2030')).toBe('2020-2030');
    expect(winAnsi('d’Yquem')).toBe("d'Yquem");
    expect(winAnsi('“Reserva”')).toBe('"Reserva"');
  });

  it('vervangt tekens buiten het bereik in plaats van te klappen', () => {
    expect(winAnsi('葡萄酒')).toBe('???');
    expect(winAnsi('★★★')).toBe('***');
    expect(winAnsi('emoji 🍷 hier')).toContain('?');
  });

  it('overleeft een lege tekst', () => {
    expect(winAnsi('')).toBe('');
  });
});

describe('buildPdf', () => {
  it('levert een geldig PDF-bestand', async () => {
    const bytes = await buildPdf([w({ naam: 'Barolo', jaar: 2016, aantal: 3 })]);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(800);
  });

  it('klapt niet op namen met tekens buiten WinAnsi', async () => {
    const bytes = await buildPdf([
      w({ naam: '葡萄酒 — “speciaal” 🍷', regio: 'Café–Bar', note: '★★★★★' }),
    ]);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('maakt meerdere paginas bij een grote kelder', async () => {
    const veel = Array.from({ length: 90 }, (_, i) => w({ naam: `Wijn ${i}`, jaar: 2020 }));
    const een = await buildPdf([w({ naam: 'Eén' })]);
    const meer = await buildPdf(veel);
    expect(meer.length).toBeGreaterThan(een.length * 2);
  });

  it('overleeft een lege kelder', async () => {
    const bytes = await buildPdf([]);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});

describe('buildWorkbook', () => {
  it('levert een geldig xlsx-bestand (zip-signatuur)', async () => {
    const bytes = await buildWorkbook([w({ naam: 'Barolo', jaar: 2016 })]);
    // Een .xlsx is een zip; die begint altijd met PK.
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('overleeft een lege kelder', async () => {
    const bytes = await buildWorkbook([]);
    expect(bytes[0]).toBe(0x50);
  });
});
