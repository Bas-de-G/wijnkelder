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
// De stap-voor-stap sommelier staat elders in het bestand dan het vrije advies.
const somm = slice('function sommTypePref', 'function renderSommStep');
// updateStats schrijft rechtstreeks in de DOM; met een nep-document kunnen we de
// vier getallen die het origineel toont alsnog uitlezen.
const stats = slice('function updateStats()', '// ── RENDER LIST ──');
// renderTimeline schrijft ook in de DOM; met hetzelfde nep-document kunnen we de
// HTML uitlezen en de percentages eruit halen.
const tijdlijn = slice('function renderTimeline()', '// ── LOG ──');
const sommVragen = slice('const SOMM_QUESTIONS', 'let sommStep');

const factory = new Function(`
  const YEAR_HOLDER = { year: new Date().getFullYear() };
  const WARN = 2;
  Object.defineProperty(globalThis, '__y', { get: () => YEAR_HOLDER.year, configurable: true });
  ${constants}
  ${badge.replace(/\bYEAR\b/g, '__y')}
  ${fns}
  ${sommVragen}
  ${somm}
  let wines = [];
  const __velden = {};
  const document = {
    getElementById: (id) => ({ set textContent(v) { __velden[id] = v; } }),
  };
  ${stats}
  let __tl = '';
  const __tlEl = { set innerHTML(v) { __tl = v; } };
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const jsAttr = (v) => esc(JSON.stringify(String(v)));
  const __getById = document.getElementById;
  document.getElementById = (id) => (id === 'tl-content' ? __tlEl : __getById(id));
  ${tijdlijn.replace(/\bYEAR\b/g, '__y')}
  return { tokenize, containsWord, scoreWine, bdg, prog, sommScore, sommTypePref,
           SOMM_QUESTIONS, setYear: y => { YEAR_HOLDER.year = y; },
           TYPE_HINTS, NL_STOPWORDS, SPECIAL_WORDS, UNUSUAL_GRAPES,
           /** De ruwe HTML die het origineel voor de tijdlijn tekent. */
           renderTimeline: (ws) => { wines = ws; renderTimeline(); return __tl; },
           updateStats: (ws) => {
             wines = ws;
             updateStats();
             return {
               nu: +__velden['hs-nu'],
               wachten: +__velden['hs-wt'],
               voorbij: +__velden['hs-vb'],
               flessen: +__velden['hs-tot'],
             };
           } };
`);

export const legacy = factory();
