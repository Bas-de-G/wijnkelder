import { redirect } from 'next/navigation';
import { getCellarWithWines } from '@/lib/cellar';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { AdviceForm } from './AdviceForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wijn bij het eten · Wijnkelder' };

export default async function AdviesPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  return (
    <>
      <PageHeader titel="Wat drink ik" cursief="vanavond"
        sub="Typ wat je eet, of laat je door een paar vragen leiden. Ik zoek in je eigen aantekeningen — geen internet, geen model." />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <AdviceForm wines={data.wines} />
    </main>
      <TabBar />
    </>
  );
}
