import { redirect } from 'next/navigation';
import { getCellarWithWines } from '@/lib/cellar';
import { heeftAanvullingNodig } from '@/lib/enrich-prompt';
import { Nav } from '../Nav';
import { AanvulFlow } from './AanvulFlow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Laten aanvullen · Wijnkelder' };

export default async function AanvullenPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const onvolledig = data.wines.filter(heeftAanvullingNodig);

  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>
          Laten <em>aanvullen</em>
        </h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: '58ch' }}>
          Claude zoekt per wijn de druif op, bepaalt een realistisch drinkvenster en schrijft een
          notitie met wijnhuis, smaakprofiel en eettips.
        </p>
      </div>
      <Nav />
      <AanvulFlow totaal={data.wines.length} onvolledig={onvolledig.length} />
    </main>
  );
}
