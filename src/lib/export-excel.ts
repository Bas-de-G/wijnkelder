import ExcelJS from 'exceljs';
import { EXPORT_HEADERS, EXPORT_WIDTHS, exportRows } from './export';
import type { Wine } from './types';

/** Bouwt het .xlsx-bestand op de server, zodat de bibliotheek niet naar de browser hoeft. */
export async function buildWorkbook(wines: Wine[]): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wijnkelder';
  wb.created = new Date();

  const ws = wb.addWorksheet('Wijnkelder', {
    views: [{ state: 'frozen', ySplit: 1 }], // kopregel blijft staan bij scrollen
  });

  ws.addRow(EXPORT_HEADERS as unknown as string[]);
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };

  for (const rij of exportRows(wines)) ws.addRow(rij);

  ws.columns.forEach((kolom, i) => {
    kolom.width = EXPORT_WIDTHS[i];
  });

  // Notities zijn lang; laten aflopen is prettiger dan afkappen.
  ws.getColumn(EXPORT_HEADERS.length).alignment = { wrapText: true, vertical: 'top' };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_HEADERS.length } };

  // ExcelJS heeft een eigen Buffer-type; omzetten naar Uint8Array houdt de
  // route onafhankelijk van die bibliotheek.
  return new Uint8Array(await wb.xlsx.writeBuffer());
}
