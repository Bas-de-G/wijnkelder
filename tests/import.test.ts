import { describe, it, expect } from 'vitest';
import { mapWine, readBackup, planImport, changedFields, forInsert } from '../src/lib/import';

describe('mapWine', () => {
  it('hernoemt de legacy-velden', () => {
    const w = mapWine({
      id: 1756219000000, naam: 'Barolo', type: 'Rood', prod: 'Vietti', loc: 'Rek B',
      van: '2024', tm: '2038', jaar: '2016', aantal: '3', prijs: '68.50', herkomst: 'zelf gekocht',
    });
    expect(w.producent).toBe('Vietti');
    expect(w.locatie).toBe('Rek B');
    expect(w.drink_from).toBe(2024);
    expect(w.drink_to).toBe(2038);
    expect(w.legacy_id).toBe('1756219000000');
  });

  it('maakt van tekst echte getallen', () => {
    const w = mapWine({ naam: 'x', jaar: '2016', aantal: '3', prijs: '68.50', sterren: '4' });
    expect(w.jaar).toBe(2016);
    expect(w.aantal).toBe(3);
    expect(w.prijs).toBe(68.5);
    expect(w.sterren).toBe(4);
  });

  it('accepteert een komma als decimaalteken', () => {
    expect(mapWine({ naam: 'x', prijs: '12,95' }).prijs).toBe(12.95);
  });

  it('maakt lege tekst tot null in plaats van een lege string', () => {
    const w = mapWine({ naam: 'x', regio: '', druif: '   ', prijs: '', jaar: '' });
    expect(w.regio).toBeNull();
    expect(w.druif).toBeNull();
    expect(w.prijs).toBeNull();
    expect(w.jaar).toBeNull();
  });

  it('vangt onzin op zonder te klappen', () => {
    const w = mapWine({ naam: 'x', jaar: 'onbekend', aantal: '-4', prijs: 'gratis', sterren: '99' });
    expect(w.jaar).toBeNull();
    expect(w.aantal).toBe(0);
    expect(w.prijs).toBeNull();
    expect(w.sterren).toBe(5);
  });

  it('houdt ontbrekende voorraad en beoordeling leeg in plaats van te gokken', () => {
    // Anders zou bijwerken een bestaand aantal flessen overschrijven met 1.
    const w = mapWine({ naam: 'x' });
    expect(w.aantal).toBeNull();
    expect(w.sterren).toBeNull();
    expect(forInsert(w).aantal).toBe(1);
    expect(forInsert(w).sterren).toBe(0);
  });

  it('valt terug op Overig bij een onbekend type', () => {
    expect(mapWine({ naam: 'x', type: 'Oranje' }).type).toBe('Overig');
    expect(mapWine({ naam: 'x', type: 'Rosé' }).type).toBe('Rosé');
  });

  it('houdt een ontbrekend type leeg in plaats van er Overig van te maken', () => {
    // Anders zou een aanvulling die het type niet noemt een rode wijn op
    // Overig zetten.
    expect(mapWine({ naam: 'x' }).type).toBeNull();
    expect(forInsert(mapWine({ naam: 'x' })).type).toBe('Overig');
  });

  it('houdt een ontbrekende naam leeg, maar geeft een nieuwe wijn er wel een', () => {
    expect(mapWine({}).naam).toBeNull();
    expect(forInsert(mapWine({})).naam).toBe('Naamloze wijn');
  });
});

describe('readBackup', () => {
  it('leest v2 met versieveld', () => {
    expect(readBackup({ version: 2, wines: [{ naam: 'a' }] })?.wines).toHaveLength(1);
  });
  it('leest v1 zonder versieveld', () => {
    expect(readBackup({ wines: [{ naam: 'a' }], log: [] })?.wines).toHaveLength(1);
  });
  it('leest een kale array', () => {
    expect(readBackup([{ naam: 'a' }])?.wines).toHaveLength(1);
  });
  it('wijst iets anders af', () => {
    expect(readBackup({ appels: 3 })).toBeNull();
    expect(readBackup('tekst')).toBeNull();
    expect(readBackup(null)).toBeNull();
  });
});

describe('planImport', () => {
  const bestaand = [
    { id: 'u1', legacy_id: '100', naam: 'Barolo', jaar: 2016 },
    { id: 'u2', legacy_id: null, naam: 'Chablis', jaar: 2021 },
  ];

  it('herkent een bestaande wijn aan het oude id', () => {
    const p = planImport([{ id: 100, naam: 'Barolo', jaar: '2016' }], bestaand);
    expect(p.nieuw).toHaveLength(0);
    expect(p.bijgewerkt[0].id).toBe('u1');
  });

  it('herkent een wijn zonder id aan naam en jaargang', () => {
    const p = planImport([{ naam: 'chablis', jaar: '2021' }], bestaand);
    expect(p.nieuw).toHaveLength(0);
    expect(p.bijgewerkt[0].id).toBe('u2');
  });

  it('ziet een andere jaargang als een andere wijn', () => {
    const p = planImport([{ naam: 'Chablis', jaar: '2022' }], bestaand);
    expect(p.nieuw).toHaveLength(1);
  });

  it('voegt onbekende wijnen toe', () => {
    const p = planImport([{ id: 999, naam: 'Rioja', jaar: '2018' }], bestaand);
    expect(p.nieuw.map((w) => w.naam)).toEqual(['Rioja']);
  });

  it('is idempotent: twee keer dezelfde back-up geeft geen duplicaten', () => {
    const backup = [{ id: 100, naam: 'Barolo', jaar: '2016' }, { id: 999, naam: 'Rioja' }];
    const eerste = planImport(backup, bestaand);
    expect(eerste.nieuw).toHaveLength(1);

    // Simuleer dat de nieuwe wijn nu ook in de kelder staat.
    const na = [...bestaand, { id: 'u3', legacy_id: '999', naam: 'Rioja', jaar: null }];
    const tweede = planImport(backup, na);
    expect(tweede.nieuw).toHaveLength(0);
  });

  it('telt een duplicaat binnen één bestand maar één keer', () => {
    const p = planImport([{ id: 5, naam: 'Rioja' }, { id: 5, naam: 'Rioja' }], []);
    expect(p.nieuw).toHaveLength(1);
  });
});

describe('changedFields', () => {
  const patch = mapWine({ naam: 'Barolo', jaar: '2016', note: 'aangevuld', druif: 'Nebbiolo' });

  it('noemt alleen velden die echt veranderen', () => {
    const velden = changedFields(patch, { naam: 'Barolo', jaar: 2016, note: null, druif: null, type: 'Overig' });
    expect(velden.sort()).toEqual(['druif', 'note']);
  });

  it('laat een leeg veld nooit bestaande gegevens wissen', () => {
    const leeg = mapWine({ naam: 'Barolo', jaar: '2016' });
    const velden = changedFields(leeg, { naam: 'Barolo', jaar: 2016, note: 'iets waardevols', type: 'Overig' });
    expect(velden).not.toContain('note');
  });

  it('meldt niets als alles gelijk is', () => {
    const zelfde = mapWine({ naam: 'Barolo', jaar: '2016', type: 'Rood', aantal: '1' });
    expect(changedFields(zelfde, { naam: 'Barolo', jaar: 2016, type: 'Rood', aantal: 1 })).toEqual([]);
  });
});
