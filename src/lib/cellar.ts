import { createClient } from './supabase/server';
import { gebruikerId } from './auth';
import type { Wine, Cellar } from './types';

/**
 * Haalt de kelder van de ingelogde gebruiker op, met de wijnen erin.
 *
 * De kelder en de wijnen komen in één aanvraag binnen. Dat waren twee losse
 * queries achter elkaar: eerst de kelder opzoeken om aan het id te komen, dan
 * de wijnen erbij. PostgREST kan de wijnen meteen meesturen, dus dat scheelt
 * een heel netwerkritje op elk scherm dat de kelder toont.
 *
 * De databasetrigger maakt bij registratie al een kelder aan; komt die er
 * onverhoopt niet, dan maken we hem hier alsnog in plaats van een lege pagina
 * te tonen.
 */
export async function getCellarWithWines(): Promise<{ cellar: Cellar; wines: Wine[] } | null> {
  const supabase = await createClient();
  const uid = await gebruikerId(supabase);
  if (!uid) return null;

  const { data: gevonden } = await supabase
    .from('cellars')
    .select('id, owner_id, name, wines(*)')
    // Een filter op een meegestuurde tabel dunt alleen die lijst uit; een kelder
    // zonder wijnen valt er dus niet door weg.
    .is('wines.deleted_at', null)
    .eq('owner_id', uid)
    .order('created_at')
    .order('naam', { referencedTable: 'wines' })
    .limit(1)
    .maybeSingle();

  if (gevonden) {
    const { wines, ...cellar } = gevonden as Cellar & { wines: Wine[] | null };
    return { cellar: cellar as Cellar, wines: (wines ?? []) as Wine[] };
  }

  const { data: nieuw, error } = await supabase
    .from('cellars')
    .insert({ owner_id: uid })
    .select('id, owner_id, name')
    .single();
  if (error || !nieuw) return null;

  return { cellar: nieuw as Cellar, wines: [] };
}
