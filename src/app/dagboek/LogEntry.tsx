'use client';

import { useState } from 'react';
import { deleteLogEntry } from '@/lib/actions';
import type { DrinkLogEntry } from '@/lib/types';

export function LogEntry({ entry, index }: { entry: DrinkLogEntry; index: number }) {
  const [confirm, setConfirm] = useState(false);

  const datum = new Date(entry.gedronken_op).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const context = [entry.met_wie, entry.gelegenheid].filter(Boolean).join(' · ');

  return (
    <li className="log-entry" style={{ animationDelay: `${Math.min(index, 14) * 22}ms` }}>
      <div className="log-when">
        <span className="mono">{datum}</span>
        {confirm ? (
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Wissen?</span>
            <form action={deleteLogEntry.bind(null, entry.id)}>
              <button className="btn btn-quiet btn-sm" type="submit">Ja</button>
            </form>
            <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(false)}>Nee</button>
          </span>
        ) : (
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => setConfirm(true)}
            aria-label={`Notitie over ${entry.naam_snapshot} wissen`}
          >
            Wissen
          </button>
        )}
      </div>

      <h3 className="row-name" style={{ fontSize: 19 }}>
        {entry.naam_snapshot}
        {entry.jaar && <span className="row-vintage">{entry.jaar}</span>}
        {!!entry.sterren && (
          <span style={{ color: 'var(--brass)', fontSize: 13, letterSpacing: 1 }}>
            {'★'.repeat(entry.sterren)}
          </span>
        )}
      </h3>

      {context && <p className="row-meta" style={{ whiteSpace: 'normal' }}>{context}</p>}
      {entry.note && <p className="log-note">{entry.note}</p>}
    </li>
  );
}
