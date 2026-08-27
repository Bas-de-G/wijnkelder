import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCellarWithWines } from '@/lib/cellar';
import { drinkBadge, currentYear } from '@/lib/drinkwindow';
import { AppHeader } from './Masthead';
import { Nav, TabBar } from './Nav';
import { Ledger } from './Ledger';

export const dynamic = 'force-dynamic';

export default async function KelderPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const { wines } = data;
  const year = currentYear();

  const tally = { nu: 0, wachten: 0, voorbij: 0, flessen: 0 };
  for (const w of wines) {
    const s = drinkBadge(w, year).status;
    if (s === 'nu') tally.nu++;
    else if (s === 'wt') tally.wachten++;
    else if (s === 'vb') tally.voorbij++;
    tally.flessen += w.aantal || 0;
  }

  return (
    <>
      <AppHeader tally={tally} />
      <main className="shell">
        <Nav />
        <Ledger wines={wines} />
        {wines.length > 0 && (
          <div className="alleen-breed" style={{ marginTop: 26, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
            <Link className="btn btn-quiet" href="/advies">Wat drink ik vanavond?</Link>
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
