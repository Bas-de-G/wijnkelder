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
