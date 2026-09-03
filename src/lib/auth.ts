import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Het id van de ingelogde gebruiker.
 *
 * Bewust `getClaims()` en niet `getUser()`. getUser() is elke keer een
 * netwerkaanroep naar de auth-server; de middleware heeft die al gedaan voor
 * dit verzoek, dus een tweede is een rondje voor niets. getClaims() controleert
 * de handtekening van het token lokaal tegen de publieke sleutel van het
 * project — die wordt één keer opgehaald en daarna hergebruikt.
 *
 * Let op: dat lokale pad geldt alleen als het project asymmetrische
 * JWT-sleutels gebruikt (ES256/RS256). Draait het nog op het oude gedeelde
 * geheim (HS256), dan valt supabase-js zelf terug op getUser() en is dit precies
 * even duur als eerst — nooit duurder.
 *
 * Veiligheid verandert er niet door: elke tabel heeft Row Level Security op
 * `auth.uid()`, dus de database bepaalt wat iemand mag zien. Dit id wordt alleen
 * gebruikt om te weten of er iemand is en welke kelder erbij hoort.
 */
export async function gebruikerId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const sub = data.claims.sub;
  return typeof sub === 'string' && sub ? sub : null;
}
