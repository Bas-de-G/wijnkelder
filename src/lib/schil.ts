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
  // Kort genoeg om op één regel te passen op een telefoon van 320px. Liep een
  // titel over, dan werd hij afgekapt of ging de balk omlopen — en dan is de
  // hoogte weer niet overal gelijk. De langere zin staat als inleiding op het
  // scherm zelf.
  '/advies': { titel: 'Wat', cursief: 'vanavond' },
  '/verlanglijst': { titel: 'Nog te', cursief: 'proeven' },
  '/toevoegen': { titel: 'Nieuwe', cursief: 'fles' },
  '/aanvullen': { titel: 'Laten', cursief: 'aanvullen' },
  '/exporteren': { titel: 'Delen &', cursief: 'export' },
  '/importeren': { titel: 'Kelder', cursief: 'inlezen' },
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
