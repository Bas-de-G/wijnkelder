/**
 * De aanvulinstructie, letterlijk zoals Dennis hem opschreef. Niet aanpassen
 * zonder reden: de app leest de labels "Wijnhuis", "Wijn & jaargang" en
 * "Lekker bij" terug uit het note-veld (zie parseNote in sommelier.ts), dus een
 * andere formulering betekent dat notities niet meer als aparte alinea's
 * verschijnen.
 */
export const ENRICH_PROMPT = `In de Wijnkelder-app: als ik export-/back-upbestanden aanlever om aan te vullen, zoek zelf de druivensoort(en) van elke wijn op en vul het "druif"-veld in, naast de andere aanvullingen (drinkvenster, notities). Controleer daarbij ook of reeds ingevulde velden (regio, druif) kloppen, en corrigeer ze als ze fout blijken. Zoek daarbij ook naar jaargang-specifieke context (hoe was dat groeiseizoen/die oogst, karakter van die specifieke jaargang). Schrijf de notitie ("note"-veld) altijd in deze structuur, met een lege regel tussen elk blok: "Wijnhuis: " gevolgd door "Wijn & jaargang: <druif, type/smaak van de wijn, en jaargang-specifieke info indien gevonden>" gevolgd door "Lekker bij: <uitgebreide eettips, inclusief korte uitleg waarom iets goed matcht>". De app herkent deze labels en toont ze als aparte alinea's met tussenkopjes. Als voor wijnhuis, wijnmaker of jaargang geen concrete info te vinden is, laat dat onderdeel dan gewoon weg in plaats van expliciet te vermelden dat er niets gevonden is — nooit informatie verzinnen, wel gewoon stilzwijgend overslaan wat onbekend is.

Geef je antwoord terug als één JSON-bestand met de vorm {"update_wines": [ ... ]}, waarin per wijn het "id" staat zoals het in mijn export stond, plus alleen de velden die je hebt aangevuld of gecorrigeerd.`;

/** Een wijn mist informatie die Claude kan aanvullen. */
export function heeftAanvullingNodig(w: {
  druif: string | null;
  note: string | null;
  drink_from: number | null;
  drink_to: number | null;
}): boolean {
  return !w.druif?.trim() || !w.note?.trim() || (w.drink_from == null && w.drink_to == null);
}
