'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/actions';
import {
  IconKelder, IconPlus, IconTijdlijn, IconDagboek, IconInzichten, IconAdvies,
  IconVerlanglijst, IconAanvullen, IconExporteren, IconImporteren,
  IconMeer, IconUit, IconSluit,
} from './icons';

type Item = { href: string; label: string; Icon: (p: { className?: string }) => React.JSX.Element };

// De tijdlijn uit de oude app zit nu in het register zelf: alle wijnen delen daar
// één tijdas. Meldingen zijn er het filter "vraagt aandacht". Vandaar geen aparte
// tabbladen meer voor die twee.
const HOOFD: Item[] = [
  { href: '/', label: 'Kelder', Icon: IconKelder },
  { href: '/tijdlijn', label: 'Tijdlijn', Icon: IconTijdlijn },
  { href: '/dagboek', label: 'Dagboek', Icon: IconDagboek },
  { href: '/inzichten', label: 'Inzichten', Icon: IconInzichten },
  { href: '/advies', label: 'Advies', Icon: IconAdvies },
];

const OVERIG: Item[] = [
  { href: '/verlanglijst', label: 'Verlanglijst', Icon: IconVerlanglijst },
  { href: '/aanvullen', label: 'Laten aanvullen', Icon: IconAanvullen },
  { href: '/exporteren', label: 'Exporteren & delen', Icon: IconExporteren },
  { href: '/importeren', label: 'Back-up importeren', Icon: IconImporteren },
];

const ALLE = [...HOOFD, { href: '/toevoegen', label: 'Toevoegen', Icon: IconPlus }, ...OVERIG];

/** Brede schermen: één rij tekstlinks boven de inhoud. */
export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Hoofdnavigatie">
      {ALLE.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Smalle schermen: een vaste balk onderaan, binnen duimbereik, plus een
 * plusknop die erboven zweeft. Vier tabs passen comfortabel naast de plusknop;
 * de rest zit achter "Meer", zodat er niets in een te smalle balk gepropt wordt.
 */
export function TabBar() {
  const path = usePathname();
  const [meerOpen, setMeerOpen] = useState(false);

  // Sluit het paneel zodra je ergens heen navigeert.
  useEffect(() => { setMeerOpen(false); }, [path]);

  // Achtergrond niet laten meescrollen terwijl het paneel openstaat.
  useEffect(() => {
    if (!meerOpen) return;
    const vorige = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMeerOpen(false); };
    window.addEventListener('keydown', opEscape);
    return () => {
      document.body.style.overflow = vorige;
      window.removeEventListener('keydown', opEscape);
    };
  }, [meerOpen]);

  const inOverig = OVERIG.some((i) => i.href === path);

  return (
    <>
      <Link className="fab" href="/toevoegen" aria-label="Wijn toevoegen">
        <IconPlus />
      </Link>

      <nav className="tabbar" aria-label="Hoofdnavigatie">
        {HOOFD.map(({ href, label, Icon }) => (
          /* prefetch: standaard haalt Next voor een dynamische route alleen de
             plaatshouder op, en pas bij de tik de gegevens. Met prefetch staat
             het hele scherm er al voordat je tikt. Op een telefoon is er geen
             muisaanwijzer om dat aan op te hangen, dus doen we het meteen. */
          <Link key={href} href={href} prefetch
            aria-current={path === href ? 'page' : undefined}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMeerOpen(true)}
          aria-expanded={meerOpen}
          aria-current={inOverig ? 'page' : undefined}
        >
          <IconMeer />
          <span>Meer</span>
        </button>
      </nav>

      {meerOpen && (
        <div className="sheet-overlay" onClick={() => setMeerOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Meer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-kop">
              <span className="label">Meer</span>
              <button onClick={() => setMeerOpen(false)} aria-label="Sluiten" className="sheet-sluit">
                <IconSluit />
              </button>
            </div>
            <ul>
              {OVERIG.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} aria-current={path === href ? 'page' : undefined}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
              <li className="sheet-scheiding">
                <form action={signOut}>
                  <button type="submit">
                    <IconUit />
                    <span>Uitloggen</span>
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
