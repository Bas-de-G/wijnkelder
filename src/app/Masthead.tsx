'use client';

import { useEffect, useState } from 'react';

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
    <button className="btn btn-quiet btn-sm" onClick={cycle} aria-label={`Thema: ${label}. Klik om te wisselen.`}>
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

export function Masthead({ tally }: { tally: Tally }) {
  const vandaag = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="masthead">
        <h1 className="wordmark">
          Wijn<em>kelder</em>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{vandaag}</span>
          <ThemeToggle />
        </div>
      </div>
      <div className="masthead-sub">
        <div className="tally">
          <div className="tally-item">
            <span className="tally-n">{tally.nu}</span>
            <span className="tally-l">Op dronk</span>
          </div>
          <div className="tally-item">
            <span className="tally-n">{tally.wachten}</span>
            <span className="tally-l">Wachten</span>
          </div>
          <div className={`tally-item${tally.voorbij ? ' alert' : ''}`}>
            <span className="tally-n">{tally.voorbij}</span>
            <span className="tally-l">Over hoogtepunt</span>
          </div>
          <div className="tally-item">
            <span className="tally-n">{tally.flessen}</span>
            <span className="tally-l">Flessen</span>
          </div>
        </div>
      </div>
    </>
  );
}
