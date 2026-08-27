'use client';

import { useActionState, useState } from 'react';
import { saveWish, deleteWish, buyWish, type FormResult } from '@/lib/actions';
import { WINE_TYPES, type WishlistItem } from '@/lib/types';

const EMPTY: FormResult = {};

const euro = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });

export function WishPanel({ items }: { items: WishlistItem[] }) {
  const [bewerkt, setBewerkt] = useState<WishlistItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      {formOpen || bewerkt ? (
        <WishForm
          item={bewerkt}
          onDone={() => { setBewerkt(null); setFormOpen(false); }}
        />
      ) : (
        <button className="btn btn-primary" onClick={() => setFormOpen(true)} style={{ marginBottom: 26 }}>
          Wijn op het lijstje zetten
        </button>
      )}

      {!items.length ? (
        <div className="state-empty">
          <p className="display">Je lijstje is leeg</p>
          <p style={{ maxWidth: '42ch', margin: '0 auto' }}>
            Handig voor die fles waar iemand je over vertelde en die je anders weer vergeet.
          </p>
        </div>
      ) : (
        <ul>
          {items.map((it) => (
            <Wish key={it.id} item={it} onEdit={() => { setFormOpen(false); setBewerkt(it); }} />
          ))}
        </ul>
      )}
    </>
  );
}

function Wish({ item, onEdit }: { item: WishlistItem; onEdit: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const meta = [item.type, item.regio, item.druif, item.producent].filter(Boolean).join(' · ');

  return (
    <li className="wish">
      <div>
        <h3 className="row-name" style={{ fontSize: 19 }}>{item.naam}</h3>
        {meta && <p className="row-meta" style={{ whiteSpace: 'normal' }}>{meta}</p>}
        {item.richtprijs != null && (
          <p className="wish-price" style={{ marginTop: 3 }}>rond {euro(item.richtprijs)}</p>
        )}
      </div>

      <div className="wish-acts">
        {confirm ? (
          <>
            <form action={deleteWish.bind(null, item.id)}>
              <button className="btn btn-quiet btn-sm" type="submit">Verwijderen</button>
            </form>
            <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(false)}>Toch niet</button>
          </>
        ) : (
          <>
            <form action={buyWish.bind(null, item.id)}>
              <button className="btn btn-sm" type="submit">Gekocht</button>
            </form>
            <button className="btn btn-quiet btn-sm" onClick={onEdit}>Bewerken</button>
            <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(true)}>Weg</button>
          </>
        )}
      </div>

      {item.note && <p className="wish-note">{item.note}</p>}
    </li>
  );
}

function WishForm({ item, onDone }: { item: WishlistItem | null; onDone: () => void }) {
  const [result, action, pending] = useActionState(
    async (prev: FormResult, form: FormData) => {
      const r = await saveWish(prev, form);
      if (!r.error) onDone();
      return r;
    },
    EMPTY
  );

  return (
    <form action={action} className="panel" style={{ marginBottom: 26 }}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <p className="label" style={{ marginBottom: 16 }}>
        {item ? 'Wens bewerken' : 'Nieuwe wens'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div className="field">
          <label htmlFor="wl-naam">Naam</label>
          <input id="wl-naam" name="naam" required autoComplete="off"
            placeholder="bijv. Château Musar" defaultValue={item?.naam ?? ''} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="wl-type">Type</label>
            <select id="wl-type" name="type" defaultValue={item?.type ?? 'Rood'}>
              {WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wl-regio">Regio</label>
            <input id="wl-regio" name="regio" placeholder="bijv. Bekaa Valley"
              defaultValue={item?.regio ?? ''} />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="wl-druif">Druif</label>
            <input id="wl-druif" name="druif" defaultValue={item?.druif ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="wl-prod">Producent</label>
            <input id="wl-prod" name="producent" defaultValue={item?.producent ?? ''} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="wl-prijs">Richtprijs</label>
          <input id="wl-prijs" name="richtprijs" inputMode="decimal" className="mono-input"
            placeholder="0,00" defaultValue={item?.richtprijs ?? ''} />
        </div>

        <div className="field">
          <label htmlFor="wl-note">Waarom deze?</label>
          <textarea id="wl-note" name="note" style={{ minHeight: 74 }}
            placeholder="Wie tipte 'm, of wat wil je proeven?"
            defaultValue={item?.note ?? ''} />
        </div>

        {result.error && <div className="notice" role="alert">{result.error}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Bezig…' : item ? 'Opslaan' : 'Op het lijstje'}
          </button>
          <button className="btn btn-quiet" type="button" onClick={onDone}>Annuleren</button>
        </div>
      </div>
    </form>
  );
}
