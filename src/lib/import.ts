// Inlezen van back-ups uit de legacy-app. Formaat v1 (zonder versieveld), v2
// (met version: 2) en een kale array met wijnen worden alle drie geaccepteerd.
//
// De oude id's gaan mee als legacy_id. Daardoor is importeren idempotent: wie
// dezelfde back-up twee keer aanlevert krijgt geen duplicaten, en wie de oude
// app blijft gebruiken kan tussendoor zo vaak overzetten als hij wil.

import { WINE_TYPES, type WineType } from './types';

export interface LegacyWine {
  id?: string | number;
  naam?: string;
  type?: string;
  regio?: string;
  druif?: string;
  prod?: string;
  jaar?: string | number;
  aantal?: string | number;
  prijs?: string | number;
  loc?: string;
  van?: string | number;
  tm?: string | number;
  sterren?: string | number;
  note?: string;
  herkomst?: string;
}

export interface LegacyLog {
  id?: string | number;
  wid?: string | number;
  naam?: string;
  type?: string;
  jaar?: string | number;
  prod?: string;
  sterren?: string | number;
  wie?: string;
  gel?: string;
  note?: string;
  ts?: number;
}

export interface LegacyWish {
  id?: string | number;
  naam?: string;
  type?: string;
  regio?: string;
  druif?: string;
  prod?: string;
  prijs?: string | number;
  note?: string;
}

export interface LegacyBackup {
  version?: number;
  wines?: LegacyWine[];
  log?: LegacyLog[];
  wishlist?: LegacyWish[];
}

export interface MappedWine {
  legacy_id: string | null;
  naam: string;
  type: WineType;
  regio: string | null;
  druif: string | null;
  producent: string | null;
  herkomst: string | null;
  locatie: string | null;
  jaar: number | null;
  /** null = stond niet in de back-up. Bij bijwerken blijft de bestaande waarde dan staan. */
  aantal: number | null;
  prijs: number | null;
  drink_from: number | null;
  drink_to: number | null;
  /** null = stond niet in de back-up, en betekent dus niet "nul sterren". */
  sterren: number | null;
  note: string | null;
}

/** Waarden voor een wijn die nieuw wordt aangemaakt; hier zijn defaults wél juist. */
export function forInsert(w: MappedWine) {
  return { ...w, aantal: w.aantal ?? 1, sterren: w.sterren ?? 0 };
}

const text = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  return s === '' ? null : s;
};

const whole = (v: unknown): number | null => {
  const s = text(v);
  if (s === null) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

const decimal = (v: unknown): number | null => {
  const s = text(v)?.replace(',', '.');
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const kind = (v: unknown): WineType => {
  const s = text(v);
  return (WINE_TYPES as string[]).includes(s ?? '') ? (s as WineType) : 'Overig';
};

const clampYear = (n: number | null): number | null =>
  n === null || n < 1800 || n > 2200 ? null : n;

export function mapWine(w: LegacyWine): MappedWine {
  const aantal = whole(w.aantal);
  const sterren = whole(w.sterren);
  return {
    legacy_id: text(w.id),
    naam: text(w.naam) ?? 'Naamloze wijn',
    type: kind(w.type),
    regio: text(w.regio),
    druif: text(w.druif),
    producent: text(w.prod),
    herkomst: text(w.herkomst),
    locatie: text(w.loc),
    jaar: clampYear(whole(w.jaar)),
    aantal: aantal === null ? null : Math.max(0, aantal),
    prijs: decimal(w.prijs),
    drink_from: clampYear(whole(w.van)),
    drink_to: clampYear(whole(w.tm)),
    sterren: sterren === null ? null : Math.min(5, Math.max(0, sterren)),
    note: text(w.note),
  };
}

/** Herkent zowel {wines:[…]} als een kale array met wijnen. */
export function readBackup(raw: unknown): LegacyBackup | null {
  if (Array.isArray(raw)) return { wines: raw as LegacyWine[] };
  if (raw && typeof raw === 'object') {
    const o = raw as LegacyBackup;
    if (Array.isArray(o.wines)) return o;
  }
  return null;
}

export interface ExistingWine {
  id: string;
  legacy_id: string | null;
  naam: string;
  jaar: number | null;
}

export interface ImportPlan {
  nieuw: MappedWine[];
  bijgewerkt: Array<{ id: string; patch: MappedWine }>;
  ongewijzigd: number;
}

const MATCH_FIELDS: Array<keyof MappedWine> = [
  'naam', 'type', 'regio', 'druif', 'producent', 'herkomst', 'locatie',
  'jaar', 'aantal', 'prijs', 'drink_from', 'drink_to', 'sterren', 'note',
];

const key = (naam: string, jaar: number | null) =>
  `${naam.trim().toLowerCase()}|${jaar ?? ''}`;

/**
 * Bepaalt per wijn of hij nieuw is, iets wijzigt, of gelijk is aan wat er staat.
 * Matcht eerst op legacy_id, daarna op naam + jaargang — zo levert een back-up
 * van een ander apparaat, met andere id's, alsnog geen duplicaten op.
 */
export function planImport(incoming: LegacyWine[], existing: ExistingWine[]): ImportPlan {
  const byLegacy = new Map<string, ExistingWine>();
  const byName = new Map<string, ExistingWine>();
  for (const e of existing) {
    if (e.legacy_id) byLegacy.set(e.legacy_id, e);
    byName.set(key(e.naam, e.jaar), e);
  }

  const plan: ImportPlan = { nieuw: [], bijgewerkt: [], ongewijzigd: 0 };
  const seen = new Set<string>();

  for (const row of incoming) {
    const mapped = mapWine(row);

    // Duplicaten binnen één bestand tellen maar één keer mee.
    const dedupe = mapped.legacy_id ?? key(mapped.naam, mapped.jaar);
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const match =
      (mapped.legacy_id ? byLegacy.get(mapped.legacy_id) : undefined) ??
      byName.get(key(mapped.naam, mapped.jaar));

    if (!match) {
      plan.nieuw.push(mapped);
      continue;
    }
    plan.bijgewerkt.push({ id: match.id, patch: mapped });
  }
  return plan;
}

/** Velden waarop een bestaande wijn echt verschilt van de aangeleverde versie. */
export function changedFields(patch: MappedWine, current: Record<string, unknown>): string[] {
  return MATCH_FIELDS.filter((f) => {
    const a = patch[f];
    const b = current[f];
    if (a === null || a === undefined || a === '') return false; // leeg overschrijft nooit
    if ((b === null || b === undefined) && a === 0) return false; // 0 is hier "niet ingevuld"
    return String(a) !== String(b ?? '');
  }) as string[];
}
