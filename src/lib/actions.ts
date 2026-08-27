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
  /**
   * Gevuld als er al een wijn met dezelfde naam en jaargang staat. De wijn is
   * dan nog niet opgeslagen: het formulier vraagt eerst of het echt een tweede
   * regel moet worden. Zes flessen van dezelfde wijn horen namelijk op één
   * regel te staan, niet op zes.
   */
  duplicaat?: { naam: string; jaar: number | null; aantal: number };
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

  // Alleen bij een nieuwe wijn, en alleen als de gebruiker het nog niet bevestigd heeft.
  if (!id && form.get('bevestigd') !== 'ja') {
    const zoek = supabase
      .from('wines')
      .select('naam, jaar, aantal')
      .eq('cellar_id', cellarId)
      .is('deleted_at', null)
      .ilike('naam', f.naam!)
      .limit(1);

    // Zonder jaartal matchen we op naam alleen; met jaartal moet ook dat kloppen.
    const { data: bestaand } = f.jaar == null ? await zoek : await zoek.eq('jaar', f.jaar);

    if (bestaand?.length) {
      const d = bestaand[0];
      return { duplicaat: { naam: d.naam, jaar: d.jaar, aantal: d.aantal } };
    }
  }

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

  const over = Math.max(0, (wine.aantal || 1) - 1);

  // Was dit de laatste fles, dan mag de gebruiker kiezen: de wijn als
  // herinnering laten staan (nul flessen) of hem uit de kelder halen. Het
  // dagboek blijft in beide gevallen intact, want dat bewaart de naam apart.
  if (over === 0 && str(form.get('verwijderen')) === 'ja') {
    await supabase.from('wines').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  } else {
    await supabase.from('wines').update({ aantal: over }).eq('id', id);
  }

  revalidatePath('/');
  revalidatePath('/dagboek');
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/inloggen');
}

/** Een dagboekregel wissen. De wijn zelf blijft staan. */
export async function deleteLogEntry(id: string) {
  const { supabase } = await requireCellar();
  await supabase.from('drink_log').delete().eq('id', id);
  revalidatePath('/dagboek');
}

function wishFields(form: FormData) {
  return {
    naam: str(form.get('naam')),
    type: wineType(form.get('type')),
    regio: str(form.get('regio')),
    druif: str(form.get('druif')),
    producent: str(form.get('producent')),
    richtprijs: money(form.get('richtprijs')),
    note: str(form.get('note')),
  };
}

export async function saveWish(_prev: FormResult, form: FormData): Promise<FormResult> {
  const f = wishFields(form);
  if (!f.naam) return { error: 'Vul minimaal een naam in.' };

  const { supabase, cellarId } = await requireCellar();
  const id = str(form.get('id'));

  const { error } = id
    ? await supabase.from('wishlist').update(f).eq('id', id)
    : await supabase.from('wishlist').insert({ ...f, cellar_id: cellarId });

  if (error) return { error: `Opslaan mislukte: ${error.message}` };
  revalidatePath('/verlanglijst');
  return {};
}

export async function deleteWish(id: string) {
  const { supabase } = await requireCellar();
  await supabase.from('wishlist').delete().eq('id', id);
  revalidatePath('/verlanglijst');
}

/**
 * Gekocht: het item verhuist naar de kelder en verdwijnt van de verlanglijst.
 * De richtprijs wordt de aankoopprijs — te corrigeren op de wijnpagina.
 */
export async function buyWish(id: string) {
  const { supabase, cellarId } = await requireCellar();

  const { data: wish } = await supabase
    .from('wishlist')
    .select('naam, type, regio, druif, producent, richtprijs, note')
    .eq('id', id)
    .single();
  if (!wish) redirect('/verlanglijst');

  const { error } = await supabase.from('wines').insert({
    cellar_id: cellarId,
    naam: wish.naam,
    type: wish.type,
    regio: wish.regio,
    druif: wish.druif,
    producent: wish.producent,
    prijs: wish.richtprijs,
    note: wish.note,
    aantal: 1,
  });
  if (error) redirect('/verlanglijst');

  await supabase.from('wishlist').delete().eq('id', id);
  revalidatePath('/');
  revalidatePath('/verlanglijst');
  redirect('/');
}

// ── DELEN ────────────────────────────────────────────────────────────────────
// Een deel-link is een token, geen kelder-id: wie de link heeft kan alleen de
// alleen-lezen projectie zien die shared_cellar() teruggeeft, en die laat prijzen
// weg. Intrekken zet revoked_at, zodat de link direct dood is zonder dat er iets
// uit de historie verdwijnt.

function nieuwToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 22);
}

export async function createShare(): Promise<FormResult> {
  const { supabase, cellarId } = await requireCellar();
  const { error } = await supabase
    .from('shares')
    .insert({ cellar_id: cellarId, token: nieuwToken() });
  if (error) return { error: `Link maken mislukte: ${error.message}` };
  revalidatePath('/exporteren');
  return {};
}

export async function revokeShare(id: string) {
  const { supabase } = await requireCellar();
  await supabase.from('shares').update({ revoked_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/exporteren');
}
