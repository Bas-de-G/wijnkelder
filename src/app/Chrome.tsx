'use client';

import { usePathname } from 'next/navigation';
import { heeftSchil, kopTitel } from '@/lib/schil';
import { Kop } from './Masthead';
import { TabBar } from './Nav';

/**
 * De vaste schil: de donkere balk bovenaan en de tabbalk onderaan.
 *
 * Die stonden eerst in elke pagina apart. Daardoor werden ze bij elk tabblad
 * afgebroken en opnieuw opgebouwd — en omdat elke pagina op de server wordt
 * gerenderd, gebeurde dat pas ná een rondje naar Supabase. Op een telefoon zie
 * je dat als een balk die wegspringt en terugkomt. Hier blijven ze staan; alleen
 * de inhoud eronder wisselt.
 */

export function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '/';

  if (!heeftSchil(path)) return <>{children}</>;

  const titel = kopTitel(path);

  return (
    <>
      {/* Altijd hetzelfde component op dezelfde plek, zodat React de balk
          bijwerkt in plaats van hem te vervangen. Zonder titel staat het
          wordmerk er: op de kelderpagina en op de pagina van één wijn. */}
      <Kop titel={titel?.titel} cursief={titel?.cursief} />
      {children}
      <TabBar />
    </>
  );
}
