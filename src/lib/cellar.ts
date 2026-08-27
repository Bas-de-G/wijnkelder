import { createClient } from './supabase/server';
import type { Wine, Cellar } from './types';

/**
 * Haalt de kelder van de ingelogde gebruiker op, met de wijnen erin.
 * De databasetrigger maakt bij registratie al een kelder aan; komt die er
 * onverhoopt niet, dan maken we hem hier alsnog in plaats van een lege pagina
 * te tonen.
 */
export async function getCellarWithWines(): Promise<{ cellar: Cellar; wines: Wine[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: cellar } = await supabase
    .from('cellars')
    .select('id, owner_id, name')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (!cellar) {
    const { data: created, error } = await supabase
      .from('cellars')
      .insert({ owner_id: user.id })
      .select('id, owner_id, name')
      .single();
    if (error || !created) return null;
    cellar = created;
  }

  const { data: wines } = await supabase
    .from('wines')
    .select('*')
    .eq('cellar_id', cellar.id)
    .is('deleted_at', null)
    .order('naam');

  return { cellar: cellar as Cellar, wines: (wines ?? []) as Wine[] };
}
