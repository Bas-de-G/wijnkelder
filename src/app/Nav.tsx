'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: Array<[string, string]> = [
  ['/', 'Kelder'],
  ['/toevoegen', 'Toevoegen'],
  ['/advies', 'Advies'],
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
