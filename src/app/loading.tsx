/**
 * Elk scherm haalt zijn gegevens op de server op, dus tussen het tikken op een
 * tabblad en het eerste beeld zit een rondje naar Supabase. Zonder dit bestand
 * wacht Next met schakelen tot dat rondje klaar is: je tikt, en er gebeurt
 * even niets. Nu wisselt de inhoud meteen en verschijnt hier een plaatshouder,
 * terwijl de balk boven- en onderin gewoon blijven staan.
 */
export default function Laden() {
  return (
    <main className="shell" aria-busy="true">
      <p className="visueel-verborgen">Bezig met laden…</p>
      <div className="skelet" aria-hidden="true">
        {[68, 92, 92, 92, 92].map((h, i) => (
          <span key={i} className="skelet-blok" style={{ height: h }} />
        ))}
      </div>
    </main>
  );
}
