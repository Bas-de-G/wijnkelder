# Wijnkelder-app — deel- en gebruikshandleiding

Deze handleiding is voor wie de app doorgestuurd krijgt en zelf een kelder wil bijhouden.

Je hebt twee dingen nodig:

| Bestand | Wat is het |
|---|---|
| `wijnkelder.html` | De volledige app, met een lege kelder. |
| `instructies-voor-claude.md` | De aanvul-instructie die je aan Claude geeft, zodat wijninformatie automatisch wordt ingevuld. |

Er valt niets te installeren.

## Stap 1 — De app openen

Er zijn twee manieren, met een belangrijk verschil in hoe je data bewaard blijft.

### Optie A — In een eigen Claude-gesprek (aanbevolen)

1. Ga naar [claude.ai](https://claude.ai) en log in, of maak een gratis account aan.
2. Start een nieuw gesprek en upload `wijnkelder.html`.
3. Vraag Claude: *"Open deze app"* — de app verschijnt direct interactief in het gesprek.
4. Vanaf nu draait de app live: alles wat je toevoegt wordt privé opgeslagen onder jouw
   Claude-account, en blijft bewaard tussen apparaten zolang je op hetzelfde account inlogt.

### Optie B — Los in een browser

Je kunt het bestand ook gewoon dubbelklikken. Dat werkt, met twee kanttekeningen:

- De data wordt lokaal in die ene browser bewaard, dus geen synchronisatie tussen apparaten.
- De aanvulfunctie werkt dan niet vanuit de app zelf; daarvoor is alsnog een apart Claude-gesprek
  nodig (zie stap 3).

## Stap 2 — Wijnen toevoegen

Tik op het **+**-tabblad en vul het formulier in: naam, type, regio, druif, producent, oogstjaar,
aantal flessen, prijs, locatie, drinkvenster en een notitie. Alleen de naam is verplicht — de rest
kun je later altijd nog aanvullen.

Heb je al een lijst in een andere app of spreadsheet? Ga naar **Export → Back-up importeren** en
upload een JSON-bestand met je wijnen.

## Stap 3 — Claude de wijninformatie laten aanvullen

Optioneel, maar dit is wat de app tot leven brengt: per wijn een notitie met wijnhuis-achtergrond,
druif, smaakprofiel en eettips, plus een realistisch drinkvenster.

1. Ga naar **Export → Back-up kopiëren naar klembord** (of *Back-up downloaden*).
2. Open een gesprek met Claude en plak of upload die back-up.
3. Geef de eerste keer ook de instructie uit [`instructies-voor-claude.md`](instructies-voor-claude.md) mee.
4. Claude stuurt een aangevuld back-upbestand terug.
5. Ga terug naar de app, kies **Export → Back-up importeren** en selecteer dat bestand.

Herhaal dit als je nieuwe wijnen hebt toegevoegd. Claude vult dan alleen aan wat ontbreekt of fout
is, en laat de rest ongemoeid.

De instructie hoef je maar één keer te geven; Claude onthoudt 'm daarna voor het vervolg van jullie
gesprekken. Start je een gloednieuw of incognito-gesprek, dan moet je 'm opnieuw meegeven.

## Wat de app allemaal kan

| Tabblad | Functie |
|---|---|
| **Kelder** | Overzicht van alle wijnen, met zoeken, filteren en sorteren op alfabet, drinkvenster of voorraad. Tik op een wijn om details uit te klappen. |
| **Toevoegen** | Nieuwe wijn invoeren. Waarschuwt automatisch als een wijn met dezelfde naam en jaar al bestaat. |
| **Tijdlijn** | Visueel overzicht van drinkvensters, gesorteerd op urgentie. |
| **Dagboek** | Log wanneer je een fles hebt gedronken, met wie, bij welke gelegenheid en je eigen beoordeling. |
| **Inzichten** | Statistieken: verdeling per type, regio en druif, gemiddelde beoordeling, totale waarde. |
| **Verlanglijst** | Wijnen die je nog wilt kopen, met een knop om ze na aankoop naar de kelder te verplaatsen. |
| **Advies** | Typ wat je eet, of gebruik de stap-voor-stap sommelier, en krijg een passende wijn uit je eigen kelder. |
| **Export** | Back-up maken en importeren, export naar CSV, Excel en PDF, en een alleen-lezen pagina of QR-code om je kelder met iemand te delen. |

De app onthoudt je voorkeur voor een licht of donker thema (het knopje naast de datum bovenin) en
werkt zowel op mobiel als desktop.
