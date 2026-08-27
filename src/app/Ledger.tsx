'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { drinkBadge, currentYear, STATUS_ORDER, type DrinkStatus } from '@/lib/drinkwindow';
import { buildAxis, windowSpan, tickPosition } from '@/lib/axis';
import { WINE_TYPES, type Wine } from '@/lib/types';

type Sort = 'naam' | 'venster' | 'voorraad' | 'toegevoegd';

const SORT_LABELS: Array<[Sort, string]> = [
  ['naam', 'Alfabet'],
  ['venster', 'Op dronk'],
  ['voorraad', 'Voorraad'],
  ['toegevoegd', 'Toegevoegd'],
];

function haystack(w: Wine) {
  return [w.naam, w.regio, w.druif, w.producent, w.locatie, w.note]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function Ledger({ wines }: { wines: Wine[] }) {
  const year = currentYear();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<Sort>('naam');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = wines.filter((w) => {
      if (type && w.type !== type) return false;
      if (needle && !haystack(w).includes(needle)) return false;
      return true;
    });

    out.sort((a, b) => {
      if (sort === 'voorraad') return (b.aantal || 0) - (a.aantal || 0);
      if (sort === 'toegevoegd') return b.created_at.localeCompare(a.created_at);
      if (sort === 'venster') {
        const sa = STATUS_ORDER[drinkBadge(a, year).status as DrinkStatus];
        const sb = STATUS_ORDER[drinkBadge(b, year).status as DrinkStatus];
        if (sa !== sb) return sa - sb;
        return (a.drink_to ?? 9999) - (b.drink_to ?? 9999);
      }
      return a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' });
    });
    return out;
  }, [wines, q, type, sort, year]);

  // De as wordt over de getoonde selectie gebouwd, zodat inzoomen op één type
  // ook de tijdas laat inzoomen.
  const axis = useMemo(() => buildAxis(shown, year), [shown, year]);

  if (!wines.length) {
    return (
      <div className="state-empty">
        <p className="display">Je register is nog leeg</p>
        <p style={{ maxWidth: '42ch', margin: '0 auto 22px' }}>
          Voeg je eerste fles toe, of neem je bestaande kelder over uit een back-up van de oude
          app.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
          <Link className="btn btn-quiet" href="/importeren">Back-up importeren</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="filters">
        <input
          type="search"
          placeholder="Zoek op naam, druif, regio of notitie…"
          aria-label="Zoeken in je kelder"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter op type">
          <option value="">Alle typen</option>
          {WINE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sorteren">
          {SORT_LABELS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {!shown.length ? (
        <div className="state-empty">
          <p className="display">Niets gevonden</p>
          <p>Geen wijn in je kelder past bij deze zoekopdracht.</p>
        </div>
      ) : (
        <div className="ledger">
          <div className="ledger-head">
            <span className="label">Wijn</span>
            <div className="axis-scale" aria-hidden="true">
              {axis.ticks.map((t) => (
                <span
                  key={t}
                  className="axis-tick"
                  style={{ left: `${tickPosition(t, axis) * 100}%` }}
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="label" style={{ textAlign: 'right' }}>Voorraad</span>
          </div>

          <div className="ledger-overlay" aria-hidden="true">
            <div />
            <div className="axis-col">
              <span className="ledger-now" style={{ ['--now' as string]: axis.now }} />
            </div>
            <div />
          </div>

          <ul>
            {shown.map((w, i) => (
              <Row key={w.id} wine={w} axis={axis} year={year} index={i} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Row({
  wine,
  axis,
  year,
  index,
}: {
  wine: Wine;
  axis: ReturnType<typeof buildAxis>;
  year: number;
  index: number;
}) {
  const badge = drinkBadge(wine, year);
  const span = windowSpan(wine, axis);
  const meta = [wine.type, wine.regio, wine.druif, wine.producent].filter(Boolean);

  const spanClass = badge.status === 'vb' ? 'past' : badge.status === 'wt' ? 'waiting' : badge.closing ? 'closing' : '';

  return (
    <li
      className={`row${badge.status === 'vb' ? ' past' : ''}`}
      style={{ animationDelay: `${Math.min(index, 18) * 22}ms` }}
    >
      <div className="row-main">
        <h3 className="row-name">
          <Link href={`/wijn/${wine.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {wine.naam}
          </Link>
          {wine.jaar && <span className="row-vintage">{wine.jaar}</span>}
          <span className={`mark ${badge.status}`}>{badge.label}</span>
        </h3>
        {meta.length > 0 && (
          <p className="row-meta">
            {meta.map((m, i) => (
              <span key={i}>
                {i > 0 && <span className="sep">·</span>}
                {m}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="window">
        <span className="window-track" />
        {span ? (
          <span
            className={`window-span ${spanClass}`}
            style={{ ['--from' as string]: span.from, ['--to' as string]: span.to }}
            title={`${wine.drink_from ?? '?'} – ${wine.drink_to ?? '?'}`}
          />
        ) : (
          <span className="window-none" title="Geen drinkvenster ingevuld" />
        )}
        <span className="window-now" style={{ ['--now' as string]: axis.now }} aria-hidden="true" />
        <span className="window-years" aria-hidden="true">
          <span>{axis.min}</span>
          <span>{axis.max}</span>
        </span>
      </div>

      <div className={`row-stock${wine.aantal === 0 ? ' is-op' : ''}`}>
        <span className="n">{wine.aantal}</span> fl.
      </div>
    </li>
  );
}
