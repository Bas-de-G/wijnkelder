'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveWine, type FormResult } from '@/lib/actions';
import { WINE_TYPES, type Wine } from '@/lib/types';

const EMPTY: FormResult = {};

export function WineForm({ wine }: { wine?: Wine }) {
  const [result, action, pending] = useActionState(saveWine, EMPTY);
  const [sterren, setSterren] = useState(wine?.sterren ?? 0);
  // Zodra de gebruiker bevestigt dat het echt een tweede regel moet worden,
  // gaat dit veld mee en slaat de server de duplicaatcontrole over.
  const [bevestigd, setBevestigd] = useState(false);

  return (
    <form action={action}>
      {wine && <input type="hidden" name="id" value={wine.id} />}
      <input type="hidden" name="sterren" value={sterren} />
      {bevestigd && <input type="hidden" name="bevestigd" value="ja" />}

      <fieldset>
        <legend>Inventaris</legend>

        <div className="field">
          <label htmlFor="naam">Naam</label>
          <input
            id="naam" name="naam" required autoComplete="off"
            placeholder="bijv. Château Pichon Baron"
            defaultValue={wine?.naam ?? ''}
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={wine?.type ?? 'Rood'}>
              {WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="regio">Regio</label>
            <input id="regio" name="regio" placeholder="bijv. Barolo" defaultValue={wine?.regio ?? ''} />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="druif">Druif</label>
            <input id="druif" name="druif" placeholder="bijv. Nebbiolo" defaultValue={wine?.druif ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="producent">Producent</label>
            <input id="producent" name="producent" defaultValue={wine?.producent ?? ''} />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="jaar">Oogstjaar</label>
            <input id="jaar" name="jaar" type="number" inputMode="numeric" min={1800} max={2100}
              className="mono-input" placeholder="2019" defaultValue={wine?.jaar ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="aantal">Aantal flessen</label>
            <input id="aantal" name="aantal" type="number" inputMode="numeric" min={0}
              className="mono-input" defaultValue={wine?.aantal ?? 1} />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="prijs">Aankoopprijs</label>
            <input id="prijs" name="prijs" inputMode="decimal" className="mono-input"
              placeholder="0,00" defaultValue={wine?.prijs ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="locatie">Plek in de kast</label>
            <input id="locatie" name="locatie" placeholder="bijv. Rek B, vak 4" defaultValue={wine?.locatie ?? ''} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="herkomst">Hoe kom je eraan?</label>
          <input id="herkomst" name="herkomst" placeholder="bijv. zelf gekocht, of gekregen van Peter"
            defaultValue={wine?.herkomst ?? ''} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Drinkvenster</legend>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="drink_from">Drinken vanaf</label>
            <input id="drink_from" name="drink_from" type="number" inputMode="numeric"
              min={1800} max={2200} className="mono-input" placeholder="2025"
              defaultValue={wine?.drink_from ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="drink_to">Drinken t/m</label>
            <input id="drink_to" name="drink_to" type="number" inputMode="numeric"
              min={1800} max={2200} className="mono-input" placeholder="2032"
              defaultValue={wine?.drink_to ?? ''} />
          </div>
        </div>
        <p className="hint" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          Laat leeg als je het niet weet — de wijn krijgt dan gewoon geen venster in het register.
        </p>
      </fieldset>

      <fieldset>
        <legend>Proefnotities</legend>

        <div className="field">
          <label id="sterren-label">Beoordeling</label>
          <div role="group" aria-labelledby="sterren-label" style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSterren(sterren === n ? 0 : n)}
                aria-pressed={n <= sterren}
                aria-label={`${n} ${n === 1 ? 'ster' : 'sterren'}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
                  fontSize: 25, lineHeight: 1,
                  color: n <= sterren ? 'var(--brass)' : 'var(--rule)',
                  transition: 'color .12s',
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="note">Notitie</label>
          <textarea id="note" name="note" defaultValue={wine?.note ?? ''}
            placeholder={'Wijnhuis: …\n\nWijn & jaargang: …\n\nLekker bij: …'} />
          <span className="hint">
            Schrijf je notitie met deze kopjes, dan toont de app ze als aparte alinea&apos;s — en
            het advies zoekt hierin naar wat bij je eten past.
          </span>
        </div>
      </fieldset>

      {result.error && <div className="notice" role="alert" style={{ marginBottom: 18 }}>{result.error}</div>}

      {result.duplicaat && !bevestigd && (
        <div className="notice warn" role="alert" style={{ marginBottom: 18 }}>
          <p style={{ marginBottom: 8 }}>
            <strong>
              &ldquo;{result.duplicaat.naam}
              {result.duplicaat.jaar ? ` ${result.duplicaat.jaar}` : ''}&rdquo;
            </strong>{' '}
            staat al in je kelder, met {result.duplicaat.aantal}{' '}
            {result.duplicaat.aantal === 1 ? 'fles' : 'flessen'}.
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            Heb je er flessen bij gekocht? Pas dan het aantal bij die wijn aan in plaats van hem
            opnieuw toe te voegen — anders staat dezelfde wijn twee keer in je register.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {result.duplicaat && !bevestigd ? (
          <>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={pending}
              onClick={() => setBevestigd(true)}
            >
              Toch als aparte regel toevoegen
            </button>
            <Link className="btn btn-quiet" href="/">Naar mijn kelder</Link>
          </>
        ) : (
          <>
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? 'Bezig…' : wine ? 'Wijzigingen opslaan' : 'Toevoegen aan kelder'}
            </button>
            <Link className="btn btn-quiet" href="/">Annuleren</Link>
          </>
        )}
      </div>
    </form>
  );
}
