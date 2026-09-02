'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { drinkBadge, currentYear } from '@/lib/drinkwindow';
import { bouwAs, balk, groepeer, positie, heeftVenster } from '@/lib/tijdlijn';
import type { Wine } from '@/lib/types';

export function Tijdlijn({ wines }: { wines: Wine[] }) {
  const year = currentYear();
  // Flessen die op zijn staan er standaard niet bij: een plattegrond van je
  // kelder gaat over wat er ligt.
  const [alleen, setAlleen] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const zichtbaar = useMemo(
    () => (alleen ? wines.filter((w) => Number(w.aantal) > 0) : wines),
    [wines, alleen]
  );

  const as = useMemo(() => bouwAs(zichtbaar, year), [zichtbaar, year]);

  // De as eindigt op een vast laatste jaar én op een veelvoud van de stap; die
  // twee vallen zelden samen, en dan botsen de laatste twee jaartallen op elkaar.
  // De as zelf houden we gelijk aan het origineel — alleen het label valt weg.
  const jaartallen = useMemo(() => {
    if (!as) return [];
    return as.ticks.filter((t, i) => {
      const volgende = as.ticks[i + 1];
      if (volgende == null) return true;
      return positie(volgende, as) - positie(t, as) > 0.09;
    });
  }, [as]);
  const groepen = useMemo(() => groepeer(zichtbaar, year), [zichtbaar, year]);

  const metVenster = wines.filter(heeftVenster).length;
  const opVoorraad = wines.filter((w) => Number(w.aantal) > 0 && heeftVenster(w)).length;

  if (!metVenster) {
    return (
      <div className="state-empty">
        <p className="display">Nog geen drinkvensters</p>
        <p style={{ maxWidth: '46ch', margin: '0 auto 22px' }}>
          De tijdlijn tekent per wijn van wanneer tot wanneer je hem het beste drinkt. Vul bij een
          wijn een venster in, of laat Claude ze in één keer aanvullen.
        </p>
        <div className="knoprij knoprij-midden">
          <Link className="btn btn-primary" href="/aanvullen">Laten aanvullen</Link>
          <Link className="btn btn-quiet" href="/">Naar mijn kelder</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tl-balk">
        <button
          className={`chip${alleen ? ' on' : ''}`}
          onClick={() => setAlleen(!alleen)}
          aria-pressed={alleen}
        >
          Alleen op voorraad
          <span className="chip-n">{opVoorraad}</span>
        </button>
        <p className="tl-telling">
          {zichtbaar.filter(heeftVenster).length} van {metVenster} met venster
        </p>
      </div>

      {!as ? (
        <div className="state-empty">
          <p className="display">Alle flessen zijn op</p>
          <p style={{ maxWidth: '44ch', margin: '0 auto' }}>
            Van de wijnen met een drinkvenster staat er geen enkele fles meer. Zet het filter uit om
            ze toch te zien.
          </p>
        </div>
      ) : (
        <div className="tl" style={{ ['--tl-nu' as string]: as.nu }}>
          <div className="tl-liniaal" aria-hidden="true">
            {jaartallen.map((t) => (
              <span key={t} className="tl-jaar" style={{ left: `${positie(t, as) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>

          <div className="tl-plaat">
            {/* Eén doorlopende lijn door de hele plaat. Dit is wat de tijdlijn
                doet wat een lijst niet kan: je ziet in één blik wat er achter
                het heden ligt en wat er nog voor staat. */}
            <div className="tl-nulaag" aria-hidden="true">
              <span className="tl-nu" />
            </div>

            {groepen.map((g) => (
              <section key={g.status} className="tl-groep">
                {/* Het kopje is meteen het label bij de kleur, zodat de status
                    nooit alleen aan de kleur hangt. */}
                <h2 className={`tl-groepkop ${g.status}`}>
                  {g.label}
                  <span className="tl-groepaantal">{g.wines.length}</span>
                </h2>

                {g.wines.map((w) => {
                  const b = balk(w, as)!;
                  const badge = drinkBadge(w, year);
                  const uit = open === w.id;
                  return (
                    <div key={w.id} className={`tl-regel${uit ? ' uit' : ''}`}>
                      <button
                        className="tl-rij"
                        onClick={() => setOpen(uit ? null : w.id)}
                        aria-expanded={uit}
                        title={`${w.naam} · ${w.drink_from}–${w.drink_to} · ${badge.label}`}
                      >
                        <span className="tl-naam">{w.naam}</span>
                        <span className="tl-baan">
                          <span
                            className={`tl-blok ${g.status}`}
                            style={{ left: `${b.van * 100}%`, width: `${b.breedte * 100}%` }}
                          />
                        </span>
                      </button>

                      {uit && (
                        <div className="tl-detail">
                          <p className="tl-detail-naam">{w.naam}</p>
                          {/* Geen punten tussen de feiten: in een rij die mag
                              omlopen komt zo'n scheidingsteken aan het begin van
                              de volgende regel terecht. De ruimte doet het werk. */}
                          <p className="tl-detail-feiten">
                            <span className="mono">{w.drink_from}–{w.drink_to}</span>
                            <span className={`merk ${badge.status}`}>{badge.label}</span>
                            <span className="mono">{Number(w.aantal) || 0} fl.</span>
                          </p>
                          <Link className="kaartknop" href={`/wijn/${w.id}`}>Openen</Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          <ul className="tl-legenda">
            <li><span className="tl-vlek nu" aria-hidden="true" />Nu drinken</li>
            <li><span className="tl-vlek wt" aria-hidden="true" />Wachten</li>
            <li><span className="tl-vlek vb" aria-hidden="true" />Over hoogtepunt</li>
            <li><span className="tl-streep" aria-hidden="true" />Nu ({year})</li>
          </ul>
        </div>
      )}
    </>
  );
}
