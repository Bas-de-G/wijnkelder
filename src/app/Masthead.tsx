'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Theme = 'auto' | 'light' | 'dark';

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    const saved = localStorage.getItem('wk-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  function cycle() {
    const next: Theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
    setTheme(next);
    try {
      if (next === 'auto') {
        localStorage.removeItem('wk-theme');
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem('wk-theme', next);
        document.documentElement.dataset.theme = next;
      }
    } catch {
      // Privémodus kan opslag blokkeren; het thema geldt dan alleen deze sessie.
    }
  }

  const label = theme === 'auto' ? 'Systeem' : theme === 'light' ? 'Licht' : 'Donker';
  return (
    <button className="kop-knop" onClick={cycle} aria-label={`Thema: ${label}. Klik om te wisselen.`}>
      {label}
    </button>
  );
}

export interface Tally {
  nu: number;
  wachten: number;
  voorbij: number;
  flessen: number;
}

function Datum() {
  // Op de server is de tijdzone een andere dan bij de bezoeker; pas na hydratie
  // klopt de datum gegarandeerd.
  const [datum, setDatum] = useState('');
  useEffect(() => {
    setDatum(new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);
  return <span className="kop-datum mono">{datum}</span>;
}

/**
 * De donkere balk bovenaan. Eén component voor élk scherm, met of zonder titel.
 *
 * Bewust niet twee componenten: React vervangt een DOM-knoop zodra het
 * componenttype op die plek verandert, en dan verdwijnt de balk een frame lang
 * bij het wisselen van Kelder naar een ander tabblad. Zo blijft het dezelfde
 * <header> en verandert alleen wat erin staat.
 *
 * Zonder titel staat het wordmerk er — op de kelderpagina en op de pagina van
 * één wijn, waar de naam te lang is voor een balk van vaste hoogte.
 */
export function Kop({ titel, cursief }: { titel?: string; cursief?: string }) {
  return (
    <header className="kop kop-slank">
      <div className="kop-binnen">
        <div className="kop-rij">
          {titel ? (
            <h1 className="kop-merk">
              {titel}
              {cursief && <em> {cursief}</em>}
            </h1>
          ) : (
            <Link href="/" className="kop-merk">
              Wijn<em>kelder</em>
            </Link>
          )}
          <div className="kop-acties">
            {!titel && <Datum />}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

/** De vier getallen die ertoe doen, in flessen. */
export function Cijfers({ tally }: { tally: Tally }) {
  return (
    <dl className="cijfers">
      <div className="cijfer nu">
        <dd>{tally.nu}</dd>
        <dt>Op dronk</dt>
      </div>
      <div className="cijfer wacht">
        <dd>{tally.wachten}</dd>
        <dt>Wachten</dt>
      </div>
      <div className="cijfer voorbij">
        <dd>{tally.voorbij}</dd>
        <dt>Over hoogtepunt</dt>
      </div>
      <div className="cijfer">
        <dd>{tally.flessen}</dd>
        <dt>Flessen</dt>
      </div>
    </dl>
  );
}

