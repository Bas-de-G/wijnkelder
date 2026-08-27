import type { Slice } from '@/lib/insights';

export function Bars({
  titel,
  slices,
  eenheid = 'flessen',
  leeg,
}: {
  titel: string;
  slices: Slice[];
  eenheid?: string;
  leeg: string;
}) {
  const max = Math.max(...slices.map((s) => s.aantal), 1);
  const totaal = slices.reduce((t, s) => t + s.aantal, 0);

  return (
    <section className="chart">
      <div className="chart-hd">
        <h3>{titel}</h3>
        <span className="unit">{eenheid}</span>
      </div>

      {!slices.length ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{leeg}</p>
      ) : (
        <div className="bars">
          {slices.map((s, i) => (
            <div
              key={s.label}
              className="bar-row"
              data-share={`${Math.round((s.aantal / totaal) * 100)}%`}
              tabIndex={0}
            >
              <span className="bar-name" title={s.label}>{s.label}</span>
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={{ ['--pct' as string]: s.aantal / max, animationDelay: `${i * 45}ms` }}
                />
              </span>
              <span className="bar-value">{s.aantal}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
