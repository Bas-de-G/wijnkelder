// Wijnadvies op basis van je eigen aantekeningen. Geen API, geen model — puur
// woordherkenning, precies zoals in de legacy-app. Dat is bewust: het werkt
// offline, kost niets, en geeft nooit een verzonnen aanbeveling.

import { NL_STOPWORDS, TYPE_HINTS, SPECIAL_WORDS, GENERIC_PAIRINGS } from './pairing-data';
import { drinkBadge, currentYear } from './drinkwindow';
import type { Wine } from './types';

export function tokenize(s: string | null | undefined): string[] {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !NL_STOPWORDS.has(w));
}

// Nederlandse samenstellingen ("wildgerechten", "tomatensaus") matchen niet op
// exacte woordgelijkheid — kijk daarom of het ene woord in het andere zit, in
// beide richtingen.
export function containsWord(noteWords: string[], word: string): boolean {
  return noteWords.some((nw) => nw.length > 3 && (nw.includes(word) || word.includes(nw)));
}

export interface ScoreOptions {
  gezelschap?: string;
  special?: boolean;
  year?: number;
}

export interface WineScore {
  total: number;
  /** Puur inhoudelijke relevantie: matcht deze wijn écht met wat je zocht? */
  contentScore: number;
}

export function scoreWine(foodWords: string[], w: Wine, opts: ScoreOptions = {}): WineScore {
  const noteWords = tokenize(w.note);

  let overlap = 0;
  for (const word of foodWords) {
    if (word.length > 3 && containsWord(noteWords, word)) overlap++;
  }

  const hints = TYPE_HINTS[w.type] || [];
  let hintScore = 0;
  for (const h of hints) {
    if (foodWords.some((word) => word.includes(h) || h.includes(word))) hintScore++;
  }

  const status = drinkBadge(w, opts.year ?? currentYear()).status;
  const statusBonus = status === 'nu' ? 2 : status === 'vb' ? -1 : 0;

  let occasionBonus = 0;
  if (opts.gezelschap === 'Zakelijk') {
    occasionBonus += (w.sterren || 0) * 0.6 + (w.prijs || 0) / 40;
  }
  if (opts.special) {
    occasionBonus += (w.sterren || 0) * 0.5;
  }

  // Status- en gezelschapsbonussen tellen alleen als tie-breaker mee. Ze mogen
  // een wijn nooit tot "match" bombarderen zonder inhoudelijke reden.
  const contentScore = overlap * 3 + hintScore * 1.5;
  return { total: contentScore + statusBonus + occasionBonus, contentScore };
}

export interface AdviceInput {
  gerecht: string;
  gezelschap?: string;
  gelegenheid?: string;
  year?: number;
}

export interface AdviceHit {
  wine: Wine;
  label: string;
  score: WineScore;
}

export interface AdviceResult {
  /** Waar de aanbeveling op gebaseerd is, voor weergave boven het resultaat. */
  summary: string;
  hits: AdviceHit[];
}

const LABELS = ['Beste match', 'Ook goed', 'Alternatief'];

export function adviseWines(wines: Wine[], input: AdviceInput): AdviceResult {
  const { gerecht, gezelschap = '', gelegenheid = '' } = input;
  const summary = [gerecht, gezelschap, gelegenheid].filter(Boolean).join(' · ');

  const available = wines.filter((w) => (w.aantal || 0) > 0);
  const foodWords = tokenize([gerecht, gelegenheid, gezelschap].filter(Boolean).join(' '));
  const special = foodWords.some((w) => SPECIAL_WORDS.has(w));

  const scored = available
    .map((w) => ({ wine: w, score: scoreWine(foodWords, w, { gezelschap, special, year: input.year }) }))
    .sort((a, b) => b.score.total - a.score.total);

  // Liever geen advies dan een gekunstelde match: zonder inhoudelijke score valt
  // een wijn af, ook als de statusbonus hem bovenaan zou zetten.
  const hits = scored
    .filter((s) => s.score.contentScore > 0)
    .slice(0, 3)
    .map((s, i) => ({ ...s, label: LABELS[i] }));

  return { summary, hits };
}

/** Wat een wijn "over het algemeen" bij past, als eigen notitie ontbreekt. */
export function genericPairing(type: string): string {
  return GENERIC_PAIRINGS[type] || GENERIC_PAIRINGS['Overig'];
}

// De app herkent notities die Claude in het afgesproken format schrijft en toont
// ze als aparte alinea's met een tussenkopje.
const NOTE_LABELS = ['wijnhuis', 'wijn & jaargang', 'wijn en jaargang', 'lekker bij', 'notitie'];

export interface NoteSection {
  label: string | null;
  body: string;
}

export function parseNote(note: string | null | undefined): NoteSection[] | null {
  if (!note) return null;
  const blocks = note.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const labelOf = (b: string) => {
    const m = b.match(/^([^:]{1,30}):\s*([\s\S]*)$/);
    return m && NOTE_LABELS.includes(m[1].trim().toLowerCase()) ? m : null;
  };
  if (!blocks.some((b) => labelOf(b))) return null;
  return blocks.map((b) => {
    const m = labelOf(b);
    return m ? { label: m[1].trim(), body: m[2].trim() } : { label: null, body: b };
  });
}
