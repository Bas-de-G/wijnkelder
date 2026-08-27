'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// De tijdlijn uit de oude app zit nu in het register zelf: alle wijnen delen daar
// één tijdas. Meldingen zijn er het filter "vraagt aandacht". Vandaar geen aparte
// tabbladen meer voor die twee.
const ITEMS: Array<[string, string]> = [
  ['/', 'Kelder'],
  ['/toevoegen', 'Toevoegen'],
  ['/dagboek', 'Dagboek'],
  ['/inzichten', 'Inzichten'],
  ['/verlanglijst', 'Verlanglijst'],
  ['/advies', 'Advies'],
  ['/aanvullen', 'Aanvullen'],
  ['/exporteren', 'Exporteren'],
  ['/importeren', 'Importeren'],
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Hoofdnavigatie">
      {ITEMS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
