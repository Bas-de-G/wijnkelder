# Opzetten

De gehoste app draait op Next.js met Supabase voor database en accounts.
Twee dingen moeten éénmalig in Supabase gebeuren; de rest is `npm install`.

## 1. Het schema aanmaken

Open in Supabase **SQL Editor → New query**, plak de inhoud van
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) en draai hem.

Dat maakt de tabellen, zet Row Level Security aan op alles, en installeert een trigger die bij
elke registratie automatisch een profiel en een lege kelder aanmaakt.

Liever vanaf de commandline? Met het databasewachtwoord uit **Project Settings → Database**:

```
psql "postgresql://postgres:WACHTWOORD@db.<project>.supabase.co:5432/postgres" \
  -f supabase/migrations/0001_init.sql
```

Controleer daarna onder **Table Editor** dat `wines`, `cellars`, `drink_log`, `wishlist` en
`shares` bestaan en dat er bij elk een schildje "RLS enabled" staat.

## 2. De inloglinks laten werken

Onder **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` voor lokaal, later je echte domein.
- **Redirect URLs**: voeg `http://localhost:3000/auth/bevestigen` toe, en dezelfde URL op je
  productiedomein.

Zonder die tweede stap komt de link in de inlogmail uit op een foutmelding.

Inloggen met Google of Apple staat standaard uit. Zet het aan onder **Authentication →
Providers** als je dat wilt; de app pikt het dan op zonder codewijziging. Let op: bied je Google
aan én wil je later de App Store in, dan eist Apple dat Sign in with Apple er ook is.

## 3. Lokaal draaien

```
npm install
cp .env.example .env.local     # vul je project-URL en publishable key in
npm run dev
```

De twee `NEXT_PUBLIC_`-waarden komen in de browser terecht en zijn bedoeld om publiek te zijn —
Row Level Security doet het echte werk. Het databasewachtwoord hoort hier niet en gebruikt de app
ook niet.

## 4. Controleren dat het werkt

```
npm test              # 122 tests: de sommelier vergeleken met het origineel, plus de import
npm run test:legacy   # opent de oude app in Chromium en controleert 33 punten
npm run build
```

Daarna in de browser:

1. Ga naar `/inloggen` en vraag een link aan. Je krijgt een mail; klik hem aan.
2. Voeg een wijn toe. Hij verschijnt in het register.
3. Ga naar `/importeren` en upload een back-up uit de oude app. Je ziet eerst een telling van wat
   er verandert.
4. Importeer hetzelfde bestand nog eens — er mogen geen duplicaten bijkomen.

**Controle op afscherming:** maak een tweede account aan en probeer de wijnen van het eerste op te
halen. Dat hoort een lege lijst te geven, niet een foutmelding. Dat is het bewijs dat RLS staat.

## Tijdens ontwikkelen

`/ontwerp` toont het register met voorbeelddata, zodat je aan het ontwerp kunt werken zonder eerst
een kelder te vullen. Die route bestaat alleen lokaal en geeft in productie een 404.

---

# Online zetten

## Waarom niet GitHub Pages

GitHub Pages serveert alleen statische bestanden. Deze app heeft een server nodig: de kelder
wordt op de server opgehaald met jouw sessie, opslaan gaat via server actions, en er draait
middleware die de sessie ververst en pagina's afschermt. Op Pages werkt daarvan niets — je zou
een lege huls krijgen.

Nodig is dus een host die Node draait. Vercel is de natuurlijke keuze (Next.js komt daar
vandaan en de gratis tier volstaat ruim), maar Netlify, Cloudflare Workers of een eigen VPS
kunnen het ook.

## Vercel, stap voor stap

**1. Zorg dat de app op de productiebranch staat.** Vercel bouwt standaard de default branch van
de repo. Staat de app nog in een pull request, merge die dan eerst — anders deployt Vercel een
repo zonder app.

**2. Importeer de repo** via [vercel.com/new](https://vercel.com/new). Next.js wordt
automatisch herkend; build command en output directory hoef je niet aan te passen.

**3. Zet twee omgevingsvariabelen** tijdens de import (of later onder Settings → Environment
Variables):

| Naam | Waarde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | je project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | je publishable key |

Zet ze voor alle drie de omgevingen (Production, Preview, Development).

`NEXT_PUBLIC_SITE_URL` laat je weg. De app gebruikt dan het adres waarop hij draait, waardoor
preview-deploys ook werken; met een vaste waarde zouden inloglinks vanuit een preview je naar
productie sturen.

**4. Voeg het Vercel-adres toe in Supabase**, onder Authentication → URL Configuration:

- **Site URL**: `https://<jouw-project>.vercel.app`
- **Redirect URLs**: `https://<jouw-project>.vercel.app/auth/bevestigen`

Wil je dat preview-deploys ook werken, voeg dan een regel met een wildcard toe —
`https://<jouw-project>-*.vercel.app/**`. Controleer in het dashboard of hij geaccepteerd wordt;
Supabase is streng op de vorm.

Zonder deze stap komt de link uit de inlogmail op een foutmelding uit. Dat is de meest
voorkomende reden dat een verse deploy "niet werkt".

**5. Controleer het.** Open het Vercel-adres, vraag een inloglink aan, klik hem in je mail. Je
hoort in een lege kelder te belanden. Ga daarna naar Importeren en neem je back-up over.

## Eigen domein

Voeg het toe onder Settings → Domains in Vercel, en herhaal stap 4 met het nieuwe adres — anders
blijven inloglinks naar het vercel.app-adres wijzen.

## Let op de voorwaarden

Vercel's gratis Hobby-plan is alleen voor niet-commercieel gebruik. Zolang dit een app voor
jezelf en vrienden is, zit je goed. Ga je er geld mee verdienen, dan is het betaalde plan nodig.
