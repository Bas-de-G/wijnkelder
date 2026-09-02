// De rekenkunde achter de tijdlijn: welke jaren staan er op de as, en waar
// begint en eindigt het balkje van een wijn. Overgenomen uit renderTimeline()
// van Dennis' app; tests/tijdlijn.test.ts vergelijkt de uitkomst met die functie
// zelf, dus een afwijking valt daar om.

import { drinkBadge, currentYear, type DrinkStatus } from './drinkwindow';
import type { Wine } from './types';

export interface TijdlijnAs {
  /** Eerste jaar op de as: een jaar vóór het vroegste drinkvenster. */
  min: number;
  /** Laatste jaar: een jaar ná het laatste drinkvenster. */
  max: number;
  ticks: number[];
  /** Waar het huidige jaar staat, als deel van de as (0–1, afgekapt). */
  nu: number;
}

export interface Balk {
  /** Links, als deel van de as (0–1). */
  van: number;
  /** Breedte, als deel van de as. Minimaal 2%, anders is een kort venster onzichtbaar. */
  breedte: number;
}

/** Alleen wijnen met een compleet, kloppend venster staan op de tijdlijn. */
export function heeftVenster(w: Pick<Wine, 'drink_from' | 'drink_to'>): boolean {
  return w.drink_from != null && w.drink_to != null && w.drink_to >= w.drink_from;
}

export function bouwAs(wines: Wine[], year: number = currentYear()): TijdlijnAs | null {
  const met = wines.filter(heeftVenster);
  if (!met.length) return null;

  const min = Math.min(...met.map((w) => w.drink_from as number)) - 1;
  const max = Math.max(...met.map((w) => w.drink_to as number)) + 1;
  const span = max - min;

  // Vijf stappen, net als in het origineel; het laatste jaar komt er los bij als
  // de stap er niet precies op uitkomt.
  const step = Math.ceil(span / 5);
  const ticks: number[] = [];
  for (let y = min; y <= max; y += step) ticks.push(y);
  if (ticks[ticks.length - 1] < max) ticks.push(max);

  return { min, max, ticks, nu: klem((year - min) / span) };
}

function klem(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

/** Waar een jaartal op de as staat, als deel van 0–1. */
export function positie(jaar: number, as: TijdlijnAs): number {
  return (jaar - as.min) / (as.max - as.min);
}

export function balk(w: Wine, as: TijdlijnAs): Balk | null {
  if (!heeftVenster(w)) return null;
  // Het origineel rondt de percentages af vóór het aftrekken; dat verschil is op
  // een smal scherm zichtbaar, dus we doen het net zo.
  const van = Math.round(positie(w.drink_from as number, as) * 100);
  const tot = Math.round(positie(w.drink_to as number, as) * 100);
  return { van: van / 100, breedte: Math.max(tot - van, 2) / 100 };
}

/** Volgorde binnen een groep: wat het eerst op is, staat bovenaan. */
export function opUrgentie(a: Wine, b: Wine): number {
  const ta = a.drink_to ?? 9999;
  const tb = b.drink_to ?? 9999;
  if (ta !== tb) return ta - tb;
  return (a.drink_from ?? 9999) - (b.drink_from ?? 9999);
}

export interface Groep {
  status: DrinkStatus;
  label: string;
  wines: Wine[];
}

const GROEP_LABELS: Record<DrinkStatus, string> = {
  vb: 'Over hoogtepunt',
  nu: 'Nu drinken',
  wt: 'Wachten',
  nvt: 'Geen venster',
};

/**
 * De wijnen gegroepeerd op status, in de volgorde waarin je ze wilt zien: eerst
 * wat te lang ligt, dan wat nu open kan, dan wat nog moet wachten. Het kopje
 * boven elke groep is meteen het label bij de kleur, zodat kleur nooit in zijn
 * eentje de status draagt.
 */
export function groepeer(wines: Wine[], year: number = currentYear()): Groep[] {
  const volgorde: DrinkStatus[] = ['vb', 'nu', 'wt'];
  const emmers = new Map<DrinkStatus, Wine[]>(volgorde.map((s) => [s, []]));

  for (const w of wines) {
    if (!heeftVenster(w)) continue;
    const s = drinkBadge(w, year).status;
    emmers.get(s)?.push(w);
  }

  return volgorde
    .map((status) => ({
      status,
      label: GROEP_LABELS[status],
      wines: (emmers.get(status) ?? []).sort(opUrgentie),
    }))
    .filter((g) => g.wines.length > 0);
}
