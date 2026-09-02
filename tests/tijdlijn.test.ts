import { describe, it, expect } from 'vitest';
import { bouwAs, balk, groepeer, heeftVenster, opUrgentie } from '../src/lib/tijdlijn';
import type { Wine, WineType } from '../src/lib/types';
import { legacy } from './legacy-logic.mjs';

const JAAR = 2026;

const w = (p: Partial<Wine> & { naam: string }): Wine => ({
  id: p.naam, cellar_id: 'c', legacy_id: null, type: 'Rood' as WineType, regio: null,
  druif: null, producent: null, herkomst: null, locatie: null, jaar: null, aantal: 1,
  prijs: null, drink_from: null, drink_to: null, sterren: 0, note: null,
  created_at: '', updated_at: '', deleted_at: null, ...p,
} as Wine);

const naarLegacy = (x: Wine) => ({
  id: x.id, naam: x.naam, type: x.type, note: x.note ?? '',
  van: x.drink_from == null ? '' : String(x.drink_from),
  tm: x.drink_to == null ? '' : String(x.drink_to),
  aantal: x.aantal,
});

/** De HTML die het origineel tekent, terug naar getallen. */
function uitOrigineel(wines: Wine[]) {
  legacy.setYear(JAAR);
  const h: string = legacy.renderTimeline(wines.map(naarLegacy));
  return {
    leeg: /class="empty"/.test(h),
    ticks: [...h.matchAll(/class="tl-tick">(\d+)</g)].map((m) => Number(m[1])),
    nu: Number(/class="tl-now" style="left:([\d.]+)%/.exec(h)?.[1] ?? NaN),
    balken: [...h.matchAll(/left:([\d.]+)%;width:([\d.]+)%/g)].map((m) => ({
      van: Number(m[1]),
      breedte: Number(m[2]),
    })),
  };
}

const KELDER = [
  w({ naam: 'Barolo Riserva', drink_from: 2026, drink_to: 2040, aantal: 3 }),
  w({ naam: 'Chablis Premier Cru', drink_from: 2023, drink_to: 2027, aantal: 6 }),
  w({ naam: 'Beaujolais Villages', drink_from: 2023, drink_to: 2025, aantal: 1 }),
  w({ naam: 'Brunello', drink_from: 2028, drink_to: 2045, aantal: 2 }),
  w({ naam: 'Vinho Verde', drink_from: 2024, drink_to: 2026, aantal: 12 }),
  // Deze twee horen niet op de tijdlijn: geen venster, of een venster dat
  // achterstevoren staat.
  w({ naam: 'Champagne', aantal: 2 }),
  w({ naam: 'Omgekeerd', drink_from: 2030, drink_to: 2020, aantal: 1 }),
];

describe('heeftVenster', () => {
  it('vraagt om een begin, een eind, en een eind dat niet vóór het begin ligt', () => {
    expect(heeftVenster({ drink_from: 2020, drink_to: 2030 })).toBe(true);
    expect(heeftVenster({ drink_from: 2020, drink_to: 2020 })).toBe(true);
    expect(heeftVenster({ drink_from: 2030, drink_to: 2020 })).toBe(false);
    expect(heeftVenster({ drink_from: 2020, drink_to: null })).toBe(false);
    expect(heeftVenster({ drink_from: null, drink_to: 2030 })).toBe(false);
    expect(heeftVenster({ drink_from: null, drink_to: null })).toBe(false);
  });
});

describe('de as, vergeleken met de oude app', () => {
  it('kiest dezelfde jaartallen op de as', () => {
    const as = bouwAs(KELDER, JAAR)!;
    expect(as.ticks).toEqual(uitOrigineel(KELDER).ticks);
  });

  it('zet de nu-lijn op dezelfde plek', () => {
    const as = bouwAs(KELDER, JAAR)!;
    // Het origineel rekent in hele procenten; wij houden de breuk aan en ronden
    // pas hier af, zodat de vergelijking over hetzelfde gaat.
    expect(Math.round(as.nu * 100)).toBe(uitOrigineel(KELDER).nu);
  });

  it('geeft geen as als geen enkele wijn een venster heeft', () => {
    const zonder = [w({ naam: 'Champagne' }), w({ naam: 'Omgekeerd', drink_from: 2030, drink_to: 2020 })];
    expect(bouwAs(zonder, JAAR)).toBeNull();
    expect(uitOrigineel(zonder).leeg).toBe(true);
  });

  it('een jaar ervoor en een jaar erna, zodat de balken niet tegen de rand plakken', () => {
    const as = bouwAs(KELDER, JAAR)!;
    expect(as.min).toBe(2022);
    expect(as.max).toBe(2046);
  });
});

describe('de balken, vergeleken met de oude app', () => {
  it('begint en eindigt op dezelfde plek', () => {
    const as = bouwAs(KELDER, JAAR)!;
    // Het origineel sorteert zelf op einddatum; die volgorde nemen we over om
    // balk voor balk te kunnen vergelijken.
    const opVolgorde = KELDER.filter(heeftVenster).slice().sort(opUrgentie);
    const onze = opVolgorde.map((x) => {
      const b = balk(x, as)!;
      return { van: Math.round(b.van * 100), breedte: Math.round(b.breedte * 100) };
    });
    expect(onze).toEqual(uitOrigineel(KELDER).balken);
  });

  it('geeft een kort venster een zichtbare minimumbreedte', () => {
    const kort = [
      w({ naam: 'Kort', drink_from: 2026, drink_to: 2026 }),
      w({ naam: 'Lang', drink_from: 2000, drink_to: 2060 }),
    ];
    const as = bouwAs(kort, JAAR)!;
    expect(balk(kort[0], as)!.breedte).toBe(0.02);
  });

  it('geeft niets terug voor een wijn zonder venster', () => {
    const as = bouwAs(KELDER, JAAR)!;
    expect(balk(w({ naam: 'Champagne' }), as)).toBeNull();
  });
});

describe('groeperen', () => {
  it('zet over hoogtepunt bovenaan, dan nu drinken, dan wachten', () => {
    const groepen = groepeer(KELDER, JAAR);
    expect(groepen.map((g) => g.status)).toEqual(['vb', 'nu', 'wt']);
  });

  it('laat wijnen zonder venster helemaal weg', () => {
    const namen = groepeer(KELDER, JAAR).flatMap((g) => g.wines.map((x) => x.naam));
    expect(namen).not.toContain('Champagne');
    expect(namen).not.toContain('Omgekeerd');
    expect(namen).toHaveLength(5);
  });

  it('laat een lege groep weg in plaats van een leeg kopje te tonen', () => {
    const alleenNu = [w({ naam: 'Nu', drink_from: 2020, drink_to: 2030 })];
    expect(groepeer(alleenNu, JAAR).map((g) => g.label)).toEqual(['Nu drinken']);
  });

  it('sorteert binnen een groep op wat het eerst op is', () => {
    const groepen = groepeer(KELDER, JAAR);
    const nu = groepen.find((g) => g.status === 'nu')!;
    expect(nu.wines.map((x) => x.drink_to)).toEqual([...nu.wines.map((x) => x.drink_to)].sort((a, b) => a! - b!));
  });
});
