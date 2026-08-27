// Woordenlijsten voor het wijnadvies, letterlijk overgenomen uit de legacy-app
// (legacy/wijnkelder.html) zodat dezelfde vraag dezelfde fles blijft opleveren.
// Niet met de hand bijwerken zonder de tests in tests/sommelier.test.ts te draaien.

export const NL_STOPWORDS = new Set([
  "de", "het", "een", "en", "of", "met", "van", "voor", "bij", "in", "op", "te", "ik", "ga",
  "we", "gaan", "vanavond", "vandaag", "morgen", "eten", "wat", "dit", "die", "dat", "er",
  "is", "zijn", "maak", "maken", "wil", "graag", "wij", "ons", "onze",
]);

// Woorden die naar een wijntype wijzen. De sommelier matcht deze losjes: een hint
// telt ook als hij ín een samengesteld woord zit ("wildgerechten" → "wild").
export const TYPE_HINTS: Record<string, string[]> = {
  "Wit": [
    "vis", "zeevrucht", "garnaal", "oester", "sushi", "schaaldier", "ceviche", "witvis",
    "zalm", "kabeljauw", "tong", "forel", "snoekbaars", "mossel", "inktvis", "krab",
    "kreeft", "sashimi", "kip", "gevogelte", "kalkoen", "room", "romig", "roomsaus",
    "botersaus", "citroensaus", "beurre", "hollandaise", "gestoomd", "gepocheerd", "citroen",
    "limoen", "dille", "bieslook", "peterselie", "venkel", "geit", "geitenkaas", "salade",
    "asperge", "kaas",
  ],
  "Rood": [
    "vlees", "rund", "lam", "wild", "stoof", "stoofpot", "gebraden", "bbq", "barbecue",
    "biefstuk", "worst", "gehakt", "eend", "ossenhaas", "entrecote", "ribeye", "spek",
    "gerookt", "gegrild", "jus", "pepersaus", "tomatensaus", "ragu", "bolognese", "truffel",
    "paddenstoel", "champignon", "risotto", "pasta", "tomaat", "kruidnagel", "rozemarijn",
    "tijm", "laurier", "peper", "romantisch", "date", "diner", "kaas", "belegen",
  ],
  "Rosé": [
    "salade", "zomers", "barbecue", "tapas", "lichte", "vis", "geit", "geitenkaas",
    "couscous", "falafel", "hummus", "pittig", "kruidig",
  ],
  "Mousserend": [
    "aperitief", "borrel", "feest", "oester", "sushi", "friet", "chips", "verjaardag",
    "jubileum", "vieren", "viering", "proost", "gefrituurd", "frituur", "zilte", "zout",
    "gember", "zoetzuur", "pittig", "curry", "wok",
  ],
};

// Gelegenheden waarbij een betere fles op zijn plaats is.
export const SPECIAL_WORDS = new Set([
  "verjaardag", "jubileum", "speciale", "vieren", "viering",
]);

// Terugval als een wijn geen eigen "lekker bij"-notitie heeft.
export const GENERIC_PAIRINGS: Record<string, string> = {
  "Rood": "rood vlees, stoofschotels, oude kaas, wild",
  "Wit": "vis, schaaldieren, romige gerechten, salades",
  "Rosé": "lichte zomerse gerechten, tapas, barbecue",
  "Mousserend": "aperitief, oesters, sushi, feestelijke momenten",
  "Overig": "uiteenlopende gerechten — proef en ontdek",
};

export const UNUSUAL_GRAPES = [
  "nascetta", "lagrein", "mondeuse", "altesse", "roussette", "sagrantino", "vernaccia",
  "garnatxa roja", "primitivo", "nebbiolo", "pinot blanc", "spätburgunder", "alvarelhão",
  "caiño",
];
