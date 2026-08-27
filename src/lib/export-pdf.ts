import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { drinkBadge, currentYear } from './drinkwindow';
import type { Wine } from './types';

// De PDF is een leesbaar overzicht om af te drukken, geen volledige data-export;
// daarvoor zijn CSV en Excel. Vandaar een selectie van kolommen die op één
// liggende A4 past.
interface Kolom {
  kop: string;
  breedte: number;
  waarde: (w: Wine, jaar: number) => string;
  rechts?: boolean;
}

const KOLOMMEN: Kolom[] = [
  { kop: 'Naam',        breedte: 168, waarde: (w) => w.naam },
  { kop: 'Type',        breedte: 62,  waarde: (w) => w.type },
  { kop: 'Regio',       breedte: 92,  waarde: (w) => w.regio ?? '' },
  { kop: 'Druif',       breedte: 108, waarde: (w) => w.druif ?? '' },
  { kop: 'Jaar',        breedte: 40,  waarde: (w) => (w.jaar ? String(w.jaar) : ''), rechts: true },
  { kop: 'Fl.',         breedte: 30,  waarde: (w) => String(w.aantal), rechts: true },
  { kop: 'Prijs',       breedte: 52,  waarde: (w) => (w.prijs != null ? w.prijs.toFixed(2) : ''), rechts: true },
  { kop: 'Drinkvenster', breedte: 86, waarde: (w) =>
      w.drink_from || w.drink_to ? `${w.drink_from ?? '?'}–${w.drink_to ?? '?'}` : '' },
  { kop: 'Status',      breedte: 92,  waarde: (w, jaar) => drinkBadge(w, jaar).label },
];

const MARGE = 32;
const REGEL = 15;
const KOP_HOOGTE = 74;

/**
 * De ingebouwde lettertypen van PDF kennen alleen WinAnsi. Een teken daarbuiten
 * — een liggend streepje uit een tekstverwerker, een ster, een Chinees karakter —
 * laat pdf-lib de hele generatie afbreken. Daarom hier vervangen in plaats van
 * laten klappen.
 */
const VERVANG: Record<string, string> = {
  '–': '-', '—': '-', '‘': "'", '’': "'",
  '“': '"', '”': '"', '…': '...', ' ': ' ',
  '•': '-', '★': '*', '☆': '*',
};

export function winAnsi(tekst: string): string {
  let uit = '';
  for (const teken of tekst.normalize('NFC')) {
    if (VERVANG[teken] !== undefined) { uit += VERVANG[teken]; continue; }
    const code = teken.codePointAt(0)!;
    uit += code >= 32 && code <= 255 ? teken : '?';
  }
  return uit;
}

/** Kapt af op de beschikbare breedte, met een beletselteken als er iets wegvalt. */
function pas(tekst: string, font: PDFFont, grootte: number, breedte: number): string {
  const schoon = winAnsi(tekst);
  if (font.widthOfTextAtSize(schoon, grootte) <= breedte) return schoon;
  let kort = schoon;
  while (kort.length > 1 && font.widthOfTextAtSize(kort + '...', grootte) > breedte) {
    kort = kort.slice(0, -1);
  }
  return kort + '...';
}

const INKT = rgb(0.1, 0.08, 0.09);
const GRIJS = rgb(0.45, 0.42, 0.43);
const OXBLOED = rgb(0.56, 0.06, 0.22);
const LIJN = rgb(0.84, 0.82, 0.79);

export async function buildPdf(wines: Wine[], datum = new Date()): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Wijnkelder');
  doc.setCreator('Wijnkelder');

  const gewoon = await doc.embedFont(StandardFonts.Helvetica);
  const vet = await doc.embedFont(StandardFonts.HelveticaBold);

  const breedte = 842, hoogte = 595; // A4 liggend
  const flessen = wines.reduce((t, w) => t + (w.aantal || 0), 0);
  const jaar = currentYear();
  const gesorteerd = [...wines].sort((a, b) =>
    a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' })
  );

  let pagina: PDFPage | null = null;
  let y = 0;
  let paginaNr = 0;

  const nieuwePagina = () => {
    pagina = doc.addPage([breedte, hoogte]);
    paginaNr++;
    y = hoogte - MARGE;

    if (paginaNr === 1) {
      pagina.drawText('Wijnkelder', { x: MARGE, y: y - 20, size: 22, font: vet, color: OXBLOED });
      const sub = `${winAnsi(datum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }))}  |  ${wines.length} wijnen  |  ${flessen} flessen`;
      pagina.drawText(sub, { x: MARGE, y: y - 38, size: 9, font: gewoon, color: GRIJS });
      y -= KOP_HOOGTE;
    } else {
      y -= 12;
    }

    let x = MARGE;
    for (const k of KOLOMMEN) {
      pagina.drawText(k.kop.toUpperCase(), { x, y, size: 7, font: vet, color: GRIJS });
      x += k.breedte;
    }
    y -= 6;
    pagina.drawLine({
      start: { x: MARGE, y }, end: { x: breedte - MARGE, y },
      thickness: 0.8, color: INKT,
    });
    y -= REGEL;
  };

  nieuwePagina();

  for (const w of gesorteerd) {
    if (y < MARGE + REGEL) nieuwePagina();

    let x = MARGE;
    for (const k of KOLOMMEN) {
      const tekst = pas(k.waarde(w, jaar), gewoon, 8.5, k.breedte - 6);
      const dx = k.rechts ? k.breedte - 6 - gewoon.widthOfTextAtSize(tekst, 8.5) : 0;
      pagina!.drawText(tekst, { x: x + dx, y, size: 8.5, font: gewoon, color: INKT });
      x += k.breedte;
    }

    y -= 5;
    pagina!.drawLine({
      start: { x: MARGE, y }, end: { x: breedte - MARGE, y },
      thickness: 0.3, color: LIJN,
    });
    y -= REGEL - 5;
  }

  // Paginanummers pas achteraf: het totaal is nu bekend.
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const label = `${i + 1} / ${paginas.length}`;
    p.drawText(label, {
      x: breedte - MARGE - gewoon.widthOfTextAtSize(label, 8),
      y: MARGE - 14, size: 8, font: gewoon, color: GRIJS,
    });
  });

  return doc.save();
}
