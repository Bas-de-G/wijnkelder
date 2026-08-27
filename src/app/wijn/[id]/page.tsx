import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { drinkBadge, drinkProgress, currentYear } from '@/lib/drinkwindow';
import { parseNote, genericPairing } from '@/lib/sommelier';
import type { Wine } from '@/lib/types';
import { Nav, TabBar } from '../../Nav';
import { PageHeader } from '../../Masthead';
import { WineForm } from '../../WineForm';
import { WineActions } from './WineActions';

export const dynamic = 'force-dynamic';

export default async function WijnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data } = await supabase.from('wines').select('*').eq('id', id).maybeSingle();
  if (!data || data.deleted_at) notFound();
  const wine = data as Wine;

  const year = currentYear();
  const badge = drinkBadge(wine, year);
  const progress = drinkProgress(wine, year);
  const sections = parseNote(wine.note);

  const meta = [
    wine.jaar ? String(wine.jaar) : null,
    `${wine.aantal} fl.`,
    wine.drink_from && wine.drink_to && progress
      ? `${wine.drink_from}–${wine.drink_to} · ${progress.pct}% van het venster`
      : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <>
      <PageHeader titel={wine.naam} sub={`${badge.label}  ·  ${meta}`} />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />

      {(sections || wine.note) && (
        <section className="panel" style={{ marginBottom: 26 }}>
          {sections ? (
            sections.map((s, i) => (
              <div key={i} style={{ marginBottom: i === sections.length - 1 ? 0 : 16 }}>
                {s.label && <p className="label" style={{ marginBottom: 3 }}>{s.label}</p>}
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{s.body}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
              {wine.note}
            </p>
          )}
        </section>
      )}

      {!wine.note && (
        <div className="notice warn" style={{ marginBottom: 26 }}>
          Nog geen notitie. Over het algemeen lekker bij: {genericPairing(wine.type)}. Vul een
          eigen notitie in, dan kan het advies deze fles ook echt voorstellen.
        </div>
      )}

      <WineActions wine={wine} />

      <details style={{ marginTop: 34 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--ink-2)', fontSize: 14, fontWeight: 600 }}>
          Gegevens bewerken
        </summary>
        <div style={{ marginTop: 22 }}>
          <WineForm wine={wine} />
        </div>
      </details>
    </main>
      <TabBar />
    </>
  );
}
