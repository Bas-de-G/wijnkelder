// Eigen icoonset in plaats van een icoonlettertype. Scheelt een externe
// aanvraag, en de streekdikte sluit aan op de haarlijnen in het register.
type P = { className?: string };

const S = (d: React.ReactNode, extra?: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={extra?.className}
  >
    {d}
  </svg>
);

/** Een fles op zijn kant: de kelder als voorraad. */
export const IconKelder = (p: P) =>
  S(<><path d="M4 9h9a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H4z" /><path d="M18 12h2M4 9V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" /></>, p);

export const IconPlus = (p: P) => S(<><path d="M12 5v14M5 12h14" /></>, p);

export const IconDagboek = (p: P) =>
  S(<><path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M8 8h7M8 12h7M8 16h4" /></>, p);

export const IconInzichten = (p: P) =>
  S(<><path d="M4 20h16" /><path d="M7 20v-6M12 20V7M17 20v-9" /></>, p);

export const IconAdvies = (p: P) =>
  S(<><path d="M6 4v6a3 3 0 0 0 3 3v7" /><path d="M6 4v5M9 4v5" /><path d="M17 4c1.5 1.5 2 3 2 5s-.5 3-2 3v8" /></>, p);

export const IconVerlanglijst = (p: P) =>
  S(<path d="M12 20s-7-4.5-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.5-7 9-7 9z" />, p);

/** Een glas met een vonk: laten aanvullen. */
export const IconAanvullen = (p: P) =>
  S(<><path d="M7 4h8l-1 6a3 3 0 0 1-6 0z" /><path d="M11 13v6M8 19h6" /><path d="M18 3v4M16 5h4" /></>, p);

export const IconExporteren = (p: P) =>
  S(<><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19h14" /></>, p);

export const IconImporteren = (p: P) =>
  S(<><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 19h14" /></>, p);

export const IconMeer = (p: P) =>
  S(<><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" /></>, p);

export const IconUit = (p: P) =>
  S(<><path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /><path d="M15 8l4 4-4 4M19 12H9" /></>, p);

export const IconSluit = (p: P) => S(<><path d="M6 6l12 12M18 6L6 18" /></>, p);

/* ── Iconen op de wijnkaart ───────────────────────────────────────────────── */

export const IconChevron = (p: P) => S(<><path d="M6 9l6 6 6-6" /></>, p);

/** Regio. */
export const IconPlek = (p: P) =>
  S(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>, p);

/** Druif — een blad, want een tros wordt bij 13px een vlek. */
export const IconDruif = (p: P) =>
  S(<><path d="M4 20c9 0 15-5 16-16-9 0-15 5-16 16z" /><path d="M4 20c4-4 7-6 11-8" /></>, p);

/** Jaargang. */
export const IconJaar = (p: P) =>
  S(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>, p);

/** Plek in de kelder. */
export const IconVak = (p: P) =>
  S(<><path d="M4 7h16M4 12h16M4 17h16" /><path d="M9 7v10M15 7v10" /></>, p);

/** Prijs. */
export const IconPrijs = (p: P) =>
  S(<><path d="M4 12.5V5a1 1 0 0 1 1-1h7.5L20 11.5 12.5 19 4 12.5z" /><circle cx="8.5" cy="8" r="1.1" fill="currentColor" stroke="none" /></>, p);

/** Cadeau of anderszins niet zelf gekocht. */
export const IconHerkomst = (p: P) =>
  S(<><rect x="3" y="9" width="18" height="11" rx="1.5" /><path d="M3 13h18M12 9v11" /><path d="M12 9S9.5 4 7.5 5.2 10 9 12 9zM12 9s2.5-5 4.5-3.8S14 9 12 9z" /></>, p);

/** Fles geopend. */
export const IconGedronken = (p: P) =>
  S(<><path d="M10 3h4v3.5l2.5 4V21h-9V10.5L10 6.5z" /><path d="M7.5 14h9" /></>, p);

export const IconBewerken = (p: P) =>
  S(<><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>, p);

/** Tijdlijn: drie vensters onder elkaar op één schaal. */
export const IconTijdlijn = (p: P) =>
  S(<><path d="M5 7h7M9 12h10M4 17h8" /><path d="M15 3v18" opacity=".45" /></>, p);
