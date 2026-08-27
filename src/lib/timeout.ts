/**
 * Geeft op als iets te lang duurt.
 *
 * De Supabase-client probeert een mislukte netwerkaanroep vanzelf opnieuw, met
 * groeiende pauzes ertussen. Dat is prettig bij een korte hapering, maar zonder
 * grens blijft een knop op "Bezig…" staan zonder dat iemand weet waarom — precies
 * wat er gebeurt in een tunnel of bij een dood wifi-punt.
 */
export class TimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`Geen antwoord binnen ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

export function metTimeout<T>(taak: Promise<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const bewaker = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([taak, bewaker]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export const NETWERK_FOUT =
  'Geen verbinding met de server. Controleer je internetverbinding en probeer het opnieuw.';

/** Herkent de gevallen waarin het aan de verbinding ligt, niet aan de invoer. */
export function isNetwerkProbleem(e: unknown): boolean {
  if (e instanceof TimeoutError) return true;
  const naam = (e as { name?: string })?.name ?? '';
  const melding = (e as { message?: string })?.message ?? '';
  return (
    naam === 'AuthRetryableFetchError' ||
    naam === 'TypeError' ||
    /failed to fetch|network|load failed/i.test(melding)
  );
}
