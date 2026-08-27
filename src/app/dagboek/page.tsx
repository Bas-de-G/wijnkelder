import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { LogEntry } from './LogEntry';
import type { DrinkLogEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dagboek · Wijnkelder' };

export default async function DagboekPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data: cellar } = await supabase
    .from('cellars').select('id').eq('owner_id', user.id)
    .order('created_at').limit(1).maybeSingle();

  const { data } = cellar
    ? await supabase
        .from('drink_log').select('*').eq('cellar_id', cellar.id)
        .order('gedronken_op', { ascending: false })
    : { data: [] };

  const entries = (data ?? []) as DrinkLogEntry[];

  return (
    <>
      <PageHeader titel="Dagboek" />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />

      {!entries.length ? (
        <div className="state-empty">
          <p className="display">Nog geen fles opengetrokken</p>
          <p style={{ maxWidth: '44ch', margin: '0 auto 22px' }}>
            Kies een wijn in je kelder en druk op &ldquo;Fles gedronken&rdquo;. Wat je daar
            invult — met wie, bij welke gelegenheid — komt hier terecht.
          </p>
          <Link className="btn btn-primary" href="/">Naar je kelder</Link>
        </div>
      ) : (
        <ul className="ledger">
          {entries.map((e, i) => (
            <LogEntry key={e.id} entry={e} index={i} />
          ))}
        </ul>
      )}
    </main>
      <TabBar />
    </>
  );
}
