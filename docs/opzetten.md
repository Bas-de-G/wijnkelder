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
