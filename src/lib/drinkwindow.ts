// Drinkvenster-logica, overgenomen uit bdg() en prog() in de legacy-app.
// Het huidige jaar is een parameter in plaats van een module-constante: de oude
// versie berekende YEAR één keer bij het laden, waardoor een app die over
// oudjaar open bleef staan het jaar erna nog het oude jaartal gebruikte.

/** Binnen hoeveel jaar een venster "bijna" is. */
export const WARN_YEARS = 2;

export type DrinkStatus = 'nu' | 'wt' | 'vb' | 'nvt';

export interface DrinkBadge {
  /** nu = op dronk, wt = wachten, vb = over hoogtepunt, nvt = geen venster bekend */
  status: DrinkStatus;
  label: string;
  /** Bijna op dronk (binnen WARN_YEARS). */
  soon: boolean;
  /** Bijna over het hoogtepunt (binnen WARN_YEARS). */
  closing: boolean;
}

interface WindowInput {
  drink_from?: number | null;
  drink_to?: number | null;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function drinkBadge(w: WindowInput, year: number = currentYear()): DrinkBadge {
  const from = w.drink_from ?? null;
  const to = w.drink_to ?? null;

  if (from === null && to === null) {
    return { status: 'nvt', label: 'Geen venster', soon: false, closing: false };
  }
  if (from !== null && year < from) {
    const jaren = from - year;
    return {
      status: 'wt',
      label: jaren === 1 ? 'Nog 1 jaar' : `Nog ${jaren} jaar`,
      soon: jaren <= WARN_YEARS,
      closing: false,
    };
  }
  if (to !== null && year > to) {
    return { status: 'vb', label: 'Over hoogtepunt', soon: false, closing: false };
  }
  const closing = to !== null && to - year <= WARN_YEARS;
  return { status: 'nu', label: 'Nu drinken', soon: false, closing };
}

export interface DrinkProgress {
  /** Hoe ver het venster gevorderd is, 0–100. */
  pct: number;
  past: boolean;
  waiting: boolean;
}

export function drinkProgress(w: WindowInput, year: number = currentYear()): DrinkProgress | null {
  const from = w.drink_from ?? null;
  const to = w.drink_to ?? null;
  if (from === null || to === null || to <= from) return null;
  const span = to - from;
  const elapsed = Math.min(Math.max(year - from, 0), span);
  return {
    pct: Math.round((elapsed / span) * 100),
    past: year > to,
    waiting: year < from,
  };
}

/** Sorteervolgorde voor "op dronk": urgentste eerst. */
export const STATUS_ORDER: Record<DrinkStatus, number> = { vb: 0, nu: 1, wt: 2, nvt: 3 };
