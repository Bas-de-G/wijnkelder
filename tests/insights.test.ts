import { describe, it, expect } from 'vitest';
import { totals, countBy, countByStatus, needsAttention } from '../src/lib/insights';
import type { Wine, WineType } from '../src/lib/types';

const w = (p: Partial<Wine> & { naam: string }): Wine => ({
  id: p.naam, cellar_id: 'c', legacy_id: null, type: 'Rood' as WineType, regio: null,
  druif: null, producent: null, herkomst: null, locatie: null, jaar: null, aantal: 1,
  prijs: null, drink_from: null, drink_to: null, sterren: 0, note: null,
  created_at: '', updated_at: '', deleted_at: null, ...p,
} as Wine);

describe('totals', () => {
  it('vermenigvuldigt de prijs met het aantal flessen', () => {
    const t = totals([w({ naam: 'a', prijs: 10, aantal: 3 }), w({ naam: 'b', prijs: 5, aantal: 2 })]);
    expect(t.waarde).toBe(40);
    expect(t.flessen).toBe(5);
  });

  it('telt wijnen zonder prijs niet mee in de waarde, en meldt hoeveel er wél een hebben', () => {
    const t = totals([w({ naam: 'a', prijs: 10, aantal: 1 }), w({ naam: 'b', aantal: 1 })]);
    expect(t.waarde).toBe(10);
    expect(t.metPrijs).toBe(1);
    expect(t.wijnen).toBe(2);
  });

  it('middelt alleen over beoordeelde wijnen', () => {
    const t = totals([w({ naam: 'a', sterren: 4 }), w({ naam: 'b', sterren: 5 }), w({ naam: 'c', sterren: 0 })]);
    expect(t.gemiddeldeScore).toBe(4.5);
    expect(t.beoordeeld).toBe(2);
  });

  it('geeft geen gemiddelde als er niets beoordeeld is', () => {
    expect(totals([w({ naam: 'a' })]).gemiddeldeScore).toBeNull();
  });

  it('overleeft een lege kelder', () => {
    const t = totals([]);
    expect(t).toMatchObject({ wijnen: 0, flessen: 0, waarde: 0, gemiddeldeScore: null });
  });
});

describe('countBy', () => {
  it('telt flessen, niet wijnen', () => {
    const s = countBy([w({ naam: 'a', type: 'Rood', aantal: 6 }), w({ naam: 'b', type: 'Wit', aantal: 1 })], 'type');
    expect(s).toEqual([{ label: 'Rood', aantal: 6 }, { label: 'Wit', aantal: 1 }]);
  });

  it('laat flessen die op zijn buiten beschouwing', () => {
    const s = countBy([w({ naam: 'a', type: 'Rood', aantal: 0 })], 'type');
    expect(s).toEqual([]);
  });

  it('splitst een blend in losse druiven', () => {
    const s = countBy([w({ naam: 'a', druif: 'Cabernet Sauvignon, Merlot', aantal: 2 })], 'druif', { split: true });
    expect(s).toEqual([
      { label: 'Cabernet Sauvignon', aantal: 2 },
      { label: 'Merlot', aantal: 2 },
    ]);
  });

  it('vat hoofdletterverschillen samen', () => {
    const s = countBy([w({ naam: 'a', regio: 'bourgogne', aantal: 1 }), w({ naam: 'b', regio: 'Bourgogne', aantal: 2 })], 'regio');
    expect(s).toEqual([{ label: 'Bourgogne', aantal: 3 }]);
  });

  it('sorteert aflopend en kapt af op de limiet', () => {
    const wines = ['a', 'b', 'c'].map((n, i) => w({ naam: n, regio: n, aantal: i + 1 }));
    expect(countBy(wines, 'regio', { limit: 2 }).map((s) => s.label)).toEqual(['C', 'B']);
  });

  it('slaat lege velden over', () => {
    expect(countBy([w({ naam: 'a', regio: null }), w({ naam: 'b', regio: '  ' })], 'regio')).toEqual([]);
  });
});

describe('countByStatus', () => {
  it('telt flessen per drinkvensterstatus', () => {
    const c = countByStatus([
      w({ naam: 'nu', drink_from: 2020, drink_to: 2030, aantal: 3 }),
      w({ naam: 'wacht', drink_from: 2030, drink_to: 2040, aantal: 2 }),
      w({ naam: 'voorbij', drink_from: 2010, drink_to: 2020, aantal: 1 }),
      w({ naam: 'geen', aantal: 4 }),
    ], 2026);
    expect(c).toEqual({ nu: 3, wt: 2, vb: 1, nvt: 4 });
  });
});

describe('needsAttention', () => {
  it('scheidt voorbij, bijna voorbij en bijna op dronk', () => {
    const a = needsAttention([
      w({ naam: 'voorbij', drink_from: 2010, drink_to: 2020 }),
      w({ naam: 'sluit', drink_from: 2020, drink_to: 2027 }),
      w({ naam: 'bijna', drink_from: 2027, drink_to: 2040 }),
      w({ naam: 'rustig', drink_from: 2020, drink_to: 2040 }),
    ], 2026);
    expect(a.voorbij.map((x) => x.naam)).toEqual(['voorbij']);
    expect(a.bijnaVoorbij.map((x) => x.naam)).toEqual(['sluit']);
    expect(a.bijnaOpDronk.map((x) => x.naam)).toEqual(['bijna']);
  });

  it('negeert flessen die op zijn', () => {
    const a = needsAttention([w({ naam: 'leeg', drink_from: 2010, drink_to: 2020, aantal: 0 })], 2026);
    expect(a.voorbij).toEqual([]);
  });
});
