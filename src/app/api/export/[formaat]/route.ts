import { NextResponse, type NextRequest } from 'next/server';
import { getCellarWithWines } from '@/lib/cellar';
import { toCSV, exportFilename } from '@/lib/export';
import { buildWorkbook } from '@/lib/export-excel';
import { buildPdf } from '@/lib/export-pdf';
import { createClient } from '@/lib/supabase/server';

const FORMATEN = ['csv', 'xlsx', 'pdf', 'json'] as const;
type Formaat = (typeof FORMATEN)[number];

function bestand(body: BodyInit, type: string, naam: string) {
  return new NextResponse(body, {
    headers: {
      'Content-Type': type,
      'Content-Disposition': `attachment; filename="${naam}"`,
      // Een export is een momentopname; nooit uit de cache serveren.
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ formaat: string }> }
) {
  const { formaat } = await params;
  if (!FORMATEN.includes(formaat as Formaat)) {
    return NextResponse.json({ fout: 'Onbekend formaat.' }, { status: 404 });
  }

  const data = await getCellarWithWines();
  if (!data) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 });
  const { cellar, wines } = data;

  if (formaat === 'csv') {
    return bestand(toCSV(wines), 'text/csv; charset=utf-8', exportFilename('csv'));
  }

  if (formaat === 'xlsx') {
    const buffer = await buildWorkbook(wines);
    return bestand(
      buffer as unknown as BodyInit,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      exportFilename('xlsx')
    );
  }

  if (formaat === 'pdf') {
    const bytes = await buildPdf(wines);
    return bestand(bytes as unknown as BodyInit, 'application/pdf', exportFilename('pdf'));
  }

  // Volledige back-up: ook dagboek en verlanglijst, in het formaat dat de
  // importfunctie van de oude app leest.
  const supabase = await createClient();
  const [{ data: log }, { data: wishlist }] = await Promise.all([
    supabase.from('drink_log').select('*').eq('cellar_id', cellar.id),
    supabase.from('wishlist').select('*').eq('cellar_id', cellar.id),
  ]);

  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    wines: wines.map((w) => ({
      id: w.legacy_id ?? w.id,
      naam: w.naam, type: w.type, regio: w.regio ?? '', druif: w.druif ?? '',
      prod: w.producent ?? '', jaar: w.jaar ?? '', aantal: w.aantal,
      prijs: w.prijs ?? '', loc: w.locatie ?? '', van: w.drink_from ?? '',
      tm: w.drink_to ?? '', sterren: w.sterren, note: w.note ?? '',
      herkomst: w.herkomst ?? '',
    })),
    log: (log ?? []).map((e) => ({
      id: e.legacy_id ?? e.id, wid: e.wine_id, naam: e.naam_snapshot, type: e.type,
      jaar: e.jaar ?? '', prod: e.producent ?? '', sterren: e.sterren ?? 0,
      wie: e.met_wie ?? '', gel: e.gelegenheid ?? '', note: e.note ?? '',
      ts: new Date(e.gedronken_op).getTime(),
    })),
    wishlist: (wishlist ?? []).map((x) => ({
      id: x.legacy_id ?? x.id, naam: x.naam, type: x.type, regio: x.regio ?? '',
      druif: x.druif ?? '', prod: x.producent ?? '', prijs: x.richtprijs ?? '',
      note: x.note ?? '',
    })),
  };

  return bestand(
    JSON.stringify(payload, null, 2),
    'application/json; charset=utf-8',
    exportFilename('json')
  );
}
