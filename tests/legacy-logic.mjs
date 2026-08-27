// Haalt de originele advies- en drinkvensterlogica uit legacy/wijnkelder.html en
// maakt er aanroepbare functies van. Zo kunnen de tests de TypeScript-port
// vergelijken met het origineel in plaats van met een overgetypte verwachting.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '..', 'legacy', 'wijnkelder.html'), 'utf8');

function slice(startMarker, endMarker) {
  const i = src.indexOf(startMarker);
  if (i < 0) throw new Error('niet gevonden: ' + startMarker);
  const j = src.indexOf(endMarker, i);
  if (j < 0) throw new Error('einde niet gevonden: ' + endMarker);
  return src.slice(i, j);
}

const constants = slice('const NL_STOPWORDS', 'function tokenize');
const fns = slice('function tokenize', 'function getWijnAdvies');
const badge = slice('function bdg(w)', 'function colorAccent');

const factory = new Function(`
  const YEAR_HOLDER = { year: new Date().getFullYear() };
  const WARN = 2;
  Object.defineProperty(globalThis, '__y', { get: () => YEAR_HOLDER.year, configurable: true });
  ${constants}
  ${badge.replace(/\bYEAR\b/g, '__y')}
  ${fns}
  return { tokenize, containsWord, scoreWine, bdg, prog, setYear: y => { YEAR_HOLDER.year = y; },
           TYPE_HINTS, NL_STOPWORDS, SPECIAL_WORDS };
`);

export const legacy = factory();
