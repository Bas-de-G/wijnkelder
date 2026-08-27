# Wat is er overgenomen uit de oorspronkelijke app

Naast elkaar: elke functie uit Dennis' `legacy/wijnkelder.html` en waar hij in de gehoste versie
terecht is gekomen.

| Oorspronkelijk | Nu | Toelichting |
|---|---|---|
| **Kelder** — lijst, zoeken, filter op type, sorteren | Register (`/`) | Sorteren op alfabet, drinkvenster, voorraad en toevoegdatum. |
| A–Z springbalk | Register | Verschijnt bij alfabetisch sorteren vanaf twaalf wijnen. |
| Uitklapbare kaarten | Detailpagina per wijn | Notities, drinkvenster en acties staan op `/wijn/<id>` in plaats van in de lijst. |
| **Toevoegen** — formulier | `/toevoegen` | |
| Duplicaatwaarschuwing | `/toevoegen` | Waarschuwt op naam, en bij een ingevuld oogstjaar ook daarop. |
| **Tijdlijn** — drinkvensters op urgentie | Opgegaan in het register | Alle wijnen delen daar één tijdas, met een doorlopende lijn voor "nu". Een apart tabblad zou hetzelfde tonen. |
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
- **Eén gedeelde tijdas.** Waar het origineel per wijn een voortgangsbalkje toonde, staan alle
  drinkvensters nu op dezelfde schaal met één doorlopende lijn voor "nu".
- **Synchronisatie tussen apparaten** zonder back-ups heen en weer te sturen.
- **Zachte verwijdering.** Een verwijderde wijn is in de database terug te halen.

## Bewust niet overgenomen

- **Tijdlijn en Meldingen als aparte tabbladen.** Beide tonen een selectie van wat het register al
  laat zien. Ze zijn erin opgegaan in plaats van gekopieerd.
