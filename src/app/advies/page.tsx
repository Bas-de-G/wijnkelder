import { redirect } from 'next/navigation';
import { getCellarWithWines } from '@/lib/cellar';
import { Nav } from '../Nav';
import { AdviceForm } from './AdviceForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wijn bij het eten · Wijnkelder' };

export default async function AdviesPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>
          Wat drink ik <em>vanavond</em>
        </h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: '58ch' }}>
          Typ wat je eet. Ik zoek in je eigen aantekeningen — geen internet, geen model, en liever
          geen advies dan een gekunstelde match.
        </p>
      </div>
      <Nav />
      <AdviceForm wines={data.wines} />
    </main>
  );
}
