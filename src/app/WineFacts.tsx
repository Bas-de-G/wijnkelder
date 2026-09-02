import { drinkBadge, drinkProgress, currentYear } from '@/lib/drinkwindow';
import type { Wine } from '@/lib/types';

/**
 * De kerngegevens van één wijn: status, voorraad, kenmerken, sterren en het
 * drinkvenster. Stond eerst als ondertitel in de donkere balk bovenaan de
 * wijnpagina, maar maakte die balk daar hoger dan op alle andere schermen — en
 * bij een lange wijnnaam nog hoger. Hier mag het omlopen zonder dat de pagina
 * eronder verspringt.
 */
export function WijnKern({ wine, year = currentYear() }: { wine: Wine; year?: number }) {
  const badge = drinkBadge(wine, year);
  const p = drinkProgress(wine, year);
  const n = Number(wine.aantal) || 0;

  const feiten = [
    wine.type,
    wine.regio,
    wine.druif,
    wine.producent,
    wine.jaar ? String(wine.jaar) : null,
    wine.locatie,
    wine.prijs != null && wine.prijs > 0 ? `€ ${wine.prijs.toFixed(2)}` : null,
    wine.herkomst && wine.herkomst.trim().toLowerCase() !== 'zelf gekocht' ? wine.herkomst : null,
  ].filter(Boolean) as string[];

  return (
    <div className="wijn-kern">
      <p className="wijn-kern-rij">
        <span className={`merk ${badge.status}`}>{badge.label}</span>
        <span className="mono wijn-voorraad">
          <b>{n}</b> fl.
        </span>
      </p>

      {feiten.length > 0 && (
        <ul className="kaart-chips">
          {feiten.map((f, i) => (
            <li key={i} className="feit">{f}</li>
          ))}
        </ul>
      )}

      {wine.sterren > 0 && (
        <p className="kaart-sterren" aria-label={`${wine.sterren} van 5 sterren`}>
          <span aria-hidden="true">{'★'.repeat(wine.sterren)}</span>
          <span className="leeg" aria-hidden="true">{'★'.repeat(5 - wine.sterren)}</span>
        </p>
      )}

      {p && (
        <div className="venster">
          <p className="venster-kop">
            <span className="mono">{wine.drink_from}–{wine.drink_to}</span>
            <span>{p.pct}% van venster</span>
          </p>
          <div className="venster-baan">
            <span className={`venster-vul ${badge.status}`} style={{ width: `${p.pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
