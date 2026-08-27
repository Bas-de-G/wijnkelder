'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { WINE_TYPES, type WineType } from './types';

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s === '' ? null : s;
}

function int(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function money(v: FormDataEntryValue | null): number | null {
  const s = str(v)?.replace(',', '.');
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function wineType(v: FormDataEntryValue | null): WineType {
  const s = str(v);
  return (WINE_TYPES as string[]).includes(s ?? '') ? (s as WineType) : 'Rood';
}

async function requireCellar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data: cellar } = await supabase
    .from('cellars')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (!cellar) throw new Error('Geen kelder gevonden voor dit account.');
  return { supabase, cellarId: cellar.id as string };
}

export interface FormResult {
  error?: string;
}

function fields(form: FormData) {
  const from = int(form.get('drink_from'));
  const to = int(form.get('drink_to'));
  return {
    naam: str(form.get('naam')),
    type: wineType(form.get('type')),
    regio: str(form.get('regio')),
    druif: str(form.get('druif')),
    producent: str(form.get('producent')),
    herkomst: str(form.get('herkomst')),
    locatie: str(form.get('locatie')),
    jaar: int(form.get('jaar')),
    aantal: Math.max(0, int(form.get('aantal')) ?? 1),
    prijs: money(form.get('prijs')),
    drink_from: from,
    drink_to: to,
    sterren: Math.min(5, Math.max(0, int(form.get('sterren')) ?? 0)),
    note: str(form.get('note')),
  };
}

function validate(f: ReturnType<typeof fields>): string | null {
  if (!f.naam) return 'Vul minimaal een naam in.';
  if (f.drink_from && f.drink_to && f.drink_to < f.drink_from) {
    return 'Het drinkvenster loopt achteruit: "t/m" ligt vóór "vanaf".';
  }
  return null;
}

export async function saveWine(_prev: FormResult, form: FormData): Promise<FormResult> {
  const f = fields(form);
  const invalid = validate(f);
  if (invalid) return { error: invalid };

  const { supabase, cellarId } = await requireCellar();
  const id = str(form.get('id'));

  if (id) {
    const { error } = await supabase.from('wines').update(f).eq('id', id);
    if (error) return { error: `Opslaan mislukte: ${error.message}` };
  } else {
    const { error } = await supabase.from('wines').insert({ ...f, cellar_id: cellarId });
    if (error) return { error: `Opslaan mislukte: ${error.message}` };
  }

  revalidatePath('/');
  redirect('/');
}

/** Zacht verwijderen: de rij blijft staan, zodat een misklik terug te draaien is. */
export async function deleteWine(id: string) {
  const { supabase } = await requireCellar();
  await supabase.from('wines').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/');
  redirect('/');
}

/** Eén fles minder, met een regel in het dagboek. */
export async function drinkBottle(_prev: FormResult, form: FormData): Promise<FormResult> {
  const { supabase, cellarId } = await requireCellar();
  const id = str(form.get('id'));
  if (!id) return { error: 'Onbekende wijn.' };

  const { data: wine } = await supabase
    .from('wines')
    .select('id, naam, type, jaar, producent, sterren, aantal')
    .eq('id', id)
    .single();
  if (!wine) return { error: 'Deze wijn staat niet meer in je kelder.' };

  const { error: logError } = await supabase.from('drink_log').insert({
    cellar_id: cellarId,
    wine_id: wine.id,
    naam_snapshot: wine.naam,
    type: wine.type,
    jaar: wine.jaar,
    producent: wine.producent,
    sterren: wine.sterren,
    met_wie: str(form.get('met_wie')),
    gelegenheid: str(form.get('gelegenheid')),
    note: str(form.get('note')),
  });
  if (logError) return { error: `Kon het dagboek niet bijwerken: ${logError.message}` };

  await supabase
    .from('wines')
    .update({ aantal: Math.max(0, (wine.aantal || 1) - 1) })
    .eq('id', id);

  revalidatePath('/');
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/inloggen');
}
