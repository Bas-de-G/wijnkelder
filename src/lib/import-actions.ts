'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { gebruikerId } from './auth';
import { readBackup, planImport, changedFields, forInsert, type BackupSoort } from './import';

export interface ImportPreview {
  error?: string;
  soort?: BackupSoort;
  nieuw?: number;
  bijgewerkt?: number;
  ongewijzigd?: number;
  logRegels?: number;
  wensen?: number;
  /** Namen uit een aanvulling die nergens bij pasten. */
  onbekend?: string[];
  /** Voorbeeld van wat er verandert, voor in het overzicht. */
  voorbeeld?: Array<{ naam: string; velden: string[] }>;
  payload?: string;
}

async function cellarId() {
  const supabase = await createClient();
  const uid = await gebruikerId(supabase);
  if (!uid) redirect('/inloggen');
  const { data } = await supabase
    .from('cellars').select('id').eq('owner_id', uid)
    .order('created_at').limit(1).maybeSingle();
  if (!data) throw new Error('Geen kelder gevonden voor dit account.');
  return { supabase, id: data.id as string };
}

/** Leest het bestand en laat zien wat er zou gebeuren — schrijft nog niets. */
export async function previewImport(_prev: ImportPreview, form: FormData): Promise<ImportPreview> {
  const raw = form.get('payload');
  if (typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Kies eerst een back-upbestand.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'Dit bestand is geen geldige JSON. Klopt het dat dit een back-up uit de app is?' };
  }

  const backup = readBackup(parsed);
  if (!backup) {
    return {
      error: 'Dit bestand heeft geen herkenbare vorm. Verwacht wordt een back-up met een ' +
        '"wines"-lijst, of een aanvulling met "update_wines" of "add_wines".',
    };
  }
  if (!backup.wines.length) {
    return { error: 'Er staan geen wijnen in dit bestand.' };
  }

  const { supabase, id } = await cellarId();
  const { data: existing } = await supabase
    .from('wines')
    .select('id, legacy_id, naam, jaar, type, regio, druif, producent, herkomst, locatie, aantal, prijs, drink_from, drink_to, sterren, note')
    .eq('cellar_id', id)
    .is('deleted_at', null);

  const rows = existing ?? [];
  const plan = planImport(backup.wines, rows, backup.soort);

  const current = new Map(rows.map((r) => [r.id, r]));
  const echtGewijzigd = plan.bijgewerkt
    .map(({ id: wid, patch }) => {
      const bestaand = current.get(wid);
      return {
        // Een aanvulling noemt vaak geen naam; toon dan die uit de kelder,
        // want daar herkent de gebruiker de wijn aan.
        naam: patch.naam ?? bestaand?.naam ?? 'Onbekende wijn',
        velden: changedFields(patch, bestaand ?? {}),
      };
    })
    .filter((x) => x.velden.length > 0);

  return {
    soort: backup.soort,
    nieuw: plan.nieuw.length,
    bijgewerkt: echtGewijzigd.length,
    ongewijzigd: plan.bijgewerkt.length - echtGewijzigd.length,
    logRegels: backup.log.length,
    wensen: backup.wishlist.length,
    onbekend: plan.onbekend,
    voorbeeld: echtGewijzigd.slice(0, 6),
    payload: raw,
  };
}

export interface ImportResult {
  error?: string;
  klaar?: boolean;
  toegevoegd?: number;
  bijgewerkt?: number;
}

/** Voert de import uit: toevoegen wat nieuw is, aanvullen wat verschilt. */
export async function runImport(_prev: ImportResult, form: FormData): Promise<ImportResult> {
  const raw = form.get('payload');
  if (typeof raw !== 'string') return { error: 'De back-up is onderweg kwijtgeraakt. Kies het bestand opnieuw.' };

  const backup = readBackup(JSON.parse(raw));
  if (!backup?.wines.length) return { error: 'Er staan geen wijnen in dit bestand.' };

  const { supabase, id } = await cellarId();
  const { data: existing } = await supabase
    .from('wines').select('id, legacy_id, naam, jaar').eq('cellar_id', id).is('deleted_at', null);

  const plan = planImport(backup.wines, existing ?? [], backup.soort);

  if (plan.nieuw.length) {
    const rows = plan.nieuw.map((w) => ({ ...forInsert(w), cellar_id: id }));
    const { error } = await supabase.from('wines').insert(rows);
    if (error) return { error: `Toevoegen mislukte: ${error.message}` };
  }

  for (const { id: wid, patch } of plan.bijgewerkt) {
    // Lege velden in de back-up mogen bestaande gegevens niet wissen.
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== null && v !== '')
    );
    const { error } = await supabase.from('wines').update(clean).eq('id', wid);
    if (error) return { error: `Bijwerken mislukte: ${error.message}` };
  }

  // Dagboek en verlanglijst gaan mee, ontdubbeld op hun oude id.
  if (backup.log.length) {
    const rows = backup.log
      .filter((e) => e.naam)
      .map((e) => ({
        cellar_id: id,
        legacy_id: e.id != null ? String(e.id) : null,
        naam_snapshot: String(e.naam),
        type: e.type ?? null,
        jaar: e.jaar != null ? Number.parseInt(String(e.jaar), 10) || null : null,
        producent: e.prod ?? null,
        sterren: e.sterren != null ? Number(e.sterren) || null : null,
        met_wie: e.wie || null,
        gelegenheid: e.gel || null,
        note: e.note || null,
        gedronken_op: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString(),
      }));
    if (rows.length) {
      await supabase.from('drink_log').upsert(rows, { onConflict: 'cellar_id,legacy_id', ignoreDuplicates: true });
    }
  }

  if (backup.wishlist.length) {
    const rows = backup.wishlist
      .filter((w) => w.naam)
      .map((w) => ({
        cellar_id: id,
        legacy_id: w.id != null ? String(w.id) : null,
        naam: String(w.naam),
        type: w.type ?? 'Rood',
        regio: w.regio || null,
        druif: w.druif || null,
        producent: w.prod || null,
        richtprijs: w.prijs ? Number.parseFloat(String(w.prijs).replace(',', '.')) || null : null,
        note: w.note || null,
      }));
    if (rows.length) {
      await supabase.from('wishlist').upsert(rows, { onConflict: 'cellar_id,legacy_id', ignoreDuplicates: true });
    }
  }

  for (const pad of ['/', '/tijdlijn', '/inzichten', '/advies']) revalidatePath(pad);
  return { klaar: true, toegevoegd: plan.nieuw.length, bijgewerkt: plan.bijgewerkt.length };
}
