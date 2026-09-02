// Statistieken over de kelder. Losse, pure functies zodat ze te testen zijn
// zonder database of browser.

import { drinkBadge, currentYear, type DrinkStatus } from './drinkwindow';
import type { Wine } from './types';

export interface Totals {
  wijnen: number;
  flessen: number;
  /** Aankoopwaarde van wat er nu ligt: prijs per fles maal aantal. */
  waarde: number;
  /** Aantal wijnen waarvan de prijs bekend is — anders is de waarde misleidend. */
  metPrijs: number;
  gemiddeldeScore: number | null;
  beoordeeld: number;
}

export function totals(wines: Wine[]): Totals {
  let flessen = 0, waarde = 0, metPrijs = 0, scoreSom = 0, beoordeeld = 0;

  for (const w of wines) {
    // Number() omdat een aantal uit een import als tekst kan binnenkomen; met
    // += zou dat een tekstuele optelling worden ("0" + "2" = "02").
    const aantal = Number(w.aantal) || 0;
    flessen += aantal;
    if (w.prijs != null && w.prijs > 0) {
      waarde += w.prijs * aantal;
      metPrijs++;
    }
    if (w.sterren > 0) {
      scoreSom += w.sterren;
      beoordeeld++;
    }
  }

  return {
    wijnen: wines.length,
    flessen,
    waarde: Math.round(waarde * 100) / 100,
    metPrijs,
    gemiddeldeScore: beoordeeld ? Math.round((scoreSom / beoordeeld) * 10) / 10 : null,
    beoordeeld,
  };
}

export interface Slice {
  label: string;
  aantal: number;
}

/**
 * Telt flessen per waarde van een veld. Meerdere druiven in één veld
 * ("Cabernet Sauvignon, Merlot") worden gesplitst, want anders krijg je een
 * lange staart van blends die elk één keer voorkomen.
 */
export function countBy(
  wines: Wine[],
  field: 'type' | 'regio' | 'druif',
  opts: { split?: boolean; limit?: number } = {}
): Slice[] {
  const tel = new Map<string, number>();

  for (const w of wines) {
    const raw = w[field];
    if (!raw) continue;
    const aantal = Number(w.aantal) || 0;
    if (aantal === 0) continue;

    // Let op: een veld met alleen spaties is truthy, dus filteren na het trimmen —
    // anders levert dat een categorie zonder naam op.
    const waarden = (opts.split ? String(raw).split(/[,/]|\ben\b|&/) : [String(raw)])
      .map((s) => s.trim())
      .filter(Boolean);

    for (const v of waarden) {
      const sleutel = v.charAt(0).toUpperCase() + v.slice(1);
      tel.set(sleutel, (tel.get(sleutel) ?? 0) + aantal);
    }
  }

  const uit = [...tel.entries()]
    .map(([label, aantal]) => ({ label, aantal }))
    .sort((a, b) => b.aantal - a.aantal || a.label.localeCompare(b.label, 'nl'));

  return opts.limit ? uit.slice(0, opts.limit) : uit;
}

export type StatusCounts = Record<DrinkStatus, number>;

export function countByStatus(wines: Wine[], year: number = currentYear()): StatusCounts {
  const uit: StatusCounts = { nu: 0, wt: 0, vb: 0, nvt: 0 };
  for (const w of wines) uit[drinkBadge(w, year).status] += Number(w.aantal) || 0;
  return uit;
}

export interface KopCijfers {
  nu: number;
  wachten: number;
  voorbij: number;
  flessen: number;
}

/**
 * De vier getallen in de kop. Dit telt *flessen*, niet wijnen — zoals de app van
 * Dennis het deed. Wijnen zonder drinkvenster tellen mee bij "op dronk", zodat
 * de eerste drie getallen samen precies het totaal zijn.
 */
export function kopCijfers(wines: Wine[], year: number = currentYear()): KopCijfers {
  const s = countByStatus(wines, year);
  return {
    nu: s.nu + s.nvt,
    wachten: s.wt,
    voorbij: s.vb,
    flessen: s.nu + s.wt + s.vb + s.nvt,
  };
}

/** Wijnen die aandacht vragen: bijna op dronk, bijna voorbij, of al voorbij. */
export function needsAttention(wines: Wine[], year: number = currentYear()) {
  const voorbij: Wine[] = [], bijnaVoorbij: Wine[] = [], bijnaOpDronk: Wine[] = [];
  for (const w of wines) {
    if (!(Number(w.aantal) > 0)) continue;
    const b = drinkBadge(w, year);
    if (b.status === 'vb') voorbij.push(w);
    else if (b.closing) bijnaVoorbij.push(w);
    else if (b.soon) bijnaOpDronk.push(w);
  }
  return { voorbij, bijnaVoorbij, bijnaOpDronk };
}
