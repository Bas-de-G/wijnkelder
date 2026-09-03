// Welke schil hoort bij welk pad. Los van het component, zodat het te testen is
// zonder een browser: een fout hier laat de kop op het inlogscherm verschijnen
// of juist wegvallen op een tabblad.

export interface KopTitel {
  titel: string;
  cursief?: string;
}

export const TITELS: Record<string, KopTitel> = {
  '/tijdlijn': { titel: 'Tijdlijn' },
  '/dagboek': { titel: 'Dagboek' },
  '/inzichten': { titel: 'Inzichten' },
  '/advies': { titel: 'Wat drink ik', cursief: 'vanavond' },
  '/verlanglijst': { titel: 'Nog te', cursief: 'proeven' },
  '/toevoegen': { titel: 'Nieuwe', cursief: 'fles' },
  '/aanvullen': { titel: 'Laten', cursief: 'aanvullen' },
  '/exporteren': { titel: 'Exporteren &', cursief: 'delen' },
  '/importeren': { titel: 'Kelder', cursief: 'overnemen' },
};

/** Schermen zonder app-schil: die brengen hun eigen kop mee of horen er niet bij. */
const KAAL = ['/inloggen', '/wachtwoord', '/auth', '/s', '/ontwerp'];

export function heeftSchil(pad: string): boolean {
  return !KAAL.some((k) => pad === k || pad.startsWith(k + '/'));
}

/**
 * De titel in de balk, of undefined voor het wordmerk. Dat laatste geldt voor de
 * kelderpagina en voor de pagina van één wijn: een wijnnaam past niet in een balk
 * van vaste hoogte, dus die staat groot bovenaan de pagina zelf.
 */
export function kopTitel(pad: string): KopTitel | undefined {
  return TITELS[pad];
}
