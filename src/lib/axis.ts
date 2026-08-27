// De gedeelde tijdas van het register. Alle wijnen worden op dezelfde schaal
// getekend, zodat je in één blik ziet wat er wacht, wat op dronk is en wat je
// te lang hebt laten liggen.

import type { Wine } from './types';

export interface Axis {
  min: number;
  max: number;
  /** Waar "nu" op de as valt, 0–1. */
  now: number;
  /** Jaartallen om als schaalverdeling te tonen. */
  ticks: number[];
}

export interface Span {
  from: number;
  to: number;
}

const PAD = 1;

export function buildAxis(wines: Wine[], year: number): Axis {
  const years: number[] = [year];
  for (const w of wines) {
    if (w.drink_from != null) years.push(w.drink_from);
    if (w.drink_to != null) years.push(w.drink_to);
  }

  let min = Math.min(...years) - PAD;
  let max = Math.max(...years) + PAD;

  // Een as van één of twee jaar breed zegt niets; geef hem altijd wat lucht.
  if (max - min < 6) {
    const mid = Math.round((min + max) / 2);
    min = mid - 3;
    max = mid + 3;
  }

  return { min, max, now: (year - min) / (max - min), ticks: buildTicks(min, max) };
}

function buildTicks(min: number, max: number): number[] {
  const span = max - min;
  // Mik op vier tot zes labels, op ronde jaartallen.
  const step = span <= 8 ? 2 : span <= 16 ? 4 : span <= 30 ? 5 : 10;
  const first = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let y = first; y <= max; y += step) out.push(y);
  return out;
}

export function tickPosition(year: number, axis: Axis): number {
  return (year - axis.min) / (axis.max - axis.min);
}

/**
 * De positie van het drinkvenster op de as, als fractie 0–1.
 * Een half venster (alleen "vanaf" of alleen "t/m") loopt door tot de rand:
 * dat is eerlijker dan een punt tekenen op een jaar dat niet bekend is.
 */
export function windowSpan(w: Wine, axis: Axis): Span | null {
  const { drink_from: from, drink_to: to } = w;
  if (from == null && to == null) return null;
  const span = axis.max - axis.min;
  const a = ((from ?? axis.min) - axis.min) / span;
  const b = ((to ?? axis.max) - axis.min) / span;
  return { from: Math.max(0, Math.min(1, a)), to: Math.max(0, Math.min(1, b)) };
}
