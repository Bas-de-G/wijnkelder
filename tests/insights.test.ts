import { describe, it, expect } from 'vitest';
import { totals, countBy, countByStatus, needsAttention, kopCijfers, flessenNa } from '../src/lib/insights';
import { legacy } from './legacy-logic.mjs';
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

describe('voorraad tellen als het aantal als tekst binnenkomt', () => {
  // Uit een import of een oude back-up kan aantal als string komen. "1" > 0
  // klopt toevallig, maar null en "" niet — vandaar Number() overal.
  const wines = [
    w({ naam: 'tekst', aantal: '2' as unknown as number }),
    w({ naam: 'leeg', aantal: '' as unknown as number }),
    w({ naam: 'nul', aantal: 0 }),
  ];

  it('telt een tekstueel aantal gewoon mee', () => {
    expect(countBy(wines, 'type')).toEqual([{ label: 'Rood', aantal: 2 }]);
  });

  it('telt flessen op zonder aan elkaar te plakken', () => {
    expect(totals(wines).flessen).toBe(2);
  });
});


describe('de vier cijfers in de kop', () => {
  // Dennis merkte op dat "op dronk" niet meer naar het aantal flessen keek. Dat
  // klopte: de kop telde wijnen. Deze test vergelijkt met de oude app zelf, dus
  // hij valt om zodra de telling weer afwijkt.
  const JAAR = 2026;

  const naarLegacy = (x: Wine) => ({
    naam: x.naam, type: x.type, note: x.note ?? '',
    van: x.drink_from == null ? '' : String(x.drink_from),
    tm: x.drink_to == null ? '' : String(x.drink_to),
    aantal: x.aantal,
  });

  const KELDER = [
    w({ naam: 'op dronk', drink_from: 2020, drink_to: 2030, aantal: 3 }),
    w({ naam: 'wacht nog', drink_from: 2030, drink_to: 2040, aantal: 6 }),
    w({ naam: 'over hoogtepunt', drink_from: 2010, drink_to: 2015, aantal: 2 }),
    w({ naam: 'geen venster', aantal: 4 }),
    w({ naam: 'op, maar bewaard', drink_from: 2020, drink_to: 2030, aantal: 0 }),
    w({ naam: 'alleen een begin', drink_from: 2024, drink_to: null, aantal: 5 }),
    w({ naam: 'alleen een eind', drink_from: null, drink_to: 2028, aantal: 1 }),
  ];

  it('telt flessen, niet wijnen', () => {
    const k = kopCijfers(KELDER, JAAR);
    expect(k.flessen).toBe(21);
    expect(k.nu).toBeGreaterThan(3);
  });

  it('geeft dezelfde getallen als de oude app', () => {
    legacy.setYear(JAAR);
    expect(kopCijfers(KELDER, JAAR)).toEqual(legacy.updateStats(KELDER.map(naarLegacy)));
  });

  it('de eerste drie getallen zijn samen het totaal', () => {
    const k = kopCijfers(KELDER, JAAR);
    expect(k.nu + k.wachten + k.voorbij).toBe(k.flessen);
  });

  it('telt een aantal dat als tekst binnenkomt gewoon mee', () => {
    const k = kopCijfers([w({ naam: 'tekst', aantal: '2' as unknown as number })], JAAR);
    expect(k.flessen).toBe(2);
  });
});

describe('flessen aftrekken na een gedronken fles', () => {
  // Deze telling stond los in drinkBottle en werd nergens gecontroleerd. Het
  // bijwerken van de voorraad kon in stilte mislukken; nu wordt de fout
  // teruggegeven en is de rekensom apart te testen.
  it('trekt er één af', () => {
    expect(flessenNa(3)).toBe(2);
    expect(flessenNa(1)).toBe(0);
  });

  it('komt nooit onder nul', () => {
    expect(flessenNa(0)).toBe(0);
    expect(flessenNa(-4)).toBe(0);
  });

  it('rekent ook met een aantal dat als tekst binnenkomt', () => {
    expect(flessenNa('3')).toBe(2);
    expect(flessenNa('1')).toBe(0);
  });

  it('gaat bij onzin uit van één fles, dus nul over', () => {
    expect(flessenNa(null)).toBe(0);
    expect(flessenNa(undefined)).toBe(0);
    expect(flessenNa('')).toBe(0);
    expect(flessenNa('kurk')).toBe(0);
  });
});
