# Wijnkelder

Een app om je wijnkelder mee bij te houden: voorraad, drinkvensters, een drinkdagboek,
een verlanglijst en een sommelier die een fles uit je eigen kelder kiest bij wat je eet.

Origineel gebouwd door Dennis als één zelfstandig HTML-bestand dat in een Claude-gesprek draait.
Dit project brengt die app naar een gehoste versie met echte accounts en een database.

## Wat waar staat

| Pad | Wat |
|---|---|
| `legacy/wijnkelder.html` | Dennis' app als één bestand. Werkt zonder server — dubbelklikken volstaat. |
| `docs/plan.md` | Het migratieplan: van artifact naar gehoste PWA, inclusief App Store-analyse. |
| `docs/instructies-voor-claude.md` | De instructie die je aan Claude geeft om wijninformatie te laten aanvullen. |
| `docs/handleiding.md` | Gebruikshandleiding voor wie de app doorgestuurd krijgt. |

De eerste commit in dit project bevat `legacy/wijnkelder.html` exact zoals Dennis 'm aanleverde.
Latere commits passen hem aan; de originele versie blijft dus opvraagbaar via de git-historie.

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

## Status

Fase 0 en 1 uit `docs/plan.md` zijn in uitvoering. De gehoste versie (Next.js + Supabase) volgt
in fase 2.
