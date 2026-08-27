# Wijnkelder

Een app om je wijnkelder mee bij te houden: voorraad, drinkvensters, een drinkdagboek,
een verlanglijst en een sommelier die een fles uit je eigen kelder kiest bij wat je eet.

Origineel gebouwd door Dennis als één zelfstandig HTML-bestand dat in een Claude-gesprek draait.
Dit project brengt die app naar een gehoste versie met echte accounts en een database.

## Wat waar staat

| Pad | Wat |
|---|---|
| `src/` | De gehoste app: Next.js, Supabase, Row Level Security. |
| `supabase/migrations/` | Het databaseschema. Draai `0001_init.sql` in de Supabase SQL-editor. |
| `legacy/wijnkelder.html` | Dennis' oorspronkelijke app als één bestand. Werkt zonder server. |
| `docs/opzetten.md` | Wat je eenmalig in Supabase instelt, en hoe je alles nagaat. |
| `docs/plan.md` | Het migratieplan, inclusief App Store-analyse. |
| `docs/instructies-voor-claude.md` | De instructie die je aan Claude geeft om wijninformatie te laten aanvullen. |
| `docs/handleiding.md` | Gebruikshandleiding voor de oude app. |

De eerste commit in dit project bevat `legacy/wijnkelder.html` exact zoals Dennis 'm aanleverde.
Latere commits passen hem aan; de originele versie blijft dus opvraagbaar via de git-historie.

## De app draaien

```
npm install
cp .env.example .env.local     # vul je Supabase-gegevens in
npm run dev
```

Eerste keer? Volg [`docs/opzetten.md`](docs/opzetten.md) — het schema moet één keer in Supabase
gedraaid worden en de inlog-redirect ingesteld.

## De legacy-app draaien

Geen build-stap, geen dependencies:

```
open legacy/wijnkelder.html
```

Of serveer 'm lokaal als je browser bestand-URL's dwarsboomt:

```
python3 -m http.server 8000 --directory legacy
# → http://localhost:8000/wijnkelder.html
```

Data komt in de IndexedDB van die browser terecht (`wijnkelder_local`). Draait de app binnen een
Claude-gesprek, dan gebruikt hij in plaats daarvan de accountopslag van Claude en synchroniseert
hij tussen apparaten.

Maak een back-up via **Export → Back-up downloaden**. Dat JSON-bestand is het migratieformaat
naar de gehoste versie.

## Tests draaien

```
npm test              # 122 tests
npm run test:legacy   # opent de oude app in Chromium, 33 controles
```

`npm test` bevat differentiële tests: het wijnadvies en de drinkvensterberekening worden
vergeleken met de originele functies uit `legacy/wijnkelder.html`, niet met overgetypte
verwachtingen. Verandert er iets aan de scoreformule of de woordenlijsten, dan valt dat daar om.

`npm run test:legacy` opent de oude app in een echte browser en controleert HTML-escaping, unieke
id's en het volledige importpad.

## Status

- **Fase 0** — repo op orde, baseline vastgelegd. Klaar.
- **Fase 1** — legacy-app gehard: HTML-escaping, UUID's, samenvoegende import. Klaar.
- **Fase 2** — gehoste versie: schema, accounts, register, toevoegen, advies, import. Kern staat.
  Dagboek, tijdlijn, inzichten en verlanglijst volgen nog.
- **Fase 3–4** — deel-links, etiketfoto's, herinneringen, PWA. Nog te doen.

Zie `docs/plan.md` voor de volledige route, inclusief de App Store-analyse.
