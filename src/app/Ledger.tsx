'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { drinkBadge, drinkProgress, currentYear, STATUS_ORDER, type DrinkStatus } from '@/lib/drinkwindow';
import { parseNote } from '@/lib/sommelier';
import { WINE_TYPES, type Wine, type WineType } from '@/lib/types';
import {
  IconChevron, IconPlek, IconDruif, IconJaar, IconVak, IconPrijs, IconHerkomst,
  IconGedronken, IconBewerken,
} from './icons';

type Sort = 'naam' | 'venster' | 'voorraad' | 'toegevoegd';

const SORT_LABELS: Array<[Sort, string]> = [
  ['naam', 'Alfabet'],
  ['venster', 'Op dronk'],
  ['voorraad', 'Voorraad'],
  ['toegevoegd', 'Toegevoegd'],
];

/** Kopjes boven de groepen als je op drinkvenster sorteert, net als in de oude app. */
const GROEP_LABELS: Record<DrinkStatus, string> = {
  vb: 'Over hoogtepunt',
  nu: 'Nu drinken',
  wt: 'Wachten',
  nvt: 'Geen venster',
};

/** Een streepje in de kleur van het type, bovenlangs de kaart. */
const ACCENT: Record<WineType, string> = {
  Rood: 'rood',
  Wit: 'wit',
  'Rosé': 'rose',
  Mousserend: 'mousserend',
  Overig: 'overig',
};

/** Eerste letter zonder accent; alles wat geen letter is valt onder '#'. */
function beginletter(naam: string): string {
  const c = (naam || '#').trim().charAt(0).toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /[A-Z]/.test(c) ? c : '#';
}

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
  // Vervangt het aparte meldingen-tabblad uit de oude app.
  const [aandacht, setAandacht] = useState(false);
  // Welke kaarten dicht staan. Dicht in plaats van open, zodat een nieuwe wijn
  // vanzelf opengeklapt in beeld komt — zoals in de app van Dennis.
  const [dicht, setDicht] = useState<ReadonlySet<string>>(() => new Set());

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = wines.filter((w) => {
      if (type && w.type !== type) return false;
      if (needle && !haystack(w).includes(needle)) return false;
      if (aandacht) {
        if (!(Number(w.aantal) > 0)) return false;
        const b = drinkBadge(w, year);
        if (b.status !== 'vb' && !b.soon && !b.closing) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      if (sort === 'voorraad') return (Number(b.aantal) || 0) - (Number(a.aantal) || 0);
      if (sort === 'toegevoegd') return b.created_at.localeCompare(a.created_at);
      if (sort === 'venster') {
        const sa = STATUS_ORDER[drinkBadge(a, year).status];
        const sb = STATUS_ORDER[drinkBadge(b, year).status];
        if (sa !== sb) return sa - sb;
        return (a.drink_to ?? 9999) - (b.drink_to ?? 9999);
      }
      return a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' });
    });
    return out;
  }, [wines, q, type, sort, aandacht, year]);

  // Springbalk: alleen zinvol bij een alfabetische lijst die lang genoeg is om
  // in te verdwalen.
  const lijst = useRef<HTMLDivElement>(null);
  const letters = useMemo(() => {
    if (sort !== 'naam' || shown.length < 12) return [];
    return [...new Set(shown.map((w) => beginletter(w.naam)))];
  }, [shown, sort]);

  const springNaar = useCallback((letter: string) => {
    const doel = lijst.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    doel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const wissel = useCallback((id: string) => {
    setDicht((oud) => {
      const uit = new Set(oud);
      if (uit.has(id)) uit.delete(id);
      else uit.add(id);
      return uit;
    });
  }, []);

  const allesOpen = shown.length > 0 && shown.every((w) => !dicht.has(w.id));
  const wisselAlles = useCallback(() => {
    setDicht(allesOpen ? new Set(shown.map((w) => w.id)) : new Set());
  }, [allesOpen, shown]);

  // Telling voor het aandacht-filter: over hoogtepunt, of binnen twee jaar
  // beginnend of eindigend.
  const attentionCount = useMemo(
    () =>
      wines.filter((w) => {
        if (!(Number(w.aantal) > 0)) return false;
        const b = drinkBadge(w, year);
        return b.status === 'vb' || b.soon || b.closing;
      }).length,
    [wines, year]
  );

  if (!wines.length) {
    return (
      <div className="state-empty">
        <p className="display">Je register is nog leeg</p>
        <p style={{ maxWidth: '42ch', margin: '0 auto 22px' }}>
          Voeg je eerste fles toe, of neem je bestaande kelder over uit een back-up van de oude
          app.
        </p>
        <div className="knoprij knoprij-midden">
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
        <button
          className={`chip${aandacht ? ' on' : ''}`}
          onClick={() => setAandacht(!aandacht)}
          aria-pressed={aandacht}
        >
          <span className="chip-lang">Vraagt aandacht</span>
          <span className="chip-kort">Aandacht</span>
          {attentionCount > 0 && <span className="chip-n">{attentionCount}</span>}
        </button>
      </div>

      {!shown.length ? (
        <div className="state-empty">
          <p className="display">Niets gevonden</p>
          <p>
            {aandacht
              ? 'Geen enkele fles vraagt op dit moment aandacht. Alles ligt op schema.'
              : 'Geen wijn in je kelder past bij deze zoekopdracht.'}
          </p>
        </div>
      ) : (
        <>
          <div className="lijst-balk">
            <p className="lijst-telling">
              {shown.length === wines.length
                ? `${wines.length} ${wines.length === 1 ? 'wijn' : 'wijnen'}`
                : `${shown.length} van ${wines.length}`}
            </p>
            <button className="lijst-wissel" onClick={wisselAlles}>
              {allesOpen ? 'Alles inklappen' : 'Alles uitklappen'}
            </button>
          </div>

          <div className="kaarten" ref={lijst} role="list">
            {shown.map((w, i) => {
              const vorige = i > 0 ? shown[i - 1] : null;
              const status = drinkBadge(w, year).status;
              // Bij sorteren op drinkvenster een kopje boven elke groep, zoals
              // in de oude app. Bij de andere sorteringen zegt zo'n kopje niets.
              const groep =
                sort === 'venster' &&
                (!vorige || drinkBadge(vorige, year).status !== status)
                  ? GROEP_LABELS[status]
                  : null;

              return (
                <div key={w.id} className="kaart-groep">
                  {groep && <p className="groep-kop">{groep}</p>}
                  <Kaart
                    wine={w}
                    year={year}
                    index={i}
                    open={!dicht.has(w.id)}
                    onWissel={() => wissel(w.id)}
                    letter={
                      // Alleen de eerste wijn per letter krijgt het merk, zodat de
                      // springbalk precies bij het begin van de groep uitkomt.
                      sort === 'naam' &&
                      (!vorige || beginletter(vorige.naam) !== beginletter(w.naam))
                        ? beginletter(w.naam)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {letters.length > 1 && (
            <nav className="azbar" aria-label="Spring naar letter">
              {letters.map((l) => (
                <button key={l} onClick={() => springNaar(l)} aria-label={`Spring naar ${l}`}>
                  {l}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </>
  );
}

function Sterren({ n }: { n: number }) {
  if (!n) return null;
  return (
    <p className="kaart-sterren" aria-label={`${n} van 5 sterren`}>
      <span aria-hidden="true">{'★'.repeat(n)}</span>
      <span className="leeg" aria-hidden="true">{'★'.repeat(5 - n)}</span>
    </p>
  );
}

function Kaart({
  wine, year, index, open, onWissel, letter,
}: {
  wine: Wine;
  year: number;
  index: number;
  open: boolean;
  onWissel: () => void;
  letter?: string;
}) {
  const badge = drinkBadge(wine, year);
  const p = drinkProgress(wine, year);
  const n = Number(wine.aantal) || 0;
  const sub = [wine.type, wine.jaar, wine.druif].filter(Boolean).join(' · ');
  const secties = parseNote(wine.note);
  // Een randje om wijnen die aandacht vragen, in de kleur van hun eigen status:
  // een amberkleurige rand om een fles die over zijn hoogtepunt is, spreekt
  // zichzelf tegen met de pil ernaast.
  const letOp = badge.status === 'vb' ? ' let-op voorbij'
    : badge.soon || badge.closing ? ' let-op' : '';

  const chips: Array<[React.ReactNode, string]> = [];
  if (wine.regio) chips.push([<IconPlek key="r" />, wine.regio]);
  if (wine.druif) chips.push([<IconDruif key="d" />, wine.druif]);
  if (wine.jaar) chips.push([<IconJaar key="j" />, String(wine.jaar)]);
  if (wine.locatie) chips.push([<IconVak key="l" />, wine.locatie]);
  if (wine.prijs != null && wine.prijs > 0) {
    chips.push([<IconPrijs key="p" />, `€ ${wine.prijs.toFixed(2)}`]);
  }
  if (wine.herkomst && wine.herkomst.trim().toLowerCase() !== 'zelf gekocht') {
    chips.push([<IconHerkomst key="h" />, wine.herkomst]);
  }

  const paneelId = `kaart-${wine.id}`;

  return (
    <article
      className={`kaart${letOp}${n === 0 ? ' is-op' : ''}`}
      data-letter={letter}
      role="listitem"
      style={{ animationDelay: `${Math.min(index, 14) * 24}ms` }}
    >
      <span className={`kaart-accent t-${ACCENT[wine.type] ?? 'overig'}`} aria-hidden="true" />

      <button className="kaart-kop" onClick={onWissel} aria-expanded={open} aria-controls={paneelId}>
        <span className="kaart-naam">{wine.naam}</span>
        <span className="kaart-voorraad">
          <b>{n}</b> fl.
        </span>
        <IconChevron className={`kaart-pijl${open ? ' open' : ''}`} />
        <span className="kaart-regel">
          <span className={`merk ${badge.status}`}>{badge.label}</span>
          {sub && <span className="kaart-sub">{sub}</span>}
        </span>
      </button>

      <div className={`kaart-meer${open ? ' open' : ''}`} id={paneelId} hidden={!open}>
        <div className="kaart-binnen">
          {chips.length > 0 && (
            <ul className="kaart-chips">
              {chips.map(([icoon, tekst], i) => (
                <li key={i} className="feit">{icoon}{tekst}</li>
              ))}
            </ul>
          )}

          <Sterren n={wine.sterren} />

          {p ? (
            <div className="venster">
              <p className="venster-kop">
                <span className="mono">{wine.drink_from}–{wine.drink_to}</span>
                <span>{p.pct}% van venster</span>
              </p>
              <div className="venster-baan">
                <span
                  className={`venster-vul ${badge.status}`}
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="venster-leeg">Geen drinkvenster ingevuld</p>
          )}

          {secties ? (
            secties.map((s, i) => (
              <div key={i} className="kaart-notitie">
                {s.label && <p className="label">{s.label}</p>}
                <p>{s.body}</p>
              </div>
            ))
          ) : wine.note ? (
            <div className="kaart-notitie"><p>{wine.note}</p></div>
          ) : null}
        </div>

        <div className="kaart-voet">
          <span className="kaart-voet-voorraad">
            Voorraad <b className="mono">{n}</b> fl.
          </span>
          {n > 0 && (
            <Link className="kaartknop drink" href={`/wijn/${wine.id}?drinken=1`}>
              <IconGedronken /> Gedronken
            </Link>
          )}
          <Link className="kaartknop" href={`/wijn/${wine.id}`} aria-label={`${wine.naam} openen`}>
            <IconBewerken /> Openen
          </Link>
        </div>
      </div>
    </article>
  );
}
