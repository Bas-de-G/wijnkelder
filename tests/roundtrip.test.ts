import { describe, it, expect } from 'vitest';
import { planImport, mapWine, changedFields, forInsert, readBackup } from '../src/lib/import';
import { parseNote } from '../src/lib/sommelier';
import { ENRICH_PROMPT, heeftAanvullingNodig } from '../src/lib/enrich-prompt';

// De notitie zoals de instructie hem laat schrijven.
const CLAUDE_NOTE = [
  'Wijnhuis: Vietti is een familiebedrijf in Castiglione Falletto, sinds 1873.',
  'Wijn & jaargang: Nebbiolo. 2016 gold in Barolo als uitzonderlijk: een koel voorjaar gevolgd door een gelijkmatige zomer.',
  'Lekker bij: gestoofd rundvlees en oude kaas — de stevige tannines vragen om vet en eiwit.',
].join('\n\n');

describe('de ronde export → Claude → import', () => {
  // Zoals /api/export/json een wijn wegschrijft die in de app zelf is aangemaakt:
  // legacy_id is dan null, dus de export zet het UUID in het id-veld.
  const geexporteerd = {
    id: '3f9a7c1e-0b2d-4e5f-8a91-2c3d4e5f6a7b',
    naam: 'Barolo Riserva', type: 'Rood', regio: 'Piemonte', druif: '',
    prod: 'Vietti', jaar: 2016, aantal: 3, prijs: 68.5, loc: 'Rek B',
    van: '', tm: '', sterren: 5, note: '', herkomst: 'zelf gekocht',
  };

  // Zoals Claude hem terugstuurt: druif, drinkvenster en notitie ingevuld.
  const verrijkt = {
    ...geexporteerd,
    druif: 'Nebbiolo',
    van: 2024,
    tm: 2040,
    note: CLAUDE_NOTE,
  };

  const bestaand = [{
    id: 'db-uuid-1',
    legacy_id: null,
    naam: 'Barolo Riserva',
    jaar: 2016,
  }];

  it('herkent de wijn terug, ook al heeft hij geen legacy_id', () => {
    const plan = planImport([verrijkt], bestaand);
    expect(plan.nieuw, 'mag geen duplicaat aanmaken').toHaveLength(0);
    expect(plan.bijgewerkt).toHaveLength(1);
    expect(plan.bijgewerkt[0].id).toBe('db-uuid-1');
  });

  it('ziet de aanvullingen als wijziging', () => {
    const plan = planImport([verrijkt], bestaand);
    const huidig = {
      naam: 'Barolo Riserva', type: 'Rood', regio: 'Piemonte', druif: null,
      producent: 'Vietti', jaar: 2016, aantal: 3, prijs: 68.5, locatie: 'Rek B',
      herkomst: 'zelf gekocht', drink_from: null, drink_to: null, sterren: 5, note: null,
    };
    const velden = changedFields(plan.bijgewerkt[0].patch, huidig).sort();
    expect(velden).toEqual(['drink_from', 'drink_to', 'druif', 'note']);
  });

  it('zet de notitie in het veld waar de app hem uitleest', () => {
    const m = mapWine(verrijkt);
    expect(m.note).toBe(CLAUDE_NOTE);
    expect(m.druif).toBe('Nebbiolo');
    expect(m.drink_from).toBe(2024);
    expect(m.drink_to).toBe(2040);
  });

  it('toont de notitie als losse alineas met tussenkopjes', () => {
    const secties = parseNote(CLAUDE_NOTE);
    expect(secties, 'de labels moeten herkend worden').not.toBeNull();
    expect(secties!.map((s) => s.label)).toEqual(['Wijnhuis', 'Wijn & jaargang', 'Lekker bij']);
    expect(secties![2].body).toContain('gestoofd rundvlees');
  });

  it('overleeft het als Claude een blok weglaat, zoals de instructie voorschrijft', () => {
    const zonderWijnhuis = [
      'Wijn & jaargang: Nebbiolo, stevig en tannisch.',
      'Lekker bij: wild en oude kaas.',
    ].join('\n\n');
    const secties = parseNote(zonderWijnhuis);
    expect(secties!.map((s) => s.label)).toEqual(['Wijn & jaargang', 'Lekker bij']);
  });

  it('corrigeert een fout ingevuld veld in plaats van het te negeren', () => {
    const gecorrigeerd = { ...verrijkt, regio: 'Barolo DOCG' };
    const plan = planImport([gecorrigeerd], bestaand);
    expect(plan.bijgewerkt[0].patch.regio).toBe('Barolo DOCG');
  });

  it('blijft werken als Claude het id weglaat', () => {
    const { id: _weg, ...zonderId } = verrijkt;
    const plan = planImport([zonderId], bestaand);
    expect(plan.nieuw).toHaveLength(0);
    expect(plan.bijgewerkt[0].id).toBe('db-uuid-1');
  });

  it('blijft werken als Claude alleen de aangevulde velden terugstuurt', () => {
    const alleenAanvulling = { id: geexporteerd.id, naam: 'Barolo Riserva', jaar: 2016, druif: 'Nebbiolo', note: CLAUDE_NOTE };
    const plan = planImport([alleenAanvulling], bestaand);
    expect(plan.nieuw).toHaveLength(0);
    expect(plan.bijgewerkt[0].patch.druif).toBe('Nebbiolo');
  });

  it('overschrijft de voorraad niet als Claude die niet noemt', () => {
    const alleenAanvulling = { id: geexporteerd.id, naam: 'Barolo Riserva', jaar: 2016, druif: 'Nebbiolo' };
    const plan = planImport([alleenAanvulling], bestaand);
    expect(plan.bijgewerkt[0].patch.aantal, 'mag niet stiekem op 1 gezet worden').toBeNull();
  });

  it('legt een nieuwe wijn uit de back-up correct aan', () => {
    const plan = planImport([verrijkt], []);
    expect(plan.nieuw).toHaveLength(1);
    const rij = forInsert(plan.nieuw[0]);
    expect(rij.aantal).toBe(3);
    expect(rij.legacy_id).toBe(geexporteerd.id);
  });
});

describe('de vormen waarin Claude kan antwoorden', () => {
  const bestaand = [
    { id: 'u1', legacy_id: null, naam: 'Barolo Riserva', jaar: 2016 },
    { id: 'u2', legacy_id: null, naam: 'Chablis', jaar: 2021 },
  ];

  it('leest een volledige back-up', () => {
    const b = readBackup({ version: 2, wines: [{ naam: 'a' }], log: [], wishlist: [] });
    expect(b?.soort).toBe('volledig');
  });

  it('leest een kale lijst uit een oude export', () => {
    expect(readBackup([{ naam: 'a' }])?.soort).toBe('volledig');
  });

  // Dit is het antwoord dat de aanvulinstructie uitlokt: alleen wat ontbrak.
  it('leest update_wines als aanvulling', () => {
    const b = readBackup({ update_wines: [{ naam: 'Barolo Riserva', druif: 'Nebbiolo' }] });
    expect(b?.soort).toBe('aanvulling');
    expect(b?.wines).toHaveLength(1);
  });

  it('leest add_wines als toevoeging', () => {
    const b = readBackup({ add_wines: [{ naam: 'Nieuwe wijn' }] });
    expect(b?.soort).toBe('toevoeging');
  });

  it('wijst iets onherkenbaars af', () => {
    expect(readBackup({ appels: 3 })).toBeNull();
    expect(readBackup('tekst')).toBeNull();
  });

  it('werkt bij een aanvulling alleen bestaande wijnen bij', () => {
    const plan = planImport(
      [{ naam: 'Barolo Riserva', jaar: 2016, druif: 'Nebbiolo' }],
      bestaand, 'aanvulling'
    );
    expect(plan.bijgewerkt).toHaveLength(1);
    expect(plan.nieuw).toHaveLength(0);
  });

  it('maakt bij een aanvulling niets nieuws aan, maar meldt wat niet paste', () => {
    const plan = planImport(
      [{ naam: 'Wijn die hier niet staat', druif: 'Merlot' }],
      bestaand, 'aanvulling'
    );
    expect(plan.nieuw, 'stil toevoegen zou erger zijn dan overslaan').toHaveLength(0);
    expect(plan.onbekend).toEqual(['Wijn die hier niet staat']);
  });

  it('matcht een aanvulling zonder jaartal op de naam', () => {
    // Claude laat het jaartal soms weg als dat in de export al klopte.
    const plan = planImport([{ naam: 'Chablis', druif: 'Chardonnay' }], bestaand, 'aanvulling');
    expect(plan.bijgewerkt[0].id).toBe('u2');
  });

  it('gokt niet welke jaargang bedoeld is als de naam dubbel voorkomt', () => {
    const twee = [
      { id: 'a', legacy_id: null, naam: 'Chablis', jaar: 2020 },
      { id: 'b', legacy_id: null, naam: 'Chablis', jaar: 2021 },
    ];
    const plan = planImport([{ naam: 'Chablis', druif: 'Chardonnay' }], twee, 'aanvulling');
    expect(plan.bijgewerkt).toHaveLength(0);
    expect(plan.onbekend).toEqual(['Chablis']);
  });

  it('voegt bij add_wines toe, ook als de naam al bestaat', () => {
    const plan = planImport([{ naam: 'Barolo Riserva', jaar: 2016 }], bestaand, 'toevoeging');
    expect(plan.nieuw).toHaveLength(1);
    expect(plan.bijgewerkt).toHaveLength(0);
  });
});

describe('welke wijnen aanvulling nodig hebben', () => {
  const w = (p: Partial<Parameters<typeof heeftAanvullingNodig>[0]>) =>
    heeftAanvullingNodig({ druif: null, note: null, drink_from: null, drink_to: null, ...p });

  it('mist een druif', () => {
    expect(w({ note: 'iets', drink_from: 2020 })).toBe(true);
  });

  it('mist een notitie', () => {
    expect(w({ druif: 'Nebbiolo', drink_from: 2020 })).toBe(true);
  });

  it('mist een drinkvenster', () => {
    expect(w({ druif: 'Nebbiolo', note: 'iets' })).toBe(true);
  });

  it('is compleet met alleen een einddatum', () => {
    expect(w({ druif: 'Nebbiolo', note: 'iets', drink_to: 2030 })).toBe(false);
  });

  it('telt een veld met alleen spaties als leeg', () => {
    expect(w({ druif: '   ', note: 'iets', drink_from: 2020 })).toBe(true);
  });

  it('is compleet als alles ingevuld is', () => {
    expect(w({ druif: 'Nebbiolo', note: 'iets', drink_from: 2020, drink_to: 2030 })).toBe(false);
  });
});

describe('de opdracht die de app aanlevert', () => {
  it('vraagt om de labels die de app terugleest', () => {
    // Zonder deze labels toont de app de notitie als één blok tekst.
    for (const label of ['Wijnhuis:', 'Wijn & jaargang:', 'Lekker bij:']) {
      expect(ENRICH_PROMPT).toContain(label);
    }
  });

  it('vraagt om een vorm die de importer accepteert', () => {
    expect(ENRICH_PROMPT).toContain('update_wines');
    expect(readBackup({ update_wines: [] })).not.toBeNull();
  });

  it('verbiedt verzinnen', () => {
    expect(ENRICH_PROMPT).toContain('nooit informatie verzinnen');
  });
});

describe('het antwoord zoals Claude het echt teruggeeft', () => {
  // De opdracht vraagt om "het id plus alleen de velden die je hebt aangevuld".
  // Claude stuurt dus géén naam mee. En voor een wijn die in de app zelf is
  // aangemaakt schrijft de export het primaire id in het id-veld, want
  // legacy_id is dan leeg.
  const inDeKelder = [{
    id: '3f9a7c1e-0b2d-4e5f-8a91-2c3d4e5f6a7b',
    legacy_id: null,
    naam: 'Barolo Riserva',
    jaar: 2016,
  }];

  const antwoordVanClaude = {
    update_wines: [{
      id: '3f9a7c1e-0b2d-4e5f-8a91-2c3d4e5f6a7b',
      druif: 'Nebbiolo',
      van: 2024,
      tm: 2040,
      note: 'Wijnhuis: Vietti.\n\nLekker bij: gestoofd rundvlees.',
    }],
  };

  it('herkent de wijn aan het id uit de export', () => {
    const b = readBackup(antwoordVanClaude)!;
    const plan = planImport(b.wines, inDeKelder, b.soort);
    expect(plan.onbekend, 'zou niet als onbekend afgedaan mogen worden').toEqual([]);
    expect(plan.bijgewerkt).toHaveLength(1);
    expect(plan.bijgewerkt[0].id).toBe('3f9a7c1e-0b2d-4e5f-8a91-2c3d4e5f6a7b');
  });

  it('overschrijft de naam niet met een verzonnen naam', () => {
    const b = readBackup(antwoordVanClaude)!;
    const plan = planImport(b.wines, inDeKelder, b.soort);
    const patch = plan.bijgewerkt[0].patch;
    expect(patch.naam, 'een ontbrekende naam mag geen "Naamloze wijn" worden').toBeNull();

    const velden = changedFields(patch, { naam: 'Barolo Riserva', jaar: 2016, druif: null, note: null });
    expect(velden, 'de naam mag niet als wijziging gelden').not.toContain('naam');
    expect(velden.sort()).toEqual(['drink_from', 'drink_to', 'druif', 'note']);
  });

  it('werkt ook als de wijn wél een legacy_id heeft', () => {
    const uitOudeApp = [{ id: 'db-1', legacy_id: '1756219000000', naam: 'Chablis', jaar: 2021 }];
    const plan = planImport([{ id: 1756219000000, druif: 'Chardonnay' }], uitOudeApp, 'aanvulling');
    expect(plan.bijgewerkt[0].id).toBe('db-1');
  });

  it('geeft een nieuwe wijn zonder naam alsnog een leesbare naam', () => {
    const plan = planImport([{ druif: 'Merlot' }], [], 'volledig');
    expect(forInsert(plan.nieuw[0]).naam).toBe('Naamloze wijn');
  });
});
