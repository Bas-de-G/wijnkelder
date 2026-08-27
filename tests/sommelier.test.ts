// Differentiële tests: de TypeScript-port wordt vergeleken met de originele
// functies uit legacy/wijnkelder.html, niet met overgetypte verwachtingen.
// Als iemand de woordenlijsten of de scoreformule aanpast, valt dat hier om.
import { describe, it, expect } from 'vitest';
import { legacy } from './legacy-logic.mjs';
import { tokenize, containsWord, scoreWine, adviseWines } from '../src/lib/sommelier';
import { drinkBadge, drinkProgress } from '../src/lib/drinkwindow';
import type { Wine, WineType } from '../src/lib/types';

const YEAR = 2026;
legacy.setYear(YEAR);

const PHRASES = [
  'gestoofd rundvlees met tomatensaus',
  'pasta met romige truffelsaus',
  'gegrilde zalm met citroen en dille',
  'oesters als aperitief',
  'verjaardagsdiner met vrienden',
  'geitenkaassalade',
  'wildgerechten in de winter',
  'pittige curry uit de wok',
  'BBQ met worst en spek',
  'sushi en sashimi',
  'Coq au vin — klassiek Frans',
  'kaasplank, belegen kazen',
  'niets bijzonders',
  '',
];

const WINES: Array<Partial<Wine> & { naam: string; type: WineType }> = [
  { naam: 'Barolo Riserva', type: 'Rood', jaar: 2016, aantal: 3, prijs: 68, sterren: 5,
    drink_from: 2024, drink_to: 2038,
    note: 'Wijnhuis: klassiek huis in Piemonte.\n\nWijn & jaargang: Nebbiolo, stevig en tannisch.\n\nLekker bij: gestoofd rundvlees, wild en truffel.' },
  { naam: 'Chablis Premier Cru', type: 'Wit', jaar: 2021, aantal: 6, prijs: 28, sterren: 4,
    drink_from: 2023, drink_to: 2027,
    note: 'Lekker bij: oesters, zalm en gerechten met citroen.' },
  { naam: 'Provence Rosé', type: 'Rosé', jaar: 2023, aantal: 2, prijs: 14, sterren: 3,
    drink_from: 2023, drink_to: 2025, note: 'Lekker bij: salade, tapas en de barbecue.' },
  { naam: 'Champagne Brut', type: 'Mousserend', jaar: null, aantal: 1, prijs: 42, sterren: 5,
    drink_from: null, drink_to: null, note: 'Lekker bij: aperitief, oesters en feestelijke momenten.' },
  { naam: 'Naamloze fles', type: 'Overig', jaar: 2019, aantal: 4, prijs: null, sterren: 0,
    drink_from: 2020, drink_to: 2024, note: null },
  { naam: 'Rioja Reserva', type: 'Rood', jaar: 2018, aantal: 0, prijs: 22, sterren: 4,
    drink_from: 2022, drink_to: 2030, note: 'Lekker bij: lamsvlees van de barbecue.' },
];

const full = (w: Partial<Wine> & { naam: string; type: WineType }): Wine => ({
  id: w.naam, cellar_id: 'c', legacy_id: null, regio: null, druif: null, producent: null,
  herkomst: null, locatie: null, jaar: null, aantal: 1, prijs: null, drink_from: null,
  drink_to: null, sterren: 0, note: null, created_at: '', updated_at: '', deleted_at: null,
  ...w,
} as Wine);

// De legacy-code verwacht van/tm/prijs als string, en gebruikt andere veldnamen.
const toLegacy = (w: Wine) => ({
  naam: w.naam, type: w.type, note: w.note ?? '',
  van: w.drink_from == null ? '' : String(w.drink_from),
  tm: w.drink_to == null ? '' : String(w.drink_to),
  aantal: w.aantal, prijs: w.prijs == null ? '' : String(w.prijs), sterren: w.sterren,
});

describe('tokenize', () => {
  it.each(PHRASES)('splitst %j gelijk aan het origineel', (phrase) => {
    expect(tokenize(phrase)).toEqual(legacy.tokenize(phrase));
  });
});

describe('containsWord', () => {
  const cases: Array<[string[], string]> = [
    [['wildgerechten', 'stoofpot'], 'wild'],
    [['tomatensaus'], 'saus'],
    [['vis'], 'zalm'],
    [[], 'wild'],
    [['kip'], 'kip'],
  ];
  it.each(cases)('%j bevat %s gelijk aan het origineel', (words, word) => {
    expect(containsWord(words, word)).toBe(legacy.containsWord(words, word));
  });
});

describe('drinkBadge', () => {
  const windows: Array<[number | null, number | null]> = [
    [null, null], [2020, 2024], [2024, 2030], [2028, 2035], [2027, 2040],
    [2026, 2026], [null, 2028], [2020, null], [null, 2024], [2026, 2027],
  ];
  const years = [2024, 2026, 2030];

  it.each(windows.flatMap((w) => years.map((y) => [w[0], w[1], y] as const)))(
    'status voor %s–%s in %i komt overeen',
    (from, to, year) => {
      legacy.setYear(year);
      const mine = drinkBadge({ drink_from: from, drink_to: to }, year);
      const theirs = legacy.bdg(toLegacy(full({ naam: 'x', type: 'Rood', drink_from: from, drink_to: to })));
      expect(mine.status).toBe(theirs.s);
      expect(mine.soon).toBe(!!theirs.bj);
      expect(mine.closing).toBe(!!theirs.bv);
      legacy.setYear(YEAR);
    }
  );

  it('schrijft het aantal jaren voluit', () => {
    expect(drinkBadge({ drink_from: 2027, drink_to: 2035 }, 2026).label).toBe('Nog 1 jaar');
    expect(drinkBadge({ drink_from: 2029, drink_to: 2035 }, 2026).label).toBe('Nog 3 jaar');
  });
});

describe('drinkProgress', () => {
  const cases: Array<[number | null, number | null]> = [
    [2020, 2030], [2026, 2026], [2030, 2020], [null, 2030], [2020, null], [2024, 2028],
  ];
  it.each(cases)('venster %s–%s levert dezelfde voortgang', (from, to) => {
    const mine = drinkProgress({ drink_from: from, drink_to: to }, YEAR);
    const theirs = legacy.prog(toLegacy(full({ naam: 'x', type: 'Rood', drink_from: from, drink_to: to })));
    if (theirs === null) {
      expect(mine).toBeNull();
    } else {
      expect(mine!.pct).toBe(theirs.pct);
      expect(mine!.past).toBe(theirs.vb);
      expect(mine!.waiting).toBe(theirs.wt);
    }
  });
});

describe('scoreWine', () => {
  const gezelschappen = ['', 'Vrienden', 'Zakelijk'];
  const combos = PHRASES.flatMap((p) => gezelschappen.map((g) => [p, g] as const));

  it.each(combos)('scoort %j (%s) gelijk aan het origineel', (phrase, gezelschap) => {
    const words = tokenize([phrase, gezelschap].filter(Boolean).join(' '));
    const special = words.some((w) => legacy.SPECIAL_WORDS.has(w));
    for (const w of WINES.map(full)) {
      const mine = scoreWine(words, w, { gezelschap, special, year: YEAR });
      const theirs = legacy.scoreWine(words, new Set(words), toLegacy(w), { gezelschap, special });
      expect(mine.total).toBeCloseTo(theirs.total, 10);
      expect(mine.contentScore).toBeCloseTo(theirs.contentScore, 10);
    }
  });
});

describe('adviseWines', () => {
  const wines = WINES.map(full);

  it('kiest dezelfde flessen in dezelfde volgorde als het origineel', () => {
    for (const phrase of PHRASES) {
      const words = tokenize(phrase);
      const special = words.some((w) => legacy.SPECIAL_WORDS.has(w));
      const theirs = wines
        .filter((w) => w.aantal > 0)
        .map((w) => ({ naam: w.naam, ...legacy.scoreWine(words, new Set(words), toLegacy(w), { gezelschap: '', special }) }))
        .sort((a, b) => b.total - a.total)
        .filter((s) => s.contentScore > 0)
        .slice(0, 3)
        .map((s) => s.naam);

      const mine = adviseWines(wines, { gerecht: phrase, year: YEAR }).hits.map((h) => h.wine.naam);
      expect(mine, `advies voor ${JSON.stringify(phrase)}`).toEqual(theirs);
    }
  });

  it('slaat flessen over die op zijn', () => {
    const hits = adviseWines(wines, { gerecht: 'lamsvlees van de barbecue', year: YEAR }).hits;
    expect(hits.map((h) => h.wine.naam)).not.toContain('Rioja Reserva');
  });

  it('geeft liever niets dan een gekunstelde match', () => {
    const hits = adviseWines(wines, { gerecht: 'cornflakes met melk', year: YEAR }).hits;
    expect(hits).toHaveLength(0);
  });
});

describe('stap-voor-stap sommelier', () => {
  it('stelt dezelfde vragen als het origineel', async () => {
    const { SOMM_VRAGEN } = await import('../src/lib/sommelier');
    expect(SOMM_VRAGEN.map((v) => v.key)).toEqual(
      legacy.SOMM_QUESTIONS.map((q: { key: string }) => q.key)
    );
    // Even veel keuzes per vraag: een weggevallen optie zou de weging veranderen.
    expect(SOMM_VRAGEN.map((v) => v.opties.length)).toEqual(
      legacy.SOMM_QUESTIONS.map((q: { options: unknown[] }) => q.options.length)
    );
  });

  it('scoort elke combinatie van antwoorden gelijk aan het origineel', async () => {
    const { sommScore, SOMM_VRAGEN } = await import('../src/lib/sommelier');
    const [g, e, s] = SOMM_VRAGEN.map((v) => v.opties.map((o) => o.value));

    for (const gelegenheid of g) {
      for (const eten of e) {
        for (const stemming of s) {
          const antwoorden = { gelegenheid, eten, stemming };
          for (const wijn of WINES.map(full)) {
            expect(
              sommScore(wijn, antwoorden, YEAR),
              `${wijn.naam} bij ${gelegenheid}/${eten}/${stemming}`
            ).toBeCloseTo(legacy.sommScore(toLegacy(wijn), antwoorden), 10);
          }
        }
      }
    }
  });

  it('kiest dezelfde twee flessen als het origineel', async () => {
    const { sommAdvies } = await import('../src/lib/sommelier');
    const wijnen = WINES.map(full);
    const antwoorden = { gelegenheid: 'speciaal', eten: 'vlees', stemming: 'vol' };

    const hunne = wijnen
      .filter((w) => w.aantal > 0)
      .map((w) => ({ naam: w.naam, score: legacy.sommScore(toLegacy(w), antwoorden) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.naam);

    expect(sommAdvies(wijnen, antwoorden, YEAR).map((h) => h.wine.naam)).toEqual(hunne);
  });

  it('slaat flessen over die op zijn', async () => {
    const { sommAdvies } = await import('../src/lib/sommelier');
    const namen = sommAdvies(WINES.map(full), { gelegenheid: 'alledaags', eten: 'vlees', stemming: 'vol' }, YEAR)
      .map((h) => h.wine.naam);
    expect(namen).not.toContain('Rioja Reserva');
  });
});
