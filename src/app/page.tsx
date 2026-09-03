import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCellarWithWines } from '@/lib/cellar';
import { kopCijfers } from '@/lib/insights';
import { Cijfers } from './Masthead';
import { Nav } from './Nav';
import { Ledger } from './Ledger';

export const dynamic = 'force-dynamic';

export default async function KelderPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const { wines } = data;
  const tally = kopCijfers(wines);

  return (
    <main className="shell">
        <Nav />
        <Cijfers tally={tally} />
        <Ledger wines={wines} />
        {wines.length > 0 && (
          <div className="alleen-breed knoprij" style={{ marginTop: 26 }}>
            <Link className="btn btn-primary" href="/toevoegen">Wijn toevoegen</Link>
            <Link className="btn btn-quiet" href="/advies">Wat drink ik vanavond?</Link>
          </div>
        )}
    </main>
  );
}
