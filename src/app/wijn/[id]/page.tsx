import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { currentYear } from '@/lib/drinkwindow';
import { parseNote, genericPairing } from '@/lib/sommelier';
import type { Wine } from '@/lib/types';
import { Nav } from '../../Nav';
import { WineForm } from '../../WineForm';
import { WineActions } from './WineActions';
import { WijnKern } from '../../WineFacts';

export const dynamic = 'force-dynamic';

export default async function WijnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ drinken?: string }>;
}) {
  const { id } = await params;
  const { drinken } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data } = await supabase.from('wines').select('*').eq('id', id).maybeSingle();
  if (!data || data.deleted_at) notFound();
  const wine = data as Wine;

  const year = currentYear();
  const sections = parseNote(wine.note);

  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />

      {/* De naam stond in de donkere balk. Die balk is nu voor alle schermen
          hetzelfde, en een wijnnaam past er niet in zonder hem af te kappen —
          dus staat hij hier, waar hij mag omlopen. */}
      <h1 className="wijn-titel">
        {wine.naam}
        {wine.jaar && <span className="row-vintage">{wine.jaar}</span>}
      </h1>

      <WijnKern wine={wine} year={year} />

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

      <WineActions wine={wine} meteenOpen={drinken === '1'} />

      <details style={{ marginTop: 34 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--ink-2)', fontSize: 14, fontWeight: 600 }}>
          Gegevens bewerken
        </summary>
        <div style={{ marginTop: 22 }}>
          <WineForm wine={wine} />
        </div>
      </details>
    </main>
  );
}
