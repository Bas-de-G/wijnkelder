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
  /** Gedeeltelijke aanvulling: werk bestaande wijnen bij, voeg niets toe. */
  update_wines?: LegacyWine[];
  /** Gedeeltelijke aanvulling: voeg deze wijnen toe, laat de rest ongemoeid. */
  add_wines?: LegacyWine[];
}

/**
 * Wat voor bestand er is aangeleverd. De aanvulinstructie vraagt Claude om
 * alleen aan te vullen wat ontbreekt, dus een gedeeltelijke patch is de
 * gebruikelijke vorm — niet de uitzondering.
 */
export type BackupSoort = 'volledig' | 'aanvulling' | 'toevoeging';

export interface GelezenBackup {
  soort: BackupSoort;
  wines: LegacyWine[];
  log: LegacyLog[];
  wishlist: LegacyWish[];
}

export interface MappedWine {
  legacy_id: string | null;
  /**
   * null = de aanlevering noemde geen naam. Dat is de normale vorm van een
   * aanvulling: de opdracht vraagt om het id plus alleen de aangevulde velden.
   * Een verzonnen naam zou de echte overschrijven zodra de wijn gematcht wordt.
   */
  naam: string | null;
  /** null = niet genoemd. Een aanvulling die het type weglaat mag een rode wijn
   *  niet op "Overig" zetten. */
  type: WineType | null;
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
  return {
    ...w,
    naam: w.naam ?? 'Naamloze wijn',
    type: w.type ?? 'Overig',
    aantal: w.aantal ?? 1,
    sterren: w.sterren ?? 0,
  };
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

/** Een onbekend type valt terug op Overig; een ontbrekend type blijft leeg. */
const kind = (v: unknown): WineType | null => {
  const s = text(v);
  if (s === null) return null;
  return (WINE_TYPES as string[]).includes(s) ? (s as WineType) : 'Overig';
};

const clampYear = (n: number | null): number | null =>
  n === null || n < 1800 || n > 2200 ? null : n;

export function mapWine(w: LegacyWine): MappedWine {
  const aantal = whole(w.aantal);
  const sterren = whole(w.sterren);
  return {
    legacy_id: text(w.id),
    naam: text(w.naam),
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

/**
 * Herkent alle vormen waarin een back-up of aanvulling kan binnenkomen:
 *
 *   {wines, log, wishlist}   een volledige back-up
 *   [ … ]                    een kale lijst wijnen, uit een oude export
 *   {update_wines: [ … ]}    aanvullingen op wijnen die al bestaan
 *   {add_wines: [ … ]}       wijnen die erbij moeten
 *
 * Die laatste twee zijn de vormen die de oorspronkelijke app ook accepteerde.
 * Ze zijn juist het gebruikelijke antwoord op de aanvulinstructie, want die
 * vraagt om alleen aan te vullen wat ontbreekt.
 */
export function readBackup(raw: unknown): GelezenBackup | null {
  if (Array.isArray(raw)) {
    return { soort: 'volledig', wines: raw as LegacyWine[], log: [], wishlist: [] };
  }
  if (!raw || typeof raw !== 'object') return null;

  const o = raw as LegacyBackup;
  if (Array.isArray(o.update_wines)) {
    return { soort: 'aanvulling', wines: o.update_wines, log: [], wishlist: [] };
  }
  if (Array.isArray(o.add_wines)) {
    return { soort: 'toevoeging', wines: o.add_wines, log: [], wishlist: [] };
  }
  if (Array.isArray(o.wines)) {
    return {
      soort: 'volledig',
      wines: o.wines,
      log: Array.isArray(o.log) ? o.log : [],
      wishlist: Array.isArray(o.wishlist) ? o.wishlist : [],
    };
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
  /** Wijnen uit een aanvulling die nergens bij passen; die worden overgeslagen. */
  onbekend: string[];
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
export function planImport(
  incoming: LegacyWine[],
  existing: ExistingWine[],
  soort: BackupSoort = 'volledig'
): ImportPlan {
  // De export schrijft `legacy_id ?? id` in het id-veld. Voor een wijn die in de
  // app zelf is aangemaakt is legacy_id leeg, dus staat daar het primaire id.
  // Beide moeten dus opzoekbaar zijn, anders komt een aanvulling nergens aan.
  const opId = new Map<string, ExistingWine>();
  const byName = new Map<string, ExistingWine>();
  const byNameOnly = new Map<string, ExistingWine>();
  for (const e of existing) {
    opId.set(String(e.id), e);
    if (e.legacy_id) opId.set(e.legacy_id, e);
    byName.set(key(e.naam, e.jaar), e);
    // Alleen als de naam eenduidig is; bij twee jaargangen van dezelfde wijn
    // mag er niet gegokt worden welke bedoeld is.
    const enkel = e.naam.trim().toLowerCase();
    byNameOnly.set(enkel, byNameOnly.has(enkel) ? (null as unknown as ExistingWine) : e);
  }

  const plan: ImportPlan = { nieuw: [], bijgewerkt: [], ongewijzigd: 0, onbekend: [] };
  const seen = new Set<string>();

  for (const row of incoming) {
    const mapped = mapWine(row);

    // Duplicaten binnen één bestand tellen maar één keer mee.
    const dedupe = mapped.legacy_id ?? (mapped.naam ? key(mapped.naam, mapped.jaar) : null);
    if (dedupe) {
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
    }

    // Bij een aanvulling matcht een wijn zonder jaartal ook op de naam alleen:
    // Claude laat het jaartal soms weg als het in de export al klopte.
    const match =
      (mapped.legacy_id ? opId.get(mapped.legacy_id) : undefined) ??
      (mapped.naam ? byName.get(key(mapped.naam, mapped.jaar)) : undefined) ??
      (mapped.naam && mapped.jaar == null
        ? byNameOnly.get(mapped.naam.trim().toLowerCase())
        : undefined);

    if (!match) {
      // Een aanvulling hoort niets nieuws aan te maken: staat de wijn er niet,
      // dan is er iets misgegaan en is stil toevoegen erger dan overslaan.
      if (soort === 'aanvulling') plan.onbekend.push(mapped.naam ?? `id ${mapped.legacy_id ?? '?'}`);
      else plan.nieuw.push(mapped);
      continue;
    }
    // Een toevoeging is expliciet bedoeld als nieuwe regel.
    if (soort === 'toevoeging') {
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
