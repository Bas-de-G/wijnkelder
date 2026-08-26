# Instructies voor Claude — Wijnkelder-app aanvullen

Gebruik je de Wijnkelder-app en wil je dat Claude je back-ups aanvult met informatie over je
wijnen? Plak onderstaande tekst dan in een gesprek met Claude — bijvoorbeeld bij het versturen van
je eerste back-up, of via **Instellingen → Personalisatie** als je de instructie blijvend wilt
laten gelden.

## De instructie

> In de Wijnkelder-app: als ik export-/back-upbestanden aanlever om aan te vullen, zoek zelf de
> druivensoort(en) van elke wijn op en vul het "druif"-veld in, naast de andere aanvullingen
> (drinkvenster, notities). Controleer daarbij ook of reeds ingevulde velden (regio, druif)
> kloppen, en corrigeer ze als ze fout blijken. Zoek daarbij ook naar jaargang-specifieke context
> (hoe was dat groeiseizoen/die oogst, karakter van die specifieke jaargang). Schrijf de notitie
> ("note"-veld) altijd in deze structuur, met een lege regel tussen elk blok: "Wijnhuis: " gevolgd
> door "Wijn & jaargang: <druif, type/smaak van de wijn, en jaargang-specifieke info indien
> gevonden>" gevolgd door "Lekker bij: <uitgebreide eettips, inclusief korte uitleg waarom iets
> goed matcht>". De app herkent deze labels en toont ze als aparte alinea's met tussenkopjes. Als
> voor wijnhuis, wijnmaker of jaargang geen concrete info te vinden is, laat dat onderdeel dan
> gewoon weg in plaats van expliciet te vermelden dat er niets gevonden is — nooit informatie
> verzinnen, wel gewoon stilzwijgend overslaan wat onbekend is.

## Hoe werkt dit in de praktijk?

1. Open de Wijnkelder-app en voeg je wijnen toe via het formulier.
2. Ga naar het **Export**-tabblad en exporteer een back-up (JSON-bestand).
3. Stuur dat bestand naar Claude, samen met (de eerste keer) de instructie hierboven.
4. Claude zoekt per wijn de druif en een passend drinkvenster op, en schrijft een notitie met
   wijnhuis-achtergrond, smaakprofiel en eettips.
5. Claude stuurt een aangevuld back-upbestand terug.
6. Importeer dat bestand via **Export → Back-up importeren**.

Herhaal dit elke keer als je nieuwe wijnen toevoegt. Claude vult dan alleen de nieuwe of
ontbrekende informatie aan, niet wat er al staat — tenzij er een fout in zit.

## Waarom dit format?

De app herkent notities die volgens dit patroon zijn opgebouwd en toont ze automatisch als nette,
aparte alinea's met tussenkopjes, in plaats van één lopend blok tekst. Notities die dit format niet
volgen worden nog steeds gewoon getoond, alleen zonder de opmaak.

De herkenning zit in `renderStructuredNote()`; de labels staan in de constante `NOTE_LABELS`.
