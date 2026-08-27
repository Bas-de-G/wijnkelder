# Wijnkelder — van Claude-artifact naar gehoste PWA

## Context

Dennis heeft een wijnkelder-app gebouwd als één HTML-bestand (~3.840 regels, 158 KB, vanilla JS,
geen build-stap). Die draait als Claude-artifact en slaat alles op via `window.storage` met
IndexedDB als terugval. Functioneel is het verrassend compleet — negen tabbladen, een
regelgebaseerde sommelier, export naar CSV/Excel/JSON/QR.

De beperkingen zitten niet in de features maar in het fundament:

- **Geen echte hosting.** De app leeft in een Claude-gesprek. Delen betekent een HTML-bestand
  doorsturen; de ontvanger krijgt een lege kopie die op *zijn* Claude-account opslaat.
- **Geen user management.** Er is geen account, geen login, geen autorisatie. "Persoonlijk" betekent
  hier alleen "toevallig in jouw browser".
- **Geen database.** De hele staat is één JSON-blob onder één sleutel. Elke wijziging herschrijft
  alles → laatste schrijver wint, en tussen apparaten kan data stil verdwijnen.
- **Verrijking is handwerk.** JSON exporteren → in een Claude-chat plakken → verrijkt bestand
  terugimporteren, elke keer opnieuw.

Doel: dezelfde app live, met registratie/login, een echte database, en installeerbaar als PWA.
De App Store blijft een expliciete latere optie (fase 5 hieronder), niet iets waar we nu voor bouwen.

**Gekozen richting** (uit de vragen vooraf): Next.js + Supabase + Vercel · open registratie ·
PWA eerst, store later · de handmatige Claude-verrijkingsroute blijft behouden.

---

## Wat er nu staat (inventaris voor de migratie)

Bron: `4d91af78-wijnkelderleegdelen.html` (upload). Alles hieronder moet meeverhuizen.

| Tab | Kernfuncties |
|---|---|
| Kelder | Lijst, zoeken, filter op type, sorteren, A–Z-springbalk, uitklapbare kaarten |
| Toevoegen | Formulier + duplicaatdetectie op naam(+jaar) |
| Tijdlijn | Drinkvensters gesorteerd op urgentie |
| Dagboek | Log per gedronken fles: met wie, gelegenheid, notitie |
| Meldingen | Wijnen die aandacht vragen (`bdg()`-logica) |
| Inzichten | Verdeling per type/regio/druif, gem. beoordeling, totale waarde |
| Verlanglijst | Wensen + "gekocht → naar kelder" |
| Advies | Regelgebaseerde food pairing + stap-voor-stap sommelier |
| Export | CSV, Excel, "PDF", JSON-back-up, alleen-lezen HTML, QR |

**Datamodel nu:** drie arrays (`wines`, `dlog`, `wishlist`) in één blob `wijnkelder-data`.
Wijnvelden: `id, naam, type, regio, druif, prod, jaar, aantal, prijs, loc, van, tm, sterren, note, herkomst`.

**Concrete gebreken om mee te nemen** (geverifieerd in de code):

1. **ID-botsingen** — `id: Date.now()` in `saveWine` (regel 3485), `addWishlistItem` (2904) en
   `handleImport` (`Date.now() + i`, 3772). Twee items in dezelfde milliseconde krijgen hetzelfde id;
   over twee apparaten is uniciteit helemaal niet gegarandeerd. Dit moet vóór de migratie stoppen.
2. **Stored XSS** — `renderWineCard` (2654) zet `w.naam`, `w.note`, `w.regio` ongefilterd in
   `innerHTML`; idem `renderStructuredNote`, `buildWineChips`, `exportPDF`, `exportReadOnlyHTML`.
   Nu laag risico, maar met open registratie én geïmporteerde JSON van derden wordt dit een echt lek.
3. **Import vervangt alles** — `handleImport` (3745) gooit bij een `{wines:…}`-bestand de hele kelder
   weg. Eén verkeerd bestand = alles kwijt, geen undo.
4. **"PDF-export" is geen PDF** — `exportPDF` (3601) downloadt HTML met het verzoek zelf Ctrl+P te doen.
5. **Fragiele clouddetectie** — `Store.get` (2352) leidt uit de tekst `/internal server error/i` af of
   een sleutel simpelweg nog niet bestaat. Breekt zodra die foutmelding verandert.
6. **Types als tekst** — `prijs`, `jaar`, `van`, `tm` zijn strings; overal `parseFloat`/`+`-casts.

---

## Fase 0 — Repo op orde (½ dag)

De repo `bas-de-g/wijnkelder` bevat nu alleen een README.

- `legacy/wijnkelder-original.html` — Dennis' bestand ongewijzigd vastleggen als baseline/referentie.
- `docs/plan.md` — dit plan, zodat Dennis meeleest.
- `README.md` — wat het is, hoe je het lokaal draait.
- Node/TypeScript-scaffold, ESLint + Prettier, Vitest, Playwright.

---

## Fase 1 — Het huidige bestand hardmaken (1 dag)

Dit is Dennis' productie-app met echte data erin; die moet blijven werken terwijl we bouwen, en
moet stoppen met het genereren van botsende id's vóórdat we importeren.

Wijzigingen in `legacy/wijnkelder-original.html` (klein en chirurgisch, geen herstructurering):

- `esc()`-helper toevoegen en toepassen op elke gebruikersstring in de zes `innerHTML`-plekken
  hierboven. Fixt gebrek 2.
- `Date.now()` → `crypto.randomUUID()` op de drie id-plekken. Bestaande numerieke id's blijven
  gewoon geldig (alles vergelijkt met `===` op de waarde). Fixt gebrek 1.
- `handleImport`: standaard **samenvoegen** in plaats van vervangen, met een telling vooraf
  ("12 nieuw, 3 bijgewerkt, 41 ongewijzigd — doorgaan?") en een automatische back-up naar
  IndexedDB vlak vóór het schrijven. Fixt gebrek 3.
- Exportformaat versioneren: `{"version": 2, "wines": [...], ...}`. De importer accepteert v1 en v2.

Dennis kan hierna gewoon doorwerken; zijn back-up is voortaan importeerbaar in de nieuwe app.

---

## Fase 2 — De gehoste app (kern, ~1 week)

### Stack

- **Next.js (App Router) + TypeScript** op **Vercel**
- **Supabase**: Postgres + Auth + Storage + Row Level Security
- **Tailwind** met Dennis' bestaande designtokens (`--wine: #9F1240`, Fraunces/Inter/Space Grotesk)
  overgenomen uit de `:root`-blokken van het origineel — de app moet er hetzelfde uitzien.

### Databaseschema (`supabase/migrations/0001_init.sql`)

```
profiles     id (=auth.users), display_name, locale, theme, is_18_plus, created_at
cellars      id, owner_id → profiles, name, created_at
wines        id, cellar_id, legacy_id, naam, type, regio, druif, producent,
             jaar int, aantal int, prijs numeric(10,2), locatie, herkomst,
             drink_from int, drink_to int, sterren int, note,
             created_at, updated_at, deleted_at
drink_log    id, cellar_id, wine_id → wines (ON DELETE SET NULL),
             naam_snapshot, type, jaar, producent, sterren,
             met_wie, gelegenheid, note, gedronken_op, created_at
wishlist     id, cellar_id, naam, type, regio, druif, producent,
             richtprijs numeric(10,2), note, created_at
shares       id, cellar_id, token unique, expires_at, revoked_at, created_at
```

Wat dit oplost t.o.v. nu:

- **UUID-primary keys** — einde id-botsingen.
- **Echte types** — `numeric` voor prijs, `int` voor jaartallen (gebrek 6).
- **`legacy_id`** — houdt de oude `Date.now()`-id's bij, zodat herhaald importeren idempotent is.
  Dennis kan de oude app blijven gebruiken en meermaals importeren zonder duplicaten.
- **`deleted_at`** — zachte verwijdering, dus "wijn verwijderen" is terug te draaien.
- **`updated_at`** — basis voor conflictafhandeling in plaats van blind overschrijven.
- **`naam_snapshot` in drink_log** — het origineel doet dit al goed (regel 3341); behouden, zodat je
  dagboek intact blijft als de wijn zelf verdwijnt.
- **`cellars` als aparte tabel** — vandaag één per gebruiker, maar dit is de enige plek waar een
  gedeelde huishoudkelder later nog inpasbaar is zonder migratiepijn.

### Autorisatie

RLS aan op elke tabel. Eén patroon, overal:

```sql
using (cellar_id in (select id from cellars where owner_id = auth.uid()))
```

`shares` krijgt daarnaast een `security definer`-functie die op token een alleen-lezen projectie
teruggeeft (zonder prijzen), zodat een deel-link werkt zonder ingelogd te zijn.

**Auth-methoden:** e-mail magic link + Google + Sign in with Apple. Apple is nu nog niet nodig,
maar richtlijn 4.8 eist 'm zodra je met Google login én in de App Store wilt — hem meteen
aanzetten scheelt later een migratie van bestaande accounts.

### Migratiepad

`/import` accepteert het bestaande `wijnkelder-backup.json` (v1 én v2), toont een diff
("12 nieuw, 3 bijgewerkt"), en schrijft pas na bevestiging. Mapping oud → nieuw:
`prod → producent`, `loc → locatie`, `van → drink_from`, `tm → drink_to`, `prijs`/`jaar` gecast.

### Wat ongewijzigd overgaat

De sommelier-logica is goed en werkt offline zonder API. `TYPE_HINTS`, `NL_STOPWORDS`,
`tokenize`, `containsWord`, `scoreWine`, `getWijnAdvies` (regels 3345–3457) verhuizen vrijwel
letterlijk naar `lib/sommelier.ts`, mét unit tests op de bestaande voorbeelden. Idem `bdg()` en
`prog()` (2552–2570) → `lib/drinkwindow.ts`.

---

## Fase 3 — Verbeteringen die alleen mét server kunnen (~1 week)

Op volgorde van waarde:

1. **Live deel-link** vervangt `exportReadOnlyHTML` + QR. Een echte URL (`/s/<token>`) die altijd
   actueel is, in te trekken, optioneel met vervaldatum. De QR-code wijst nu naar die link in plaats
   van naar een tekstblob die stukloopt bij een grote kelder (regel 3721).
2. **Etiketfoto's** via Supabase Storage — de grootste ontbrekende feature in een kelder-app.
   Upload vanaf de telefoon, thumbnail op de kaart.
3. **Drinkvenster-herinneringen** die ook aankomen als je de app *niet* opent: geplande Supabase-functie
   + Web Push / e-mail. Nu draait `renderAlerts()` alleen bij openen.
4. **Echte PDF-export** via een server-route met een PDF-renderer (fixt gebrek 4).
5. **Export/import blijft** zoals gekozen: de handmatige Claude-route verandert niet, alleen netter —
   versioneerd formaat, samenvoegen met diff-preview, en `instructies-voor-claude.md` als
   downloadbare pagina in de app zodat je 'm niet kwijtraakt.

---

## Fase 4 — PWA (2–3 dagen)

- `manifest.webmanifest`, icon-set, splash screens, `theme-color: #9F1240` (staat al goed).
- Service worker (`next-pwa`/Workbox): app-shell offline, kelder leesbaar zonder netwerk.
- Schrijfacties offline in een wachtrij (IndexedDB) → background sync bij herstel.
- De bestaande "zet op beginscherm"-banner (regel 631) vervangen door de echte
  `beforeinstallprompt`-flow.

Hierna is het voor dagelijks gebruik niet meer van een app te onderscheiden — icoon op het
beginscherm, offline, geen browserbalk, en €0 aan store-kosten.

---

## Fase 5 — App Store: kan het? (analyse, nu niet bouwen)

**Kort: ja, maar niet als je de website simpelweg inpakt.**

- **Richtlijn 4.2 (minimum functionality).** Een WebView-schil zonder native functionaliteit wordt in
  2026 vrijwel zeker afgewezen; het is al jaren de meest voorkomende afwijzingsreden. Apple kijkt
  expliciet naar wat er *buiten* de WebView gebeurt.
- **De route die wél werkt:** Capacitor-schil plus echt-native functies. Voor deze app liggen die voor
  het oprapen: camera/barcode-scan om een fles toe te voegen, native push voor drinkvenster-alerts,
  offline-first lokale database, Face ID-vergrendeling van de kelder, en een widget "nu drinken" op
  het beginscherm.
- **Kosten:** Apple Developer €99/jaar, Google Play $25 eenmalig.
- **De echte vertrager is Google, niet Apple.** Persoonlijke Play Console-accounts aangemaakt na
  13 nov 2023 moeten eerst een closed test draaien met **12 testers, 14 aaneengesloten dagen**, en
  sinds 2026 controleert Google ook of die testers de app daadwerkelijk gebruikt hebben. Zakelijke
  accounts zijn vrijgesteld. Hier moet je maanden vooruit mee beginnen.
- **Leeftijdsclassificatie.** Apple heeft de tiers in 2025 herzien naar 4+/9+/13+/16+/18+.
  "Verwijzingen naar alcohol" incidenteel = 13+, frequent = 18+. Een kelder-app is per definitie
  frequent, dus reken op een hoge classificatie — exact bepalen via de vragenlijst bij indiening.
- **Verplicht bij open registratie:** account verwijderen ín de app (richtlijn 5.1.1(v), al sinds
  juni 2022), privacybeleid-URL, en App Privacy-labels. Sign in with Apple zodra Google-login aanstaat
  (4.8).

**Advies:** de PWA uit fase 4 levert ~90% van de beleving voor €0 en zonder reviewwachtrij. Doe de
store pas als je de camera-scan, push en widget echt wilt — dan is er ook een inhoudelijk verhaal
richting richtlijn 4.2, en de bouw uit fase 2–4 is dan al herbruikbaar.

---

## Gevolgen van open registratie

Dit is de keuze met de meeste juridische bijwerkingen, dus expliciet:

- **Privacybeleid + voorwaarden** — verplicht voor beide stores en onder de AVG.
- **Account verwijderen + data-export in de app** — AVG art. 15 en 17. De export bestaat al; de
  verwijderknop moet erbij.
- **Leeftijdscheck bij registratie** (18+ bevestiging) — passend bij alcohol en helpt het
  store-verhaal later.
- **Rate limiting** op auth-endpoints en uploads; maximum bestandsgrootte op etiketfoto's.
- **Kosten bij groei:** Supabase en Vercel hebben ruime gratis tiers, genoeg voor de eerste honderden
  gebruikers. Let op: Vercel Hobby is alleen voor niet-commercieel gebruik — zodra er geld omgaat is
  Pro nodig. Reken op ~€15/jaar (domein) om te beginnen; controleer de actuele limieten bij livegang.

---

## Verificatie

Per fase, end-to-end:

**Fase 1** — Open `legacy/wijnkelder-original.html` in een browser. Voeg een wijn toe met de naam
`<img src=x onerror=alert(1)>` → moet als letterlijke tekst verschijnen, geen dialoog. Voeg twee
wijnen snel achter elkaar toe → twee verschillende id's in de JSON-export. Importeer een back-up over
een gevulde kelder → telling vooraf klopt en niets is verdwenen.

**Fase 2** — `npm run dev`; registreer twee accounts. Probeer met account B via de anon-key een rij
van account A te lezen → moet leeg terugkomen (RLS-bewijs). Importeer Dennis' echte back-up en
vergelijk aantallen wijnen/log/verlanglijst met het origineel. Importeer hetzelfde bestand nog eens →
nul duplicaten (dat test `legacy_id`). `npm run test` voor de sommelier-tests: dezelfde invoer moet
dezelfde aanbeveling geven als het origineel.

**Fase 3** — Open een deel-link in een privévenster (uitgelogd zichtbaar, geen prijzen), trek 'm in,
herlaad → 404. Upload een etiketfoto en controleer dat die niet leesbaar is vanaf een ander account.

**Fase 4** — Lighthouse PWA-audit ≥ 90 en "installable". Zet vliegtuigmodus aan → kelder blijft
leesbaar; voeg offline een wijn toe → verschijnt na herstel in de database.

**Doorlopend** — Playwright-scenario: registreren → wijn toevoegen → fles drinken → dagboekregel
controleren → JSON exporteren → opnieuw importeren → aantallen gelijk.

---

## Volgorde en inschatting

| Fase | Inhoud | Duur |
|---|---|---|
| 0 | Repo, scaffold, baseline vastleggen | ½ dag |
| 1 | Huidig bestand hardmaken (XSS, id's, import) | 1 dag |
| 2 | Next.js + Supabase, schema, auth, migratie, alle tabs | ~1 week |
| 3 | Deel-links, etiketfoto's, push-herinneringen, echte PDF | ~1 week |
| 4 | PWA: manifest, service worker, offline | 2–3 dagen |
| 5 | App Store — alleen als je 'm echt wilt | apart traject |

Na fase 2 is het live en bruikbaar. Fase 3 en 4 zijn los uitrolbaar.
