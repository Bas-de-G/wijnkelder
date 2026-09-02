# Wat is er overgenomen uit de oorspronkelijke app

Naast elkaar: elke functie uit Dennis' `legacy/wijnkelder.html` en waar hij in de gehoste versie
terecht is gekomen.

| Oorspronkelijk | Nu | Toelichting |
|---|---|---|
| **Kelder** — lijst, zoeken, filter op type, sorteren | Register (`/`) | Sorteren op alfabet, drinkvenster, voorraad en toevoegdatum. |
| A–Z springbalk | Register | Verschijnt bij alfabetisch sorteren vanaf twaalf wijnen. |
| Uitklapbare kaarten | Register | Zelfde opbouw als het origineel: kenmerken, sterren, drinkvenster en notitie klappen open onder de naam. De volledige pagina per wijn staat op `/wijn/<id>`. |
| **Toevoegen** — formulier | `/toevoegen` | |
| Duplicaatwaarschuwing | `/toevoegen` | Waarschuwt op naam, en bij een ingevuld oogstjaar ook daarop. |
| **Tijdlijn** — drinkvensters op urgentie | `/tijdlijn` | Eigen tabblad, net als in het origineel: elk venster als balk op één jaarschaal, gegroepeerd op status. Eén doorlopende lijn voor dit jaar in plaats van een streepje per regel. |
| **Meldingen** | Filter "vraagt aandacht" | Zit met een teller naast de zoekbalk. |
| **Dagboek** | `/dagboek` | |
| Laatste fles: bewaren of verwijderen | Detailpagina | Dezelfde keuze; het dagboek blijft in beide gevallen intact. |
| **Inzichten** | `/inzichten` | Type, regio en druif, plus vier kerncijfers. Blends tellen bij elke druif mee. |
| **Verlanglijst** | `/verlanglijst` | Inclusief "gekocht", dat het item naar de kelder verplaatst. |
| **Advies** — vrije tekst | `/advies` → Typ zelf | Zelfde woordenlijsten en weging als het origineel. |
| **Advies** — stap voor stap | `/advies` → Stap voor stap | Dezelfde drie vragen en dezelfde score. |
| **Export** — Excel | `/exporteren` | Nu op de server gemaakt, met filterrij en vastgezette kopregel. |
| **Export** — CSV | `/exporteren` | Met BOM, zodat Excel accenten goed toont. |
| **Export** — PDF | `/exporteren` | Een echte PDF. Het origineel downloadde HTML met het verzoek zelf af te drukken. |
| **Export** — JSON-back-up | `/exporteren` | Zelfde formaat als het origineel, dus de Claude-aanvulroute blijft werken. |
| Back-up naar klembord | `/exporteren` | |
| **Back-up importeren** | `/importeren` | Voegt samen in plaats van te vervangen, met een telling vooraf. Accepteert `wines`, een kale lijst, `update_wines` en `add_wines`. |
| **Aanvullen door Claude** | `/aanvullen` | De drie stappen op één scherm: exporteren, de opdracht kopiëren, het antwoord terugplakken. |
| Alleen-lezen pagina delen | Deel-link | Een echte URL die actueel blijft en in te trekken is, in plaats van een gedownload bestand dat meteen veroudert. |
| QR-code | Deel-link | Wijst naar de link. Het origineel propte de kelderinhoud zelf in de code, waardoor die vastliep bij een grote kelder. |
| Licht/donker thema | Alle schermen | |
| "Zet op beginscherm"-banner | Nog niet | Hoort bij de PWA-stap (fase 4). |

## Wat er nieuw bij is gekomen

- **Accounts.** Inloggen met e-mailadres en wachtwoord, met wachtwoordherstel. Elke kelder is
  afgeschermd op databaseniveau, niet alleen in de interface.
- **Synchronisatie tussen apparaten** zonder back-ups heen en weer te sturen.
- **Zachte verwijdering.** Een verwijderde wijn is in de database terug te halen.

## Waar we van het origineel zijn afgeweken

- **De vier cijfers in de kop tellen flessen**, net als in het origineel — niet wijnen. De eerste
  drie tellen samen op tot het totaal, doordat een wijn zonder drinkvenster bij "op dronk" valt.
  `tests/insights.test.ts` vergelijkt de telling met `updateStats()` uit de oude app zelf.
- **"Gedronken" op de kaart** opent het dagboekformulier op de pagina van die wijn (`?drinken=1`)
  in plaats van een aparte dialoog. Zo staat dat formulier op één plek.
- **De tijdlijn groepeert op status** in plaats van één doorlopende lijst op einddatum. Het kopje
  boven een groep is meteen het label bij de kleur van de balken eronder, zodat de status nooit
  alleen aan kleur hangt — nodig, want geen enkele groen-oranje-rode schaal overleeft
  deuteranopie. `tests/tijdlijn.test.ts` vergelijkt de jaarschaal en de balken met
  `renderTimeline()` uit de oude app zelf.
- **Verwijderen staat niet op de kaart.** Dat is onomkeerbaar genoeg om een pagina verder te
  verdienen.

## Bewust niet overgenomen

- **Meldingen als apart tabblad.** Dat toont een selectie van wat het register al laat zien; het
  is opgegaan in het filter "vraagt aandacht" in plaats van gekopieerd. De tijdlijn is er wél als
  eigen scherm: die laat iets zien wat een lijst niet kan — alle vensters naast elkaar op één
  schaal.
