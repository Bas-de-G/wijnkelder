// Eén plek waar vastligt welke kolommen een export bevat en in welke volgorde.
// CSV, Excel en PDF gebruiken dit allemaal, zodat de drie nooit uit elkaar lopen.

import { drinkBadge, currentYear } from './drinkwindow';
import type { Wine } from './types';

export const EXPORT_HEADERS = [
  'Naam', 'Type', 'Regio', 'Druif', 'Producent', 'Oogstjaar', 'Flessen',
  'Prijs (€)', 'Locatie', 'Herkomst', 'Drinken vanaf', 'Drinken t/m',
  'Status', 'Sterren', 'Notities',
] as const;

/** Breedte per kolom in tekens, voor Excel. */
export const EXPORT_WIDTHS = [26, 12, 16, 20, 18, 10, 8, 11, 14, 18, 13, 13, 17, 8, 44];

export function exportRow(w: Wine, year = currentYear()): (string | number)[] {
  return [
    w.naam,
    w.type,
    w.regio ?? '',
    w.druif ?? '',
    w.producent ?? '',
    w.jaar ?? '',
    w.aantal,
    w.prijs ?? '',
    w.locatie ?? '',
    w.herkomst ?? '',
    w.drink_from ?? '',
    w.drink_to ?? '',
    drinkBadge(w, year).label,
    w.sterren || '',
    w.note ?? '',
  ];
}

export function exportRows(wines: Wine[], year = currentYear()) {
  return wines.map((w) => exportRow(w, year));
}

/**
 * Een CSV-veld hoort tussen aanhalingstekens als het een komma, aanhalingsteken
 * of regeleinde bevat; een aanhalingsteken erbinnen wordt verdubbeld. Notities
 * bevatten alle drie regelmatig, dus dit is geen theoretisch geval.
 */
function csvField(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(wines: Wine[], year = currentYear()): string {
  const rows = [EXPORT_HEADERS as readonly (string | number)[], ...exportRows(wines, year)];
  // \r\n omdat Excel daar op rekent; de BOM ervoor zodat accenten goed vallen.
  return '﻿' + rows.map((r) => r.map(csvField).join(',')).join('\r\n');
}

/** Bestandsnaam met datum, zodat opeenvolgende exports elkaar niet overschrijven. */
export function exportFilename(ext: string, datum = new Date()): string {
  const d = datum.toISOString().slice(0, 10);
  return `wijnkelder-${d}.${ext}`;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  wines: unknown[];
  log: unknown[];
  wishlist: unknown[];
}
