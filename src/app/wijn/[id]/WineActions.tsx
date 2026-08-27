'use client';

import { useActionState, useState } from 'react';
import { drinkBottle, deleteWine, type FormResult } from '@/lib/actions';
import type { Wine } from '@/lib/types';

const EMPTY: FormResult = {};

export function WineActions({ wine }: { wine: Wine }) {
  const [result, action, pending] = useActionState(drinkBottle, EMPTY);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (open) {
    return (
      <form action={action} className="panel">
        <p className="label" style={{ marginBottom: 14 }}>Fles geopend</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input type="hidden" name="id" value={wine.id} />
          <div className="grid-2">
            <div className="field">
              <label htmlFor="met_wie">Met wie?</label>
              <input id="met_wie" name="met_wie" placeholder="bijv. met Anne" />
            </div>
            <div className="field">
              <label htmlFor="gelegenheid">Gelegenheid</label>
              <input id="gelegenheid" name="gelegenheid" placeholder="bijv. verjaardagsdiner" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="log-note">Hoe was het?</label>
            <textarea id="log-note" name="note" style={{ minHeight: 80 }} />
          </div>
          {result.error && <div className="notice" role="alert">{result.error}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? 'Bezig…' : 'Vastleggen in dagboek'}
            </button>
            <button className="btn btn-quiet" type="button" onClick={() => setOpen(false)}>
              Annuleren
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button className="btn btn-primary" onClick={() => setOpen(true)} disabled={wine.aantal === 0}>
        {wine.aantal === 0 ? 'Geen flessen meer' : 'Fles gedronken'}
      </button>
      {confirmDelete ? (
        <form action={deleteWine.bind(null, wine.id)} style={{ display: 'flex', gap: 10 }}>
          <button className="btn" type="submit">Ja, verwijderen</button>
          <button className="btn btn-quiet" type="button" onClick={() => setConfirmDelete(false)}>
            Toch niet
          </button>
        </form>
      ) : (
        <button className="btn btn-quiet" onClick={() => setConfirmDelete(true)}>
          Verwijderen
        </button>
      )}
    </div>
  );
}
