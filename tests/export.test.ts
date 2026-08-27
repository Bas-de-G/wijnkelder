import { describe, it, expect } from 'vitest';
import { toCSV, exportRow, EXPORT_HEADERS, EXPORT_WIDTHS, exportFilename } from '../src/lib/export';
import type { Wine, WineType } from '../src/lib/types';

const w = (p: Partial<Wine> & { naam: string }): Wine => ({
  id: p.naam, cellar_id: 'c', legacy_id: null, type: 'Rood' as WineType, regio: null,
  druif: null, producent: null, herkomst: null, locatie: null, jaar: null, aantal: 1,
  prijs: null, drink_from: null, drink_to: null, sterren: 0, note: null,
  created_at: '', updated_at: '', deleted_at: null, ...p,
} as Wine);

describe('kolommen', () => {
  it('heeft voor elke kolom een breedte', () => {
    expect(EXPORT_WIDTHS).toHaveLength(EXPORT_HEADERS.length);
  });

  it('levert net zoveel velden als er kolommen zijn', () => {
    expect(exportRow(w({ naam: 'Barolo' }))).toHaveLength(EXPORT_HEADERS.length);
  });

  it('zet de status erbij, berekend op het meegegeven jaar', () => {
    const rij = exportRow(w({ naam: 'x', drink_from: 2020, drink_to: 2024 }), 2026);
    expect(rij[12]).toBe('Over hoogtepunt');
    expect(exportRow(w({ naam: 'x', drink_from: 2020, drink_to: 2030 }), 2026)[12]).toBe('Nu drinken');
  });

  it('laat lege velden leeg in plaats van "null" te schrijven', () => {
    const rij = exportRow(w({ naam: 'x' }));
    expect(rij.filter((v) => String(v).includes('null'))).toEqual([]);
  });
});

describe('toCSV', () => {
  it('begint met de kolomkoppen', () => {
    expect(toCSV([w({ naam: 'x' })]).split('\r\n')[0]).toContain('Naam,Type,Regio');
  });

  it('zet een BOM vooraan, anders verminkt Excel de accenten', () => {
    expect(toCSV([])[0]).toBe('﻿');
  });

  it('beschermt een notitie met komma tegen kolomverschuiving', () => {
    const csv = toCSV([w({ naam: 'x', note: 'kruidig, lang' })]);
    expect(csv).toContain('"kruidig, lang"');
  });

  it('verdubbelt aanhalingstekens binnen een veld', () => {
    const csv = toCSV([w({ naam: 'De "Beste" Wijn' })]);
    expect(csv).toContain('"De ""Beste"" Wijn"');
  });

  it('houdt een notitie met regeleindes in één cel', () => {
    const csv = toCSV([w({ naam: 'x', note: 'Wijnhuis: A\n\nLekker bij: B' })]);
    expect(csv).toContain('"Wijnhuis: A\n\nLekker bij: B"');
    // De regel met de wijn mag niet in stukken vallen.
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('beschermt ook tegen puntkomma, waar sommige Excel-versies op splitsen', () => {
    expect(toCSV([w({ naam: 'a;b' })])).toContain('"a;b"');
  });
});

describe('exportFilename', () => {
  it('zet de datum in de naam zodat exports elkaar niet overschrijven', () => {
    expect(exportFilename('csv', new Date('2026-08-27T10:00:00Z'))).toBe('wijnkelder-2026-08-27.csv');
  });
});
