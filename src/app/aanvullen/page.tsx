import { redirect } from 'next/navigation';
import { getCellarWithWines } from '@/lib/cellar';
import { heeftAanvullingNodig } from '@/lib/enrich-prompt';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { AanvulFlow } from './AanvulFlow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Laten aanvullen · Wijnkelder' };

export default async function AanvullenPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const onvolledig = data.wines.filter(heeftAanvullingNodig);

  return (
    <>
      <PageHeader titel="Laten" cursief="aanvullen" />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <p className="inleiding">Claude zoekt per wijn de druif op, bepaalt een realistisch drinkvenster en schrijft een notitie met wijnhuis, smaakprofiel en eettips.</p>
      <AanvulFlow totaal={data.wines.length} onvolledig={onvolledig.length} />
    </main>
      <TabBar />
    </>
  );
}
